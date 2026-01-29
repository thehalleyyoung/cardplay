# Basic Tracker Board

**Board ID:** `basic-tracker`  
**Category:** Manual  
**Difficulty:** Intermediate  
**Philosophy:** You control everything - pure tracker

## Overview

The Basic Tracker Board provides a classic tracker interface with no AI assistance. Pattern-based composition with full manual control over every note, effect command, and parameter.

## When to Use

- Pure manual tracker workflow (Renoise, FastTracker heritage)
- Precise control over note entry and effects
- Sample-accurate timing requirements
- Chip tune and retro music composition
- When you prefer hexadecimal note entry and vertical scrolling

## Layout

Three-panel tracker layout:

- **Left Panel (Sidebar):** Instrument/sample browser
- **Center Panel (Main):** Pattern editor with columns for notes, instruments, effects
- **Right Panel (Inspector):** Properties for selected events and track settings

## Available Decks

### Pattern Editor Deck (Primary)
- **Type:** `pattern-deck`
- **Purpose:** Main pattern editing surface
- **Features:**
  - Hex note entry (traditional)
  - Effect command columns
  - Beat highlights
  - Follow playback mode
  - Multi-track columns

### Instrument Browser Deck
- **Type:** `instruments-deck`
- **Purpose:** Browse and load instruments/samples
- **Gating:** Only manual instruments (no generators)
- **Features:**
  - Sample instruments
  - Synthesizer instruments
  - Effects chains per track
  - Drag-and-drop to pattern

### Properties Deck
- **Type:** `properties-deck`
- **Purpose:** Edit selected events and track properties
- **Features:**
  - Note pitch/velocity (hex or decimal)
  - Effect parameters
  - Track volume/pan/mute/solo
  - Pattern length control

## Keyboard Shortcuts

### Navigation
- `Up/Down` - Move cursor vertically
- `Left/Right` - Move between columns
- `Cmd+Up/Cmd+Down` - Next/previous pattern
- `PageUp/PageDown` - Scroll by pattern view height

### Editing
- Piano keys - Enter notes (mapped to QWERTY)
- `Backslash` - Note off
- `Delete` - Clear cell
- `Cmd+D` - Clone pattern
- `Cmd+X/C/V` - Cut/Copy/Paste

### Playback
- `Space` - Play/stop
- `F` - Toggle follow playback
- `L` - Toggle pattern loop

### Octave
- `Ctrl+Up` - Octave up
- `Ctrl+Down` - Octave down

### Actions
- `Cmd+Z` - Undo
- `Cmd+Shift+Z` - Redo

## Tool Configuration

All composition tools are disabled:

- ❌ Phrase Database - Hidden
- ❌ Harmony Explorer - Hidden
- ❌ Phrase Generators - Hidden
- ❌ Arranger Card - Hidden
- ❌ AI Composer - Hidden

## Data Flow

### Pattern Edits → Shared Store
All tracker edits write to `SharedEventStore` via TrackerEventSync:
- Each pattern row maps to event ticks
- Effect commands write parameter automation
- Instrument changes create card references
- Undo/redo via UndoStack

### Stream Context
Pattern editor binds to `ActiveContext.activeStreamId`:
- Pattern length is stream's event range
- Switching patterns switches active stream
- Multi-pattern tabs available

## Integration Points

### With Piano Roll
- Notes entered in tracker appear in piano roll
- Piano roll velocity edits update tracker
- Shared event selection

### With Notation
- Tracker notes render in notation view
- Timing is synchronized (tick-accurate)
- Shared undo stack

### With Session
- Patterns can be clips in session grid
- Launching pattern plays tracker events
- Transport quantization applies

## Empty State

When no pattern exists:
> "No pattern — press + to create stream/pattern"

## Theme

Classic tracker aesthetic:
- **Colors:** Bright columns on dark background
- **Typography:** Monospace font (`Fira Code`, `Consolas`)
- **Visual:** Beat highlights, column separators
- **Control Indicators:** Manual-only (no AI colors)

## Pattern Length

Configurable per pattern:
- Default: 64 rows
- Common: 32, 64, 128, 256 rows
- Persists per stream
- Adjustable via pattern properties

## Hex vs Decimal

Optional toggle for note display:
- **Hex mode:** C-4 01 -- 0F0200 (traditional)
- **Decimal mode:** C-4 01 -- 127,64 (modern)
- Persisted per board preference

## Performance Tips

1. **Use follow playback** during editing for real-time feedback
2. **Clone patterns** instead of copy/paste for structure
3. **Master keyboard shortcuts** - mouse is slow in trackers
4. **Use effect columns** for automation instead of separate lanes
5. **Pattern length per section** - verse/chorus can have different lengths

## Persona Fit

Ideal for:
- **Tracker Purists:** Renoise, FastTracker, Impulse Tracker users
- **Chip Tune Artists:** Sample-accurate retro music
- **Electronic Producers:** Pattern-based EDM workflows
- **Sample-Based:** Working primarily with samples vs synthesis

## Related Boards

- **Tracker + Harmony Board** (assisted) - Adds chord tone hints
- **Tracker + Phrases Board** (assisted) - Adds phrase drag/drop
- **Live Performance Tracker Board** (hybrid) - Performance-focused tracker

## Technical Notes

- Board state persists (hex/decimal choice, follow mode, octave)
- Pattern scrolling uses virtualization for performance
- Beat highlights computed from transport PPQ settings
- Effect command validation matches audio engine capabilities

## Mapping from Renoise

If coming from Renoise:
- Pattern editor = Pattern Editor
- Instrument browser = Instrument Selector
- Properties = Track DSPs + Instrument Properties
- No built-in phrases (see Tracker + Phrases board for that)

---

**Implemented:** Phase F (F031-F060) ✅  
**Status:** Stable, ready for use  
**Last Updated:** 2026-01-29
