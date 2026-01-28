# Learn: Arrangement
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Arrangement panel, which shows a timeline view of your Session's active clips across tracks, giving you a linear perspective on your music's structure.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Completed [Learn: Session](./learn-session.md)
- Understanding of tracks, clips, and scenes

## Workflow 1: Viewing the Timeline (3 minutes)

### Goal
Understand the Arrangement view and how it represents your Session.

### Steps

1. **Open the Arrangement panel**
   - Click the **Arrangement** tab
   - You see a timeline with horizontal lanes

2. **Understand the layout**
   - **Horizontal axis**: Time (bars and beats)
   - **Vertical lanes**: One per Session track
   - **Colored blocks**: Active clips on each track
   - **Vertical line**: Playhead position

3. **Identify track lanes**
   - Each lane corresponds to a Session track (mixer channel)
   - Lane labels show track IDs
   - Colored blocks indicate when a clip (`Container<"clip">` — see cardplay2.md §2.0.1) is playing
   - ✅ You see the linear structure of your music

4. **Follow playhead**
   - Enable **Follow** checkbox
   - The view auto-scrolls to keep playhead visible
   - ✅ Useful for watching playback

### Troubleshooting
- **Empty view?** Launch some clips in Session first
- **Playhead not moving?** Press Play in transport
- **Follow not working?** Check Follow checkbox

### What You Learned
✓ Arrangement shows timeline of active clips  
✓ Each lane = one Session track  
✓ Playhead shows current position  
✓ Follow mode auto-scrolls  

---

## Workflow 2: Zoom and Navigation (3 minutes)

### Goal
Adjust the view to see the right time range and detail level.

### Steps

1. **Adjust window size**
   - **Window (bars)** dropdown: 4, 8, 16, 32 bars
   - Larger window = more context, smaller blocks
   - Smaller window = zoomed in, more detail
   - ✅ 8-16 bars is typical for song structure

2. **Use zoom controls**
   - **H-**: Zoom out horizontally (wider view)
   - **H+**: Zoom in horizontally (narrower view)
   - **V-**: Zoom out vertically (scale time up)
   - **V+**: Zoom in vertically (scale time down)
   - **Reset**: Return to default zoom
   - ✅ Customize for editing vs. overview

3. **Scroll through timeline**
   - If window is smaller than project length, scroll horizontally
   - Or use Follow mode to stay anchored on playhead
   - ✅ Navigate long arrangements

### What You Learned
✓ How to adjust window size  
✓ Zoom controls for timeline  
✓ How to navigate long projects  

---

## Workflow 3: Note Operations on Clips (4 minutes)

### Goal
Apply batch note operations to clips directly from Arrangement view.

### Steps

1. **Select a clip**
   - Click a colored block in a lane
   - The clip is selected (highlighted)
   - ✅ You can now operate on its notes

2. **Randomize velocity**
   - Click **"Randomize Velocity"** button
   - All notes in the clip get varied velocities
   - Adds humanization and dynamics
   - ✅ Instant variation

3. **Invert scale**
   - Click **"Invert Scale"** button
   - Melody inverts around a center pitch
   - Creates melodic variations
   - ✅ Quick composition tool

4. **Chordify**
   - Click **"Chordify"** button
   - Single notes become chords (stacked thirds)
   - Transforms melody into harmony
   - ✅ Instant chord voicings

### Troubleshooting
- **Operations don't work?** Ensure a clip is selected first
- **Changes too extreme?** Undo and try again with different parameters
- **Which clip is selected?** Look for highlight border

### What You Learned
✓ How to select clips in Arrangement  
✓ Randomize velocity for dynamics  
✓ Invert scale for variations  
✓ Chordify for instant harmony  

---

## Key Concepts

### Arrangement View
- Linear timeline of music structure
- Shows when clips are active on each track
- Complements Session's clip launcher grid

### Track Lane
- One horizontal lane per Session track
- Shows colored blocks for active clips
- Helps visualize track activity over time

### Follow Mode
- Auto-scroll to keep playhead visible
- Essential for long arrangements
- Disable for static editing

### Playhead
- Vertical line showing current playback position
- Moves left-to-right as music plays
- Position shown in bars:beats:ticks

### Note Operations
- Batch transformations on clip notes
- Applied directly from Arrangement view
- Fast way to create variations

---

## Tips and Tricks

1. **Window = 8 bars**: Good starting point for most arrangements
2. **Follow mode + Play**: Watch your song structure unfold
3. **Randomize velocity**: Humanize mechanical patterns
4. **Invert scale**: Create B sections from A sections
5. **Chordify melodies**: Turn lead lines into pads/chords
6. **Zoom out for overview**: See full song structure (intro/verse/chorus/outro)
7. **Zoom in for detail**: Focus on specific sections

---

## Common Workflows

### Viewing Song Structure
1. Launch multiple scenes in Session
2. Open Arrangement
3. Set window to 16-32 bars
4. Press Play
5. Watch colored blocks appear as clips launch
6. ✅ See verse, chorus, bridge structure

### Creating Variations
1. Select a clip block in Arrangement
2. Click "Randomize Velocity" for dynamics
3. Click "Invert Scale" for melodic variation
4. Compare with original in Session

### Planning a Song
1. Use Arrangement to visualize clip activity
2. Identify gaps or imbalances (missing instruments)
3. Return to Session to add clips
4. Check Arrangement again for balance

---

## Next Steps

- [Learn: Session](./learn-session.md) - Back to clip launcher
- [Learn: Mixer](./learn-mixer.md) - Balance track levels
- [Learn: Clip Editor](./learn-clip-editor.md) - Edit clip notes

---

## Reference

### Arrangement Controls

| Control | Description |
|---------|-------------|
| Follow | Auto-scroll with playhead |
| Window (bars) | Visible time range (4/8/16/32) |
| H-/H+ | Horizontal zoom |
| V-/V+ | Vertical zoom |
| Reset | Reset zoom to default |
| Snap | Align edits to grid |
| Swing | Show groove preview |

### Note Operations

- **Randomize Velocity**: Add humanizing velocity variations
- **Invert Scale**: Invert melody within a scale
- **Chordify**: Stack thirds to create chords

---

## Troubleshooting

**Q: Arrangement is empty**  
A: Launch clips in Session first. Arrangement shows active clip activity.

**Q: Blocks don't match my Session structure**  
A: Arrangement is best-effort—it approximates clip launch times based on current state.

**Q: How do I edit notes in Arrangement?**  
A: Select clip, use operations, or switch to Clip Editor/Tracker/Piano Roll for detailed editing.

**Q: Can I arrange clips directly here?**  
A: Not yet. Use Session for launching, Arrangement for overview.

**Q: Why are some tracks missing?**  
A: Tracks without active clips won't show blocks. Launch more clips in Session.
