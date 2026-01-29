# Session + Generators Board

**Board ID:** `session-generators`  
**Category:** Assisted  
**Difficulty:** Intermediate  
**Philosophy:** Trigger generation, then curate - fast sketching with full control

## Overview

The Session + Generators Board combines clip-based session workflow with on-demand phrase generators. Quickly sketch ideas by generating clips, then curate and perform them. Perfect for fast iteration and live performance preparation.

## When to Use

- Rapid idea sketching and exploration
- Live performance setup with generated backing tracks
- Beat-making with generator assistance
- Quick clip generation for arrangement later
- Learning compositional patterns through examples
- When you want speed but retain curation control

## Control Philosophy

**Assisted:** You trigger when to generate and what to generate. The board fills clips on-demand, but you curate results, edit them, and control performance. Clear distinction between "generated" and "manual" content.

## Layout

Four-panel layout optimized for generation workflow:

- **Left Panel (Browser):** Instrument browser for manual additions
- **Center Panel (Session):** Clip-session grid (main workspace)
- **Right Panel (Generator):** Generator deck with on-demand controls
- **Bottom Panel (Mixer):** Mixer for balancing and effects

## Available Decks

### Clip-Session Deck (Center Panel)
- **Type:** `clip-session`
- **Purpose:** Main session grid for clips
- **Features:**
  - Track × Scene grid (Ableton-style)
  - Clip launch/stop controls
  - Playing/queued/stopped state indicators
  - Generated clip badges (clear visual distinction)
  - Manual clip support (record/edit)
- **Integration:**
  - Clips backed by ClipRegistry
  - Streams backed by SharedEventStore
  - Selection sets ActiveContext

### Generator Deck (Right Panel)
- **Type:** `generators-deck`
- **Purpose:** On-demand phrase generation
- **Features:**
  - Generator type selector (melody, bass, drums, arp, pad)
  - "Generate" button (triggers generation into selected clip)
  - "Regenerate" button (replace with new variation, undoable)
  - "Freeze" button (convert generated → manual ownership)
  - Seed/style/density controls
  - Chord-follow option (if chord track exists)
- **Workflow:**
  1. Select empty clip slot in session grid
  2. Choose generator type (e.g., "Bass")
  3. Click "Generate"
  4. Review generated clip
  5. Regenerate if needed, or freeze to keep

### Mixer Deck (Bottom Panel)
- **Type:** `mixer-deck`
- **Purpose:** Balance and mixing controls
- **Features:**
  - Track strips with volume/pan
  - Mute/solo/arm buttons
  - Level meters
  - Send controls (if applicable)
  - Master output control

### Instrument Browser Deck (Left Panel)
- **Type:** `instruments-deck`
- **Purpose:** Browse and load instruments
- **Gating:** Manual instruments + assisted helpers
- **Features:**
  - Sample instruments
  - Synthesizers
  - Effects
  - Drag-and-drop to tracks

### Properties Deck (Optional Tab)
- **Type:** `properties-deck`
- **Purpose:** Edit clip and generator settings
- **Features:**
  - Clip name/color/loop settings
  - Generator parameters (seed, style, density)
  - Chord-follow toggle
  - Humanize/quantize options

## Generation Workflow

### Basic Generation Loop

1. **Select Target:** Click empty slot in session grid
2. **Choose Generator:** Select type (melody, bass, drums, etc.)
3. **Configure:** Adjust style, density, seed (optional)
4. **Generate:** Click "Generate" button
5. **Review:** Listen to generated clip
6. **Iterate:** Regenerate if not satisfied (fully undoable)
7. **Commit:** Freeze to make editable as manual content

### Advanced Options

- **Chord-Follow Mode:** Generator adapts to chord track progression
- **Seed Control:** Regenerate variations with different seeds
- **Style Presets:** Quick access to genres (lofi, house, ambient, etc.)
- **Density Control:** Sparse to dense note generation

### Generated vs Manual Clips

- **Generated Clips:** Badge indicator, lighter color, can regenerate
- **Manual Clips:** Standard appearance, fully editable, cannot regenerate
- **Frozen Clips:** Started as generated, now manual (no badge, editable)

## Keyboard Shortcuts

### Generation Actions
- **Cmd+G** - Generate into selected slot
- **Cmd+Shift+G** - Regenerate selected clip
- **Cmd+F** - Freeze selected clip (generated → manual)
- **Cmd+N** - Create new manual clip

### Session Actions
- **Space** - Launch selected clip
- **Cmd+E** - Stop selected clip
- **Enter** - Launch scene (all clips in row)
- **Escape** - Stop all clips

### Navigation
- **Arrow Keys** - Navigate grid
- **Cmd+1-9** - Jump to track 1-9
- **Shift+1-9** - Jump to scene 1-9

### Standard
- **Cmd+Z** - Undo
- **Cmd+Shift+Z** - Redo
- **Cmd+D** - Duplicate clip

## Recommended Workflows

### Quick Sketching

1. Set tempo and key
2. Generate bass clip (slot A1)
3. Generate drums clip (slot A2)
4. Generate pad clip (slot A3)
5. Launch scene A to hear together
6. Iterate generators until satisfied
7. Freeze clips and edit details

### Live Performance Prep

1. Generate multiple variations per track (scenes 1-8)
2. Freeze favorite variations
3. Add manual breaks and transitions
4. Set up mixer with effects
5. Practice launching scenes in order
6. Export as project for live set

### Beat Making

1. Start with drums generator (create groove foundation)
2. Add bass generator following the rhythm
3. Layer melody generators (lead, pad, arp)
4. Freeze all clips
5. Switch to manual editing for final touches
6. Export clips to arrangement view

## Tools Enabled

- **Phrase Generators:** `on-demand` mode
  - Generate into selected clip
  - Multiple generator types available
  - Regenerate with undo support
  - Clear generated/manual distinction

## Tools Optional (Can Enable)

- **Harmony Explorer:** `display-only` mode (for chord-follow)
- **Phrase Database:** `browse-only` mode (for manual phrase drag)

## Tools Disabled

- **Arranger Card:** Hidden (use AI Arranger Board instead)
- **AI Composer:** Hidden initially (can enable for advanced workflows)

## Theme

The board uses an **assisted color palette** optimized for clarity:

- **Primary:** Electric blue (generation actions)
- **Secondary:** Warm orange (generated content badge)
- **Accent:** Green (freeze/commit actions)
- **Background:** Dark mode with high contrast for live use

Generated clips have subtle color tinting to distinguish from manual clips.

## Recommendations

This board is recommended for:

- **"Quick sketching"** workflows
- **"Ableton user"** wanting generation assist
- **"Beat maker"** exploring ideas rapidly
- **"Live performer"** preparing sets with variations
- **"Producer"** in early arrangement phase

## Generation Quality

### What Generators Do Well

- Rhythmic patterns (drums, bass, arpeggios)
- Harmonic backing (pads, chord progressions)
- Melodic variations (leads, counter-melodies)
- Genre-appropriate patterns (lofi, house, ambient)

### What Generators Don't Do

- Write your song for you (you curate and arrange)
- Replace musical judgment (you decide what works)
- Automatically fix bad ideas (you iterate and improve)

**Philosophy:** Generators are **creative tools**, not replacements for creativity. They help you explore faster, not think less.

## Integration with Other Boards

### Switching Away
- Clips remain in ClipRegistry
- Generated content stays accessible
- Can switch to manual tracker/notation to edit generated notes

### Switching To This Board
- Inherits clips from previous boards
- Shows generation badges for clips created here
- Manual clips from other boards work normally

### Export to Arrangement
- Freeze important clips first
- Drag clips to timeline in Producer Board
- Generator settings are not preserved across boards

## Performance Considerations

- **Generation Speed:** Near-instant for typical patterns (< 100ms)
- **Clip Capacity:** Tested with 100+ clips per session
- **Undo History:** Each generation creates undo point (safe to experiment)
- **Memory:** Generated clips are stored like manual clips (no extra overhead)

## Examples

### Lofi Hip Hop Beat

```
Scene 1 (Intro):
  Track 1 (Drums): Generate "lofi-drums" style
  Track 2 (Bass): Generate "sub-bass" following drums
  Track 3 (Keys): Generate "lofi-keys" with chord-follow

Scene 2 (Verse):
  Track 1 (Drums): Regenerate with higher density
  Track 2 (Bass): Keep same
  Track 3 (Keys): Add manual melody on top

Scene 3 (Chorus):
  Track 1-3: Freeze all and edit for transitions
  Track 4 (Vocals): Add manual recording
```

### House Track Build

```
Build progression across scenes:
Scene 1: Kick only (generated)
Scene 2: + Bass (generated, freeze)
Scene 3: + Hihat (generated)
Scene 4: + Pad (generated, chord-follow)
Scene 5: + Lead (manual melody)
Scene 6: Full mix (adjust levels in mixer)
```

## Technical Notes

- **Generation Engine:** Rule-based generators (no network, instant results)
- **Clip Storage:** Same as manual clips (SharedEventStore + ClipRegistry)
- **Undo Integration:** Every generation is undoable via UndoStack
- **Chord-Follow:** Reads chord events from dedicated chord stream
- **Seed System:** Reproducible generations with seed control

## Common Questions

### Q: Can I edit generated clips?
**A:** Yes! Freeze them first to convert to manual ownership, then edit freely in tracker/notation.

### Q: Will regenerating lose my edits?
**A:** Only if clip is still "generated" status. Freeze first to protect edits.

### Q: Can I use my own generator presets?
**A:** Yes (future feature). Extension system will support custom generators.

### Q: Does this require internet?
**A:** No. All generators are local, rule-based systems. No network needed.

## See Also

- [AI Arranger Board](./ai-arranger-board.md) - Full arrangement generation
- [Basic Session Board](./basic-session-board.md) - Pure manual session
- [Phrase Generators Tool](./tool-modes.md#phrase-generators) - Generator modes reference
- [Generator Deck](./decks.md#generator-deck) - Generator deck details
