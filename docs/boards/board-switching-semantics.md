# Board Switching Semantics

## Overview

This document defines the precise semantics of board switching in CardPlay, including what state persists, what resets, what migrates, and how lifecycle hooks are called.

## K005: Board Switch Lifecycle

When `switchBoard(targetBoardId, options)` is called, the following sequence occurs:

### 1. Validation Phase

```typescript
// Validate target board exists
const targetBoard = getBoardRegistry().get(targetBoardId);
if (!targetBoard) {
  console.error('Board not found');
  return false; // Abort switch
}

// Get current board (may be null for first switch)
const currentBoard = getCurrentBoard();
```

### 2. Deactivation Phase

```typescript
// Call onDeactivate hook for current board (if exists and enabled)
if (options.callLifecycleHooks && currentBoard?.onDeactivate) {
  try {
    currentBoard.onDeactivate();
  } catch (error) {
    console.error('Error in onDeactivate:', error);
    // Continue anyway - don't block switch
  }
}

// Clear current board theme (CSS variables)
if (currentBoard) {
  clearBoardTheme();
}
```

**Purpose:** Allows current board to clean up resources, save state, or perform final actions.

**Common uses:**
- Stop continuous generation loops
- Flush pending changes to stores
- Clean up timers or subscriptions
- Log analytics (if enabled)

### 3. State Update Phase

```typescript
// Update BoardStateStore with new current board
stateStore.setCurrentBoard(targetBoardId);
// This triggers:
// - Adds targetBoardId to recentBoardIds (max 10)
// - Updates lastOpenedAt timestamp
// - Persists to localStorage (debounced)
```

**Side effects:**
- BoardStateStore subscribers notified
- Board switch integration recomputes visible decks/allowed cards (D066-D068)
- UI components subscribed to store will re-render

### 4. Layout Reset Phase (Optional)

```typescript
// If resetLayout option is true
if (options.resetLayout) {
  stateStore.resetLayoutState(targetBoardId);
  // Removes persisted panel sizes, dock positions
  // Next render will use target board's default layout
}
```

**When to use:**
- User wants "factory reset" layout
- Switching to very different board type
- Layout corruption recovery

### 5. Deck Reset Phase (Optional)

```typescript
// If resetDecks option is true
if (options.resetDecks) {
  stateStore.resetDeckState(targetBoardId);
  // Clears persisted deck tabs, filters, scroll positions
  // Next render will use target board's default deck state
}
```

**When to use:**
- User wants "clean slate" deck views
- Debugging deck state issues
- Starting fresh workflow in same board

### 6. Context Migration Phase

```typescript
// Preserve active context by default
if (!options.preserveActiveContext) {
  // Reset context to board defaults
  if (targetBoard.primaryView) {
    contextStore.setActiveViewType(targetBoard.primaryView);
  }
  // activeStreamId and activeClipId preserved
}
```

**Default behavior:** activeStreamId/activeClipId persist so the same musical content is visible.

**When NOT preserving:**
- User wants to "jump" to board's default context
- Onboarding flow guiding user to specific content

### 7. Selection Migration Phase

```typescript
// Clear selection if requested
if (options.clearSelection) {
  const selectionStore = getSelectionStore();
  selectionStore.clearSelection();
}
```

**Default behavior:** Selection persists by event/clip ID, so the same items remain selected.

**When clearing:**
- User wants fresh selection state
- Switching to board where selection doesn't make sense

### 8. Transport Migration Phase

```typescript
// Preserve transport by default
if (!options.preserveTransport) {
  // Reset transport state
  contextStore.setPlaying(false);
  contextStore.setTransportPosition(0);
  // Tempo, time signature, and loop region remain
}
```

**Default behavior:** Transport continues from current position.

**When NOT preserving:**
- User wants playback to stop on switch
- Switching to performance board that needs specific start point

### 9. Activation Phase

```typescript
// Call onActivate hook for target board
if (options.callLifecycleHooks && targetBoard.onActivate) {
  try {
    targetBoard.onActivate();
  } catch (error) {
    console.error('Error in onActivate:', error);
    // Continue anyway - board is now active
  }
}

// Apply new board theme (CSS variables)
applyBoardTheme(targetBoard);
```

**Purpose:** Allows new board to initialize resources, set default state, or configure tools.

**Common uses:**
- Start continuous generation loop (generative boards)
- Initialize Prolog knowledge base (AI boards)
- Set default tool modes
- Apply board-specific keyboard shortcuts

### 10. Render Phase

```typescript
// BoardHost component detects state change
// - Destroys old deck panel host (with transition)
// - Creates new deck instances via factories
// - Renders new deck panel host (with transition)
// - All decks receive activeContext from BoardContextStore
```

**Transitions:**
- Respects `prefers-reduced-motion` preference
- Default: 200ms fade out/in
- Reduced motion: instant switch

## Default Switch Options

```typescript
const DEFAULT_SWITCH_OPTIONS: BoardSwitchOptions = {
  resetLayout: false,           // Preserve per-board layout
  resetDecks: false,            // Preserve per-board deck state
  preserveActiveContext: true,  // Keep same stream/clip active
  preserveTransport: true,      // Continue playback from current position
  clearSelection: false,        // Keep same events/clips selected
  callLifecycleHooks: true,     // Call onActivate/onDeactivate
};
```

## Switch Scenarios

### Scenario 1: Quick Board Switch (Cmd+B)

User presses Cmd+B, selects "Notation Board", presses Enter.

```typescript
switchBoard('notation-board-manual', {
  // All defaults - everything preserved
});
```

**Result:**
- Same stream visible in notation view
- Layout/decks preserve user's last session in notation board
- Selection, transport, context all preserved
- Smooth transition with fade effect

### Scenario 2: First-Time Board Selection

User completes onboarding and selects first board.

```typescript
switchBoard('basic-tracker', {
  resetLayout: true,  // Use factory default layout
  resetDecks: true,   // Use factory default deck state
  // Other defaults apply
});
```

**Result:**
- Clean initial layout (no persisted state)
- Default deck configuration
- No active stream yet (empty project)
- User starts fresh

### Scenario 3: Capture Generative to Manual

User has been working in "Generative Ambient" board, wants to edit manually.

```typescript
// Capture action from UI
captureToManualBoard('basic-tracker', {
  preserveActiveContext: true,  // Keep same content active
  preserveTransport: false,     // Stop playback
  clearSelection: true,         // Fresh selection
  callLifecycleHooks: true,     // Stop generation loop
});
```

**Result:**
- Generative board's `onDeactivate` stops generation
- All generated streams frozen as manual content
- Playback stops
- User lands in tracker with editable content

### Scenario 4: Board Quick Switch (Numeric)

User is in board switcher, presses 2 to switch to second recent board.

```typescript
switchBoard(recentBoards[1].id, {
  // All defaults - instant workflow switch
});
```

**Result:**
- Instant switch to frequently-used board
- All context preserved (same project state)
- Last-used layout/decks restored
- Feels like "tab switching" for power users

### Scenario 5: Reset to Default Layout

User's layout is broken, wants to reset.

```typescript
// From board chrome "Reset Layout" action
switchBoard(currentBoardId, {
  resetLayout: true,
  resetDecks: false,  // Keep deck state (tabs, filters)
  // Other defaults (stay on same board)
});
```

**Result:**
- Same board reloads
- Layout resets to defaults
- Deck state preserved (active tabs, filters)
- Musical content unaffected

## State Persistence Timing

### Immediate Persistence

These changes persist immediately (synchronously):

- `currentBoardId`
- `recentBoardIds`
- `favoriteBoardIds`
- `firstRunCompleted`

### Debounced Persistence

These changes persist after debounce (300ms):

- Layout state changes (panel resize, dock move)
- Deck state changes (tab switch, filter change, scroll)

**Rationale:** Avoid excessive localStorage writes during UI interactions.

### On-Demand Persistence

These persist only when explicitly requested:

- Board definition export
- Project save
- Template creation

## Cross-Board Data Invariants

The following invariants MUST hold across all board switches:

### Invariant 1: Stream Integrity

```
For all event stream IDs s in SharedEventStore:
  If s exists before switch, s exists after switch with same events.
  
For all events e in stream s:
  e.id, e.kind, e.start, e.duration, e.payload are immutable.
```

**Implication:** Switching boards never mutates or deletes streams/events.

### Invariant 2: Clip Integrity

```
For all clip IDs c in ClipRegistry:
  If c exists before switch, c exists after switch with same stream reference.
  
For all clips c:
  c.streamId, c.duration, c.loop are preserved.
```

**Implication:** Switching boards never breaks clip-stream relationships.

### Invariant 3: Routing Integrity

```
For all connections conn in RoutingGraph:
  If conn exists before switch, conn exists after switch with same ports.
  
For all connections conn:
  conn.sourcePort, conn.targetPort, conn.type are immutable.
```

**Implication:** Switching boards never severs audio/MIDI/modulation routing.

### Invariant 4: Parameter Integrity

```
For all device parameters p in ParameterResolver:
  If p has automation curve before switch, curve persists after switch.
  If p has modulation source before switch, source persists after switch.
```

**Implication:** Switching boards never deletes automation or modulation data.

### Invariant 5: Context Consistency

```
If activeStreamId = s before switch and preserveActiveContext = true:
  Then activeStreamId = s after switch.
  
If activeClipId = c before switch and preserveActiveContext = true:
  Then activeClipId = c after switch.
```

**Implication:** User sees the "same content" in different view (unless explicitly reset).

## Performance Considerations

### Optimizations

1. **Lazy Deck Creation**
   - Decks only instantiate when rendered
   - Hidden decks don't mount until shown

2. **Cached Gating Results** (D066-D068)
   - Visible deck types computed once per board switch
   - Allowed cards computed once per board switch
   - Results cached until next switch

3. **Debounced Persistence**
   - Layout/deck state writes throttled to 300ms
   - Only dirty state persisted (not full snapshot)

4. **Transition Throttling**
   - Respects `prefers-reduced-motion`
   - Skips fade if rapid switches (< 100ms apart)

### Benchmarks

Target performance for board switches:

- **Validation phase:** < 1ms
- **State update phase:** < 5ms
- **Render phase:** < 50ms (DOM updates)
- **Total perceptible delay:** < 200ms (with transitions)

## Error Handling

### Board Not Found

```typescript
if (!targetBoard) {
  console.error('Board not found:', targetBoardId);
  // Show toast: "Board not available"
  return false;
}
```

**User experience:** Switch aborted, current board remains active.

### Lifecycle Hook Errors

```typescript
try {
  currentBoard.onDeactivate();
} catch (error) {
  console.error('Error in onDeactivate:', error);
  // Continue with switch anyway
}
```

**User experience:** Switch proceeds, error logged to console.

### Deck Factory Missing

```typescript
const instances = createDeckInstances(targetBoard, activeContext);
// If factory missing for a deck type:
// - Logs warning
// - Skips that deck
// - Continues with other decks
```

**User experience:** Board loads with available decks, missing decks hidden.

### Store Persistence Failure

```typescript
// If localStorage.setItem() throws (quota exceeded)
try {
  localStorage.setItem(key, value);
} catch (error) {
  console.warn('Could not persist board state:', error);
  // Continue in-memory, no persistence
}
```

**User experience:** Board works, but state lost on reload.

## See Also

- [Project Compatibility](./project-compatibility.md) - Data persistence across boards
- [Board State](./board-state.md) - State schema and storage
- [Migration Plans](./migration.md) - Deck-to-deck mapping heuristics
- [Board API](./board-api.md) - Board definition interface
