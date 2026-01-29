# Generative Ambient Board

**Control Level:** Generative  
**Difficulty:** Beginner  
**Philosophy:** "System generates, you curate"

## Overview

The Generative Ambient board provides continuous, autonomous music generation for ambient and experimental soundscapes. Unlike other boards where you trigger generation, this board runs continuously, evolving musical material over time. Your role shifts from creator to curator - you listen, set global constraints, and capture "best moments" when they emerge.

## Board Layout

```
┌──────────┬──────────────────────────────┬────────────┐
│Properties│  Generator Stream (Center)   │  Timeline  │
│ (Left)   │  Continuous Output View      │  (Right)   │
│          │  Evolving Layers             │  Capture   │
│Constraints│  Density Meters             │  Moments   │
│          │  Accept/Reject               │            │
├──────────┴──────────────────────────────┴────────────┤
│  Mixer Deck (Balance Evolving Layers)                │
└───────────────────────────────────────────────────────┘
```

## Key Features

### 1. Continuous Generation Mode
- **phraseGenerators:** `continuous` mode
- Runs in background, proposing candidates over time
- No manual triggering required
- Evolves according to global constraints

### 2. Curation Workflow
Instead of creating, you curate:
- **Listen:** Generation plays continuously
- **Accept** (`Enter`) - Commit interesting material to stores
- **Reject** (`Backspace`) - Discard without mutating stores
- **Capture** (`Cmd+R`) - Record time window as clip

### 3. Layer-Based Generation
Multiple independent generative layers:
- **Pad Layer** - Sustained, evolving harmonies
- **Texture Layer** - Granular, atmospheric elements
- **Pulse Layer** - Sparse rhythmic elements
- **Drone Layer** - Sustained tones and pedal points

Each layer can be:
- **Active** - Generating continuously
- **Frozen** - Stopped, events editable
- **Solo/Mute** - Audition or silence

### 4. Mood Presets
Pre-configured constraint sets for instant results:

**Drone (Press `1`):**
- Long sustains
- Minimal movement
- Low register emphasis
- Very sparse density

**Shimmer (Press `2`):**
- High register
- Reverb emphasis (visual hint)
- Arpeggiated textures
- Moderate density

**Granular (Press `3`):**
- Short, overlapping events
- Wide pitch range
- Dense texture
- Randomized timing

**Minimalist (Press `4`):**
- Sparse events
- Repetitive patterns
- Slow evolution
- Clean, simple

### 5. Global Constraints
Set boundaries for generation:

**Harmonic Constraints:**
- Key signature (optional, can be free)
- Scale type (major, minor, chromatic, microtonal)
- Chord basis (optional chord track)
- Interval restrictions

**Temporal Constraints:**
- Tempo range (min/max BPM)
- Rhythmic grid (free, quantized, mixed)
- Event duration range

**Density Constraints:**
- Events per second (overall)
- Notes per layer
- Silence probability

**Randomness:**
- Evolution speed (slow drift vs rapid change)
- Pitch randomness
- Timing randomness
- Velocity randomness

### 6. CPU Guardrails
Automatic throttling to prevent system overload:
- **Max events/sec:** Configurable limit (default 10)
- **Max layers:** Active layer count limit (default 4)
- **CPU threshold:** Pauses generation if CPU > 80%
- **Memory limit:** Stops if memory usage exceeds threshold
- **Visual warnings:** Orange/red indicators when limits approached

## Workflow

### 1. Initialize Board
1. Open Generative Ambient board
2. System starts continuous generation automatically
3. Set mood preset or adjust constraints
4. Listen and observe

### 2. Set Constraints
1. Open properties deck (left panel)
2. Adjust global constraints:
   - Tempo range
   - Density
   - Harmony (key, scale)
   - Randomness
3. Changes affect future generation (ongoing material continues)

### 3. Curate Material
As generation runs:
1. Listen for interesting moments
2. Press `Enter` to accept current candidate
3. Accepted material commits to SharedEventStore
4. Rejected material discards automatically after timeout

### 4. Capture Moments
When something special emerges:
1. Press `Cmd+R` to start capture
2. Recording window appears (default 8 bars)
3. Material recorded to new clip in timeline
4. Clip appears in timeline deck (right panel)

### 5. Layer Management
Control individual layers:
1. Freeze interesting layers (`Cmd+F`)
2. Frozen layers stop generating
3. Edit frozen layers manually if desired
4. Unfreeze to resume generation

### 6. Arrange Captured Clips
Use timeline deck to:
- Drag captured clips to arrange
- Trim clip boundaries
- Duplicate best moments
- Export finished soundscape

## Keyboard Shortcuts

### Curation
- `Enter` - Accept current candidate
- `Backspace` - Reject current candidate
- `Cmd+R` - Capture live (record time window)

### Layer Controls
- `Cmd+F` - Freeze selected layer
- `Cmd+Shift+R` - Regenerate layer (with new seed)
- `M` - Mute/unmute layer
- `S` - Solo layer

### Mood Presets
- `1` - Drone mood
- `2` - Shimmer mood
- `3` - Granular mood
- `4` - Minimalist mood

### Playback
- `Space` - Play/pause (pauses generation too)
- `Escape` - Stop (continues generation in background)

### Global
- `Cmd+Z` - Undo (undo accept/freeze actions)
- `Cmd+Shift+Z` - Redo

## Continuous Generation Loop

### How It Works
```
┌──────────────────────────────────────┐
│  Generate Candidates                 │
│  ↓                                   │
│  Propose to User (play/visualize)    │
│  ↓                                   │
│  User Accepts/Rejects/Ignores       │
│  ↓                                   │
│  Accepted → SharedEventStore        │
│  Rejected → Discard                 │
│  Ignored → Auto-reject after 4 bars │
│  ↓                                   │
│  Generate Next Candidates           │
└──────────────────────────────────────┘
```

### Candidate Lifespan
- **Proposed:** Candidate plays for 4 bars
- **Pending:** Waits for user action (accept/reject)
- **Timeout:** Auto-rejects after 4 bars if no action
- **Accepted:** Moves to permanent storage
- **Rejected:** Discarded from memory

### Generation Timing
- New candidates proposed every 2-4 bars
- Overlapping candidates possible (multi-layer)
- User can accept multiple overlapping candidates
- Rejection stops candidate playback immediately

## Visual Feedback

### Density Meters
Each layer shows:
- **Current density:** Events per second
- **Target density:** From constraints
- **Trend:** Increasing/decreasing

### Generated Badges
Visual indicators on generated material:
- 🟣 **Candidate** - Purple, pending accept/reject
- 🟢 **Accepted** - Green, committed to store
- 🔵 **Frozen** - Blue, stopped generation
- ⚪ **Manual** - White, user-edited

### Layer State Icons
- ▶️ **Generating** - Actively creating new events
- ⏸️ **Paused** - Generation paused
- ❄️ **Frozen** - No generation, editable
- 🔇 **Muted** - Generating but not audible

### CPU/Memory Warnings
- 🟢 Green: Normal operation
- 🟡 Yellow: Approaching limits
- 🔴 Red: At capacity, throttling active

## Mood Preset Details

### Drone
**Characteristics:**
- Very slow harmonic movement
- Long sustained notes (4-16 bars)
- Low register (C2-C4)
- Minimal density (0.1-0.3 notes/sec)

**Use Cases:**
- Deep listening
- Meditation backgrounds
- Film score drones
- Harmonic foundations

### Shimmer
**Characteristics:**
- High register (C5-C7)
- Arpeggiated patterns
- Rapid note changes (2-4 notes/sec)
- Major/Lydian harmony

**Use Cases:**
- Bright textures
- Ambient pop overlays
- Ethereal backgrounds
- Reflective moments

### Granular
**Characteristics:**
- Very short durations (0.1-0.5 beats)
- High density (5-10 events/sec)
- Wide pitch range (C2-C7)
- Randomized timing

**Use Cases:**
- Textural layers
- Experimental soundscapes
- Glitch aesthetics
- Dense atmospheres

### Minimalist
**Characteristics:**
- Sparse events (0.5-1 note/sec)
- Repetitive patterns
- Limited pitch range (1 octave)
- Slow evolution

**Use Cases:**
- Clean ambient
- Repetitive music
- Focus backgrounds
- Minimalist composition

## Integration with Shared Stores

### Event Storage
- Accepted candidates written to `SharedEventStore`
- Each layer gets its own `EventStreamId`
- Frozen layers remain in store but stop receiving updates
- Manual edits to frozen layers preserved

### Clip Management
- Captured moments create entries in `ClipRegistry`
- Clips reference layer streams via StreamIds
- No duplication - clips share event streams
- Timeline deck shows all captured clips

### Undo Support
- Accept/reject actions undoable
- Freeze/unfreeze actions undoable
- Capture actions undoable (removes clip)
- Manual edits to frozen layers undoable

## Performance Considerations

### CPU Usage
Continuous generation is CPU-intensive:
- **Throttling:** Automatic when CPU > 80%
- **Layer limits:** Max 4 active layers
- **Event limits:** Max 10 events/sec total
- **Pause option:** Press `Space` to pause generation

### Memory Management
- **Candidate buffer:** Limited to 100 events
- **Timeout cleanup:** Auto-reject clears memory
- **Frozen layers:** Events moved to permanent storage
- **Manual cleanup:** Delete unused captured clips

### Optimization Tips
- Freeze layers you like (reduces active generation)
- Lower density settings
- Use fewer simultaneous layers
- Close other applications
- Increase audio buffer size if glitching

## Switching to Manual Boards

When you want detailed editing:

1. Freeze layers you want to keep
2. Press `Cmd+Shift+M` (if implemented) or switch boards manually
3. Choose Basic Tracker, Notation, or Piano Roll board
4. Frozen layer streams remain accessible
5. Edit manually as desired
6. Can switch back to Generative Ambient later

## Best Practices

### 1. Start with Presets
- Choose mood preset closest to target
- Listen for several bars before adjusting
- Make small constraint changes
- Observe evolution before committing

### 2. Curate Selectively
- Don't accept everything - be picky
- Look for "happy accidents"
- Accept only truly interesting material
- Build library of captured moments

### 3. Layer Management
- Start with 1-2 layers
- Add layers gradually
- Freeze successful layers
- Solo layers to evaluate individually

### 4. Constraint Exploration
- Change one constraint at a time
- Observe impact for 4-8 bars
- Reset to preset if lost
- Document successful settings

### 5. Capture Strategy
- Capture best moments as they occur
- Don't wait - they may not return
- Trim captured clips later
- Build arrangement from captures

## Troubleshooting

### Generation sounds random/chaotic
- Reduce randomness settings
- Set key/scale constraint
- Decrease density
- Try Minimalist or Drone preset

### Nothing interesting happening
- Increase evolution speed
- Raise density
- Add more layers
- Try Shimmer or Granular preset

### CPU usage too high
- Freeze some layers
- Reduce active layer count
- Lower density constraints
- Pause generation temporarily

### Can't capture moments
- Check capture duration setting
- Verify timeline deck is visible
- Ensure storage space available
- Try shorter capture duration

### Layers conflict harmonically
- Enable key constraint
- Use same scale for all layers
- Freeze conflicting layers
- Adjust layer registers

## Comparison with Other Boards

| Feature | Generative Ambient | AI Arranger | AI Composition |
|---------|-------------------|-------------|----------------|
| Generation | Continuous | On-demand | Prompt-based |
| Control | Constraints | Sections + Parts | Intent + Constraints |
| Workflow | Curate | Direct | Collaborate |
| Difficulty | Beginner | Advanced | Advanced |
| Best For | Exploration | Arrangement | Composition |

## Technical Details

### Generation Engine
Uses layered approach:
- Each layer independent generator instance
- Generators run on separate timers
- Candidates buffered in memory
- Accept/reject integrates with stores

### Constraint Application
Constraints filter/guide in real-time:
- **Key/scale** → Pitch filtering
- **Tempo** → Note duration scaling
- **Density** → Event frequency throttling
- **Randomness** → Probability distributions

### Memory Architecture
```
┌────────────────────────────────────┐
│  Candidate Buffer (temp)          │
│  ↓ (accept)                        │
│  SharedEventStore (permanent)     │
│  ↓ (reference)                     │
│  ClipRegistry (timeline)          │
└────────────────────────────────────┘
```

## Related Boards

- **AI Arranger** - Directed arrangement generation
- **AI Composition** - Prompt-based composition
- **Session + Generators** - On-demand generation
- **Manual Boards** - Edit frozen layers

## Future Enhancements

### Planned Features
- Machine learning evolution (learns from accepts/rejects)
- Multi-user curation (collaborative listening)
- Export as endless loop
- MIDI output for hardware synths

### Under Consideration
- Visual representation of constraints (2D parameter space)
- Rhythmic pattern learning
- Style transfer between layers
- Automatic mastering/mixing

## Philosophical Note

The Generative Ambient board embraces a different creative paradigm:

**Traditional Composition:**
- You have intent
- You create material
- You arrange and refine
- You finish

**Generative Curation:**
- System has autonomy
- System creates continuously
- You listen and select
- Never truly finished

This shift from creator to curator can be liberating - you're freed from the blank canvas and can focus on taste and selection. The system generates endlessly; you choose what survives.

Think of it like:
- **Photography** vs **Painting** - Capturing moments vs creating from scratch
- **DJing** vs **Composing** - Selecting and arranging vs creating
- **Gardening** vs **Building** - Cultivating growth vs direct construction

The Generative Ambient board is your garden - you plant seeds (constraints), tend the growth (adjust parameters), and harvest what blooms (accept moments).
