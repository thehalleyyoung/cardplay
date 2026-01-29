# Board Panels and Layout

This document describes panel roles, layout mapping, and how panels host decks within boards.

**Status:** E085 ✅

## Overview

Panels are the layout containers within a board. They define the spatial organization (left sidebar, center workspace, right inspector, etc.) and host one or more decks.

## Panel Roles

Each panel has a semantic role that indicates its purpose:

### `browser`
Browse and select assets (instruments, samples, phrases, presets).

**Typical Decks:**
- `instruments-deck`
- `samples-deck`
- `phrases-deck`

**Typical Position:** Left sidebar

### `composition`
Main composition workspace (the primary editing surface).

**Typical Decks:**
- `pattern-deck`
- `notation-deck`
- `piano-roll-deck`
- `session-deck`
- `arrangement-deck`

**Typical Position:** Center

### `properties`
Inspect and edit properties of selected items.

**Typical Decks:**
- `properties-deck`

**Typical Position:** Right sidebar or bottom panel

### `mixer`
Audio mixing and routing controls.

**Typical Decks:**
- `mixer-deck`
- `routing-deck`

**Typical Position:** Bottom panel

### `timeline`
Timeline-based arrangement view.

**Typical Decks:**
- `arrangement-deck`
- `automation-deck`

**Typical Position:** Center or bottom (often below composition)

### `toolbar`
Action buttons and mode toggles.

**Typical Decks:**
- Custom toolbar decks (future)

**Typical Position:** Top bar

### `transport`
Playback transport controls.

**Typical Decks:**
- `transport-deck`

**Typical Position:** Top or bottom bar (often in board chrome)

## Panel Positions

Panels are positioned using these values:

- `left`: Left sidebar
- `right`: Right sidebar
- `top`: Top bar (horizontal strip)
- `bottom`: Bottom bar or panel
- `center`: Main workspace

## Panel Definition

Panels are defined in the `BoardLayout.panels` array:

```typescript
interface PanelDefinition {
  readonly id: string;                // Unique ID within board
  readonly role: PanelRole;           // Semantic role
  readonly position: PanelPosition;   // Spatial position
  readonly defaultWidth?: number;     // Default width in pixels
  readonly defaultHeight?: number;    // Default height in pixels
  readonly collapsible?: boolean;     // Can be collapsed
  readonly resizable?: boolean;       // Can be resized
}
```

Example:

```typescript
{
  id: 'left-browser',
  role: 'browser',
  position: 'left',
  defaultWidth: 300,
  collapsible: true,
  resizable: true,
}
```

## Layout Types

Boards support three layout types:

### `dock`
**Dock-based layout** (most common) with:
- Dockable panels that can be moved between positions
- Resizable splitters
- Collapsible sidebars
- Multiple decks per panel (tabs or splits)

Example: VSCode-style layout with left sidebar, center editor, right properties.

### `grid`
**Grid-based layout** with:
- Fixed grid cells
- Responsive sizing
- Deck placement in grid cells

Example: Ableton-style session grid with fixed regions.

### `custom`
**Custom layout** with:
- Application-specific layout logic
- No built-in layout constraints
- Full control over positioning

Use this when dock/grid are insufficient.

## Layout Runtime

The layout runtime is the persisted state of the layout:

```typescript
interface LayoutRuntimeState {
  panels: Record<string, PanelRuntimeState>;
}

interface PanelRuntimeState {
  visible: boolean;
  width?: number;
  height?: number;
  collapsed: boolean;
  decks: string[];  // Deck IDs in this panel
  activeTab?: number;
}
```

Layout runtime is:
- Created from `BoardLayout` by `createDefaultLayoutRuntime(board)`
- Merged with persisted state by `mergePersistedLayout(board, persisted)`
- Serialized for persistence by `serializeLayout(runtime)`
- Deserialized on load by `deserializeLayout(persisted)`

## Panel-Deck Mapping

Decks are assigned to panels via the board definition. Each deck references a panel by ID or is placed in the default composition panel.

Example board with panel-deck mapping:

```typescript
const myBoard: Board = {
  id: 'notation-manual',
  name: 'Notation (Manual)',
  layout: {
    type: 'dock',
    panels: [
      { id: 'left', role: 'browser', position: 'left', defaultWidth: 300 },
      { id: 'center', role: 'composition', position: 'center' },
      { id: 'right', role: 'properties', position: 'right', defaultWidth: 280 },
    ],
  },
  decks: [
    { id: 'instruments', type: 'instruments-deck', panelId: 'left', /* ... */ },
    { id: 'score', type: 'notation-deck', panelId: 'center', /* ... */ },
    { id: 'props', type: 'properties-deck', panelId: 'right', /* ... */ },
  ],
  // ...
};
```

If no `panelId` is specified, the deck is placed in the first panel with role `composition`.

## Multi-Deck Panels

A panel can host multiple decks. The deck layout mode (`tabs` vs `stack` vs `split`) determines how they're displayed:

- **Tabs:** Tab bar at the top, one deck visible at a time
- **Stack:** Decks layered with z-index, top deck visible
- **Split:** Decks side-by-side or top-bottom

Example: Left browser panel with two decks (instruments and samples) in tab mode.

## Responsive Behavior

Layout responds to viewport size:

- **Large screens (>1280px):** All panels visible
- **Medium screens (768-1280px):** Sidebars collapsible
- **Small screens (<768px):** Single-panel view with tab navigation

Responsive rules are applied by the layout engine and stored in layout runtime.

## Persistence

Panel state is persisted per board via `BoardStateStore.perBoardLayout`:

- Panel visibility and collapsed state
- Panel sizes (width/height)
- Active tab index per panel
- Deck order within panels

State is keyed by `boardId` and survives board switching.

## Moving Decks Between Panels

Users can move decks between panels by:

1. **Drag-and-drop:** Drag deck header to target panel
2. **Context menu:** "Move to Panel" → choose target
3. **Keyboard shortcut:** Focus deck, `Cmd+Shift+M`, select panel

The layout runtime is updated and persisted automatically.

## Resizing Panels

Panels can be resized by dragging splitters between them:

- **Left/Right splitters:** Adjust sidebar widths
- **Top/Bottom splitters:** Adjust panel heights
- **Min/Max sizes:** Enforced by layout constraints

Sizes are persisted per board in layout runtime.

## Collapsing Panels

Collapsible panels can be toggled via:

- **Click collapse button** in panel header
- **Keyboard shortcut:** `Cmd+B` (browser), `Cmd+I` (properties)
- **Automatic collapse:** When space is constrained

Collapsed state is persisted per board.

## Layout Adapters

Layout adapters convert board definitions to concrete layouts:

- **`createDefaultLayoutRuntime(board)`**: Generate default layout from board definition
- **`mergePersistedLayout(board, persisted)`**: Apply user customizations to default layout
- **`validateLayout(board)`**: Validate panel/deck references

See `src/boards/layout/adapter.ts` for implementation.

## Dock Tree Structure

Dock-based layouts use a tree structure:

```typescript
interface DockNode {
  type: 'split' | 'panel';
  orientation?: 'horizontal' | 'vertical';
  children?: DockNode[];
  panelId?: string;
  size?: number;
}
```

This allows nested splits and complex layouts.

Example tree:

```
Root (horizontal split)
├─ Left Panel (300px)
├─ Center Split (vertical)
│  ├─ Top Panel (composition)
│  └─ Bottom Panel (mixer)
└─ Right Panel (280px)
```

## Default Layouts by Board Type

### Manual Boards
- **Left:** Browser (instruments)
- **Center:** Primary editor (tracker/notation/piano-roll)
- **Right:** Properties
- **Bottom:** (optional) Mixer or DSP chain

### Assisted Boards
- **Left:** Browser + Tool deck (phrases/generators)
- **Center:** Primary editor
- **Right:** Properties + Tool deck (harmony)
- **Bottom:** Mixer

### Generative Boards
- **Top:** Arranger sections
- **Left:** Generator controls
- **Center:** Session grid or timeline
- **Right:** Properties + AI advisor
- **Bottom:** Mixer

### Hybrid Boards
- **Top:** Arranger + transport
- **Left:** Browser + phrases
- **Center:** Split (session + notation)
- **Right:** Properties + routing
- **Bottom:** Mixer

## Creating Custom Layouts

To create a custom layout:

1. **Define panels** with roles and positions
2. **Assign decks** to panels via `panelId`
3. **Set layout type** (`dock` recommended)
4. **Test** in playground with different screen sizes
5. **Document** layout intent in board definition comments

## Accessibility

All layouts must support:

- **Keyboard navigation:** Tab through panels, Cmd+[1-9] for deck tabs
- **Screen reader:** ARIA landmarks for panels, labels for decks
- **Focus management:** Focus trap within modals, restore focus on close
- **High contrast:** Panel borders visible, clear visual hierarchy

## See Also

- [Board API Reference](./board-api.md)
- [Deck Types](./decks.md)
- [Layout Runtime Types](../../src/boards/layout/runtime-types.ts)
- [Layout Adapter](../../src/boards/layout/adapter.ts)
