# Deck and Stack System

**Phase K Task:** K021
**Last Updated:** 2026-01-29

## Overview

CardPlay's **Deck and Stack System** is the UI architecture for organizing cards, panels, and tools within boards. This document aligns with Part VII of `cardplayui.md`.

**Key Concepts:**
- **Deck:** A container for cards with a specific card layout (tabs, stack, split, floating)
- **Stack:** A vertical list of cards within a deck
- **Card:** An individual UI component (instrument, effect, tool, editor)
- **Panel:** A docked region of the board containing one or more decks

---

## Architecture Hierarchy

```
Board
└── Panels (left, right, top, bottom, center)
    └── Decks (pattern-editor, mixer, instrument-browser, etc.)
        └── Cards (individual components)
```

**Example: Basic Tracker Board**
```
┌─────────────────────────────────────────────────────────┐
│ Board Chrome (name, control level badge, board actions) │
├──────────┬────────────────────────────┬─────────────────┤
│ Left     │ Center Panel               │ Right Panel     │
│ Panel    │                            │                 │
│          │  ┌──────────────────────┐  │ ┌─────────────┐ │
│ ┌──────┐ │  │ Pattern Editor Deck  │  │ │ Properties  │ │
│ │Instr.│ │  │ (tracker-panel.ts)   │  │ │ Deck        │ │
│ │Deck  │ │  │                      │  │ │             │ │
│ │      │ │  │ [Card: Tracker View] │  │ │ [Selected   │ │
│ │      │ │  │                      │  │ │  Event]     │ │
│ └──────┘ │  └──────────────────────┘  │ └─────────────┘ │
│          │                            │                 │
│ ┌──────┐ │  ┌──────────────────────┐  │                 │
│ │DSP   │ │  │ Transport Deck       │  │                 │
│ │Chain │ │  │ [Play/Stop/Tempo]    │  │                 │
│ └──────┘ │  └──────────────────────┘  │                 │
└──────────┴────────────────────────────┴─────────────────┘
```

---

## Deck Types

### What is a Deck?

A **deck** is a typed container that:
1. Has a unique `DeckType` (e.g., `pattern-editor`, `mixer`, `properties`)
2. Defines a card layout strategy (tabs, stack, split, floating)
3. Is instantiated by a `DeckFactory` registered in the system
4. Can contain zero or more cards
5. Has persistent state (active tabs, scroll position, filters)

### Deck Card Layouts

From `src/boards/types.ts`:

```typescript
export type DeckCardLayout =
  | 'stack'    // Vertical list of cards (scrollable)
  | 'tabs'     // Tab bar with one active card visible
  | 'split'    // Two panes (horizontal or vertical)
  | 'floating' // Draggable/resizable overlay cards
```

#### Layout: Stack

**Purpose:** Show multiple cards vertically, all visible

**Example:** DSP Chain deck
```
┌────────────────┐
│ DSP Chain      │
├────────────────┤
│ [Reverb Card]  │
│ [EQ Card]      │
│ [Compressor]   │
│ + Add Effect   │
└────────────────┘
```

**Characteristics:**
- All cards visible simultaneously (scrollable)
- Drag to reorder cards
- Add/remove cards via + button
- Collapse/expand individual cards
- Used for: instrument chains, effect racks, modular patching

**Implementation:**
```typescript
// src/ui/components/stack-component.ts
export function createStack(config: StackConfig): HTMLElement {
  // Render vertical list of cards
  // Support drag reordering
  // Collapse/expand affordances
}
```

#### Layout: Tabs

**Purpose:** Show one card at a time with tab navigation

**Example:** Pattern Editor with multiple patterns
```
┌────────────────────────────────┐
│ [Pattern A] [Pattern B] [+]    │ ← Tab bar
├────────────────────────────────┤
│                                │
│     Active Pattern Editor      │
│     (only Pattern A visible)   │
│                                │
└────────────────────────────────┘
```

**Characteristics:**
- Only one card visible at a time
- Tab bar for switching
- Keyboard shortcuts: Cmd+1..9 to switch tabs
- Used for: multiple patterns, multiple scores, multiple clips

**Implementation:**
```typescript
// src/ui/components/deck-container.ts (tabs mode)
export function createTabbedDeck(config: DeckConfig): HTMLElement {
  // Render tab bar
  // Show active tab content only
  // Persist activeTabId in deck state
}
```

#### Layout: Split

**Purpose:** Show two cards side-by-side

**Example:** Notation + Piano Roll split
```
┌──────────────┬──────────────┐
│ Notation     │ Piano Roll   │
│ Score        │ View         │
│              │              │
│ (same        │ (same        │
│  stream)     │  stream)     │
│              │              │
└──────────────┴──────────────┘
```

**Characteristics:**
- Two cards visible simultaneously
- Resizable split (drag divider)
- Can be horizontal or vertical split
- Used for: side-by-side views, compare/contrast, input+output

**Implementation:**
```typescript
// Deck definition
{
  id: 'editor-split',
  type: 'split',
  cardLayout: 'split',
  splitOrientation: 'horizontal', // or 'vertical'
  splitRatio: 0.5, // 50/50 default
}
```

#### Layout: Floating

**Purpose:** Overlay cards that can be moved and resized

**Example:** Detached instrument editor
```
┌────────────────────────────┐
│ Main Board View            │
│                            │
│  ┌──────────────┐          │
│  │ Synth Editor │ ← Floating
│  │ [params...]  │   card
│  └──────────────┘          │
│                            │
└────────────────────────────┘
```

**Characteristics:**
- Cards overlay the main board
- Draggable and resizable
- Can be minimized to tab bar
- Used for: modal editors, detached tools, peek views

---

## Stack Component Deep Dive

### What is a Stack?

A **stack** is a specific card layout where cards are arranged vertically in a scrollable list. Stacks are used for:
- Effect chains (reverb → EQ → compressor)
- Instrument chains (oscillator → filter → envelope)
- Modular patches (connections between modules)

### Stack Features

From `src/ui/components/stack-component.ts`:

**1. Card Ordering**
```typescript
// Drag to reorder
stack.addEventListener('drop', (e) => {
  const draggedCardId = e.dataTransfer.getData('cardId');
  const targetIndex = findDropIndex(e.clientY);
  reorderCard(draggedCardId, targetIndex);
  // Persist new order in deck state
});
```

**2. Collapse/Expand**
```typescript
// Each card can collapse to header only
<div class="stack-card" data-collapsed="false">
  <div class="stack-card-header" onclick="toggleCollapse()">
    <span>Reverb</span>
    <button>▼</button> <!-- ▶ when collapsed -->
  </div>
  <div class="stack-card-body">
    <!-- Card content (hidden when collapsed) -->
  </div>
</div>
```

**3. Add Card**
```typescript
// + button at bottom of stack
<button class="stack-add-card" onclick="openCardPicker()">
  + Add Effect
</button>

// Card picker respects gating rules (Phase D)
function openCardPicker(stackDeckType: DeckType) {
  const allowedCards = getAllowedCardEntries(currentBoard);
  const filtered = allowedCards.filter(card => 
    canDropInDeck(card, stackDeckType)
  );
  showPicker(filtered);
}
```

**4. Remove Card**
```typescript
// X button on each card header
<button class="stack-card-remove" 
        onclick="removeCard(cardId)"
        aria-label="Remove card">
  ✕
</button>

// Removal is undoable
function removeCard(cardId: string) {
  UndoStack.push({
    type: 'remove-card',
    redo: () => stack.removeCard(cardId),
    undo: () => stack.addCard(cardSnapshot),
  });
}
```

---

## Deck Factories

### What is a Deck Factory?

A **deck factory** creates deck instances from deck definitions. Factories are registered per `DeckType`.

From `src/boards/decks/factory-types.ts`:

```typescript
export interface DeckFactory {
  create(
    deckDef: BoardDeck,
    ctx: DeckFactoryContext
  ): DeckInstance | Promise<DeckInstance>;
}

export interface DeckInstance {
  id: string;
  type: DeckType;
  element: HTMLElement;
  destroy: () => void;
  getState?: () => unknown;
  setState?: (state: unknown) => void;
}
```

### Factory Registry

From `src/boards/decks/factory-registry.ts`:

```typescript
// Register factories for all deck types
const registry = new Map<DeckType, DeckFactory>();

registerFactory('pattern-editor', patternEditorFactory);
registerFactory('notation-score', notationScoreFactory);
registerFactory('mixer', mixerFactory);
registerFactory('properties', propertiesFactory);
// ... etc

// Usage in board host
const deckInstance = getFactory(deckType).create(deckDef, ctx);
panel.appendChild(deckInstance.element);
```

### Example Factory: Pattern Editor

```typescript
// src/boards/decks/pattern-editor-factory.ts

export const patternEditorFactory: DeckFactory = {
  create(deckDef, ctx) {
    // Get active stream from context
    const streamId = ctx.activeContext.activeStreamId;
    
    // Create tracker panel
    const panel = createTrackerPanel({
      streamId,
      patternLength: deckDef.defaultPatternLength || 64,
      onEdit: (events) => {
        // Write to SharedEventStore (undo integrated)
        SharedEventStore.addEvents(streamId, events);
      },
    });

    // Subscribe to context changes
    const sub = ctx.activeContext.subscribe((newCtx) => {
      if (newCtx.activeStreamId !== streamId) {
        panel.setStream(newCtx.activeStreamId);
      }
    });

    return {
      id: deckDef.id,
      type: 'pattern-editor',
      element: panel.element,
      destroy: () => {
        panel.destroy();
        ctx.activeContext.unsubscribe(sub);
      },
      getState: () => ({
        scrollTop: panel.element.scrollTop,
        activeRow: panel.getActiveRow(),
      }),
      setState: (state) => {
        panel.element.scrollTop = state.scrollTop;
        panel.setActiveRow(state.activeRow);
      },
    };
  },
};
```

---

## Deck State Persistence

### Per-Board Deck State

Each board can persist deck-specific state:

```typescript
// From src/boards/store/types.ts

export interface DeckState {
  // Active tab (for tabbed decks)
  activeTabId?: string;
  
  // Scroll positions (for scrollable decks)
  scrollTop?: number;
  scrollLeft?: number;
  
  // Focused item (for grid/list decks)
  focusedItemId?: string;
  
  // Filters and search (for browser decks)
  filterState?: {
    searchText?: string;
    categoryFilter?: string[];
    tags?: string[];
  };
  
  // Collapsed cards (for stack decks)
  collapsedCardIds?: string[];
  
  // Split ratios (for split decks)
  splitRatio?: number;
}
```

### Persistence API

```typescript
// Save deck state when user changes something
BoardStateStore.setDeckState(boardId, deckId, {
  scrollTop: 420,
  activeTabId: 'pattern-2',
  filterState: { searchText: 'bass' },
});

// Load deck state when board activates
const deckState = BoardStateStore.getDeckState(boardId, deckId);
deckInstance.setState(deckState);
```

### Example: Session Grid Deck State

```typescript
// User scrolls session grid
sessionGridPanel.addEventListener('scroll', debounce(() => {
  BoardStateStore.setDeckState(currentBoardId, 'session-deck', {
    scrollTop: sessionGridPanel.scrollTop,
    scrollLeft: sessionGridPanel.scrollLeft,
  });
}, 300));

// User switches board and comes back
switchBoard(newBoardId);
// ... later ...
switchBoard(originalBoardId); // ← Session grid scroll is restored!
```

---

## Deck Integration with Boards

### Defining Decks in Board Definition

From `src/boards/types.ts`:

```typescript
export interface Board {
  id: string;
  name: string;
  decks: BoardDeck[]; // ← Deck definitions
  layout: BoardLayout;
  // ... other fields
}

export interface BoardDeck {
  id: string;              // Unique within board
  type: DeckType;          // Factory key
  title: string;           // Display name
  cardLayout: DeckCardLayout; // tabs | stack | split | floating
  
  // Deck-level control override (optional)
  controlLevel?: ControlLevel;
  
  // Constraints
  allowReordering?: boolean; // Can user reorder cards?
  allowDragOut?: boolean;    // Can user drag cards out?
  allowDragIn?: boolean;     // Can user drag cards in?
  
  // Default state
  defaultCards?: string[];   // Initial card ids
  defaultPatternLength?: number;
  defaultView?: string;
}
```

### Example: Basic Tracker Board

```typescript
// src/boards/builtins/basic-tracker-board.ts

export const basicTrackerBoard: Board = {
  id: 'basic-tracker',
  name: 'Basic Tracker',
  controlLevel: 'full-manual',
  
  decks: [
    // Center panel: pattern editor
    {
      id: 'main-pattern',
      type: 'pattern-editor',
      title: 'Pattern Editor',
      cardLayout: 'tabs', // Multiple patterns as tabs
      allowReordering: false,
      defaultPatternLength: 64,
    },
    
    // Left panel: instrument browser
    {
      id: 'instruments',
      type: 'instrument-browser',
      title: 'Instruments',
      cardLayout: 'stack', // Stack of instruments
      allowReordering: true,
    },
    
    // Right panel: properties
    {
      id: 'properties',
      type: 'properties',
      title: 'Properties',
      cardLayout: 'stack', // Event properties
    },
    
    // Bottom: DSP chain
    {
      id: 'effects',
      type: 'dsp-chain',
      title: 'Effects',
      cardLayout: 'stack', // Stack of effects
      allowReordering: true,
      allowDragIn: true,
      allowDragOut: true,
    },
  ],
  
  layout: {
    panels: [
      { id: 'left', role: 'browser', position: 'left', decks: ['instruments'] },
      { id: 'center', role: 'composition', position: 'center', decks: ['main-pattern'] },
      { id: 'right', role: 'properties', position: 'right', decks: ['properties'] },
      { id: 'bottom', role: 'toolbar', position: 'bottom', decks: ['effects'] },
    ],
  },
};
```

---

## Deck Rendering Pipeline

### Board Host → Panel Host → Deck Container → Cards

```typescript
// 1. Board Host (src/ui/components/board-host.ts)
const boardHost = createBoardHost();
document.body.appendChild(boardHost.element);

// 2. Board host renders panels for active board
const board = BoardRegistry.get(currentBoardId);
board.layout.panels.forEach(panelDef => {
  const panelHost = createDeckPanelHost(panelDef, board);
  boardHost.addPanel(panelHost.element);
});

// 3. Panel host renders decks
panelDef.decks.forEach(deckId => {
  const deckDef = board.decks.find(d => d.id === deckId);
  const factory = getDeckFactory(deckDef.type);
  const deckInstance = factory.create(deckDef, {
    activeContext: BoardContextStore.getContext(),
    board,
  });
  panelHost.addDeck(deckInstance.element);
});

// 4. Deck container renders cards (if card layout = stack)
if (deckDef.cardLayout === 'stack') {
  const stack = createStack({
    cards: deckDef.defaultCards.map(loadCard),
    allowReordering: deckDef.allowReordering,
  });
  deckInstance.element.appendChild(stack);
}
```

---

## Card System Integration

### What is a Card?

A **card** is an individual UI component inside a deck. Cards come from:
1. **Instrument Cards** (`src/cards/instrument-cards.ts`) - Synths, samplers, etc.
2. **Effect Cards** (`src/cards/effect-cards.ts`) - Reverb, EQ, etc.
3. **Tool Cards** (`src/cards/tool-cards.ts`) - Generators, analyzers, etc.
4. **Editor Cards** (tracker, notation, piano roll as single-card decks)

### Card Registry

From `src/cards/registry.ts`:

```typescript
export interface CardMeta {
  id: string;
  name: string;
  category: 'instrument' | 'effect' | 'tool' | 'editor';
  tags: string[];
  create: (config: unknown) => CardInstance;
}

// Global registry
const cardRegistry = new Map<string, CardMeta>();

registerCard({
  id: 'synth-basic',
  name: 'Basic Synth',
  category: 'instrument',
  tags: ['synth', 'subtractive'],
  create: (config) => createSynthCard(config),
});
```

### Gating and Deck Drops

Phase D integration:

```typescript
// When user drags a card to a deck
function handleDrop(deckType: DeckType, cardMeta: CardMeta) {
  // Validate via gating rules
  const validationResult = validateDeckDrop(
    currentBoard,
    deckType,
    cardMeta
  );
  
  if (!validationResult.allowed) {
    showToast(`Cannot add: ${validationResult.reason}`);
    return;
  }
  
  // Create card instance
  const cardInstance = cardMeta.create(defaultConfig);
  
  // Add to deck with undo
  UndoStack.push({
    type: 'add-card',
    redo: () => deck.addCard(cardInstance),
    undo: () => deck.removeCard(cardInstance.id),
  });
}
```

---

## Best Practices

### For Board Authors

1. **Choose appropriate card layouts:**
   - Use `tabs` for multiple patterns/scores/clips
   - Use `stack` for effect chains and instrument racks
   - Use `split` for side-by-side views
   - Use `floating` for modal/overlay tools

2. **Set sensible constraints:**
   - Manual boards: `allowReordering: true`, `allowDragIn: false`
   - Assisted boards: `allowDragIn: true` for instrument/effect decks
   - Directed boards: `allowDragIn: true` for all decks

3. **Respect gating:**
   - Never expose decks that contain disallowed card types
   - Use `computeVisibleDeckTypes(board)` to filter deck list

### For Deck Factory Authors

1. **Integrate with ActiveContext:**
   - Subscribe to `activeStreamId`, `activeClipId`, etc.
   - Update deck content when context changes
   - Unsubscribe in `destroy()`

2. **Implement state persistence:**
   - Provide `getState()` and `setState()` methods
   - Persist scroll positions, active tabs, filters
   - Load state on creation

3. **Support undo/redo:**
   - All mutations must go through UndoStack
   - Use `UndoStack.push()` with redo/undo functions
   - Avoid direct DOM/store mutations

### For Card Authors

1. **Be deck-agnostic:**
   - Cards should work in any deck (stack, tabs, etc.)
   - Don't assume parent container structure
   - Use events for communication (not direct parent access)

2. **Support collapse/expand:**
   - Provide a minimal header view (collapsed state)
   - Provide a full body view (expanded state)
   - Respect `data-collapsed` attribute

3. **Respect control levels:**
   - Cards can be gated by control level
   - Mark cards with appropriate categories/tags
   - Don't bypass gating checks

---

## Examples from Codebase

### Example 1: DSP Chain Stack

```typescript
// From basic-tracker-board.ts
{
  id: 'effects',
  type: 'dsp-chain',
  title: 'Effects',
  cardLayout: 'stack',
  allowReordering: true, // Drag to reorder effects
  allowDragIn: true,     // Drag effects from browser
  allowDragOut: false,   // Don't allow dragging out
}
```

**Result:** Vertical stack of effect cards, user can reorder, can add new effects, cannot remove by dragging out (must use X button).

### Example 2: Session Grid Tabs

```typescript
// From basic-session-board.ts
{
  id: 'session',
  type: 'clip-session',
  title: 'Session',
  cardLayout: 'tabs', // Multiple session pages as tabs
  allowReordering: false,
  defaultView: 'grid',
}
```

**Result:** Tab bar for multiple session pages, user can switch with Cmd+1..9, cannot reorder tabs.

### Example 3: Notation + Piano Roll Split

```typescript
// From composer-board.ts
{
  id: 'editor-split',
  type: 'split',
  title: 'Editors',
  cardLayout: 'split',
  splitOrientation: 'horizontal',
  splitRatio: 0.5, // 50/50
  leftCard: 'notation-score',
  rightCard: 'piano-roll',
}
```

**Result:** Notation on left, piano roll on right, same stream visible in both, resizable divider.

---

## Related Documentation

- [Decks](./decks.md) - Detailed reference for each deck type
- [Panels](./panels.md) - Panel roles and docking system
- [Board API](./board-api.md) - Core board types
- [Gating](./gating.md) - Card visibility rules
- [Theming](./theming.md) - Deck/card visual styling

---

## Summary

**The Deck and Stack System provides:**
- ✅ Typed deck containers with factory pattern
- ✅ Four card layout strategies (tabs, stack, split, floating)
- ✅ Per-board deck state persistence (scroll, tabs, filters)
- ✅ Drag-and-drop with gating integration
- ✅ Undo/redo for all deck/card operations
- ✅ ActiveContext integration for cross-deck sync

**Part VII alignment:**
- Deck types map to `cardplayui.md` sections
- Card layouts match proposed UX patterns
- State persistence enables board switching
- Gating respects control levels
