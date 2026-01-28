# Learn: Piano Roll
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Piano Roll panel, a visual MIDI editor with a piano keyboard on the left and a timeline grid for intuitive note editing with mouse and drawing tools.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Completed [Learn: Clip Editor](./learn-clip-editor.md)
- Basic understanding of piano keyboard layout

## Workflow 1: Visual Note Editing (3 minutes)

### Goal
Add, move, resize, and delete notes using the visual piano roll interface.

### Steps

1. **Open the Piano Roll panel**
   - Click the **Piano Roll** tab
   - Select a clip in Session
   - You see a piano keyboard on the left, grid on the right

2. **Understand the layout**
   - **Left**: Piano keyboard (C, C#, D, ... vertically)
   - **Right**: Timeline grid (horizontal = time, vertical = pitch)
   - **Colored rectangles**: Note events (`Event<Voice<P>>` with `payload` containing pitch/velocity — see cardplay2.md §2.0.1)
   - **Grid lines**: Beat/bar markers

3. **Add a note**
   - Click on the grid where you want a note
   - A note appears at that pitch and time
   - Default duration (e.g., 1/16 or 1/8)
   - ✅ Visual placement makes melody writing intuitive

4. **Move a note**
   - Click and drag a note
   - Move horizontally to change timing
   - Move vertically to change pitch
   - ✅ Notes snap to grid (if snap enabled)

5. **Resize a note**
   - Hover over the right edge of a note
   - Cursor changes to resize mode
   - Drag to make longer/shorter
   - ✅ Control note duration visually

6. **Delete a note**
   - Right-click a note
   - Select **Delete**
   - Or select and press Delete key
   - ✅ Quick removal

### Troubleshooting
- **Can't add notes?** Ensure clip is selected in Session
- **Notes don't snap?** Check snap setting
- **Piano keyboard not visible?** Zoom out vertically

### What You Learned
✓ Visual piano roll layout  
✓ How to add notes by clicking  
✓ How to move and resize notes  
✓ How to delete notes  

---

## Workflow 2: Zoom and Navigation (3 minutes)

### Goal
Control the view to see the right amount of detail for editing.

### Steps

1. **Adjust visible bars**
   - **Bars** dropdown: 1, 2, 4, 8 bars
   - More bars = more context, smaller notes
   - Fewer bars = zoomed in, larger notes
   - ✅ Match to your editing needs

2. **Adjust pitch range**
   - **Range** dropdown: C2..C4, C3..C5, C4..C6
   - Shows different octaves
   - Bass: C2..C4
   - Melody: C3..C5 or C4..C6
   - ✅ Focus on the relevant pitch range

3. **Use zoom controls**
   - **H-**: Zoom out horizontally (wider view)
   - **H+**: Zoom in horizontally (narrower view)
   - **V-**: Zoom out vertically (more pitches visible)
   - **V+**: Zoom in vertically (fewer pitches, larger keys)
   - **Reset**: Return to default zoom
   - ✅ Customize view for different tasks

4. **Adjust grid step**
   - **Step (ticks)** input: 24 = 1/16, 48 = 1/8, 12 = 1/32
   - Controls grid snap precision
   - Finer = more precision, coarser = faster editing
   - ✅ Standard is 24 (1/16 notes)

### What You Learned
✓ How to zoom in/out  
✓ How to adjust visible bars and pitch range  
✓ How to set grid step for snap precision  

---

## Workflow 3: Advanced Editing Operations (5 minutes)

### Goal
Use selection tools and batch operations for efficient editing.

### Steps

1. **Select multiple notes**
   - Click and drag to create a selection box
   - All notes inside are selected (highlighted)
   - Or Ctrl/Cmd+Click individual notes
   - ✅ Operate on many notes at once

2. **Transpose notes**
   - Select notes
   - Use **Transpose** operation
   - Shift all selected notes up/down in pitch
   - ✅ Quick key changes

3. **Scale velocity**
   - Select notes
   - Use **Scale velocity** operation
   - Multiply velocities by a factor
   - ✅ Make patterns louder/quieter

4. **Humanize notes**
   - Select notes
   - Use **Humanize** operation
   - Adds random timing/velocity variations
   - ✅ Makes robotic patterns more natural

5. **Nudge timing**
   - Select notes
   - Use **Nudge** operation
   - Shift timing slightly (swing, microtiming)
   - ✅ Fine-tune groove feel

6. **Strum chords**
   - Select chord notes (multiple notes at same time)
   - Use **Strum** operation
   - Notes are slightly offset (guitar-like)
   - ✅ Adds organic feel to chords

7. **Legato**
   - Select notes
   - Use **Legato** operation
   - Extends note durations to touch next note
   - ✅ Creates smooth, connected melody

8. **Mirror pitch**
   - Select notes
   - Use **Mirror pitch** operation
   - Inverts the melody around a center pitch
   - ✅ Creates variations

### Troubleshooting
- **Operations not available?** Ensure notes are selected first
- **Too much humanization?** Adjust parameters or undo
- **Strum sounds wrong?** Try smaller offset values

### What You Learned
✓ Multi-select for batch editing  
✓ Transpose, scale velocity, humanize  
✓ Nudge, strum, legato, mirror  

---

## Key Concepts

### Piano Roll
- Visual representation of notes on a piano keyboard
- Horizontal = time, vertical = pitch
- Standard in most DAWs (FL Studio, Ableton, Logic)

### Grid Snap
- Notes align to grid when adding/moving
- Step size controls precision (24 ticks = 1/16 note)
- Disable for microtiming adjustments

### Note Velocity
- How loud a note plays (0-127)
- Shown by color/brightness (brighter = louder)
- Edit by adjusting velocity lane (if available)

### Note Duration
- How long a note sounds (in ticks)
- Resize by dragging right edge of note
- Short = staccato, long = legato

### Zoom
- **Horizontal**: Time resolution (bars visible)
- **Vertical**: Pitch resolution (octaves visible)
- Balance between overview and detail

---

## Tips and Tricks

1. **Use Range dropdown**: Focus on relevant octaves (C3..C5 for melody)
2. **Grid step 24**: Standard for 1/16 note resolution
3. **Zoom in for detail**: H+ when editing individual notes
4. **Zoom out for overview**: H- to see full pattern
5. **Humanize subtly**: Small variations sound natural, large ones sound sloppy
6. **Strum for realism**: Apply to chords for guitar/harp feel
7. **Legato for smooth melodies**: No gaps between notes
8. **Mirror for variations**: Create inversions of melodies

---

## Common Workflows

### Creating a Melody
1. Set bars to 4, range to C4..C6
2. Set step to 24 (1/16 notes)
3. Click to add notes in a scale pattern
4. Resize notes for phrasing (short/long)
5. Humanize timing slightly for natural feel

### Creating Chords
1. Click to add 3-4 notes vertically aligned (same time)
2. Use Strum to offset slightly
3. Adjust velocities for balance
4. Copy/paste to create progression

### Editing Velocity Dynamics
1. Select all notes
2. Use Scale velocity to adjust overall loudness
3. Or manually adjust individual note colors/brightness
4. Add accents on strong beats

---

## Next Steps

- [Learn: Tracker](./learn-tracker.md) - Row-based alternative
- [Learn: Clip Editor](./learn-clip-editor.md) - Grid-based editing
- [Learn: Arrangement](./learn-arrangement.md) - Timeline view

---

## Reference

### Piano Roll Controls

| Control | Description |
|---------|-------------|
| Bars | Visible timeline (1/2/4/8 bars) |
| Step (ticks) | Grid snap precision (12/24/48) |
| Dur (ticks) | Default note duration |
| Range | Visible pitch range (octaves) |
| H-/H+ | Horizontal zoom |
| V-/V+ | Vertical zoom |
| Reset | Reset zoom to default |

### Multi-Select Operations

- **Transpose**: Shift pitch up/down
- **Scale velocity**: Multiply velocities
- **Humanize**: Add timing/velocity variations
- **Nudge**: Shift timing slightly
- **Strum**: Offset chord notes
- **Legato**: Extend durations to touch
- **Mirror pitch**: Invert melody

### Grid Step Reference

| Ticks | Musical Division | Use Case |
|-------|-----------------|----------|
| 6 | 1/64 note | Very fine detail |
| 12 | 1/32 note | Fine detail |
| 24 | 1/16 note | Standard (recommended) |
| 48 | 1/8 note | Coarse, fast editing |
| 96 | 1/4 note | Very coarse |

---

## Troubleshooting

**Q: Notes are too small to see**  
A: Zoom in with H+ and V+, or reduce Bars value

**Q: Can't resize notes**  
A: Hover over the right edge until cursor changes to resize mode

**Q: Notes don't snap to grid**  
A: Check that snap is enabled and step size is reasonable (24 is standard)

**Q: How do I change note velocity?**  
A: Use Scale velocity operation or adjust velocity lane (if available)

**Q: Piano Roll vs. Tracker?**  
A: Piano Roll = visual, mouse-friendly. Tracker = compact, keyboard-driven.

**Q: Can I draw multiple notes at once?**  
A: Hold Ctrl/Cmd while dragging to draw a sequence of notes (pencil tool)
