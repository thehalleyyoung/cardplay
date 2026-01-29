# Project Compatibility

**Phase K Task:** K004
**Last Updated:** 2026-01-29

## Overview

All boards in CardPlay share the same underlying project format. This means you can switch between boards without losing data — your streams, clips, routing, and parameters remain intact.

**Key Principle:** Boards are views; projects are data. Switching boards is like changing your workspace layout, not changing your project.

---

## Project Data Model

A CardPlay project consists of:

### 1. **Event Streams** (SharedEventStore)
- Musical events (notes, chords, automation points)
- Each stream has a unique `EventStreamId`
- Streams are board-agnostic (same stream in tracker/notation/piano roll)

### 2. **Clips** (ClipRegistry)
- References to event streams with metadata
- Each clip has a unique `ClipId`
- Clips are board-agnostic (same clip in session/timeline)

### 3. **Routing Graph** (RoutingGraphStore)
- Audio/MIDI/modulation connections
- Instrument and effect chains
- Modular patching

### 4. **Parameters** (ParameterResolver)
- Preset values
- Automation curves
- Modulation sources and targets

### 5. **Transport State** (TransportController)
- Tempo, time signature, loop region
- Playback state
- Current tick position

---

## Board-Agnostic Storage

All project data is stored in **shared stores** that are independent of the active board:

```typescript
// Event streams - shared across all boards
import { getSharedEventStore } from '@cardplay/state/event-store';
const eventStore = getSharedEventStore();
const stream = eventStore.getStream(streamId);  // Same data in any board

// Clips - shared across all boards
import { getClipRegistry } from '@cardplay/state/clip-registry';
const clipRegistry = getClipRegistry();
const clip = clipRegistry.getClip(clipId);  // Same clip in any board

// Routing - shared across all boards
import { getRoutingGraph } from '@cardplay/state/routing-graph';
const routingGraph = getRoutingGraph();
// Same connections in any board
```

---

## Board-Specific State

Boards DO have some state that is unique to each board:

### Per-Board Persisted State

Stored in `BoardStateStore`:

```typescript
interface BoardState {
  currentBoardId: string;           // Active board
  recentBoardIds: string[];         // Recently used boards
  favoriteBoardIds: string[];       // Favorited boards
  perBoardLayout: Map<string, LayoutState>;    // Per-board panel sizes/positions
  perBoardDeckState: Map<string, DeckState>;   // Per-board deck tab/scroll state
}
```

**What persists per-board:**
- Panel sizes and collapsed states
- Deck tab positions and scroll offsets
- Deck-specific filter/search state
- Per-board theme choice (if configured)

**What does NOT persist per-board:**
- Event streams (shared)
- Clips (shared)
- Routing connections (shared)
- Parameters (shared)
- Transport state (shared)

---

## Board Switching Scenarios

### Scenario 1: Notation → Tracker

**Before switch:**
- Notation Board shows stream "Main" in notation view
- 16 bars of composed music

**After switch:**
- Tracker Board shows stream "Main" in tracker view
- Same 16 bars, now displayed as tracker rows

**Result:** Same data, different visualization.

### Scenario 2: Session → Timeline

**Before switch:**
- Session Board shows clips in a grid (clip launching)
- 8 clips across 4 tracks

**After switch:**
- Producer Board shows same 8 clips in timeline (arrangement)
- Clips can be arranged linearly

**Result:** Same clips, different layout and workflow.

### Scenario 3: Manual → Assisted

**Before switch:**
- Basic Tracker Board (full manual)
- Pattern created manually

**After switch:**
- Tracker + Phrases Board (assisted)
- Same pattern visible, now can drag phrases

**Result:** Same pattern data, additional tools available.

---

## Stream and Clip References

### How Streams Work

Streams are stored by ID in `SharedEventStore`:

```typescript
// Creating a stream (board-agnostic)
const streamId = eventStore.createStream({ name: 'Bass Line' });

// Any board can access this stream
const stream = eventStore.getStream(streamId);

// Any board can edit events
eventStore.addEvents(streamId, [
  { id: uuid(), kind: EventKinds.NOTE, start: asTick(0), duration: asTickDuration(96), payload: { pitch: 36, velocity: 100 } }
]);
```

### How Clips Work

Clips reference streams + add metadata:

```typescript
// Creating a clip (board-agnostic)
const clipId = clipRegistry.createClip({
  name: 'Bass Loop',
  streamId: streamId,     // Reference to stream
  duration: asTickDuration(384),
  loop: true,
  color: '#ff0000'
});

// Any board can access this clip
const clip = clipRegistry.getClip(clipId);

// The clip's events come from the stream
const events = eventStore.getEvents(clip.streamId);
```

**Key Insight:** Clips don't duplicate events. They reference streams. This ensures consistency across boards.

---

## No Duplication

CardPlay enforces a **single source of truth**:

❌ **Don't do this:**
```typescript
// BAD: Copying events into a clip-local array
const clipEvents = [...eventStore.getEvents(streamId)];
```

✅ **Do this:**
```typescript
// GOOD: Always read from the shared store
const clip = clipRegistry.getClip(clipId);
const events = eventStore.getEvents(clip.streamId);
```

---

## Board Switching Guarantees

### What is Preserved

When switching boards, the following are **guaranteed to remain unchanged**:

- ✅ All event streams and their events
- ✅ All clips and their metadata
- ✅ All routing connections
- ✅ All parameter values (presets, automation, modulation)
- ✅ Transport state (tempo, loop region, playback position)
- ✅ Active context (activeStreamId, activeClipId, activeTrackId)
- ✅ Selection (selected events/clips by ID)
- ✅ Undo/redo history

### What May Change

When switching boards, the following **may change** (by design):

- 🔄 Visible decks (different boards show different tools)
- 🔄 Panel layout (panel sizes and positions are per-board)
- 🔄 Deck tab positions (per-board state)
- 🔄 Tool availability (phrase library hidden on manual boards)
- 🔄 Theme colors (if per-board theme enabled)

### What Can Optionally Reset

Board switching supports options to optionally reset state:

```typescript
import { switchBoard } from '@cardplay/boards/switching';

await switchBoard('notation-manual', {
  resetLayout: true,         // Reset panel sizes to defaults
  resetDecks: true,          // Reset deck tab positions
  preserveActiveContext: false, // Reset active stream/clip
  preserveTransport: false   // Reset tempo/loop
});
```

By default, all state is preserved (safe switching).

---

## Migration Heuristics

When switching boards, the system applies **deck migration heuristics** to preserve your context:

### Matching Deck Types

If both boards have a deck of the same type, the active deck follows:

**Example:**
- In Basic Tracker: `pattern-editor` deck is active (showing stream "Main")
- Switch to Tracker + Phrases
- Result: `pattern-editor` deck in new board is active, showing stream "Main"

### Fallback to Primary View

If no matching deck exists, activate the primary view deck:

**Example:**
- In Session Board: `clip-session` deck is active
- Switch to Notation Board (no `clip-session` deck)
- Result: `notation-score` deck (primary view) is activated

### No Data Loss

Even if a deck doesn't carry over, the underlying data remains:

**Example:**
- In Session + Generators: `generator` deck is active
- Switch to Basic Tracker (no `generator` deck)
- Result: `generator` deck is hidden, but generated clips are still in ClipRegistry

---

## Project File Format

A CardPlay project file (`.cardplay`) contains:

```json
{
  "version": "1.0",
  "metadata": {
    "name": "My Song",
    "author": "Artist Name",
    "created": "2026-01-29T09:00:00Z",
    "modified": "2026-01-29T10:00:00Z"
  },
  "streams": [
    {
      "id": "stream-123",
      "name": "Main Melody",
      "events": [
        { "id": "event-1", "kind": "note", "start": 0, "duration": 96, "payload": { "pitch": 60, "velocity": 100 } }
      ]
    }
  ],
  "clips": [
    {
      "id": "clip-456",
      "name": "Melody Loop",
      "streamId": "stream-123",
      "duration": 384,
      "loop": true,
      "color": "#ff0000"
    }
  ],
  "routing": {
    "nodes": [ /* ... */ ],
    "connections": [ /* ... */ ]
  },
  "parameters": {
    "presets": { /* ... */ },
    "automation": [ /* ... */ ],
    "modulation": [ /* ... */ ]
  },
  "transport": {
    "tempo": 120,
    "timeSignatureNumerator": 4,
    "timeSignatureDenominator": 4,
    "loopRegion": { "start": 0, "end": 1536 }
  }
}
```

**Note:** Board-specific state (panel sizes, deck tabs) is NOT included in the project file. It's persisted separately in browser localStorage per-user.

---

## Cross-Board Workflows

### Example: Compose → Arrange → Produce

1. **Notation Board (Manual)** — Compose melody in notation
   - Stream "Melody" created with 32 bars
   - Focus on pitch/rhythm correctness

2. **Session + Generators Board (Assisted)** — Add bass/drums
   - Stream "Melody" visible in session (same data)
   - Generate bass into new stream "Bass"
   - Generate drums into new stream "Drums"

3. **Producer Board (Hybrid)** — Arrange and mix
   - All 3 streams visible in timeline
   - Clips arranged linearly
   - Mix levels, add FX, automate parameters
   - Bounce final stems

**Result:** Seamless cross-board workflow. Each board provides different tools, but all work on the same project.

---

## Constraints and Validation

### Board Validation

When switching boards, the system validates:

- ✅ All referenced deck types have factories
- ✅ Tool configuration is consistent with control level
- ✅ Panel IDs match layout definitions

### Data Validation

When loading projects, the system validates:

- ✅ All stream IDs referenced by clips exist
- ✅ All routing connection node IDs exist
- ✅ All parameter targets exist
- ✅ Event payloads match event kinds

**If validation fails:**
- Non-critical issues → logged as warnings
- Critical issues → graceful degradation (missing data ignored)

---

## Best Practices

### For Users

1. **Don't worry about board switching** — your data is safe
2. **Experiment with boards** — find the workflow that suits each task
3. **Use boards as tools** — notation for composition, tracker for detail, session for arrangement

### For Developers

1. **Never store events locally** — always use SharedEventStore
2. **Never duplicate clip data** — always reference ClipRegistry
3. **Always use branded IDs** — EventStreamId, ClipId, etc.
4. **Always handle missing data gracefully** — streams/clips can be deleted
5. **Always integrate with UndoStack** — make all edits undoable

---

## FAQ

### Q: If I create a clip in Session Board, can I edit it in Timeline?
**A:** Yes! Clips are shared. Session view and timeline view show the same clips.

### Q: If I switch from Manual to Generative board, will AI tools appear?
**A:** Yes, tool visibility changes with the board. But your existing data remains unchanged.

### Q: If I delete a board-specific deck, does it delete my data?
**A:** No. Closing a deck hides the UI. The underlying streams/clips remain.

### Q: Can I have the same stream open in two boards simultaneously?
**A:** Not simultaneously (only one board active at a time). But you can switch boards and the same stream will be available.

### Q: What happens if a board expects a deck type that doesn't exist?
**A:** The board won't load fully. Missing deck factories are validated at board registration time.

### Q: Can I export a project and import it in a different board?
**A:** Yes! Projects are board-agnostic. Load the project, then switch to any board.

---

## Technical Details

### Store Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Board-Independent Layer                 │
│                                                           │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐ │
│  │ EventStore  │  │ClipRegistry│  │RoutingGraphStore│ │
│  └─────────────┘  └────────────┘  └──────────────────┘ │
│                                                           │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ParameterStore │  │TransportStore│  │SelectionStore│ │
│  └───────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ Shared across all boards
                            │
┌─────────────────────────────────────────────────────────┐
│                    Board-Specific Layer                  │
│                                                           │
│  ┌──────────────┐  ┌───────────────┐                    │
│  │ BoardState   │  │ ActiveContext │                    │
│  │ Store        │  │ Store         │                    │
│  └──────────────┘  └───────────────┘                    │
│                                                           │
│  Per-board:                                              │
│  • Panel sizes, collapsed states                         │
│  • Deck tab positions, scroll offsets                    │
│  • Deck filter/search state                              │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action (any board)
        ↓
  Deck Component
        ↓
  Shared Store (EventStore, ClipRegistry, etc.)
        ↓
  Subscription Updates
        ↓
  All Subscribed Decks (across all boards if switched)
```

---

## Summary

**All boards share the same project data.** Switching boards changes the workspace (decks, tools, layout) but never changes the underlying streams, clips, routing, or parameters.

This architecture enables:
- ✅ Flexible workflows (use the right board for the right task)
- ✅ No data loss (safe to experiment with boards)
- ✅ Cross-board consistency (same event in tracker/notation/piano roll)
- ✅ Extensibility (new boards can access all existing data)

**Result:** CardPlay is one app with many faces, all working on the same music. 🎵
