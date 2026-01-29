# Basic Session Board

**Board ID:** `basic-session`  
**Category:** Manual  
**Difficulty:** Beginner  
**Philosophy:** Manual clip launching

## Overview

The Basic Session Board provides an Ableton Live-style clip launching interface with no AI generation. Create, launch, and perform with clips you create manually.

## When to Use

- Live performance with clip launching
- Quick sketching and jam sessions
- Loop-based composition
- Ableton Live-style workflows
- When you want immediate playback control

## Layout

Four-panel session layout:

- **Left Panel (Browser):** Instrument browser
- **Center Panel (Session Grid):** Clip slot matrix (tracks × scenes)
- **Bottom Panel (Mixer):** Track strips with meters
- **Right Panel (Properties):** Clip/event properties editor

## Available Decks

### Session Grid Deck (Primary)
- **Type:** `session-deck`
- **Purpose:** Clip launching matrix
- **Features:**
  - Track × scene grid
  - Clip launch/stop
  - Scene launch (horizontal rows)
  - Stop all clips
  - Recording to slots
  - Clip colors and names

### Instrument Browser Deck
- **Type:** `instruments-deck`
- **Purpose:** Browse and add instruments
- **Gating:** Only manual instruments (no generators)
- **Features:**
  - Instrument categories
  - Drag-and-drop to tracks
  - Preset browsing
  - Quick audition

### Mixer Deck
- **Type:** `mixer-deck`
- **Purpose:** Track mixing controls
- **Features:**
  - Volume/pan per track
  - Mute/solo/arm buttons
  - Meters (input/output)
  - Send levels
  - Group/bus routing

### Properties Deck
- **Type:** `properties-deck`
- **Purpose:** Edit clip settings
- **Features:**
  - Clip name, color
  - Loop on/off
  - Start/end points
  - Launch quantization
  - Follow actions

## Keyboard Shortcuts

### Clip Control
- `Space` - Launch selected clip
- `Shift+Space` - Stop selected clip
- `Enter` - Launch selected scene
- `Cmd+Period` - Stop all clips

### Track Control
- `A` - Arm track
- `S` - Solo track
- `M` - Mute track
- `Up/Down` - Navigate slots (vertical)
- `Left/Right` - Navigate tracks (horizontal)

### Clip Actions
- `Cmd+D` - Duplicate clip
- `Delete` - Delete clip
- `Cmd+R` - Rename clip
- `Cmd+E` - Edit clip in editor (switches to notation/tracker)

### Undo
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

### Session Grid → Shared Stores
All session operations interact with shared state:

1. **Creating a clip:**
   - Creates stream in `SharedEventStore`
   - Creates clip in `ClipRegistry`
   - Links stream to slot position

2. **Launching a clip:**
   - Reads events from stream
   - Transport plays events
   - Updates play state UI

3. **Editing a clip:**
   - Sets `ActiveContext.activeClipId`
   - Other views (notation/tracker) update
   - Edits write back to stream

### Transport Quantization
- Launch actions quantized to bar/beat
- Configurable per clip (immediate/bar/beat/2bars/4bars)
- Queue indicator shows pending launches
- Stop actions can be quantized or immediate

## Integration Points

### With Timeline/Arrangement
- Session clips can be timeline clips
- Clips share the same ClipRegistry
- No duplication of data
- Can switch between session and arrangement views

### With Notation/Tracker
- Clicking "Edit" opens notation/tracker for that clip's stream
- Active context syncs automatically
- Edits propagate back to session grid

### With Mixer
- Mixer reflects session track states
- Mute/solo/arm synced
- Volume/pan changes immediate
- Meters show live audio levels

## Empty State

When session grid is empty:
> "No clips — click an empty slot to create one"

## Clip Launch Modes

### Trigger
- Launch: Plays clip from start
- Re-trigger: Restarts clip
- Stop: Stops clip immediately (or quantized)

### Gate
- Hold: Clip plays while key/button held
- Release: Clip stops when released

### Toggle
- First click: Play
- Second click: Stop
- Useful for loops

### Quantization
- **None:** Launch immediately
- **1 Bar:** Launch on next bar
- **1 Beat:** Launch on next beat
- **2 Bars, 4 Bars, etc.:** Launch on next division

## Scene Launching

Scenes are horizontal rows:
- Launch scene = launch all clips in that row simultaneously
- Useful for song sections (intro, verse, chorus, bridge, outro)
- Scene stop = stop all playing clips (optional quantize)

## Performance Tips

1. **Color-code clips** by type (drums, bass, melody, effects)
2. **Use scenes** for song structure (one scene per section)
3. **Set quantization** per clip (drums immediate, pads on bar)
4. **Record to empty slots** during performance (capture ideas live)
5. **Use follow actions** for automatic clip progression (advanced)

## Persona Fit

Ideal for:
- **Live Performers:** Real-time clip launching
- **Ableton Live Users:** Familiar session workflow
- **Loop-Based Producers:** Building tracks from loops
- **Beatmakers:** Quick sketch and jam sessions
- **DJs:** Live remixing and mashups

## Related Boards

- **Session + Generators Board** (assisted) - Adds AI generation to slots
- **Live Performance Board** (hybrid) - Performance-optimized with AI arranger
- **Producer Board** (hybrid) - Full production environment

## Technical Notes

- Session grid backed by `ClipRegistry` (no local state)
- Clip launch uses transport quantization system
- Play state updates at 60fps for visual feedback
- Undo stack tracks clip creation/deletion/moves
- Board state persists (slot assignments, clip colors)

## Ableton Live Mapping

If coming from Ableton Live:
- Session Grid = Session View
- Mixer = Mixer Section
- Instrument Browser = Browser (Instruments)
- Properties = Clip View
- No automatic MIDI mapping yet (manual board)
- No built-in Max for Live (extension system coming)

## Session Grid Size

Default: 8 tracks × 8 scenes (64 slots)
- Expandable to 16 tracks × 16 scenes
- Track add/remove on demand
- Scene add/remove on demand
- Persisted per project

---

**Implemented:** Phase F (F091-F120) ✅  
**Status:** Stable, ready for use  
**Last Updated:** 2026-01-29
