# Board State Persistence

## Overview

The Board State Store manages persistent preferences and layout state for all boards. State is stored in `localStorage` and survives browser sessions.

## Storage Keys

- **Main state**: `cardplay.boardState.v1`
- **Active context**: `cardplay.activeContext.v1`

## BoardState Schema

```typescript
interface BoardState {
  version: number;                    // Schema version (currently 1)
  currentBoardId: string | null;      // Active board ID
  recentBoardIds: readonly string[];  // Recently used boards
  favoriteBoardIds: readonly string[]; // Favorite boards
  perBoardLayout: Record<string, LayoutState>;
  perBoardDeckState: Record<string, DeckState>;
  firstRunCompleted: boolean;
  lastOpenedAt: number | null;        // Timestamp
}
```

## LayoutState Schema

Per-board layout customizations:

```typescript
interface LayoutState {
  panelSizes: Record<string, number>;     // Panel ID → size in pixels
  collapsedPanels: readonly string[];     // Collapsed panel IDs
  customTree?: unknown;                    // Custom layout tree (JSON)
}
```

## DeckState Schema

Per-board deck state:

```typescript
interface DeckState {
  activeCards: Record<string, string>;     // Deck ID → active card ID
  scrollPositions: Record<string, number>; // Deck ID → scroll position
  focusedItems: Record<string, string>;    // Deck ID → focused item ID
  filterState: Record<string, string>;     // Deck ID → filter/search text
}
```

## ActiveContext Schema

Cross-board active context (survives board switches):

```typescript
interface ActiveContext {
  activeStreamId: string | null;
  activeClipId: string | null;
  activeTrackId: string | null;
  activeDeckId: string | null;
  activeViewType: ViewType | null;
}
```

## Persistence Strategy

### Write Throttling

- Layout changes are debounced (300ms) to avoid excessive writes
- State writes are batched when possible
- Failed writes are logged but don't block UI

### Read Strategy

- State is loaded synchronously on app startup
- Parse errors fall back to default state
- Version mismatches trigger migrations

## Migrations

### Version 1 (Current)

Initial schema. No migrations needed yet.

### Future Migrations

When schema changes:

1. Increment version number
2. Add migration function in `store/storage.ts`
3. Test round-trip with old data
4. Document breaking changes

Example migration skeleton:

```typescript
function migrateBoardStateV1toV2(v1: BoardStateV1): BoardStateV2 {
  return {
    ...v1,
    version: 2,
    newField: defaultValue,
  };
}
```

## State Reset

### Reset Individual Board

```typescript
store.resetLayoutState('basic-tracker');
store.resetDeckState('basic-tracker');
```

### Reset All Boards

```typescript
// Clear all persisted state
localStorage.removeItem('cardplay.boardState.v1');
localStorage.removeItem('cardplay.activeContext.v1');

// Reload to get defaults
location.reload();
```

## Default Values

### Default BoardState

```typescript
{
  version: 1,
  currentBoardId: null,
  recentBoardIds: [],
  favoriteBoardIds: [],
  perBoardLayout: {},
  perBoardDeckState: {},
  firstRunCompleted: false,
  lastOpenedAt: null
}
```

### Default ActiveContext

```typescript
{
  activeStreamId: null,
  activeClipId: null,
  activeTrackId: null,
  activeDeckId: null,
  activeViewType: null
}
```

## Browser Environment

State persistence handles non-browser environments gracefully:

```typescript
// Safe localStorage access
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

if (isBrowser) {
  // Read/write localStorage
} else {
  // Use in-memory state (tests)
}
```

## Privacy & Security

- All state is stored locally (no network transmission)
- No personally identifiable information is stored
- State can be cleared at any time
- No analytics or tracking

## Debugging

### Inspect State

```typescript
// In browser console
const state = JSON.parse(localStorage.getItem('cardplay.boardState.v1') || '{}');
console.log(state);
```

### Export State

```typescript
const state = store.getState();
const json = JSON.stringify(state, null, 2);
console.log(json);
// Copy to clipboard or download
```

### Clear State

```typescript
// From console
localStorage.removeItem('cardplay.boardState.v1');
localStorage.removeItem('cardplay.activeContext.v1');
location.reload();
```

## Performance

- Typical state size: < 50KB
- Parse time: < 5ms
- Write time: < 10ms (debounced)
- Memory footprint: negligible

## See Also

- [Board API](./board-api.md)
- [Layout Runtime](./layout-runtime.md)
- [Board Migration](./migration.md)
