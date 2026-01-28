# Learn: Session
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Session view, which is the heart of clip-based performance and composition in Cardplay. Learn how to launch clips, trigger scenes, and work with the Session grid.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Basic understanding of tracks and clips

## Workflow 1: Understanding the Session Grid (3 minutes)

### Goal
Learn the basic structure of the Session view and how clips, tracks, and scenes relate.

### Steps

1. **Open the Session panel**
   - Click the **Session** tab in the main interface
   - You'll see a grid layout with:
     - **Columns** = Tracks (vertical lanes for different instruments/sounds)
     - **Rows** = Scenes (horizontal groupings that launch together)
     - **Cells** = Slots that can contain clips (the actual musical patterns)

2. **Understand the layout**
   - Each **track** represents one instrument or sound source
   - Each **scene** is a horizontal row that can trigger multiple clips at once
   - Empty slots show as gray/empty, filled slots show colored rectangles
   - Track names appear at the top of each column
   - Scene launch buttons appear on the right side of each row

3. **Create your first track**
   - Click the **"+ Track"** button in the top toolbar
   - A new column appears in the grid
   - The track is automatically assigned an ID (e.g., "track-1")
   - ✅ You now have a place to add clips

4. **Create your first scene**
   - Click the **"+ Scene"** button in the top toolbar
   - A new row appears in the grid
   - The scene gets an ID (e.g., "scene-1")
   - ✅ You now have a horizontal launcher for multiple clips

### Troubleshooting
- **Grid too small?** Add more tracks and scenes—the grid adapts dynamically
- **Can't see all tracks?** Scroll horizontally within the panel
- **Want to delete?** Right-click track/scene headers (or use delete buttons if available)

### What You Learned
✓ Session grid structure (tracks × scenes)  
✓ How to create tracks and scenes  
✓ Where clips live (in the grid slots)  

---

## Workflow 2: Creating and Launching Clips (4 minutes)

### Goal
Add clips to the Session grid and launch them to hear sound.

### Steps

1. **Select a slot to add a clip**
   - Click an empty slot in the Session grid
   - The slot becomes selected (highlighted border)
   - The clip is created automatically and selected
   - ✅ A container is created for this clip (shown in Session Inspector)

2. **Add notes to your clip**
   - With the clip selected, open the **Clip Editor** panel
   - Use the grid to add notes (note events are `Event<Voice<MIDIPitch>>` with payload containing pitch, velocity — see cardplay2.md §2.0.1):
     - Click on the piano roll or tracker grid
     - Set pitch (vertical) and timing (horizontal)
     - Adjust velocity and duration as needed
   - Or use the **Pads** panel to record notes live

3. **Set clip length**
   - In the Clip Editor, use the **"Clip Length"** dropdown
   - Common lengths: 1 bar, 2 bars, 4 bars, 8 bars
   - The clip will loop at this length when playing
   - ✅ Your clip is now a repeating musical pattern

4. **Launch a single clip**
   - Go back to the Session panel
   - Click directly on the **clip slot** (colored rectangle)
   - The clip arms for launch (highlighted or flashing)
   - ✅ On the next quantized boundary, the clip starts playing

5. **Launch an entire scene**
   - Click the **"Launch"** button on the right side of a scene row
   - All clips in that scene arm for launch
   - Press **Space** or the Play button to hear them
   - 🎵 Multiple clips play together (drums, bass, melody, etc.)

### Troubleshooting
- **No sound?** Check that the audio engine is running (Audio panel)
- **Clips launch immediately?** Check **Launch Quantize** setting (bar/beat/off)
- **Wrong notes?** Edit in Clip Editor or Tracker panel
- **Clip too short/long?** Adjust length in Clip Editor

### What You Learned
✓ How to create clips in Session slots  
✓ How to launch individual clips  
✓ How to launch entire scenes  
✓ How clips loop at their set length  

---

## Workflow 3: Launch Quantization and Song Mode (5 minutes)

### Goal
Control when clips launch and automate scene progression for full song playback.

### Steps

1. **Set launch quantize**
   - In the Session panel header, find the **"Launch Quantize"** dropdown
   - Options:
     - **off**: Clips launch immediately when clicked
     - **beat**: Clips launch on the next beat (quarter note)
     - **bar**: Clips launch on the next bar (4 beats) - **recommended default**
     - **96/48/24/12**: Launch on specific tick subdivisions (advanced)
   - Try **bar** for tight, musical launches

2. **Test launch timing**
   - Press **Play** to start the transport
   - With transport running, click a clip or scene launch button
   - Notice the clip waits until the next bar to start (if quantize = bar)
   - This keeps your music in time and prevents rhythmic clashes

3. **Enable "Seek on launch"**
   - Check the **"Seek on launch"** checkbox
   - When enabled: launching jumps the transport to position 0
   - When disabled: launching continues from current position
   - Use this to restart from the beginning vs. smooth transitions

4. **Enable Song Mode**
   - Check the **"Song mode"** checkbox
   - Set **Bars** to how long each scene should play (e.g., 8)
   - Set **End** behavior:
     - **next scene**: Auto-advance to the next scene
     - **stop all**: Stop playback after the scene ends
   - ✅ Scenes now advance automatically

5. **Play your arrangement**
   - Launch Scene 1
   - Press Play
   - After 8 bars (or your chosen length), Scene 2 launches automatically
   - This continues through all scenes in order
   - 🎵 You've created a linear song structure

### Troubleshooting
- **Scenes change too fast?** Increase the Bars value in Song Mode
- **Song mode not working?** Ensure the checkbox is enabled
- **Want manual control?** Disable Song Mode and launch scenes manually

### What You Learned
✓ Launch quantization keeps clips in time  
✓ Seek on launch controls playback position  
✓ Song Mode automates scene progression  
✓ How to create linear arrangements with scenes  

---

## Key Concepts

### Tracks
- Vertical columns in the Session grid
- Each track represents one instrument or sound source
- Tracks can have audio settings (gain, pan, waveform) in the Mixer panel
- Add tracks with the **"+ Track"** button

### Scenes
- Horizontal rows in the Session grid
- Launching a scene triggers all clips in that row
- Scenes are the primary way to compose song sections (verse, chorus, etc.)
- Add scenes with the **"+ Scene"** button

### Clips
- Musical patterns that live in Session slots (track × scene intersections)
- Clips contain events (notes, automation, etc.)
- Clips loop at their set length
- Edit clips in Clip Editor, Tracker, or Piano Roll

### Launch Quantize
- Controls when armed clips actually start playing
- **bar** (default): Waits for the next bar boundary
- **off**: Starts immediately (can cause timing issues)
- **beat**: Waits for the next quarter note

### Song Mode
- Automates scene progression for linear playback
- Specify how many bars each scene plays before advancing
- Choose to stop or continue to the next scene at the end

---

## Tips and Tricks

1. **Quick scene launch**: Press **1**, **2**, **3**, etc. on your keyboard to launch scenes
2. **Metronome**: Enable in Session settings to hear the beat while composing
3. **Cancel pending launches**: Click the **"Cancel"** button to abort armed launches
4. **Sampler tracks**: Use **"🎹 + Sampler Track"** to create instrument tracks with sample banks
5. **Session Inspector**: Open to see detailed info about the selected clip's container
6. **Follow actions**: In Song Mode, experiment with different Bars values for verse/chorus structures

---

## Common Workflows

### Building a Loop-Based Track
1. Create 4 tracks (drums, bass, melody, FX)
2. Create 1 scene
3. Add clips to each track in Scene 1
4. Edit clips in Clip Editor with different patterns
5. Launch Scene 1 and loop indefinitely

### Building a Song Arrangement
1. Create multiple scenes (Intro, Verse, Chorus, Bridge, Outro)
2. Add clips to each scene (some tracks can be empty)
3. Enable Song Mode with 8 bars per scene
4. Launch Scene 1 and let Song Mode advance automatically

### Live Performance Setup
1. Create multiple scenes with variations (A, B, C sections)
2. Set Launch Quantize to **bar**
3. Disable Song Mode for manual control
4. Launch scenes live by clicking or using keyboard shortcuts
5. Use **Cancel** to abort unwanted launches

---

## Next Steps

- [Learn: Mixer](./learn-mixer.md) - Control track levels, effects, and routing
- [Learn: Clip Editor](./learn-clip-editor.md) - Edit notes and events in clips
- [Learn: Tracker](./learn-tracker.md) - Fast, row-based editing with Renoise-style workflow
- [Learn: Pads](./learn-pads.md) - Trigger sounds and record clips with pad interface

---

## Reference

### Session Panel Controls

| Control | Description |
|---------|-------------|
| Launch Quantize | When clips start (off/beat/bar/subdivisions) |
| Seek on launch | Jump to position 0 when launching |
| Song mode | Auto-advance scenes after N bars |
| Metronome | Audible click track for timing |
| + Track | Add a new track column |
| 🎹 + Sampler Track | Add an instrument track with sample bank |
| + Scene | Add a new scene row |
| Cancel | Abort pending clip launches |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause transport |
| 1, 2, 3... | Launch Scene 1, 2, 3... |
| Ctrl/Cmd+Click | Select multiple slots |
| Delete | Clear selected clip |

---

## Troubleshooting

**Q: My clips don't play any sound**  
A: Ensure (1) audio engine is running, (2) track has audio settings in Mixer, (3) clip has note events, (4) transport is playing

**Q: Clips launch at the wrong time**  
A: Check Launch Quantize setting—try "bar" for musical timing

**Q: Scene launches but no clips play**  
A: Ensure clips exist in that scene's row (not empty slots)

**Q: Song Mode doesn't advance scenes**  
A: Check that Song Mode checkbox is enabled and Bars value is set

**Q: How do I delete a track or scene?**  
A: Use delete buttons in the Session toolbar or right-click (context menu may vary)
