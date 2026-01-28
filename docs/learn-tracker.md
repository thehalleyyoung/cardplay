# Learn: Tracker
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Tracker panel, a Renoise-style row-based editor for fast, precise note editing with compact vertical scrolling and hex notation.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Completed [Learn: Clip Editor](./learn-clip-editor.md)
- Understanding of musical timing (beats, bars, subdivisions)

## Workflow 1: Understanding the Tracker Layout (3 minutes)

### Goal
Learn the tracker's row-based structure and how to navigate.

### Steps

1. **Open the Tracker panel**
   - Click the **Tracker** tab
   - Select a clip in Session
   - You see a vertical scrolling view with rows

2. **Understand the column layout**
   - **Row number**: Time position (in grid units)
   - **NOTE**: Pitch in musical notation (C-4, D#5, etc.)
   - **VEL**: Velocity in hex (00-7F = 0-127) — stored in event `payload.velocity`
   - **DUR**: Duration in hex (ticks) — stored in event `duration`
   - Each row represents one grid step (e.g., 1/16 note)
   - Note: Events use the `Event<Voice<P>>` type with `payload` (see cardplay2.md §2.0.1)

3. **Understand grid resolution**
   - **Grid** dropdown: 1/8, 1/16, 1/32, 1/64
   - 1/16 = each row is a sixteenth note (standard)
   - 1/32 = each row is a thirty-second note (finer)
   - ✅ Higher resolution = more rows, finer control

4. **Navigate rows**
   - Scroll vertically to move through time
   - Enable **Follow** to auto-scroll with playhead
   - ✅ Tracker is optimized for keyboard-driven editing

### Troubleshooting
- **Too many rows?** Increase grid size (1/8 instead of 1/32)
- **Can't see all rows?** Use **Rows** dropdown to show more (32/64/128)
- **Follow mode not working?** Check that Follow checkbox is enabled

### What You Learned
✓ Tracker uses rows for time  
✓ Columns show NOTE, VEL, DUR  
✓ Grid resolution controls row density  
✓ Follow mode auto-scrolls with playhead  

---

## Workflow 2: Adding and Editing Notes (4 minutes)

### Goal
Add, edit, and delete notes using tracker keyboard input.

### Steps

1. **Add a note**
   - Click on a row in the **NOTE** column
   - Type a note name: `C4`, `D#5`, `A3`, etc.
   - The note appears with default velocity and duration
   - ✅ Fast keyboard-driven entry

2. **Edit velocity**
   - Click the **VEL** column for a note
   - Type a hex value: `7F` (loud), `40` (medium), `20` (quiet)
   - Hex range: 00-7F (0-127 in decimal)
   - ✅ Precise velocity control

3. **Edit duration**
   - Click the **DUR** column for a note
   - Type a hex value: `018` (24 ticks = 1/16), `030` (48 ticks = 1/8)
   - ✅ Control note length precisely

4. **Delete a note**
   - Click the NOTE cell
   - Press **Delete** or **Backspace**
   - The note is removed
   - ✅ Fast deletion

5. **Use right-click for accents**
   - Right-click a NOTE cell
   - Select **Accent** to increase velocity
   - Or use other context menu operations
   - ✅ Quick adjustments

### Troubleshooting
- **Can't type notes?** Click the NOTE cell first to focus it
- **Hex confusing?** 7F = 127 (max), 40 = 64 (mid), 00 = 0 (silent)
- **Notes don't play?** Check clip length and transport position

### What You Learned
✓ How to add notes with keyboard  
✓ Hex notation for velocity and duration  
✓ How to edit and delete notes  
✓ Right-click for quick operations  

---

## Workflow 3: Advanced Tracker Techniques (5 minutes)

### Goal
Use tracker-specific features like snap, swing preview, zoom, and multi-select operations.

### Steps

1. **Enable snap to grid**
   - Check the **Snap** checkbox
   - Notes align to grid when edited
   - Disable for microtiming adjustments
   - ✅ Keeps timing precise

2. **Show swing preview**
   - Check the **Swing** checkbox
   - Visual indicators show groove timing
   - Helps visualize swing feel
   - ✅ Useful when using groove in Mixer

3. **Zoom controls**
   - **H-**: Zoom out horizontally (more rows visible)
   - **H+**: Zoom in horizontally (fewer rows, more detail)
   - **Reset**: Return to default zoom
   - ✅ Adjust for editing vs. overview

4. **Adjust visible rows**
   - **Rows** dropdown: 32, 64, 128
   - More rows = more context, more scrolling
   - Fewer rows = less scrolling, less context
   - ✅ Balance visibility vs. performance

5. **Join selected notes**
   - Select multiple rows (Ctrl/Cmd+Click)
   - Use **Join** operation (if available)
   - Notes merge into longer notes
   - ✅ Create legato passages

6. **Scale duration**
   - Select notes
   - Use **Scale duration** operation
   - Multiply/divide note lengths
   - ✅ Quick timing adjustments

7. **Apply gate**
   - Select notes
   - Use **Gate** operation
   - Shorten notes for staccato feel
   - ✅ Tighten drum patterns

### Troubleshooting
- **Zoom too extreme?** Use Reset button
- **Swing not visible?** Check that groove is enabled in Mixer
- **Operations not working?** Ensure notes are selected first

### What You Learned
✓ Snap and swing visualization  
✓ Zoom controls for different views  
✓ Multi-select operations (join, scale, gate)  

---

## Key Concepts

### Row
- One time step in the tracker (e.g., 1/16 note)
- Row number = position in ticks (grid × row index)

### Grid Resolution
- 1/8 = 48 ticks per row (coarse)
- 1/16 = 24 ticks per row (standard)
- 1/32 = 12 ticks per row (fine)
- 1/64 = 6 ticks per row (very fine)

### Hex Notation
- Compact format for numbers
- **VEL**: 00-7F (0-127 decimal)
- **DUR**: 000-FFF (0-4095 ticks)
- Example: 7F = 127, 40 = 64, 10 = 16

### Follow Mode
- Auto-scroll to keep playhead visible
- Essential for live recording/editing
- Disable for static editing

### Snap
- Align notes to grid when editing
- Prevents off-grid timing errors
- Disable for intentional microtiming

---

## Tips and Tricks

1. **Use 1/16 grid** for most patterns (standard resolution)
2. **Follow mode + Play**: Watch your pattern scroll by
3. **Hex velocity**: 7F = loud, 60 = medium, 40 = quiet, 20 = soft
4. **Hex duration**: 018 = 1/16, 030 = 1/8, 060 = 1/4
5. **Right-click for accents**: Quick way to emphasize beats
6. **Zoom for detail**: H+ when editing individual notes
7. **Rows = 64**: Good balance for most editing
8. **Disable snap for groove**: Add manual swing by offsetting rows

---

## Common Workflows

### Tracker-Style Drum Programming
1. Set grid to 1/16
2. Set rows to 64
3. Enable Follow
4. Add kick on rows 0, 24, 48, 72 (on-beats)
5. Add snare on rows 12, 36, 60, 84 (off-beats)
6. Add hi-hats every 12 rows (1/16 notes)
7. Adjust velocities for groove

### Rapid Melody Entry
1. Set grid to 1/8 or 1/16
2. Disable Follow (static view)
3. Click NOTE column, type: C4, E4, G4, C5, etc.
4. Quickly tab to VEL, type: 60, 65, 70, 75, etc.
5. Tab to DUR, type: 030, 030, 060, 060, etc.

### Microtiming Adjustments
1. Disable Snap
2. Zoom in (H+)
3. Manually adjust row positions
4. Create swing by offsetting hi-hats slightly
5. Use swing preview to visualize

---

## Next Steps

- [Learn: Piano Roll](./learn-piano-roll.md) - Visual alternative to tracker
- [Learn: Clip Editor](./learn-clip-editor.md) - Grid-based editing
- [Learn: Arrangement](./learn-arrangement.md) - Timeline view

---

## Reference

### Tracker Controls

| Control | Description |
|---------|-------------|
| Grid | Row resolution (1/8, 1/16, 1/32, 1/64) |
| Rows | Visible rows (32, 64, 128) |
| Follow | Auto-scroll with playhead |
| H-/H+ | Horizontal zoom |
| Snap | Align to grid |
| Swing | Show groove preview |
| Keys | Keyboard shortcuts help |

### Column Format

| Column | Format | Description |
|--------|--------|-------------|
| Row # | Decimal | Time position (row index) |
| NOTE | C-4, D#5 | Pitch in musical notation |
| VEL | 00-7F hex | Velocity (0-127) |
| DUR | 000-FFF hex | Duration in ticks |

### Hex Conversion Reference

| Decimal | Hex | Meaning |
|---------|-----|---------|
| 0 | 00 | Silent/zero |
| 64 | 40 | Medium velocity |
| 96 | 60 | Loud |
| 127 | 7F | Maximum |
| 24 | 18 | 1/16 note (at ppq=96) |
| 48 | 30 | 1/8 note |
| 96 | 60 | 1/4 note |

---

## Troubleshooting

**Q: I don't understand hex notation**  
A: 00-7F is 0-127. Common values: 20=soft, 40=medium, 60=loud, 7F=max

**Q: Tracker too fast/slow to navigate**  
A: Adjust Rows (32 for speed, 128 for detail) and use Follow mode

**Q: Notes appear in wrong rows**  
A: Check grid resolution—1/16 is standard, 1/32 is finer

**Q: Can't see playhead**  
A: Enable Follow checkbox to auto-scroll

**Q: How do I copy/paste patterns?**  
A: Use multi-select, then copy/paste operations (Ctrl/Cmd+C/V)

**Q: Tracker vs. Piano Roll?**  
A: Tracker = compact, fast keyboard entry. Piano Roll = visual, mouse-friendly.
