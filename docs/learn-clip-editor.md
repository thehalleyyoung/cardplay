# Learn: Clip Editor
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Clip Editor panel, where you edit note events in clips using a grid-based interface. This is the primary view for adjusting timing, pitch, velocity, and duration of individual notes.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Completed [Learn: Session](./learn-session.md)
- At least one clip with notes created

## Workflow 1: Basic Note Editing (3 minutes)

### Goal
Add, move, and delete notes in a clip using the Clip Editor grid.

### Steps

1. **Open the Clip Editor panel**
   - Click the **Clip Editor** tab
   - Select a clip in the Session (click a slot)
   - The clip's notes appear in the grid

2. **Understand the grid**
   - **Horizontal axis**: Time (bars, beats, subdivisions)
   - **Vertical axis**: Pitch (MIDI note numbers)
   - **Colored rectangles**: Note events (`Event<Voice<P>>` with payload containing pitch, velocity, etc. — see cardplay2.md §2.0.1)
   - **Grid lines**: Beat/subdivision markers

3. **Add a note**
   - Click an empty space in the grid
   - A note appears with default duration
   - ✅ The note will play at that time and pitch

4. **Move a note**
   - Click and drag a note to a new position
   - Horizontal: Changes timing (when it plays)
   - Vertical: Changes pitch (which note)
   - ✅ Notes snap to grid if snap is enabled

5. **Delete a note**
   - Right-click a note and select **Delete**
   - Or select the note and press **Delete** key
   - ✅ The note is removed from the clip

### Troubleshooting
- **Can't add notes?** Ensure a clip is selected in Session
- **Notes don't snap?** Check that snap is enabled
- **Grid too zoomed?** Adjust view bars or grid resolution

### What You Learned
✓ How to add notes to clips  
✓ How to move notes (time and pitch)  
✓ How to delete notes  

---

## Workflow 2: Adjusting Clip Length and Grid (3 minutes)

### Goal
Control the clip's loop length and grid resolution for precision editing.

### Steps

1. **Set clip length**
   - In the **Clip Length** dropdown, choose: 1, 2, 4, 8, or 16 bars
   - The clip loops at this length
   - Longer length = more musical space
   - ✅ Notes beyond clip length won't play

2. **Choose grid resolution**
   - In the **Grid** dropdown, choose: 1/8, 1/16, 1/32
   - 1/16 = sixteenth note grid (common default)
   - 1/32 = thirty-second note grid (finer detail)
   - 1/8 = eighth note grid (coarser, faster editing)
   - ✅ Grid affects snap and note placement precision

3. **Adjust view bars**
   - In the **View Bars** dropdown, choose: 1, 2, 4 bars
   - Controls how much timeline is visible
   - More bars = more context, less detail
   - Fewer bars = zoomed in, more detail
   - ✅ Zoom to fit your editing needs

4. **Set pitch range**
   - In the **Range** dropdown, choose pitch ranges
   - Example: C3..D#4 (for bass), C4..D#5 (for melody)
   - ✅ Shows the relevant octave for your instrument

### What You Learned
✓ How to set clip loop length  
✓ How to adjust grid resolution  
✓ How to zoom the view  
✓ How to set visible pitch range  

---

## Workflow 3: Multi-Select Operations (4 minutes)

### Goal
Edit multiple notes at once using selection and batch operations.

### Steps

1. **Select multiple notes**
   - Click and drag to create a selection box
   - All notes in the box are selected (highlighted)
   - Or Ctrl/Cmd+Click individual notes
   - ✅ You can now operate on all selected notes

2. **Split notes at cursor**
   - Select notes
   - Click **Split at cursor** button
   - Notes are divided at the playhead position
   - ✅ Useful for creating variations

3. **Randomize timing**
   - Select notes
   - Click **Randomize timing**
   - Notes drift slightly from the grid (humanization)
   - ✅ Adds natural feel

4. **Apply accent**
   - Select notes
   - Click **Apply accent**
   - Velocity increases for selected notes (louder)
   - ✅ Emphasizes certain beats

5. **Adjust note duration**
   - Select notes
   - Use **Dur (ticks)** input to set default duration
   - Or drag note ends to adjust individually
   - ✅ Controls note length (staccato vs. legato)

### What You Learned
✓ How to select multiple notes  
✓ Batch operations (split, randomize, accent)  
✓ How to adjust note duration  

---

## Key Concepts

### Grid Resolution
- Snap precision for note placement
- 1/16 = sixteenth notes (common default)
- 1/32 = finer detail
- 1/8 = coarser, faster editing

### Clip Length
- Loop length in bars
- Notes beyond this point don't play
- Set based on musical phrase length

### Pitch Range
- Visible MIDI note range
- C3..D#4 for bass/drums
- C4..D#5 for melody/chords

### Note Duration
- How long a note sounds (in ticks)
- Short = staccato (percussive)
- Long = legato (smooth)

### Snap
- Aligns notes to grid when moving/adding
- Disable for microtiming adjustments

---

## Common Workflows

### Creating a Bassline
1. Set clip length to 1 or 2 bars
2. Set grid to 1/16
3. Set range to C2..C4
4. Add notes on-beat (kick positions)
5. Adjust durations for groove

### Creating a Melody
1. Set clip length to 4 bars
2. Set grid to 1/16 or 1/8
3. Set range to C4..C5
4. Add notes in a scale pattern
5. Use multi-select to humanize timing

### Creating Drum Patterns
1. Set clip length to 1 bar
2. Set grid to 1/16
3. Add kick (C2) on beats 1 and 3
4. Add snare (D2) on beats 2 and 4
5. Add hi-hats (F#2) on every 1/16

---

## Tips and Tricks

1. **Use 1/16 grid** for most patterns (standard EDM/hip-hop)
2. **Zoom in for detail**: Use View Bars = 1 for precise editing
3. **Humanize with randomize**: Select all notes, randomize timing slightly
4. **Accent on-beats**: Select every 4th note, apply accent
5. **Stretch notes**: Drag note ends for legato feel
6. **Copy/paste patterns**: Select all, copy, paste at different position
7. **Variation slots**: Use Variation dropdown (A/B/C/D) for pattern versions

---

## Next Steps

- [Learn: Tracker](./learn-tracker.md) - Row-based editing alternative
- [Learn: Piano Roll](./learn-piano-roll.md) - Visual piano-roll editor
- [Learn: Pads](./learn-pads.md) - Record notes live with pads

---

## Reference

### Clip Editor Controls

| Control | Description |
|---------|-------------|
| Clip Length | Loop length (1/2/4/8/16 bars) |
| Variation | Pattern slot (A/B/C/D) |
| Stretch notes | Adjust existing notes when changing length |
| View Bars | Visible timeline (1/2/4 bars) |
| Grid | Snap resolution (1/8, 1/16, 1/32) |
| Range | Visible pitch range |

### Multi-Select Operations

- Split at cursor
- Randomize timing
- Apply accent
- Transpose (shift pitch)
- Scale duration

---

## Troubleshooting

**Q: Notes don't play**  
A: Check that clip length covers the notes, and transport is playing

**Q: Can't select notes**  
A: Ensure clip is selected in Session first

**Q: Grid too fine/coarse**  
A: Adjust Grid dropdown (1/16 is standard)

**Q: Notes disappear after edit**  
A: Check clip length—notes beyond loop point are hidden

**Q: How do I copy notes?**  
A: Select notes, Ctrl/Cmd+C to copy, Ctrl/Cmd+V to paste
