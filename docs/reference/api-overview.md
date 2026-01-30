# CardPlay API Reference

**Complete reference for CardPlay's public APIs**

---

## Table of Contents

1. [Core Systems](#core-systems)
2. [Board System API](#board-system-api)
3. [Event Store API](#event-store-api)
4. [Clip Registry API](#clip-registry-api)
5. [Routing Graph API](#routing-graph-api)
6. [Extension API](#extension-api)
7. [Types Reference](#types-reference)

---

## Core Systems

### Initialization

```typescript
import { initializeBoardSystem } from './boards/initialization';

// Initialize the complete board-centric system
const cleanup = initializeBoardSystem();

// Later, when shutting down:
cleanup();
```

**What it does:**
- Registers all builtin boards
- Registers all deck factories
- Initializes keyboard shortcuts
- Sets up board switcher UI
- Restores last active board (or selects default)

---

## Board System API

See full board documentation at [Board System](../boards/).

### Quick Reference

```typescript
// Get/switch boards
import { BoardStateStore } from './boards/state/board-state-store';
const board = BoardStateStore.getActiveBoard();
BoardStateStore.switchBoard(boardId);

// Register deck factories
import { DeckFactory } from './boards/decks/deck-factory';
DeckFactory.register({ type: 'my-deck', render: (...) => {...} });
```

---

## Event Store API

The central store for all musical events.

```typescript
import { SharedEventStore } from './state/event-store';

// Create stream
const streamId = SharedEventStore.createStream({ 
  name: 'Piano', 
  events: [] 
});

// Add events
SharedEventStore.addEvents(streamId, [
  {
    id: asEventId('e1'),
    kind: EventKinds.NOTE,
    start: asTick(0),
    duration: asTickDuration(480),
    payload: { pitch: 60, velocity: 80 }
  }
]);

// Query events
const events = SharedEventStore.queryEvents(streamId, asTick(0), asTick(1920));

// Subscribe to changes
const unsub = SharedEventStore.subscribe((state) => {
  console.log('Store updated');
});
```

---

## Clip Registry API

Manages clips (containers for streams).

```typescript
import { ClipRegistry } from './state/clip-registry';

// Create clip
const clipId = ClipRegistry.createClip({
  name: 'Verse',
  streamId,
  duration: asTickDuration(7680),
  loop: true
});

// Update clip
ClipRegistry.updateClip(clipId, { name: 'Chorus' });
```

---

## Routing Graph API

Manages audio/MIDI/modulation routing.

```typescript
import { RoutingGraph } from './state/routing-graph';

// Connect nodes
RoutingGraph.connect({
  from: { nodeId: asNodeId('piano'), portId: 'audio-out' },
  to: { nodeId: asNodeId('master'), portId: 'audio-in' },
  type: 'audio'
});

// Validate connection
const valid = RoutingGraph.validateConnection(fromPort, toPort);
```

---

## Extension API

Create custom extensions for CardPlay.

```typescript
import { ExtensionAPI } from './extensions/api';

const myExtension = {
  manifest: {
    id: 'my-ext',
    name: 'My Extension',
    version: '1.0.0',
    permissions: ['event-store']
  },
  initialize(api: ExtensionAPI) {
    api.registerCard({ id: 'my-card', ... });
    api.registerGenerator({ id: 'my-gen', ... });
  }
};
```

---

## Types Reference

### Branded Types

CardPlay uses branded types for safety:

```typescript
type Tick = number & { __brand: 'Tick' };
type TickDuration = number & { __brand: 'TickDuration' };
type EventId = string & { __brand: 'EventId' };

// Constructors
function asTick(n: number): Tick;
function asTickDuration(n: number): TickDuration;
function asEventId(s: string): EventId;
```

### Event Structure

```typescript
interface Event {
  id: EventId;
  kind: EventKind;  // 'NOTE' | 'CC' | 'AUTOMATION' | etc.
  start: Tick;
  duration: TickDuration;
  payload: Record<string, any>;
}
```

---

## Best Practices

- Always use branded type constructors
- Use `executeWithUndo()` for undoable operations
- Subscribe selectively to stores
- Virtualize large lists
- Request minimal extension permissions

---

## Further Reading

- [Keyboard Shortcuts](../guides/keyboard-shortcuts.md)
- [FAQ](../guides/faq.md)
- [Troubleshooting](../guides/troubleshooting.md)
- [Cookbook](../guides/cookbook.md)
