# CardPlay Routing System

> **Phase J - J055**: Routing overlay visualization and connection management.

## Overview

The CardPlay routing system provides visual connection management between audio/MIDI sources and destinations. It supports multiple connection types with type-safe validation and an intuitive graphical overlay.

## Connection Types

### Supported Connection Types (A082)

| Type | Color | Description |
|------|-------|-------------|
| `audio` | Blue | Audio signal routing |
| `midi` | Green | MIDI note/CC routing |
| `modulation` | Purple | Parameter modulation |
| `trigger` | Orange | Event triggers |

### Type Compatibility (A083)

The routing graph enforces type compatibility:

```typescript
// Valid connections
audio → audio
midi → midi  
modulation → any parameter
trigger → any action

// Invalid connections (rejected)
audio → midi
midi → audio
trigger → modulation
```

## Routing Graph Store

### Core Types

```typescript
/**
 * Routing node (deck, card, or track)
 */
export interface RoutingNode {
  readonly id: string;
  readonly type: 'deck' | 'card' | 'track';
  readonly label: string;
  readonly inputs: Port[];
  readonly outputs: Port[];
}

/**
 * Connection between nodes
 */
export interface RoutingConnection {
  readonly id: string;
  readonly sourceNode: string;
  readonly sourcePort: string;
  readonly targetNode: string;
  readonly targetPort: string;
  readonly connectionType: ConnectionType;
  readonly gain?: number;  // Audio connections
  readonly enabled: boolean;
}

/**
 * Port on a node
 */
export interface Port {
  readonly id: string;
  readonly label: string;
  readonly type: ConnectionType;
  readonly direction: 'input' | 'output';
}
```

### Graph Operations (A081)

```typescript
import { getRoutingGraph } from '@cardplay/state/routing-graph';

const graph = getRoutingGraph();

// Add node
graph.addNode(node);

// Add connection (with validation)
const result = graph.addConnection(connection);
if (!result.valid) {
  console.error(result.reason); // "Incompatible port types"
}

// Remove connection
graph.removeConnection(connectionId);

// Query connections
const connections = graph.getConnectionsForNode(nodeId);
const inbound = graph.getInboundConnections(nodeId);
const outbound = graph.getOutboundConnections(nodeId);
```

## Routing Overlay UI (J021-J033)

### Activation

The routing overlay is toggled via:
- Shortcut: `Cmd+Shift+R`
- Board chrome button: "Show Routing"
- Per-board persistence: state saved

### Visual Elements (J022, J023)

```
┌─────────────────────────────────────────┐
│  [Routing Overlay]        ×  Mini  Full │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────┐         ┌──────┐              │
│  │ Deck │ Audio → │ Deck │              │
│  │  A   │─────────│  B   │              │
│  └──────┘         └──────┘              │
│                                          │
│  ┌──────┐  MIDI  ┌──────┐               │
│  │Card │ ~~~~~~~~│Card  │               │
│  │ C   │         │ D    │               │
│  └──────┘         └──────┘              │
│                                          │
└─────────────────────────────────────────┘
```

#### Node Rendering (J022)

Nodes are rendered as:
- **Decks**: Rounded rectangles with deck icon
- **Cards**: Smaller rectangles with card type icon  
- **Tracks**: Horizontal bars with track number

Input ports on left, output ports on right.

#### Connection Rendering (J023)

Connections use color-coded lines:
- **Audio**: Thick blue curves
- **MIDI**: Medium green curves
- **Modulation**: Thin purple dashed lines
- **Trigger**: Dotted orange lines

### Interaction (J024, J025)

#### Click-to-Connect (J024)

1. Click output port on source node
2. Port highlights, connection preview appears
3. Click input port on destination node
4. Validation runs:
   - ✅ Valid: Connection created
   - ❌ Invalid: Shake animation + tooltip with reason
5. Connection persists to routing graph

#### Drag-to-Rewire (J025)

1. Click existing connection line
2. Drag to new port
3. Validation runs on drop
4. Connection updated if valid

#### Undo Support (J026, J036)

All connection operations are undoable:

```typescript
import { getUndoStack } from '@cardplay/state';

// Connection operations automatically wrapped
getUndoStack().push({
  name: 'Add Connection',
  forward: () => graph.addConnection(connection),
  backward: () => graph.removeConnection(connection.id)
});
```

### Modes

#### Full Mode

- Shows all nodes and connections
- Pan and zoom enabled
- Node positions draggable
- Layout auto-arranged or manual

#### Mini-Map Mode (J028)

- Zoomed-out overview
- Click to focus area in full mode
- Useful for dense graphs (50+ connections)
- Color-coded density visualization

#### Focus Mode

- Shows only connections for selected node
- Other nodes dimmed
- Reduces visual complexity

### Validation Feedback (J032)

Invalid connection attempts show:
- ❌ Red X icon at cursor
- Shake animation on target port
- Tooltip: "Cannot connect audio to MIDI"
- Audio feedback (optional)

### Accessibility (J033, J051)

- **Reduced Motion**: Smooth animations disabled
- **High Contrast**: Thicker lines, stronger colors
- **Keyboard Navigation**:
  - Tab between nodes
  - Arrow keys move selection
  - Enter to select port
  - Space to create connection
  - Escape to cancel

## Connection Inspector Panel (J031)

Selected connections show details panel:

```
┌───────────────────────────┐
│ Connection Inspector      │
├───────────────────────────┤
│ Type: Audio               │
│ Source: Mixer Track 1     │
│ Target: Master Out        │
│                           │
│ Gain: ▓▓▓▓▓░░░ -6.0 dB   │
│                           │
│ [ ] Enabled               │
│ [×] Delete Connection     │
└───────────────────────────┘
```

Controls:
- **Gain Slider**: Audio connections only
- **Enabled Toggle**: Bypass without deleting
- **Delete Button**: Remove connection (undoable)

## Audio Engine Integration

### Deck Layout Adapter (J029, J030)

Audio decks expose audio nodes for routing:

```typescript
import { DeckLayoutAdapter } from '@cardplay/audio/deck-layout';

// Get audio nodes for routing
const adapter = new DeckLayoutAdapter(deckDef);
const inputNode = adapter.getInputNode();
const outputNode = adapter.getOutputNode();

// Connections update audio graph automatically
graph.subscribe((connections) => {
  audioEngine.updateRoutingGraph(connections);
});
```

### Real-Time Audio Routing

Changes to routing graph trigger audio engine updates:
1. Connection added → Audio nodes connected
2. Connection removed → Audio nodes disconnected
3. Gain changed → Audio gain updated
4. Connection disabled → Audio muted

No audio glitches during routing changes (smooth crossfade).

## Persistence

### Per-Board Routing (J027)

Routing configurations save per-board:

```json
{
  "boardId": "composer",
  "routingGraph": {
    "nodes": [...],
    "connections": [...]
  }
}
```

Key: `cardplay.boards.composer.routing.v1`

### Project Routing

Project files include global routing:

```json
{
  "version": "1.0.0",
  "routing": {
    "masterOut": "node-123",
    "connections": [...]
  }
}
```

## Validation Rules (Phase D - D028, D029, D043, D044)

### Port Type Validation

```typescript
export function canConnect(
  source: Port,
  target: Port
): { valid: boolean; reason?: string } {
  // Check direction
  if (source.direction !== 'output') {
    return { valid: false, reason: 'Source must be output port' };
  }
  if (target.direction !== 'input') {
    return { valid: false, reason: 'Target must be input port' };
  }
  
  // Check type compatibility
  if (source.type === 'audio' && target.type !== 'audio') {
    return { valid: false, reason: 'Cannot connect audio to non-audio' };
  }
  if (source.type === 'midi' && target.type !== 'midi') {
    return { valid: false, reason: 'Cannot connect MIDI to non-MIDI' };
  }
  
  // Modulation can target any parameter
  if (source.type === 'modulation') {
    return { valid: true };
  }
  
  return { valid: true };
}
```

### Cycle Detection

```typescript
// Prevent routing cycles (A → B → A)
export function hasCycle(
  graph: RoutingGraph,
  connection: RoutingConnection
): boolean {
  const visited = new Set<string>();
  
  function visit(nodeId: string): boolean {
    if (visited.has(nodeId)) return true;
    visited.add(nodeId);
    
    const outbound = graph.getOutboundConnections(nodeId);
    return outbound.some(conn => visit(conn.targetNode));
  }
  
  return visit(connection.sourceNode);
}
```

## Performance (J059)

### Render Optimization

- **Virtualization**: Only visible connections rendered
- **Dirty Regions**: Redraw only changed areas
- **RAF Throttling**: Max 60fps rendering
- **Canvas Layers**: Static nodes on bottom layer, connections on top

### Large Graphs

For graphs with 50+ nodes:
- Automatic layout uses force-directed algorithm
- Clustering groups related nodes
- Level-of-detail rendering (simplified at zoom-out)
- Search/filter to focus on subset

## Testing

### Unit Tests (J034, J035, J036)

```typescript
// Phase D validation tests
test('canConnect rejects audio→midi', () => {
  const audio = { type: 'audio', direction: 'output' };
  const midi = { type: 'midi', direction: 'input' };
  
  const result = canConnect(audio, midi);
  expect(result.valid).toBe(false);
  expect(result.reason).toContain('audio');
});

// Integration tests
test('adding connection updates graph store', () => {
  const graph = getRoutingGraph();
  const connection = createTestConnection();
  
  graph.addConnection(connection);
  
  const stored = graph.getConnection(connection.id);
  expect(stored).toEqual(connection);
});

test('undo restores previous routing', () => {
  const graph = getRoutingGraph();
  const undo = getUndoStack();
  
  const connection = createTestConnection();
  graph.addConnection(connection);
  
  undo.undo();
  
  expect(graph.getConnection(connection.id)).toBeUndefined();
});
```

## Related Documentation

- `docs/boards/decks.md` - Deck audio nodes
- `docs/boards/theming.md` - Routing overlay styling
- `docs/state/routing-graph.md` - Graph data structures
- `BOARD_API_REFERENCE.md` - Routing API reference

## Future Enhancements

- **Routing Templates**: Save/load common routing setups
- **Bus System**: Hierarchical routing with aux sends
- **Sidechain Routing**: Ducking and modulation routing
- **MIDI Learn**: Click-to-assign MIDI CC to parameters
- **Multi-Output**: Cards with multiple output buses

---

**Status**: Phase J - J021-J033 ✅ Complete
**Last Updated**: 2026-01-29
**Version**: 1.0.0
