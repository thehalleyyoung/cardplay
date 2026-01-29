# Board Deck Types

This document describes each deck type available in the Board-Centric Architecture and their backing components.

**Status:** E084 ✅

## Overview

Decks are the primary UI containers within boards. Each deck type serves a specific purpose and can be configured with different card layouts (stack, tabs, split, floating).

## Deck Types

### Editor Decks

#### `pattern-deck` (Tracker Pattern Editor)
- **Factory:** `pattern-editor-factory.ts`
- **Component:** `tracker-panel.ts`
- **Purpose:** Tracker-style pattern editing with rows/columns
- **Active Context:** Binds to `activeStreamId`
- **Features:**
  - Hex note entry
  - Effect commands
  - Pattern length control
  - Real-time sync with SharedEventStore
- **Typical Boards:** Basic Tracker, Tracker + Harmony, Tracker + Phrases

#### `notation-deck` (Notation Score)
- **Factory:** `notation-deck-factory.ts`
- **Component:** `notation-panel.ts` via `notation-store-adapter.ts`
- **Purpose:** Western notation score editing
- **Active Context:** Binds to `activeStreamId`
- **Features:**
  - Staff engraving
  - Clef/key/time signature
  - Voice leading
  - Bidirectional store sync
- **Typical Boards:** Notation Manual, Notation + Harmony

#### `piano-roll-deck` (Piano Roll Editor)
- **Factory:** `piano-roll-factory.ts`
- **Component:** `piano-roll-panel.ts`
- **Purpose:** MIDI-style piano roll editing
- **Active Context:** Binds to `activeStreamId`
- **Features:**
  - Note grid with velocity lane
  - Snap to grid
  - Selection tools
  - Real-time sync with SharedEventStore
- **Typical Boards:** All composer/producer boards

#### `session-deck` (Clip Session Grid)
- **Factory:** `session-deck-factory.ts`
- **Component:** `session-grid-panel.ts`
- **Purpose:** Ableton-style session view for clip launching
- **Active Context:** Sets `activeClipId` on slot selection
- **Features:**
  - Track × scene grid
  - Clip launch states (playing/queued/stopped)
  - Scene launch
  - Backed by ClipRegistry
- **Typical Boards:** Basic Session, Session + Generators, Live Performance

#### `arrangement-deck` (Timeline Arrangement)
- **Factory:** `arrangement-deck-factory.ts`
- **Component:** `arrangement-panel.ts`
- **Purpose:** Linear timeline arrangement view
- **Active Context:** Binds to ClipRegistry
- **Features:**
  - Multi-track timeline
  - Clip placement and editing
  - Automation lanes (via automation-deck)
  - Zoom and navigation
- **Typical Boards:** Producer, Composer, all arrangement-focused boards

### Browser Decks

#### `instruments-deck` (Instrument Browser)
- **Factory:** `instrument-browser-factory.ts`
- **Component:** Integrates with card registry
- **Purpose:** Browse and load instrument cards
- **Gating:** Filters by board control level (Phase D)
- **Features:**
  - Category filtering
  - Search
  - Drag-and-drop card templates
  - "Show disabled" toggle with reasons
- **Typical Boards:** All boards

#### `samples-deck` (Sample Browser)
- **Factory:** `sample-browser-factory.ts`
- **Component:** `sample-browser.ts`
- **Purpose:** Browse and load audio samples
- **Features:**
  - Folder navigation
  - Waveform preview
  - Tag filtering
  - Drag samples to sampler cards
- **Typical Boards:** Basic Sampler, Producer boards

#### `phrases-deck` (Phrase Library)
- **Factory:** `phrase-library-factory.ts`
- **Component:** `phrase-library-panel.ts` / `phrase-browser-ui.ts`
- **Purpose:** Browse and drag musical phrases
- **Gating:** Controlled by `phraseDatabase` tool mode
- **Features:**
  - Category/tag filtering
  - Phrase preview playback
  - Drag-and-drop with adaptation
  - Save selection as phrase
- **Typical Boards:** Tracker + Phrases, Composer (assisted)

### Tool Decks

#### `dsp-chain` (DSP Effect Chain)
- **Factory:** `dsp-chain-factory.ts`
- **Component:** `dsp-chain-panel.ts`
- **Purpose:** Effect stack for audio processing
- **Features:**
  - Vertical effect chain
  - Drag-and-drop effects
  - Routing integration
  - Per-track or master chain
- **Typical Boards:** All boards (mixing/mastering)

#### `mixer-deck` (Mixer Channels)
- **Factory:** `mixer-deck-factory.ts`
- **Component:** `mixer-panel.ts`
- **Purpose:** Track mixing console
- **Features:**
  - Track strips (fader, pan, mute, solo, arm)
  - Level meters
  - Send/return routing
  - Master channel
- **Typical Boards:** Producer, Session, Live Performance

#### `properties-deck` (Properties Inspector)
- **Factory:** `properties-factory.ts`
- **Component:** `properties-panel.ts`
- **Purpose:** Edit selected event/clip/card properties
- **Active Context:** Reacts to SelectionStore
- **Features:**
  - Event editing (note, velocity, start, duration)
  - Clip editing (name, color, loop, duration)
  - Card parameter editing (future)
  - Type-safe field editors
- **Typical Boards:** All boards

#### `transport-deck` (Transport Controls)
- **Factory:** `transport-factory.ts`
- **Component:** Custom transport UI
- **Purpose:** Playback transport controls
- **Features:**
  - Play/Stop/Pause buttons
  - Tempo control
  - Loop toggle
  - Time signature display
- **Typical Boards:** All boards (usually in board chrome)

#### `routing-deck` (Routing Graph / Modular)
- **Factory:** `routing-factory.ts`
- **Component:** `connection-router.ts` integration
- **Purpose:** Visualize and edit routing graph
- **Features:**
  - Node/edge visualization
  - Port connection validation
  - Audio/MIDI/modulation routing
  - Mini-map mode
- **Typical Boards:** Producer, Sound Designer, Live Performance

#### `automation-deck` (Automation Lanes)
- **Factory:** `automation-factory.ts`
- **Component:** Custom automation UI
- **Purpose:** Parameter automation editing
- **Features:**
  - Per-parameter automation lanes
  - Envelope curve editing
  - Modulation routing
  - Undo support
- **Typical Boards:** Producer, Composer (advanced)

### AI/Generator Decks

#### `generators-deck` (Generator Cards)
- **Factory:** `generator-factory.ts`
- **Component:** Custom generator UI
- **Purpose:** On-demand phrase/part generation
- **Gating:** Controlled by `phraseGenerators` tool mode
- **Features:**
  - Melody/bass/drums/arp generators
  - Generate/regenerate actions
  - Style presets
  - Output to active stream
- **Typical Boards:** Session + Generators, AI Arranger, Generative boards

#### `arranger-deck` (Arranger Sections)
- **Factory:** `arranger-factory.ts`
- **Component:** Custom sections UI
- **Purpose:** Section-based arrangement
- **Gating:** Controlled by `arrangerCard` tool mode
- **Features:**
  - Section blocks (intro, verse, chorus, etc.)
  - Part toggles (drums, bass, melody, pads)
  - Style/energy controls
  - Generate per section
- **Typical Boards:** AI Arranger, Composer (directed)

#### `harmony-deck` (Harmony Display)
- **Factory:** `harmony-display-factory.ts`
- **Component:** Custom harmony UI
- **Purpose:** Display and suggest harmony
- **Gating:** Controlled by `harmonyExplorer` tool mode
- **Features:**
  - Current key/chord display
  - Chord tone highlighting
  - Roman numeral analysis
  - Next chord suggestions
- **Typical Boards:** Tracker + Harmony, Notation + Harmony

#### `ai-advisor-deck` (AI Advisor Panel)
- **Factory:** `ai-advisor-factory.ts` (Phase L)
- **Component:** `ai-advisor-panel.ts`
- **Purpose:** Prolog-based compositional advice
- **Features:**
  - Query system
  - Suggestion display
  - Workflow planning
  - Project health analysis
- **Typical Boards:** Assisted/Directed/Generative boards

## Deck Configuration

### Card Layout Modes

Decks can be configured with different card layouts:

- **`stack`**: Cards stacked, one visible at a time (z-index control)
- **`tabs`**: Tab bar with one active tab content area
- **`split`**: Split view with multiple cards visible simultaneously
- **`floating`**: Draggable/resizable floating cards

### Control Level Override

Decks can override the board-level control level:

```typescript
{
  id: 'my-deck',
  type: 'pattern-deck',
  cardLayout: 'tabs',
  controlLevelOverride: 'full-manual', // Force manual control for this deck
  // ...
}
```

This allows hybrid boards where some decks are manual and others are generative.

## Deck State Persistence

Per-deck state is persisted via `BoardStateStore.perBoardDeckState`:

- Active tab index
- Scroll positions
- Focused item
- Filters/search state
- Collapsed/expanded sections

State is keyed by `boardId + deckId` and survives board switching.

## Creating Custom Decks

To add a new deck type:

1. **Define the DeckType** in `src/boards/types.ts`
2. **Create a Factory** in `src/boards/decks/factories/`
3. **Implement `DeckFactory` interface:**
   - `deckType`: string matching your DeckType
   - `create(deckDef, ctx)`: returns DeckInstance
   - `validate(deckDef)`: optional validation (returns error or null)
4. **Register in `registerAllFactories()`** in `factories/index.ts`
5. **Add Gating Rules** (Phase D) if the deck should be conditionally visible
6. **Test** mounting and unmounting in playground

## Testing Decks

Each deck should have:

- **Unit tests** for factory creation and validation
- **Integration tests** for:
  - Rendering without errors
  - Active context binding
  - State persistence
  - Undo integration
  - Gating rules (if applicable)

See `src/boards/decks/factories/*.test.ts` for examples.

## See Also

- [Board API Reference](./board-api.md)
- [Panel Roles and Layout](./panels.md)
- [Card Gating Rules](./gating.md)
- [Deck Runtime Types](../../src/boards/decks/runtime-types.ts)
