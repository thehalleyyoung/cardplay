# Project Compatibility

## Overview

CardPlay boards share a **common project format**, ensuring that projects created in one board can be opened and edited in any other board. This design enables flexible workflows where users can switch between manual, assisted, and generative approaches as their creative needs evolve.

## Shared Project Foundation

All boards operate on the same underlying data structures:

### Core Data Stores

- **SharedEventStore**: All musical events (notes, automation, chord symbols) live in streams
- **ClipRegistry**: All clips reference streams by ID, not by copying data
- **Routing Graph**: All audio/MIDI/modulation connections persist across boards
- **Parameter Resolver**: All device/instrument parameters persist with their automation/modulation
- **Selection Store**: Selection state (by event/clip ID) transfers between boards
- **Transport State**: Tempo, time signature, loop region, and playhead position are global
- **Undo Stack**: Undo/redo history persists and works across board switches

### Board-Specific State

Boards persist their own UI state separately:

- **Per-Board Layout**: Panel sizes, dock positions, collapsed/expanded states
- **Per-Board Deck State**: Active tabs, scroll positions, filters, search queries
- **Per-Board Theme**: Color scheme overrides (optional)

Board-specific state does NOT include musical content - only UI preferences.

## K004: What Persists When Switching Boards

### Always Persists (Musical Content)

✅ **Streams and Events**
- All event streams remain in SharedEventStore
- Note events, automation events, chord events, etc.
- Timing, pitch, velocity, duration - all preserved

✅ **Clips and Arrangements**
- Clip definitions in ClipRegistry
- Timeline arrangements (clip placements on tracks)
- Session grid slot assignments
- Clip loop ranges and colors

✅ **Instrument/Effect Chains**
- Device cards and their parameters
- Routing connections (audio/MIDI/modulation)
- Preset data
- Automation curves

✅ **Selection and Context**
- Active stream ID (which pattern/score is being edited)
- Active clip ID (which clip is selected)
- Active track ID
- Selected events/clips (by ID, not visual selection)

✅ **Transport State** (by default)
- Current playhead position
- Loop region
- Tempo and time signature
- Playing/stopped state

### Optionally Reset

⚠️ **Layout State** (if `resetLayout: true` in switch options)
- Panel sizes and positions reset to target board defaults
- Active deck tabs reset
- Scroll positions reset

⚠️ **Deck State** (if `resetDecks: true` in switch options)
- Filter states clear
- Search queries clear
- Focused items reset

⚠️ **Selection** (if `clearSelection: true` in switch options)
- Selected events/clips cleared
- Active stream/clip preserved

⚠️ **Transport** (if `preserveTransport: false` in switch options)
- Playback stops
- Playhead resets to 0

### Never Persists (UI-Only State)

❌ **Visual State**
- Mouse hover states
- Tooltip visibility
- Modal open/closed states
- Keyboard focus (restored to board chrome)

❌ **Temporary Previews**
- Phrase preview playback
- Generator draft proposals (unless accepted)
- Routing connection drag previews

## Board Migration Patterns

When switching boards, the system follows these migration patterns:

### 1. View Mapping

If the target board doesn't support the current primary view, the system:
- Sets `activeViewType` to the target board's `primaryView`
- Preserves `activeStreamId` and `activeClipId` so the same content is visible
- Renders decks that can display the active stream (e.g., notation → tracker)

Example:
```
Current board: Notation Board (primaryView: 'notation')
Target board: Basic Tracker (primaryView: 'tracker')

Result: Same stream shown in tracker instead of notation
```

### 2. Deck Matching

The system attempts to preserve open deck types:
- If target board has the same deck type, it stays open with same context
- If target board doesn't have that deck type, it closes gracefully
- Target board's default decks open with active context

Example:
```
Current board decks: [notation-score, properties, harmony-display]
Target board decks: [pattern-editor, properties, dsp-chain]

Result:
- notation-score → closes (not in target)
- properties → stays open (common to both)
- harmony-display → closes (not in target)
- pattern-editor → opens with activeStreamId
- dsp-chain → opens with default state
```

### 3. Tool Availability

Boards with different tool configurations require careful migration:

**Manual → Assisted Migration**
- All manual content preserved
- Generated content (if any existed) becomes editable manual content
- Phrase library becomes available for drag-drop
- Harmony display activates with current key/chord context

**Assisted → Manual Migration**
- All content preserved (generated events become manual)
- Tool decks (phrase library, harmony display) close
- All events remain editable
- "Generated" metadata ignored (all events treated as manual)

**Generative → Manual Migration**
- Continuous generation stops
- All current events frozen as manual content
- Generator decks close
- User gains full manual control

**Manual → Generative Migration**
- Existing manual content preserved
- Generator decks open but don't overwrite existing streams
- User can selectively apply generation to empty tracks/clips
- Manual tracks remain untouched unless explicitly regenerated

## Project Compatibility Guarantees

### Version Compatibility

Projects are forward- and backward-compatible within major versions:
- Projects from v1.0 load in v1.5 (may gain features)
- Projects from v1.5 load in v1.0 (newer features gracefully degrade)
- Boards validate tool/deck availability and adapt gracefully

### Board Availability

If a project was saved in a board that no longer exists:
- Project still loads (all data intact)
- System selects a compatible board based on control level
- User can manually switch to preferred board
- No data loss occurs

### Missing Tools/Decks

If a project uses tools/decks not available on current board:
- Data remains in stores (clips, streams, routing)
- Inaccessible decks don't render but data persists
- Switching to a board with those tools restores full functionality
- Warning banner suggests compatible boards

## Best Practices

### For Users

1. **Start with the right board for your workflow**
   - Manual boards for full control
   - Assisted boards for quick iteration
   - Generative boards for exploration

2. **Switch boards freely during your session**
   - Edit in tracker, review in notation
   - Compose in generative, polish in manual
   - No fear of data loss

3. **Use board switching as a creative tool**
   - Manual → Generative: Get variations on your ideas
   - Generative → Manual: Capture and refine generated content
   - Assisted → Manual: Finalize with full control

### For Developers

1. **Never store musical content in board-specific state**
   - Always use SharedEventStore, ClipRegistry, RoutingGraph
   - Board state = UI preferences only

2. **Design decks to be context-aware**
   - Read activeStreamId/activeClipId from BoardContextStore
   - Update when context changes
   - Don't cache stream/clip data

3. **Handle missing context gracefully**
   - If activeStreamId doesn't exist, show empty state
   - If activeClipId is null, disable clip-specific actions
   - Always provide a path to create new content

## Migration API

Programmatic board switching with migration options:

```typescript
import { switchBoard } from '@cardplay/boards/switching';

// Switch with defaults (preserve everything)
switchBoard('basic-tracker');

// Switch and reset layout to target board defaults
switchBoard('notation-board-manual', {
  resetLayout: true,
  resetDecks: false,
  preserveActiveContext: true,
  preserveTransport: true,
  clearSelection: false,
});

// Switch to generative board and stop playback
switchBoard('generative-ambient', {
  resetLayout: false,
  resetDecks: true,
  preserveActiveContext: true,
  preserveTransport: false, // Stop playback
  clearSelection: true,     // Clear selection
});
```

## See Also

- [Board Switching Semantics](./board-switching-semantics.md) - Detailed switching behavior
- [Board State](./board-state.md) - Persistence model
- [Layout Runtime](./layout-runtime.md) - Panel/deck state structure
- [Migration Plans](./migration.md) - Deck-to-deck mapping heuristics
