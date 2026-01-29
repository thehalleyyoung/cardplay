# Board Switching Semantics

**Phase K Task:** K005
**Last Updated:** 2026-01-29

## Overview

This document describes exactly what happens when you switch from one board to another in CardPlay. Understanding these semantics helps you predict behavior and design board-switching workflows.

**Key Principle:** Switching boards is safe, fast, and mostly non-destructive. Your music data persists; only the workspace layout changes.

---

## Quick Reference

| State | Persists? | Resets? | Configurable? |
|-------|-----------|---------|---------------|
| Event streams | ✅ Always | ❌ Never | ❌ No |
| Clips | ✅ Always | ❌ Never | ❌ No |
| Routing connections | ✅ Always | ❌ Never | ❌ No |
| Parameters (automation) | ✅ Always | ❌ Never | ❌ No |
| Transport state | ✅ Default | 🔄 Optional | ✅ Yes |
| Active context (stream/clip) | ✅ Default | 🔄 Optional | ✅ Yes |
| Selection | ✅ Default | 🔄 Optional | ✅ Yes |
| Undo history | ✅ Always | ❌ Never | ❌ No |
| Panel layout | ❌ Per-board | ✅ Yes | ✅ Yes |
| Deck tabs | ❌ Per-board | ✅ Yes | ✅ Yes |
| Deck scroll | ❌ Per-board | ✅ Yes | ❌ No |
| Tool visibility | ❌ Per-board | ✅ Yes | ❌ No |

---

## Board Switch Process

### Step 1: Validation

Before switching, the system validates:

```typescript
const targetBoard = getBoardRegistry().get(targetBoardId);

if (!targetBoard) {
  throw new Error(`Board ${targetBoardId} not found`);
}

// Validate all deck types have factories
validateBoardFactories(targetBoard);
```

**Validation checks:**
- ✅ Target board exists in registry
- ✅ All deck types have registered factories
- ✅ Tool configuration is valid

**If validation fails:**
- Error thrown
- Current board remains active
- No state changes

---

### Step 2: Deactivation Hook

The current board's `onDeactivate` hook is called (if defined):

```typescript
if (currentBoard.onDeactivate) {
  currentBoard.onDeactivate();
}
```

**Use cases for onDeactivate:**
- Save board-specific state
- Clean up resources (timers, subscriptions)
- Log analytics

**Important:** Don't mutate shared stores in hooks (streams/clips/routing). Hooks are for board-specific cleanup only.

---

### Step 3: State Preservation (Configurable)

Based on switch options, certain state may be preserved or reset:

```typescript
interface BoardSwitchOptions {
  resetLayout?: boolean;           // Reset panel sizes to defaults
  resetDecks?: boolean;            // Reset deck tabs to defaults
  preserveActiveContext?: boolean; // Keep active stream/clip
  preserveTransport?: boolean;     // Keep tempo/loop/playback
  preserveSelection?: boolean;     // Keep selected events/clips
}
```

**Default behavior (all true):**
```typescript
const defaultOptions: BoardSwitchOptions = {
  resetLayout: false,           // Keep panel sizes
  resetDecks: false,            // Keep deck tabs
  preserveActiveContext: true,  // Keep active stream/clip
  preserveTransport: true,      // Keep tempo/loop
  preserveSelection: true       // Keep selection
};
```

#### Preserve Active Context (Default: true)

```typescript
if (options.preserveActiveContext) {
  // activeStreamId, activeClipId, activeTrackId remain unchanged
} else {
  // Reset active context to defaults (first stream, first clip, etc.)
  const firstStream = eventStore.getAllStreams()[0];
  boardContextStore.setActiveStream(firstStream?.id);
}
```

**When to reset:**
- Switching to a board with a completely different workflow
- Starting fresh after a long session
- Demo/presentation mode

#### Preserve Transport (Default: true)

```typescript
if (options.preserveTransport) {
  // Tempo, time signature, loop region, playback state unchanged
} else {
  // Reset transport to defaults
  transport.setTempo(120);
  transport.setTimeSignature(4, 4);
  transport.clearLoopRegion();
  transport.stop();
}
```

**When to reset:**
- Switching from one song to another
- Tempo/meter change needed for new workflow

#### Preserve Selection (Default: true)

```typescript
if (options.preserveSelection) {
  // selectedEventIds, selectedClipIds remain unchanged
} else {
  selectionStore.clearSelection();
}
```

**When to reset:**
- Starting a new editing task
- Switching to a board that doesn't show selected items

---

### Step 4: Layout Migration

The system determines which decks to show in the new board:

```typescript
const currentActiveDeck = getCurrentActiveDeck();
const migrationPlan = createDeckMigrationPlan(currentBoard, targetBoard, currentActiveDeck);
```

**Migration heuristics:**

1. **Matching Deck Type** — If the new board has the same deck type, activate it
   ```typescript
   if (targetBoard.decks.some(d => d.type === currentActiveDeck.type)) {
     activateDeckOfType(currentActiveDeck.type);
   }
   ```

2. **Primary View Fallback** — If no match, activate the primary view
   ```typescript
   else {
     const primaryDeck = targetBoard.decks.find(d => d.type === targetBoard.primaryView);
     activateDeck(primaryDeck);
   }
   ```

3. **Per-Board Deck State** — Restore previously-saved deck tabs/scroll positions
   ```typescript
   const deckState = boardStateStore.getDeckState(targetBoardId);
   if (deckState) {
     applyDeckState(deckState);
   }
   ```

**Example migration:**

```
Current Board: Session Board
  Active Deck: clip-session (showing track 2, scene 3)

Target Board: Producer Board
  Has clip-session? Yes (in a tab)
  → Activate clip-session deck
  → Restore per-board deck state (last tab position)
```

---

### Step 5: Tool Visibility Update

Tools are shown/hidden based on the new board's `compositionTools` configuration:

```typescript
const tools = computeVisibleDeckTypes(targetBoard);
// Returns: ['instrument-browser', 'mixer', 'properties']
// (phrase-library, generator hidden on manual boards)
```

**Gating rules:**

| Control Level | Phrase DB | Harmony | Generators | Arranger | AI Composer |
|---------------|-----------|---------|------------|----------|-------------|
| Full Manual | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| Manual + Hints | ❌ Hidden | ✅ Display | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| Assisted | ✅ Drag/Drop | ✅ Suggest | ✅ On-Demand | ❌ Hidden | ❌ Hidden |
| Directed | ✅ Browse | ✅ Suggest | ✅ Auto | ✅ Chord-Follow | ✅ Palette |
| Generative | ✅ Browse | ✅ Auto | ✅ Continuous | ✅ Autonomous | ✅ Inline |

**Important:** Tool visibility changes, but generated data persists (phrases, clips, etc.).

---

### Step 6: Theme Application (Optional)

If per-board theming is enabled:

```typescript
const theme = loadBoardTheme(targetBoardId);
applyBoardTheme(theme);
```

**Theme application:**
- Updates CSS custom properties
- No component remounting required
- Respects reduced-motion preference

---

### Step 7: Activation Hook

The target board's `onActivate` hook is called (if defined):

```typescript
if (targetBoard.onActivate) {
  targetBoard.onActivate();
}
```

**Use cases for onActivate:**
- Load board-specific resources
- Initialize board-specific timers
- Log analytics

---

### Step 8: State Persistence

The board switch is persisted:

```typescript
boardStateStore.setCurrentBoard(targetBoardId);
boardStateStore.addRecentBoard(targetBoardId);
```

**Persisted to localStorage:**
- `cardplay.boardState.v1` updated
- `currentBoardId` set to new board
- `recentBoardIds` updated (max 10)

---

### Step 9: UI Re-render

The board host re-renders with the new board:

```typescript
boardHost.render();  // Re-mounts deck containers with new board definition
```

**Rendering:**
- Deck containers created for each deck in new board
- Panel layout applied from board definition (or restored from per-board state)
- Decks rendered via their factories

---

## Timing and Performance

### Switch Duration

Typical board switch timing:

| Step | Duration |
|------|----------|
| Validation | < 1ms |
| Deactivation hook | Varies (user code) |
| State preservation | < 1ms |
| Migration plan | < 1ms |
| Tool visibility update | < 1ms |
| Theme application | < 5ms |
| Activation hook | Varies (user code) |
| Persistence | < 10ms (debounced) |
| UI re-render | 10-50ms |
| **Total** | **~20-100ms** |

**Target:** < 100ms for perceived instant switching.

**Optimization:**
- Deck factories use lazy rendering
- Persisted deck state avoids re-computing scroll positions
- No shared store mutations (no undo entries)

---

## Edge Cases

### Case 1: Missing Deck Type

**Scenario:**
- Current board has `visualization` deck active
- Target board has no `visualization` deck type

**Behavior:**
- Migration falls back to primary view
- No error thrown
- Data remains accessible (if deck opens again later)

---

### Case 2: First-Time Board Load

**Scenario:**
- User switches to a board they've never used before
- No persisted deck state

**Behavior:**
- Default layout from board definition applied
- All deck tabs at default positions
- No scroll positions restored

---

### Case 3: Incompatible Active Context

**Scenario:**
- Current board has `activeTrackId` set to track 5
- Target board (Notation) has no concept of tracks

**Behavior:**
- Active context preserved (track 5 ID remains)
- Target board ignores `activeTrackId` (not used in notation view)
- If switching back to session/timeline, track 5 active again

---

### Case 4: Rapid Board Switching

**Scenario:**
- User presses `Cmd+B` and rapidly switches between boards

**Behavior:**
- Each switch is fully completed before next
- Debounced persistence (only final board persisted)
- No race conditions (state updates are synchronous)

---

### Case 5: Board Switch During Playback

**Scenario:**
- Transport is playing
- User switches boards

**Behavior (default):**
- Playback continues uninterrupted
- New board shows playhead updates
- Audio engine unaffected

**Behavior (with `preserveTransport: false`):**
- Playback stops
- Transport resets to defaults

---

## User-Facing Behavior

### What Users See

1. **Board switcher opens** (`Cmd+B`)
2. **User selects new board**
3. **Brief flash** (< 100ms)
4. **New workspace appears**
   - Different decks visible
   - Different layout
   - Same project data

### What Users Experience

- ✅ **Fast** — Switch feels instant
- ✅ **Safe** — No data loss
- ✅ **Predictable** — Context preserved by default
- ✅ **Flexible** — Can reset if desired

---

## Developer Guidelines

### In Deck Factories

```typescript
export function createMyDeck(deckDef: BoardDeck, ctx: DeckContext): DeckInstance {
  return {
    id: deckDef.id,
    type: deckDef.type,
    render: () => {
      const container = document.createElement('div');
      
      // ✅ Read from shared stores
      const stream = eventStore.getStream(ctx.activeStreamId);
      
      // ❌ Don't store local copies
      // const localEvents = [...stream.events];  // BAD
      
      // ✅ Subscribe to updates
      const unsub = eventStore.subscribe(streamId, () => {
        // Re-render on changes
      });
      
      return {
        element: container,
        destroy: () => {
          unsub();  // ✅ Clean up subscriptions
        }
      };
    }
  };
}
```

### In Board Definitions

```typescript
export const myBoard: Board = {
  // ...
  onActivate: () => {
    // ✅ Load board-specific resources
    loadBoardPresets();
    
    // ❌ Don't mutate shared state
    // eventStore.clearAllStreams();  // BAD
  },
  
  onDeactivate: () => {
    // ✅ Clean up board-specific resources
    cleanupBoardTimers();
    
    // ❌ Don't mutate shared state
    // clipRegistry.clearAll();  // BAD
  }
};
```

### In Board-Specific UI

```typescript
// ✅ React to board changes
boardStateStore.subscribe(() => {
  const currentBoardId = boardStateStore.getState().currentBoardId;
  updateUIForBoard(currentBoardId);
});

// ❌ Don't assume board is stable
// const board = getBoardRegistry().get(boardStateStore.getState().currentBoardId);
// setInterval(() => {
//   updateBoardUI(board);  // BAD: board may have switched
// }, 1000);
```

---

## Testing Board Switching

### Manual Testing Checklist

- [ ] Switch from Board A to Board B
- [ ] Verify data persists (streams, clips, routing)
- [ ] Verify active context persists (or resets if configured)
- [ ] Verify selection persists (or clears if configured)
- [ ] Verify transport persists (or resets if configured)
- [ ] Verify panel layout from Board B (or per-board state)
- [ ] Verify tool visibility matches Board B control level
- [ ] Switch back to Board A
- [ ] Verify per-board state restored (panel sizes, deck tabs)
- [ ] Rapid switch between multiple boards (no errors)
- [ ] Switch during playback (continues or stops as configured)

### Automated Testing

```typescript
describe('Board Switching', () => {
  it('should preserve streams when switching boards', () => {
    const streamId = eventStore.createStream({ name: 'Test' });
    switchBoard('board-a');
    switchBoard('board-b');
    expect(eventStore.getStream(streamId)).toBeDefined();
  });

  it('should preserve active context by default', () => {
    boardContextStore.setActiveStream(streamId);
    switchBoard('board-a');
    expect(boardContextStore.getContext().activeStreamId).toBe(streamId);
  });

  it('should reset active context if requested', () => {
    boardContextStore.setActiveStream(streamId);
    switchBoard('board-a', { preserveActiveContext: false });
    expect(boardContextStore.getContext().activeStreamId).not.toBe(streamId);
  });

  it('should update tool visibility', () => {
    switchBoard('basic-tracker');  // Manual board
    expect(isToolVisible('phrase-library')).toBe(false);
    switchBoard('tracker-phrases');  // Assisted board
    expect(isToolVisible('phrase-library')).toBe(true);
  });
});
```

---

## FAQ

### Q: Does board switching create an undo entry?
**A:** No. Board switching is a view change, not a data change.

### Q: Can I undo a board switch?
**A:** Not via undo stack. Use `Cmd+B` and select recent board, or press `Cmd+B` twice to toggle.

### Q: What happens to hidden decks' subscriptions?
**A:** Deck components are unmounted and subscriptions cleaned up (if properly implemented with `destroy()`).

### Q: Can I switch boards programmatically?
**A:** Yes: `await switchBoard(boardId, options)`.

### Q: Does board switching affect audio engine?
**A:** No (unless `preserveTransport: false` stops playback). Routing and parameters persist.

### Q: Can I switch boards without UI?
**A:** Yes (headless mode). Call `switchBoard()` directly. UI updates via subscriptions.

---

## Best Practices

### For Users

1. **Switch freely** — data is safe, experiment with workflows
2. **Use board switcher** (`Cmd+B`) — fast keyboard-driven navigation
3. **Favorite boards** — pin your most-used boards for quick access
4. **Reset layout** — if a board feels cluttered, reset panel sizes

### For Developers

1. **Always clean up subscriptions** — in deck `destroy()` hooks
2. **Never assume board is stable** — subscribe to board state changes
3. **Test board switching** — automated tests for data preservation
4. **Document board-specific state** — clarify what persists per-board

---

## Summary

Board switching in CardPlay is designed to be:

- ✅ **Fast** (< 100ms target)
- ✅ **Safe** (data always preserved)
- ✅ **Flexible** (configurable preservation/reset)
- ✅ **Predictable** (consistent heuristics)

**Core guarantee:** Your streams, clips, routing, and parameters are never touched during board switching. Only the workspace UI changes.

Boards are views. Projects are data. Switch boldly. 🎵
