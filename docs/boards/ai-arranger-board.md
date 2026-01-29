# AI Arranger Board

**Control Level:** Directed  
**Difficulty:** Advanced  
**Philosophy:** "You set direction, AI fills in"

## Overview

The AI Arranger board provides directed arrangement capabilities where you define the musical structure (chord progressions, sections, style) and the AI generates musical parts. You maintain creative control while the AI handles instrumentation and arrangement details.

## Board Layout

```
┌────────────────────────────────────────────────┐
│  Arranger Deck (Sections + Style Controls)    │
├─────────────┬─────────────────┬────────────────┤
│  Generator  │  Session Grid   │   Properties   │
│  (Right)    │  (Center)       │   (Right)      │
│             │                 │                │
├─────────────┴─────────────────┴────────────────┤
│  Mixer Deck (Balance Parts)                   │
└────────────────────────────────────────────────┘
```

## Key Features

### 1. Chord-Following Generation
- **Arranger Mode:** `chord-follow`
- Define chord progressions in the arranger deck
- AI generates parts that follow the harmony
- Supports real-time chord editing and regeneration

### 2. Section-Based Structure
- **Section Types:** Intro, Verse, Pre-Chorus, Chorus, Bridge, Breakdown, Drop, Solo, Outro
- Each section has configurable:
  - Length (bars)
  - Energy level (1-5)
  - Complexity level (1-5)
  - Part toggles (drums, bass, melody, pads)

### 3. Style Presets
Pre-configured generator mappings for instant results:
- **Lofi Hip Hop:** Relaxed drums, jazzy chords, vinyl crackle
- **House:** Four-on-floor drums, rolling basslines, stabs
- **Ambient:** Evolving pads, sparse percussion, textures
- **Techno:** Driving percussion, modulated synths, builds
- **Jazz:** Swing drums, walking bass, chord voicings

### 4. Per-Part Controls
Each musical part (drums, bass, melody, pads) has:
- **Seed:** Deterministic regeneration
- **Density:** Note/hit frequency (0-1)
- **Swing:** Rhythmic feel (-1 to 1)
- **Humanize:** Timing/velocity variation (0-1)

### 5. Generation States
Parts can be in different states:
- **Generated:** AI-created, can regenerate
- **Frozen:** User-approved, won't regenerate
- **Manual:** User-edited, full control

## Workflow

### 1. Set Up Arrangement
1. Open AI Arranger board
2. Add sections using the arranger deck
3. Set section lengths and energy levels
4. Define chord progression (optional)

### 2. Configure Generation
1. Select a style preset
2. Toggle desired parts (drums, bass, melody, pads)
3. Adjust per-part settings in properties deck
4. Set global energy/density

### 3. Generate and Refine
1. Click "Generate Arrangement"
2. Review generated parts in session grid
3. Regenerate individual sections/parts as needed
4. Freeze parts you're happy with
5. Edit frozen parts manually if desired

### 4. Mix and Arrange
1. Balance parts using mixer deck
2. Launch clips from session grid to audition
3. Adjust per-track effects in mixer
4. Export or capture to manual board for fine-tuning

## Keyboard Shortcuts

### Generation
- `Cmd+R` - Regenerate selected section
- `Cmd+Shift+R` - Regenerate selected part
- `Cmd+F` - Freeze selected section
- `Cmd+Shift+F` - Freeze selected part

### Section Navigation
- `Right` - Next section
- `Left` - Previous section
- `Cmd+N` - Add new section
- `Cmd+D` - Duplicate section

### Part Toggles
- `1` - Toggle drums
- `2` - Toggle bass
- `3` - Toggle harmony
- `4` - Toggle melody

### Per-Part Processing
- `Cmd+H` - Humanize selected part
- `Cmd+Q` - Quantize selected part

### Workflow
- `Cmd+Shift+M` - Capture to manual board
- `Space` - Play/pause
- `Escape` - Stop

## Integration with Shared Stores

The AI Arranger board writes all generated material to shared stores for seamless integration:

### Event Storage
- Each part (drums, bass, melody, pads) gets its own `EventStreamId`
- Generated events are written to `SharedEventStore`
- Events can be viewed/edited in tracker, piano roll, or notation views

### Clip Management
- Session grid slots reference streams via `ClipRegistry`
- No local copies - all clips share the same event streams
- Launching clips in session grid plays the corresponding stream

### Undo Support
- All generation actions are wrapped in undo groups
- Freeze/unfreeze actions are undoable
- Humanize/quantize operations can be undone

## Control Level Indicators

Visual indicators show the state of each part:
- 🟢 **Generated** - Green badge, can regenerate
- 🔵 **Frozen** - Blue badge, won't regenerate
- ⚪ **Manual** - White badge, user-edited

These indicators appear:
- In mixer deck track headers
- In session grid clip headers
- In properties deck when selecting parts

## Performance Notes

### CPU Guardrails
- Generation is throttled to prevent CPU spikes
- Maximum events per generation cycle
- Background generation can be paused

### Memory Management
- Generated events are stored in shared stores
- No duplication of event data
- Cleanup happens on section deletion

## Switching to Manual Boards

When you're ready for detailed editing:

1. Press `Cmd+Shift+M` to open "Capture to Manual Board" dialog
2. Select a target manual board (Basic Tracker, Notation, etc.)
3. All streams remain active and accessible
4. Switch back to arranger board anytime to regenerate

## Best Practices

### 1. Start Simple
- Begin with 2-3 sections
- Toggle only drums + bass initially
- Add complexity gradually

### 2. Use Freeze Strategically
- Freeze sections you like to prevent accidental regeneration
- Freeze individual parts (e.g., freeze drums, regenerate bass)
- Unfreeze to try variations

### 3. Leverage Style Presets
- Start with a preset closest to your target
- Adjust per-part settings to taste
- Create custom presets by saving settings

### 4. Mix AI and Manual
- Generate arrangement structure with AI
- Freeze generated parts
- Add manual flourishes and details in tracker/notation
- Use AI for variations and fills

## Technical Details

### Generator Integration
The arranger deck integrates with:
- `src/ai/generators/melody-generator.ts`
- `src/ai/generators/bass-generator.ts`
- `src/ai/generators/drum-generator.ts`
- `src/ai/generators/chord-generator.ts`

### Phrase Adaptation
Generated parts are adapted using:
- `src/cards/phrase-adapter.ts` for chord-following
- Voice-leading algorithms for smooth transitions
- Rhythm quantization to match section feel

### State Persistence
Per-board settings are persisted:
- Style preset selection
- Per-part generator settings
- Freeze/unfreeze states
- Section structure

## Related Boards

- **Session + Generators** - On-demand generation without arrangement structure
- **AI Composition** - Prompt-based composition with notation editing
- **Generative Ambient** - Continuous generation for exploration
- **Composer (Hybrid)** - Mix manual and assisted per track

## Troubleshooting

### Generation takes too long
- Reduce section length
- Decrease density settings
- Disable unused parts
- Check CPU usage in system monitor

### Generated parts sound repetitive
- Increase variation seed
- Adjust humanize settings
- Try different style presets
- Regenerate with higher energy

### Parts don't follow chords
- Verify chord track has events
- Check harmony settings in properties
- Ensure arranger mode is `chord-follow`
- Regenerate section after chord changes

### Can't edit generated events
- Freeze the part first
- Switch to a manual board for detailed editing
- Use properties panel for basic edits

## Future Enhancements

### Planned Features
- Custom style preset creation
- Per-section style overrides
- Fill generation at section boundaries
- Automatic transitions between sections
- Export arrangement as MIDI/audio

### Under Consideration
- Real-time generation during playback
- Collaborative generation (multiple users)
- Style learning from existing projects
- Genre-specific arrangement templates
