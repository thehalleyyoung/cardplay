# Board System API Reference

## Quick Start

```typescript
import { initializeBoardSystem } from '@cardplay/boards/init';
import { getBoardRegistry } from '@cardplay/boards/registry';
import { getBoardStateStore } from '@cardplay/boards/store/store';
import { getBoardContextStore } from '@cardplay/boards/context/store';
import { switchBoard } from '@cardplay/boards/switching/switch-board';

// 1. Initialize (call once at app startup)
initializeBoardSystem();

// 2. Get available boards
const registry = getBoardRegistry();
const boards = registry.list();
console.log('Available boards:', boards.map(b => b.name));

// 3. Switch to a board
await switchBoard('basic-tracker', {
  resetLayout: false,
  preserveActiveContext: true
});

// 4. Access current state
const stateStore = getBoardStateStore();
const state = stateStore.getState();
console.log('Current board:', state.currentBoardId);
console.log('Recent boards:', state.recentBoardIds);
```

## Core Types

### Board Definition

```typescript
interface Board {
  // Identity
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  
  // Control
  controlLevel: ControlLevel;
  difficulty: BoardDifficulty;
  primaryView: ViewType;
  
  // Tools
  compositionTools: CompositionToolConfig;
  
  // Structure
  layout: BoardLayout;
  decks: BoardDeck[];
  connections: BoardConnection[];
  
  // Customization
  theme?: BoardTheme;
  shortcuts?: BoardShortcutMap;
  
  // Lifecycle
  onActivate?: (context: ActiveContext) => void;
  onDeactivate?: () => void;
}
```

### Control Levels

```typescript
type ControlLevel =
  | 'full-manual'         // Pure manual control
  | 'manual-with-hints'   // Manual + visual hints
  | 'assisted'            // Manual + tool execution
  | 'collaborative'       // 50/50 with AI
  | 'directed'            // You direct, AI creates
  | 'generative';         // AI creates, you curate
```

### Deck Types

```typescript
type DeckType =
  | 'pattern-deck'        // Tracker pattern editor
  | 'piano-roll-deck'     // Piano roll editor
  | 'notation-deck'       // Notation score
  | 'session-deck'        // Clip launch grid
  | 'arrangement-deck'    // Timeline/arrangement
  | 'instruments-deck'    // Instrument browser
  | 'properties-deck'     // Property inspector
  | 'mixer-deck'          // Mixer strips
  | 'dsp-chain'           // Effect chain
  | 'transport-deck'      // Transport controls
  | 'phrase-library'      // Phrase browser
  | 'sample-browser'      // Sample browser
  | 'generator'           // Generator controls
  | 'arranger'            // Arranger sections
  | 'harmony-display'     // Harmony context
  | 'chord-track'         // Chord progression
  | 'modular'             // Routing graph
  | 'ai-composer';        // AI composer UI
```

## Board Registry

### Registering Boards

```typescript
import { getBoardRegistry } from '@cardplay/boards/registry';

const registry = getBoardRegistry();

// Register a board (validates automatically)
registry.register(myBoard);

// Get a board by ID
const board = registry.get('basic-tracker');

// List all boards
const allBoards = registry.list();

// Filter by control level
const manualBoards = registry.getByControlLevel('full-manual');

// Search by name/description/tags
const results = registry.search('tracker');

// Get by difficulty
const beginnerBoards = registry.getByDifficulty('beginner');
```

### Recommendations

```typescript
import { getRecommendedBoards } from '@cardplay/boards/recommendations';

// Get boards recommended for a user type
const recommended = getRecommendedBoards('tracker-purist', registry);
```

## Board State Store

### Persistence

```typescript
import { getBoardStateStore } from '@cardplay/boards/store/store';

const store = getBoardStateStore();

// Get current state
const state = store.getState();

// Subscribe to changes
const unsubscribe = store.subscribe((newState) => {
  console.log('State changed:', newState);
});

// Current board
store.setCurrentBoard('notation-manual');
const currentId = store.getState().currentBoardId;

// Favorites
store.toggleFavorite('basic-tracker');
const favorites = store.getState().favoriteBoardIds;

// Recent boards
const recents = store.getState().recentBoardIds;

// First-run flag
store.setFirstRunCompleted();
const completed = store.getState().firstRunCompleted;
```

### Layout State

```typescript
// Get layout state for a board
const layoutState = store.getLayoutState('basic-tracker');

// Set layout state
store.setLayoutState('basic-tracker', {
  panelSizes: { left: 300, right: 400 },
  collapsedPanels: ['properties'],
});

// Reset layout
store.resetLayoutState('basic-tracker');
```

### Deck State

```typescript
// Get deck state for a board
const deckState = store.getDeckState('notation-manual');

// Set deck state
store.setDeckState('notation-manual', {
  activeCards: { 'deck-1': 'card-a' },
  scrollPositions: { 'deck-1': 100 },
  focusedItems: {},
  filterState: {},
  deckSettings: {
    'notation-deck': {
      notation: {
        zoom: 150,
        showMeasureNumbers: true
      }
    }
  }
});

// Reset deck state
store.resetDeckState('notation-manual');
```

## Active Context

### Stream/Clip Context

```typescript
import { getBoardContextStore } from '@cardplay/boards/context/store';

const contextStore = getBoardContextStore();

// Get current context
const context = contextStore.getContext();

// Set active stream
contextStore.setActiveStream('stream-123');

// Set active clip
contextStore.setActiveClip('clip-456');

// Set active track
contextStore.setActiveTrack('track-789');

// Set active deck
contextStore.setActiveDeck('deck-notation');

// Set active view
contextStore.setActiveView('notation');

// Subscribe to changes
const unsubscribe = contextStore.subscribe((newContext) => {
  console.log('Context changed:', newContext);
});
```

## Board Switching

### Switch Function

```typescript
import { switchBoard } from '@cardplay/boards/switching/switch-board';

// Basic switch
await switchBoard('basic-tracker');

// Switch with options
await switchBoard('notation-manual', {
  resetLayout: true,      // Reset to default layout
  resetDecks: false,      // Preserve deck state
  preserveActiveContext: true,  // Keep stream/clip selection
  preserveTransport: true      // Keep transport state
});
```

## Deck Factories

### Creating Decks

```typescript
import { createDeckInstances } from '@cardplay/boards/decks/deck-factories';
import { getBoardContextStore } from '@cardplay/boards/context/store';

const board = registry.get('basic-tracker');
const context = getBoardContextStore().getContext();

// Create all deck instances for a board
const deckInstances = createDeckInstances(board, context);

// Render decks
deckInstances.forEach(instance => {
  const element = instance.render();
  document.body.appendChild(element);
  
  // Mount lifecycle
  if (instance.mount) {
    instance.mount(element);
  }
});
```

### Registering Custom Factories

```typescript
import { getDeckFactoryRegistry } from '@cardplay/boards/decks/factory-registry';
import type { DeckFactory } from '@cardplay/boards/decks/factory-types';

const myFactory: DeckFactory = {
  deckType: 'my-custom-deck',
  
  create(deckDef, ctx) {
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'My Custom Deck',
      render: () => {
        const el = document.createElement('div');
        el.textContent = 'Custom deck content';
        return el;
      },
      destroy: () => {
        // Cleanup
      }
    };
  },
  
  validate(deckDef) {
    if (deckDef.type !== 'my-custom-deck') {
      return 'Invalid deck type';
    }
    return null;
  }
};

// Register the factory
const registry = getDeckFactoryRegistry();
registry.registerFactory('my-custom-deck', myFactory);
```

## Card Gating

### Check Card Availability

```typescript
import { isCardAllowed } from '@cardplay/boards/gating/is-card-allowed';
import { whyNotAllowed } from '@cardplay/boards/gating/why-not';
import { getAllowedCardEntries } from '@cardplay/boards/gating/get-allowed-cards';

const board = registry.get('basic-tracker');

// Check if a specific card is allowed
const cardMeta = { id: 'phrase-browser', category: 'phrase', tags: [] };
const allowed = isCardAllowed(board, cardMeta);

// Get denial reason
if (!allowed) {
  const reason = whyNotAllowed(board, cardMeta);
  console.log('Card not allowed:', reason);
}

// Get all allowed cards
const allowedCards = getAllowedCardEntries(board);
console.log('Available cards:', allowedCards.length);
```

### Deck Visibility

```typescript
import { computeVisibleDeckTypes } from '@cardplay/boards/gating/tool-visibility';

const board = registry.get('tracker-harmony');

// Get visible deck types for this board
const visibleDecks = computeVisibleDeckTypes(board);
console.log('Visible decks:', visibleDecks);
// → ['pattern-deck', 'harmony-display', 'instruments-deck', 'properties-deck']
```

## UI Components

### Board Host

```typescript
import { BoardHost } from '@cardplay/ui/components/board-host';

// Create board host (renders active board workspace)
const host = new BoardHost({
  containerId: 'board-host-container'
});

// Mount to DOM
const element = host.render();
document.body.appendChild(element);
```

### Board Switcher

```typescript
import { BoardSwitcher } from '@cardplay/ui/components/board-switcher';

// Create board switcher modal
const switcher = new BoardSwitcher({
  onBoardSelected: (boardId) => {
    switchBoard(boardId);
  }
});

// Open with Cmd+B
document.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 'b') {
    switcher.open();
  }
});
```

### Board Browser

```typescript
import { BoardBrowser } from '@cardplay/ui/components/board-browser';

// Create full board library view
const browser = new BoardBrowser({
  onBoardSelected: (boardId) => {
    switchBoard(boardId);
  },
  onToggleFavorite: (boardId) => {
    store.toggleFavorite(boardId);
  }
});

const element = browser.render();
document.body.appendChild(element);
```

## Best Practices

### 1. Always Initialize First

```typescript
// ✅ Good
initializeBoardSystem();
const boards = getBoardRegistry().list();

// ❌ Bad
const boards = getBoardRegistry().list(); // No factories registered yet!
initializeBoardSystem();
```

### 2. Subscribe and Unsubscribe

```typescript
// ✅ Good
class MyComponent {
  private unsubscribe?: () => void;
  
  mount() {
    this.unsubscribe = store.subscribe(this.handleChange);
  }
  
  unmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// ❌ Bad
store.subscribe(this.handleChange); // Leaks memory!
```

### 3. Use Type Guards

```typescript
// ✅ Good
const board = registry.get(boardId);
if (!board) {
  console.error('Board not found');
  return;
}
// TypeScript knows board is defined here

// ❌ Bad
const board = registry.get(boardId)!; // Might crash!
board.name;
```

### 4. Validate Before Registering

```typescript
// ✅ Good
import { validateBoard } from '@cardplay/boards/validate';

const errors = validateBoard(myBoard);
if (errors.length > 0) {
  console.error('Invalid board:', errors);
  return;
}
registry.register(myBoard);

// ❌ Bad
registry.register(myBoard); // Might throw!
```

## Examples

### Complete Board Definition

```typescript
import type { Board } from '@cardplay/boards/types';

const myBoard: Board = {
  id: 'my-custom-board',
  name: 'My Custom Board',
  description: 'A custom board for my workflow',
  icon: '🎵',
  category: 'Custom',
  tags: ['custom', 'workflow'],
  
  controlLevel: 'full-manual',
  difficulty: 'intermediate',
  primaryView: 'tracker',
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: false, mode: 'hidden' },
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' },
  },
  
  layout: {
    type: 'dock-layout',
    panels: [
      { id: 'left', role: 'browser', position: 'left' },
      { id: 'center', role: 'composition', position: 'center' },
      { id: 'right', role: 'properties', position: 'right' },
    ],
  },
  
  decks: [
    {
      id: 'pattern-deck',
      type: 'pattern-deck',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: false,
    },
    {
      id: 'instruments',
      type: 'instruments-deck',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: true,
    },
  ],
  
  connections: [],
  
  shortcuts: {
    'switch-pattern': 'Cmd+1',
    'add-instrument': 'Cmd+Shift+I',
  },
};

// Register it
getBoardRegistry().register(myBoard);
```

## Troubleshooting

### Board not appearing in list

```typescript
// Check if registered
const board = registry.get('my-board-id');
if (!board) {
  console.log('Board not registered');
}

// Check if factories exist for all deck types
import { validateBoardFactories } from '@cardplay/boards/decks/factory-registry';
const errors = validateBoardFactories(myBoard);
console.log('Factory errors:', errors);
```

### State not persisting

```typescript
// Check if localStorage is available
if (!window.localStorage) {
  console.error('localStorage not available');
}

// Check state manually
const state = store.getState();
console.log('Current state:', state);

// Force save (debounced by default)
store.setCurrentBoard(state.currentBoardId); // Triggers save
```

### Context not updating

```typescript
// Subscribe to see changes
contextStore.subscribe((ctx) => {
  console.log('Context update:', ctx);
});

// Check current context
const ctx = contextStore.getContext();
console.log('Current context:', ctx);
```

---

For more details, see:
- `docs/boards/board-api.md` - Complete API documentation
- `docs/boards/deck-authoring.md` - Creating custom decks
- `docs/boards/board-authoring.md` - Creating custom boards
