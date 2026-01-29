# Board Switching Migration

## Overview

When switching between boards, the system must gracefully handle differences in deck types, panel layouts, and tool configurations. The migration system ensures state is preserved where possible and reset safely where necessary.

## Migration Phases

### 1. Pre-Switch Validation

```typescript
// Validate target board exists
const targetBoard = registry.get(targetBoardId);
if (!targetBoard) {
  throw new Error(`Board not found: ${targetBoardId}`);
}

// Validate board factories
validateBoardFactories(targetBoard);
```

### 2. Lifecycle Hooks

```typescript
// Current board cleanup
if (currentBoard.onDeactivate) {
  currentBoard.onDeactivate();
}

// Target board initialization
if (targetBoard.onActivate) {
  targetBoard.onActivate();
}
```

### 3. State Migration

Apply migration plan based on `BoardSwitchOptions`:

```typescript
interface BoardSwitchOptions {
  resetLayout?: boolean;           // Clear persisted layout
  resetDecks?: boolean;             // Clear persisted deck state
  preserveActiveContext?: boolean;  // Keep stream/clip/track IDs
  preserveTransport?: boolean;      // Keep transport state
}
```

## Deck Migration Heuristics

### Matching DeckType

If source and target boards both have a deck of the same type:

```typescript
// Preserve deck state
targetDeckState = sourceDeckState;
```

Example: Switching from "Basic Tracker" to "Tracker + Phrases" preserves the pattern-deck state.

### Non-Matching DeckType

If target board lacks a deck type from source:

```typescript
// Discard deck state
// (User can reopen the source board to restore)
```

Example: Switching from "Tracker + Phrases" to "Notation Manual" discards the phrase-deck state.

### Overlapping DeckType

If both boards have overlapping deck types but different counts:

```typescript
// Keep first N deck states where N = min(source, target)
```

Example: Switching from a 3-deck tracker board to a 2-deck tracker board keeps the first 2 states.

## Layout Migration Heuristics

### Matching Panel Roles

If source and target boards share panel roles:

```typescript
// Preserve panel sizes and collapsed states
if (sourcePanel.role === targetPanel.role) {
  targetPanel.size = sourcePanel.size;
  targetPanel.collapsed = sourcePanel.collapsed;
}
```

### Non-Matching Panel Roles

If target board has different panel roles:

```typescript
// Use default layout
// (Preserve global prefs like theme)
```

## Active Context Migration

### Default Behavior (preserveActiveContext: true)

Active stream, clip, and track IDs are preserved across board switches:

```typescript
// Before switch
activeContext.activeStreamId = 'stream-1';

// After switch
activeContext.activeStreamId = 'stream-1'; // Still accessible
```

This allows seamless editing across different views of the same data.

### Reset Behavior (preserveActiveContext: false)

Active context is cleared and defaults to the first available entity:

```typescript
// After switch
activeContext.activeStreamId = getFirstStreamId() || null;
activeContext.activeClipId = getFirstClipId() || null;
```

## Transport Migration

### Default Behavior (preserveTransport: true)

Transport state (playing, tempo, loop region) is preserved:

```typescript
// Before switch
transport.isPlaying = true;
transport.tempo = 120;

// After switch (still playing at same tempo)
transport.isPlaying = true;
transport.tempo = 120;
```

### Reset Behavior (preserveTransport: false)

Transport is stopped and reset to defaults:

```typescript
// After switch
transport.isPlaying = false;
transport.currentTick = 0;
// tempo may reset based on board defaults
```

## Migration Plan Types

### Safe Migration

All state preserved, no data loss:

```typescript
const plan: BoardMigrationPlan = {
  type: 'safe',
  preserveDecks: true,
  preserveLayout: true,
  preserveContext: true,
};
```

Use when: Switching between similar boards (e.g., manual variants).

### Adaptive Migration

Some state preserved, some reset to defaults:

```typescript
const plan: BoardMigrationPlan = {
  type: 'adaptive',
  preserveDecks: false,
  preserveLayout: true,
  preserveContext: true,
};
```

Use when: Switching between boards with different deck sets.

### Clean Migration

All state reset to defaults:

```typescript
const plan: BoardMigrationPlan = {
  type: 'clean',
  preserveDecks: false,
  preserveLayout: false,
  preserveContext: false,
};
```

Use when: User explicitly requests "fresh start" or board is incompatible.

## Board Migration Plan

Defined in `src/boards/switching/migration-plan.ts`:

```typescript
interface BoardMigrationPlan {
  type: 'safe' | 'adaptive' | 'clean';
  preserveDecks: boolean;
  preserveLayout: boolean;
  preserveContext: boolean;
  deckMapping?: Record<string, string>; // Source deck ID → target deck ID
  warnings?: string[];                  // User-facing warnings
}
```

### computeMigrationPlan(source: Board, target: Board, options: BoardSwitchOptions)

Analyzes boards and generates migration plan:

```typescript
import { computeMigrationPlan } from '@cardplay/boards/switching';

const plan = computeMigrationPlan(sourceBoard, targetBoard, {
  resetLayout: false,
  resetDecks: false,
  preserveActiveContext: true,
});
```

## Warnings & Notifications

### Deck State Loss Warning

When switching to a board that lacks a deck type:

```
"The Phrase Library deck will be closed.
Switch back to 'Tracker + Phrases' to restore it."
```

### Layout Reset Warning

When layout is incompatible and must reset:

```
"Panel layout has been reset to default.
Customize it in Board Settings."
```

### Tool Availability Warning

When a board disables a tool that was previously active:

```
"Phrase generators are not available in this board.
Switch to 'Session + Generators' to use them."
```

## Testing Migration

### Test: Same Board (Identity)

```typescript
switchBoard(currentBoardId, options);
// Should be a no-op (no state change)
```

### Test: Similar Boards (Safe)

```typescript
switchBoard('basic-tracker', options);
switchBoard('tracker-harmony', options);
// Tracker deck state preserved
```

### Test: Incompatible Boards (Clean)

```typescript
switchBoard('basic-tracker', options);
switchBoard('notation-manual', options);
// Clean switch, new layout
```

### Test: Rapid Switching

```typescript
for (let i = 0; i < 100; i++) {
  switchBoard(['board-a', 'board-b'][i % 2]);
}
// Should not leak memory or corrupt state
```

## Rollback

If migration fails mid-switch:

1. Log error with details
2. Attempt to restore previous board
3. If restore fails, fall back to safe default board
4. Show error notification to user

## Best Practices

### For Board Authors

- Keep deck IDs stable across board versions
- Keep panel roles stable across board versions
- Document breaking changes in board updates
- Test migration paths between related boards

### For Users

- Save projects before switching to unfamiliar boards
- Use "Reset Layout" if layout becomes corrupted
- Report migration issues with board IDs

## Performance

- Migration computation: < 5ms
- State copy/restore: < 10ms
- Total switch time: < 50ms (including UI update)

## See Also

- [Board API](./board-api.md)
- [Board State](./board-state.md)
- [Layout Runtime](./layout-runtime.md)
