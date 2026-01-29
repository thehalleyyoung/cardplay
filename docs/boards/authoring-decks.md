# Deck Authoring Guide

**Phase K Task:** K003
**Last Updated:** 2026-01-29

## Overview

This guide explains how to create a new deck type for CardPlay from scratch. By the end of this guide, you'll be able to:

1. Define a new `DeckType`
2. Create a `DeckFactory`
3. Implement the deck UI component
4. Register and test your deck
5. Add gating rules
6. Write documentation and tests

---

## Prerequisites

- Familiarity with TypeScript
- Understanding of CardPlay's board system (see [board-api.md](./board-api.md))
- Familiarity with the active context system (`BoardContextStore`)
- Understanding of deck types (see [decks.md](./decks.md))

---

## What is a Deck?

A **deck** is a UI container that renders one of the standard editing or tool surfaces in CardPlay:

- **Editor Decks**: Pattern editor, piano roll, notation, timeline
- **Browser Decks**: Instrument browser, sample browser, phrase library
- **Tool Decks**: Mixer, properties, DSP chain, transport
- **AI Decks**: Generator, arranger, harmony display, AI advisor

Decks are:
- **Board-agnostic**: Can be used on any board
- **Context-aware**: Bind to `ActiveContext` (active stream, clip, track)
- **Stateful**: Persist UI state per board (scroll, tabs, filters)
- **Gateable**: Can be hidden based on board control level

---

## Step 1: Plan Your Deck

Before coding, answer these questions:

### 1. **What does this deck do?**
   - Is it an editor (tracker, notation, piano roll)?
   - Is it a browser (instruments, samples, phrases)?
   - Is it a tool (mixer, properties, effects)?
   - Is it an AI assistant (generator, arranger, advisor)?

### 2. **What context does it need?**
   - Active stream ID? (for pattern editors)
   - Active clip ID? (for clip properties)
   - Active track ID? (for mixer strips)
   - No context? (global tools like transport)

### 3. **What state should persist?**
   - Active tab index?
   - Scroll position?
   - Search/filter state?
   - Zoom level?

### 4. **Should it be gateable?**
   - Should it hide on certain boards? (e.g., phrase library hidden on manual boards)
   - Which control levels allow it?
   - Which tool config gates it?

### 5. **What are the key interactions?**
   - Edit events? (needs undo integration)
   - Launch clips? (needs transport integration)
   - Drag/drop? (needs drag system integration)
   - Generate content? (needs AI/generator integration)

---

## Step 2: Define the DeckType

Add your new deck type to `src/boards/types.ts`:

```typescript
export type DeckType =
  // ... existing types
  | 'my-custom-deck';  // Add your type here
```

Choose a clear, descriptive name. Convention:
- `{purpose}-deck` for tools: `mixer-deck`, `properties-deck`
- `{content}-browser` for browsers: `instrument-browser`, `sample-browser`
- `{surface}-editor` for editors: `pattern-editor`, `notation-score`

---

## Step 3: Create the Factory

Create a new file: `src/boards/decks/factories/my-custom-deck-factory.ts`

```typescript
import type { DeckFactory, DeckInstance } from '../factory-types';
import type { BoardDeck } from '../../types';
import type { BoardContext } from '../../context/types';
import { MyCustomDeck } from '../../../ui/components/my-custom-deck';

/**
 * Factory for MyCustomDeck.
 */
export const myCustomDeckFactory: DeckFactory = {
  deckType: 'my-custom-deck',
  
  /**
   * Create a deck instance.
   */
  create(deckDef: BoardDeck, context: BoardContext): DeckInstance {
    // Return a DeckInstance object
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'My Custom Deck',
      
      /**
       * Render the deck into a container element.
       * @returns cleanup function
       */
      render(container: HTMLElement): () => void {
        // Create and mount your deck component
        const deck = new MyCustomDeck(container, {
          deckId: deckDef.id,
          initialState: {}, // Load persisted state if needed
        });
        
        // Return cleanup function
        return () => {
          deck.destroy();
        };
      },
      
      /**
       * Optional: Handle context changes (active stream, clip, etc.)
       */
      onContextChange(newContext: BoardContext): void {
        // Update deck based on new context
        // e.g., switch to new active stream
      }
    };
  },
  
  /**
   * Optional: Validate deck configuration.
   */
  validate(deckDef: BoardDeck): string | null {
    // Return error message or null if valid
    if (deckDef.cardLayout === 'floating' && !deckDef.allowReordering) {
      return 'Floating decks must allow reordering';
    }
    return null;
  }
};
```

---

## Step 4: Implement the Deck UI Component

Create your deck component: `src/ui/components/my-custom-deck.ts`

```typescript
import { getBoardContextStore } from '../../boards/context/store';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';
import type { SubscriptionId } from '../../state/types';

/**
 * Configuration for MyCustomDeck.
 */
export interface MyCustomDeckConfig {
  deckId: string;
  initialState?: MyCustomDeckState;
}

/**
 * Persisted state for MyCustomDeck.
 */
export interface MyCustomDeckState {
  activeTab?: number;
  scrollY?: number;
  searchQuery?: string;
  // Add your state fields here
}

/**
 * MyCustomDeck component.
 */
export class MyCustomDeck {
  private container: HTMLElement;
  private config: MyCustomDeckConfig;
  private state: MyCustomDeckState;
  private subscriptions: SubscriptionId[] = [];
  
  constructor(container: HTMLElement, config: MyCustomDeckConfig) {
    this.container = container;
    this.config = config;
    this.state = config.initialState || {};
    
    this.init();
  }
  
  /**
   * Initialize the deck.
   */
  private init(): void {
    // Inject styles
    this.injectStyles();
    
    // Create UI
    this.render();
    
    // Subscribe to context changes
    const contextStore = getBoardContextStore();
    const subId = contextStore.subscribe(() => {
      this.onContextChange();
    });
    this.subscriptions.push(subId);
    
    // Subscribe to store changes if needed
    const eventStore = getSharedEventStore();
    const eventSubId = eventStore.subscribe(() => {
      this.onEventsChange();
    });
    this.subscriptions.push(eventSubId);
  }
  
  /**
   * Render the deck UI.
   */
  private render(): void {
    this.container.innerHTML = '';
    
    // Create your UI elements
    const wrapper = document.createElement('div');
    wrapper.className = 'my-custom-deck';
    
    const header = this.createHeader();
    wrapper.appendChild(header);
    
    const content = this.createContent();
    wrapper.appendChild(content);
    
    this.container.appendChild(wrapper);
  }
  
  /**
   * Create header.
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'my-custom-deck__header';
    
    const title = document.createElement('h3');
    title.textContent = 'My Custom Deck';
    header.appendChild(title);
    
    // Add controls, buttons, etc.
    
    return header;
  }
  
  /**
   * Create main content.
   */
  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'my-custom-deck__content';
    
    // Add your main content here
    
    return content;
  }
  
  /**
   * Handle context changes.
   */
  private onContextChange(): void {
    const context = getBoardContextStore().getContext();
    // Update UI based on new active stream, clip, etc.
  }
  
  /**
   * Handle event store changes.
   */
  private onEventsChange(): void {
    // Update UI when events change
  }
  
  /**
   * Get current state (for persistence).
   */
  getState(): MyCustomDeckState {
    return this.state;
  }
  
  /**
   * Inject component styles.
   */
  private injectStyles(): void {
    const styleId = 'my-custom-deck-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .my-custom-deck {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--color-bg-secondary, #1a1a1a);
      }
      
      .my-custom-deck__header {
        padding: var(--spacing-md, 16px);
        border-bottom: 1px solid var(--color-border, #444);
      }
      
      .my-custom-deck__header h3 {
        margin: 0;
        font-size: 18px;
        color: var(--color-text-primary, #fff);
      }
      
      .my-custom-deck__content {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-md, 16px);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Cleanup and destroy the deck.
   */
  destroy(): void {
    // Unsubscribe from all stores
    for (const subId of this.subscriptions) {
      // Call appropriate unsubscribe method
      // getBoardContextStore().unsubscribe(subId);
    }
    this.subscriptions = [];
    
    // Remove from DOM
    this.container.innerHTML = '';
  }
}
```

---

## Step 5: Register the Factory

Add your factory to `src/boards/decks/factories/index.ts`:

```typescript
import { myCustomDeckFactory } from './my-custom-deck-factory';

export function registerAllFactories(): void {
  // ... existing registrations
  
  // Add your factory
  registerFactory('my-custom-deck', myCustomDeckFactory);
}
```

---

## Step 6: Add Gating Rules (Optional)

If your deck should be hidden on certain boards, add gating rules.

In `src/boards/gating/tool-visibility.ts`:

```typescript
export function computeVisibleDeckTypes(board: Board): Set<DeckType> {
  const visible = new Set<DeckType>();
  
  // ... existing rules
  
  // Add your deck's gating logic
  if (board.compositionTools.myTool?.mode !== 'hidden') {
    visible.add('my-custom-deck');
  }
  
  return visible;
}
```

---

## Step 7: Test Your Deck

Create tests: `src/boards/decks/factories/my-custom-deck-factory.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { myCustomDeckFactory } from './my-custom-deck-factory';
import type { BoardDeck } from '../../types';
import type { BoardContext } from '../../context/types';

describe('myCustomDeckFactory', () => {
  let deckDef: BoardDeck;
  let context: BoardContext;
  
  beforeEach(() => {
    deckDef = {
      id: 'test-deck',
      type: 'my-custom-deck',
      cardLayout: 'stack',
      allowReordering: true,
      allowDragOut: false
    };
    
    context = {
      activeStreamId: null,
      activeClipId: null,
      activeTrackId: null,
      activeViewType: 'tracker'
    };
  });
  
  it('should create a deck instance', () => {
    const instance = myCustomDeckFactory.create(deckDef, context);
    
    expect(instance.id).toBe('test-deck');
    expect(instance.type).toBe('my-custom-deck');
    expect(instance.title).toBe('My Custom Deck');
    expect(typeof instance.render).toBe('function');
  });
  
  it('should validate deck configuration', () => {
    const error = myCustomDeckFactory.validate?.(deckDef);
    expect(error).toBeNull();
  });
  
  it('should reject invalid configuration', () => {
    deckDef.cardLayout = 'floating';
    deckDef.allowReordering = false;
    
    const error = myCustomDeckFactory.validate?.(deckDef);
    expect(error).toContain('Floating decks must allow reordering');
  });
  
  it('should render without errors', () => {
    const instance = myCustomDeckFactory.create(deckDef, context);
    const container = document.createElement('div');
    
    const cleanup = instance.render(container);
    expect(container.children.length).toBeGreaterThan(0);
    
    cleanup();
    expect(container.children.length).toBe(0);
  });
  
  it('should handle context changes', () => {
    const instance = myCustomDeckFactory.create(deckDef, context);
    
    if (instance.onContextChange) {
      const newContext = { ...context, activeStreamId: 'stream-1' as any };
      expect(() => instance.onContextChange!(newContext)).not.toThrow();
    }
  });
});
```

Also create component tests: `src/ui/components/my-custom-deck.test.ts`

---

## Step 8: Document Your Deck

Add your deck to `docs/boards/decks.md`:

```markdown
#### `my-custom-deck` (My Custom Deck)
- **Factory:** `my-custom-deck-factory.ts`
- **Component:** `my-custom-deck.ts`
- **Purpose:** Brief description of what it does
- **Gating:** Controlled by `myTool` tool mode
- **Features:**
  - Feature 1
  - Feature 2
  - Feature 3
- **Typical Boards:** Which boards use this deck
```

---

## Best Practices

### 1. **Use Theme Tokens**
Always use CSS custom properties from the theme system:
```css
color: var(--color-text-primary, #fff);
background: var(--color-bg-secondary, #1a1a1a);
```

### 2. **Integrate with Undo**
Any mutations should use `UndoStack`:
```typescript
getUndoStack().push({
  type: 'batch',
  description: 'My action',
  redo: () => { /* ... */ },
  undo: () => { /* ... */ }
});
```

### 3. **Clean Up Subscriptions**
Always unsubscribe in `destroy()`:
```typescript
destroy(): void {
  for (const subId of this.subscriptions) {
    store.unsubscribe(subId);
  }
  this.subscriptions = [];
}
```

### 4. **Handle Empty States**
Show helpful empty states when there's no content:
```typescript
if (items.length === 0) {
  return createEmptyState('No items yet', () => {
    // Action to add first item
  });
}
```

### 5. **Accessibility**
- Add ARIA roles: `role="region"`, `aria-label="My Deck"`
- Keyboard navigation: arrow keys, enter, escape
- Focus management: trap focus in modals
- Screen reader announcements for state changes

### 6. **Performance**
- Virtualize large lists (e.g., sample browser with 1000+ samples)
- Throttle rapid updates (scroll, resize)
- Use `requestAnimationFrame` for animations
- Debounce user input (search, sliders)

---

## Common Patterns

### Pattern 1: Active Context Binding

```typescript
private onContextChange(): void {
  const context = getBoardContextStore().getContext();
  
  if (context.activeStreamId && context.activeStreamId !== this.currentStreamId) {
    this.currentStreamId = context.activeStreamId;
    this.loadStream(context.activeStreamId);
  }
}
```

### Pattern 2: Store Integration

```typescript
private loadStream(streamId: EventStreamId): void {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  
  if (stream) {
    this.events = stream.events;
    this.render();
  }
}
```

### Pattern 3: State Persistence

```typescript
private saveState(): void {
  const stateStore = getBoardStateStore();
  const boardId = stateStore.getState().currentBoardId;
  
  if (boardId) {
    stateStore.setDeckState(boardId, {
      [this.config.deckId]: this.getState()
    });
  }
}
```

### Pattern 4: Drag/Drop Support

```typescript
private setupDragDrop(): void {
  this.container.addEventListener('drop', (e) => {
    e.preventDefault();
    const payload = JSON.parse(e.dataTransfer!.getData('application/json'));
    
    if (payload.type === 'phrase') {
      this.handlePhraseDrop(payload);
    }
  });
  
  this.container.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
}
```

---

## Example: Simple Browser Deck

Here's a complete minimal example:

```typescript
// Factory
export const itemBrowserFactory: DeckFactory = {
  deckType: 'item-browser',
  
  create(deckDef: BoardDeck, context: BoardContext): DeckInstance {
    return {
      id: deckDef.id,
      type: deckDef.type,
      title: 'Item Browser',
      
      render(container: HTMLElement): () => void {
        const deck = new ItemBrowserDeck(container);
        return () => deck.destroy();
      }
    };
  }
};

// Component
export class ItemBrowserDeck {
  private container: HTMLElement;
  private items: string[] = ['Item 1', 'Item 2', 'Item 3'];
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }
  
  private render(): void {
    this.container.innerHTML = `
      <div class="item-browser">
        <h3>Items</h3>
        <ul>
          ${this.items.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  destroy(): void {
    this.container.innerHTML = '';
  }
}
```

---

## Troubleshooting

### Problem: Deck doesn't appear on board
- Check factory is registered in `factories/index.ts`
- Check `DeckType` is added to types.ts
- Check board definition includes your deck
- Check gating rules aren't hiding it

### Problem: Context changes don't update deck
- Implement `onContextChange` in `DeckInstance`
- Subscribe to `BoardContextStore` in component
- Call `render()` when context changes

### Problem: State doesn't persist
- Implement `getState()` in component
- Call `BoardStateStore.setDeckState()` on changes
- Load initial state from `config.initialState` in constructor

### Problem: Type errors
- Ensure `DeckType` literal matches factory `deckType`
- Check `BoardDeck` type is used for deck definitions
- Check `DeckInstance` return type matches factory

---

## Next Steps

- Read [decks.md](./decks.md) for all builtin deck types
- Read [board-api.md](./board-api.md) for board configuration
- Read [gating.md](./gating.md) for control-level gating rules
- Look at existing factories in `src/boards/decks/factories/` for examples

---

## See Also

- [Board Authoring Guide](./authoring-boards.md)
- [Deck Types Reference](./decks.md)
- [Card Gating Rules](./gating.md)
- [Panel Roles and Layout](./panels.md)
