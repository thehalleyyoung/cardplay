# Board System Quick Reference

## For Users

### Opening Board Switcher
Press **Cmd+B** (Mac) or **Ctrl+B** (Windows/Linux) anywhere in the app.

### Switching Boards
1. Press Cmd+B
2. Type to search or use arrow keys to navigate
3. Press Enter to switch
4. Press Esc to cancel

### Keyboard Shortcuts
- **Cmd+B:** Open board switcher
- **Cmd+Z:** Undo
- **Cmd+Shift+Z:** Redo
- **Space:** Play/Pause
- **Esc:** Stop

(Board-specific shortcuts listed in each board's help panel)

## For Developers

### Creating a New Board

```typescript
// 1. Define board in src/boards/builtins/my-board.ts
import type { Board } from '../types';

export const myBoard: Board = {
  id: 'my-board-id',
  name: 'My Board Name',
  description: 'Brief description',
  icon: '🎵',
  category: 'Manual', // or 'Assisted', 'Generative', 'Hybrid'
  difficulty: 'beginner', // or 'intermediate', 'advanced', 'expert'
  tags: ['tag1', 'tag2'],
  
  controlLevel: 'full-manual', // or 'manual-with-hints', 'assisted', 'directed', 'generative', 'collaborative'
  philosophy: 'Short philosophy statement',
  
  primaryView: 'tracker', // or 'notation', 'session', etc.
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: false, mode: 'hidden' },
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' }
  },
  
  layout: {
    type: 'dock',
    panels: [
      { id: 'left', role: 'browser', position: 'left', defaultWidth: 280 },
      { id: 'center', role: 'composition', position: 'center' },
      { id: 'right', role: 'properties', position: 'right', defaultWidth: 300 }
    ]
  },
  
  panels: [ /* same as layout.panels */ ],
  
  decks: [
    {
      id: 'my-deck',
      type: 'pattern-editor', // or any DeckType
      cardLayout: 'tabs', // or 'stack', 'split', 'floating'
      allowReordering: true,
      allowDragOut: true
    }
  ],
  
  connections: [], // routing connections between decks
  
  theme: {
    colors: { primary: '#2c3e50', secondary: '#34495e', accent: '#3498db', background: '#1a1a1a' },
    typography: { fontFamily: 'Inter, sans-serif', fontSize: 14 },
    controlIndicators: { showHints: false, showSuggestions: false, showGenerative: false }
  },
  
  shortcuts: {
    'my-action': 'Cmd+Shift+A',
    // ...
  },
  
  onActivate: () => console.log('Board activated'),
  onDeactivate: () => console.log('Board deactivated')
};

// 2. Register in src/boards/builtins/register.ts
import { myBoard } from './my-board';

export function registerBuiltinBoards() {
  // ...
  registry.register(myBoard);
}
```

### Creating a New Deck Factory

```typescript
// In src/boards/decks/factories/my-deck-factory.ts
import type { BoardDeck } from '../../types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from '../factory-types';

export const myDeckFactory: DeckFactory = {
  deckType: 'my-deck-type',
  
  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'My Deck',
      
      render: () => {
        const container = document.createElement('div');
        container.className = 'my-deck';
        
        // Access active context:
        const streamId = ctx.activeContext.activeStreamId;
        
        // Build your UI...
        
        return container;
      },
      
      destroy: () => {
        // Clean up subscriptions, event listeners, etc.
      },
      
      getState: () => {
        // Return serializable state
        return { /* ... */ };
      },
      
      setState: (state) => {
        // Restore state
      }
    };
  }
};

// Register in src/boards/decks/factories/index.ts
import { myDeckFactory } from './my-deck-factory';

export function registerAllDeckFactories() {
  registry.register(myDeckFactory);
}
```

### Using the UI Event Bus

```typescript
import { getUIEventBus, emitUIEvent } from '@cardplay/ui/ui-event-bus';

// Emit an event
emitUIEvent('board-switcher:open');

// Listen for events
const unsub = getUIEventBus().on('board-switcher:open', (event) => {
  console.log('Board switcher opened', event);
});

// Cleanup
unsub();
```

### Registering Keyboard Shortcuts

```typescript
import { KeyboardShortcutManager } from '@cardplay/ui/keyboard-shortcuts';

const manager = KeyboardShortcutManager.getInstance();

// Register a shortcut
manager.register({
  id: 'my-action',
  key: 'a',
  modifiers: { meta: true, shift: true }, // Cmd+Shift+A
  description: 'My custom action',
  category: 'custom',
  action: () => {
    // Do something
  }
});

// For board-specific shortcuts (auto-cleanup on board switch):
manager.registerBoardShortcuts('my-board-id', {
  'Cmd+Shift+A': () => console.log('Board-specific action'),
  'Cmd+Shift+B': () => console.log('Another action')
});
```

### Working with Stores

```typescript
import { getSharedEventStore } from '@cardplay/state/event-store';
import { getClipRegistry } from '@cardplay/state/clip-registry';
import { getBoardContextStore } from '@cardplay/boards/context/store';
import { getUndoStack } from '@cardplay/state/undo-stack';

// Get active stream ID
const contextStore = getBoardContextStore();
const activeStreamId = contextStore.getState().activeStreamId;

// Add events with undo
const eventStore = getSharedEventStore();
const undoStack = getUndoStack();

undoStack.push({
  type: 'add-events',
  name: 'Add Note',
  undo: () => {
    eventStore.removeEvents(streamId, [eventId]);
  },
  redo: () => {
    eventStore.addEvent(streamId, myEvent);
  }
});
```

### Testing Boards

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getBoardRegistry } from '@cardplay/boards/registry';
import { validateBoard } from '@cardplay/boards/validate';
import { myBoard } from '../builtins/my-board';

describe('My Board', () => {
  beforeEach(() => {
    // Reset registry
    getBoardRegistry().clear();
  });
  
  it('should validate correctly', () => {
    expect(() => validateBoard(myBoard)).not.toThrow();
  });
  
  it('should register without errors', () => {
    const registry = getBoardRegistry();
    expect(() => registry.register(myBoard)).not.toThrow();
  });
  
  it('should have correct control level', () => {
    expect(myBoard.controlLevel).toBe('full-manual');
  });
  
  it('should hide all tools', () => {
    expect(myBoard.compositionTools.phraseDatabase.enabled).toBe(false);
    expect(myBoard.compositionTools.harmonyExplorer.enabled).toBe(false);
  });
});
```

## Architecture Patterns

### Branded Types
```typescript
import { asTick, asTickDuration } from '@cardplay/types/primitives';

const tick = asTick(960);
const duration = asTickDuration(480);
```

### Undo Pattern
```typescript
// Always wrap mutations in undo actions
undoStack.push({
  type: 'my-action',
  name: 'Friendly Name',
  undo: () => { /* revert */ },
  redo: () => { /* apply */ }
});
```

### Subscription Pattern
```typescript
// Always clean up subscriptions
const subscriptionId = store.subscribe((state) => {
  // React to changes
});

// Later:
store.unsubscribe(subscriptionId);
```

## Common Tasks

### Switch to a Board Programmatically
```typescript
import { switchBoard } from '@cardplay/boards/switching/switch-board';

switchBoard('my-board-id', {
  resetLayout: false,
  resetDecks: false,
  preserveActiveContext: true,
  preserveTransport: true
});
```

### Get Current Board
```typescript
import { getBoardStateStore } from '@cardplay/boards/store/store';
import { getBoardRegistry } from '@cardplay/boards/registry';

const store = getBoardStateStore();
const boardId = store.getState().currentBoardId;
const board = getBoardRegistry().get(boardId);
```

### Check if Card is Allowed on Board
```typescript
import { isCardAllowed } from '@cardplay/boards/gating/is-card-allowed';
import type { CardMeta } from '@cardplay/cards/types';

const allowed = isCardAllowed(board, cardMeta);
if (!allowed) {
  const reason = whyNotAllowed(board, cardMeta);
  console.log('Card not allowed:', reason);
}
```

## File Structure

```
src/
├── boards/
│   ├── builtins/           # Board definitions
│   ├── context/            # Active context store
│   ├── decks/              # Deck factories
│   │   └── factories/      # Individual deck factories
│   ├── gating/             # Card/tool visibility logic
│   ├── layout/             # Layout runtime
│   ├── project/            # Project structure
│   ├── store/              # Board state persistence
│   ├── switching/          # Board switching logic
│   ├── init.ts             # System initialization
│   ├── registry.ts         # Board registry
│   ├── types.ts            # Core types
│   └── validate.ts         # Board validation
├── ui/
│   ├── components/
│   │   ├── board-host.ts            # Root board container
│   │   ├── board-switcher.ts        # Cmd+B modal
│   │   ├── board-browser.ts         # Full board library
│   │   ├── deck-panel-host.ts       # Deck rendering
│   │   └── ...
│   ├── keyboard-shortcuts.ts        # Keyboard system
│   ├── ui-event-bus.ts              # Event coordination
│   └── drop-handlers.ts             # Drag/drop system
└── state/                   # Shared stores
    ├── event-store.ts       # Events/notes
    ├── clip-registry.ts     # Clips
    ├── undo-stack.ts        # Undo/redo
    └── ...
```

---

**See also:**
- `BOARD_SYSTEM_PROGRESS.md` - Implementation status
- `currentsteps-branchA.md` - Detailed roadmap
- `docs/boards/` - Comprehensive documentation
