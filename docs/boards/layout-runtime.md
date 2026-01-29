# Layout Runtime Model

## Overview

The Layout Runtime system bridges board layout definitions (static) to runtime layout state (dynamic). It manages panel sizes, collapsed states, dock trees, and deck arrangements.

## Architecture

```
Board.layout (static definition)
    ↓
createDefaultLayoutRuntime()
    ↓
LayoutRuntime (live UI state)
    ↓
User modifications (resize, collapse, reorder)
    ↓
serializeLayoutRuntime()
    ↓
PersistedLayoutState (localStorage)
```

## LayoutRuntime Types

### Panel Node

Represents a panel in the dock tree:

```typescript
interface PanelNode {
  type: 'panel';
  id: string;
  role: PanelRole;
  position: PanelPosition;
  size: number;           // Pixels
  collapsed: boolean;
  resizable: boolean;
  collapsible: boolean;
}
```

### Split Node

Represents a split container:

```typescript
interface SplitNode {
  type: 'split';
  orientation: 'horizontal' | 'vertical';
  children: (PanelNode | SplitNode)[];
  sizes: number[];        // Size of each child
}
```

## Default Layout Creation

### createDefaultLayoutRuntime(board: Board)

Generates initial layout runtime from board definition:

```typescript
import { createDefaultLayoutRuntime } from '@cardplay/boards/layout';

const runtime = createDefaultLayoutRuntime(board);
```

Applies:
- Default panel sizes from `BoardLayout.panels[].defaultWidth/defaultHeight`
- Default collapsed states (all expanded initially)
- Stable dock tree based on panel positions

## Layout Persistence

### serializeLayoutRuntime(runtime: LayoutRuntime)

Serializes runtime state to JSON-compatible format:

```typescript
import { serializeLayoutRuntime } from '@cardplay/boards/layout';

const persisted = serializeLayoutRuntime(runtime);
// Save to BoardState.perBoardLayout[boardId]
```

Removes:
- Function references
- DOM nodes
- Event handlers
- Temporary UI state

### deserializeLayoutRuntime(persisted: PersistedLayoutState)

Rebuilds runtime from persisted state:

```typescript
import { deserializeLayoutRuntime } from '@cardplay/boards/layout';

const runtime = deserializeLayoutRuntime(persisted);
```

Applies:
- Validation (ensure panel IDs still exist)
- Default values for missing fields
- Guards against malformed data

## Merging Persisted State

### mergePersistedLayout(board: Board, persisted: PersistedLayoutState)

Merges persisted customizations with board defaults:

```typescript
import { mergePersistedLayout } from '@cardplay/boards/layout';

const runtime = mergePersistedLayout(board, persisted);
```

Strategy:
1. Start with default layout runtime
2. Apply persisted panel sizes (if valid)
3. Apply persisted collapsed states
4. Apply custom dock tree (if compatible)
5. Validate result and fall back to defaults on error

## Panel Position Mapping

Panels are arranged based on `PanelPosition`:

- `'left'` - Left sidebar
- `'right'` - Right sidebar
- `'top'` - Top strip
- `'bottom'` - Bottom strip
- `'center'` - Main content area

### Dock Tree Structure

Typical arrangement:

```
Root (horizontal split)
├── Left Sidebar (vertical split)
│   ├── Browser Panel
│   └── Properties Panel
├── Center (vertical split)
│   ├── Top Toolbar
│   ├── Main Content
│   └── Bottom Timeline
└── Right Sidebar (vertical split)
    ├── Mixer Panel
    └── Effects Panel
```

## Deck Integration

Decks are rendered inside panels based on `BoardDeck.type` and panel role:

```typescript
// Example: Pattern deck in composition panel
{
  decks: [{
    id: 'pattern-1',
    type: 'pattern-deck',
    cardLayout: 'tabs',
    // ...
  }],
  layout: {
    panels: [{
      id: 'composition',
      role: 'composition',
      position: 'center',
      // Pattern deck renders here
    }]
  }
}
```

## Resize Behavior

### Panel Resizing

1. User drags splitter
2. Update `sizes[]` in parent SplitNode
3. Trigger re-layout (CSS flexbox)
4. Debounce persistence (300ms)

### Constraints

- Minimum panel size: 100px
- Maximum panel size: 80% of container
- Resizable only if `panel.resizable === true`

## Collapse Behavior

### Panel Collapsing

1. User clicks collapse button
2. Set `panel.collapsed = true`
3. Animate panel to 0px (or header-only height)
4. Update `collapsedPanels` array
5. Persist immediately (no debounce for toggles)

### Expanding

1. User clicks expand button
2. Set `panel.collapsed = false`
3. Restore size from persisted state or default
4. Animate to target size

## Validation

### validateLayoutRuntime(runtime: LayoutRuntime)

Validates layout runtime integrity:

```typescript
import { validateLayoutRuntime } from '@cardplay/boards/layout/guards';

const isValid = validateLayoutRuntime(runtime);
```

Checks:
- All panel IDs are unique
- All positions are valid
- All sizes are positive numbers
- Dock tree is well-formed
- No circular references

## Edge Cases

### Board Switch with Incompatible Layout

When switching boards with different panel sets:

1. Attempt to merge persisted state
2. If panel ID doesn't exist in new board, skip
3. If validation fails, fall back to default layout
4. Log warning (dev mode only)

### Missing Panel Definitions

If board definition changes and removes a panel:

1. Ignore persisted state for that panel
2. Remove from collapsed panels list
3. Remove from custom dock tree
4. Continue with remaining panels

### Corrupted Persisted State

If `JSON.parse()` fails or data is malformed:

1. Log error (dev mode)
2. Fall back to default layout runtime
3. Clear corrupted state
4. Continue with defaults

## Performance

- Layout computation: O(n) where n = panel count
- Typical panel count: 4-8
- Layout update time: < 5ms
- Resize throttling: 60fps (16ms)

## CSS Integration

Layout runtime drives CSS custom properties:

```typescript
// Applied to root element
document.documentElement.style.setProperty(
  '--panel-left-width',
  `${leftPanelSize}px`
);
```

Panels use CSS Grid or Flexbox with these variables.

## Accessibility

- Keyboard navigation through panels (Tab, Shift+Tab)
- Screen reader announcements for collapse/expand
- Focus management during panel operations
- High contrast mode compatibility

## See Also

- [Board API](./board-api.md)
- [Board State](./board-state.md)
- [Board Migration](./migration.md)
