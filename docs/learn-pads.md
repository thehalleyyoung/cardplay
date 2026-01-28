# Learn: Pads
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Pads panel, a tactile interface for triggering sounds, recording live performances, and composing with drum pads and melodic keyboards.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Completed [Learn: Samples](./learn-samples.md)
- Basic understanding of MIDI notes and clips

## Workflow 1: Playing Drum Pads (3 minutes)

### Goal
Trigger drum samples using the pad interface and understand drum mode.

### Steps

1. **Open the Pads panel**
   - Click the **Pads** tab in the main interface
   - You'll see a grid of pads (typically 4×4 = 16 pads)
   - Each pad can trigger a sample

2. **Enable keyboard mode**
   - Check the **"⌨️ Keyboard"** checkbox
   - Your computer keyboard now triggers pads
   - Keys map to pads (e.g., Q/W/E/R for top row)
   - ✅ You can play without clicking

3. **Click pads to trigger sounds**
   - Click any pad with your mouse
   - 🎵 You hear the assigned drum sample (kick, snare, hihat, etc.)
   - Release: Sample continues (one-shot mode)

4. **Use the Random Kit button**
   - Click **"🎲 Random Kit"**
   - A random selection of drum samples is assigned to pads
   - This uses a seeded randomizer for repeatability
   - ✅ Quick way to experiment with different kits

5. **Arm a clip for recording**
   - Click **"🎯 Arm clip"**
   - This ensures a clip is selected as the recording target
   - Now pad hits will be recorded as note events
   - ✅ Essential for live recording

### Troubleshooting
- **No sound?** Check that samples are loaded (see [Learn: Samples](./learn-samples.md))
- **Keyboard doesn't work?** Ensure **Keyboard** checkbox is enabled
- **Pads trigger wrong sounds?** Use "Random Kit" or manually assign samples

### What You Learned
✓ How to trigger drum pads  
✓ How to enable keyboard mode  
✓ How to randomize drum kits  
✓ How to arm clips for recording  

---

## Workflow 2: Recording Live with Pads (4 minutes)

### Goal
Record a drum pattern by playing pads in real-time.

### Steps

1. **Create a clip to record into**
   - Go to Session panel
   - Click an empty slot to create a clip
   - Return to Pads panel

2. **Arm the clip**
   - Click **"🎯 Arm clip"** to select the clip as the recording target
   - ✅ Pad hits will now be recorded as notes

3. **Start playback**
   - Press **Space** to start the transport
   - You'll hear the metronome (if enabled)
   - Transport position advances (bar/beat)

4. **Play pads live**
   - Click pads or use keyboard keys
   - Each hit creates a note event in the clip (`Event<Voice<MIDIPitch>>` with `payload` containing pitch/velocity — see cardplay2.md §2.0.1)
   - Notes are quantized to the grid (if quantize enabled)
   - ✅ You're recording in real-time

5. **Stop and listen**
   - Press **Space** to stop
   - Rewind to start (click transport position or press Home)
   - Press **Space** again to play back
   - 🎵 Your pattern loops

6. **Enable velocity sensitivity**
   - Check **"🎚️ Velocity Sens"** checkbox
   - Mouse click position affects velocity (top = loud, bottom = quiet)
   - ✅ Adds dynamics to your performance

7. **Use note repeat**
   - Check **"🔁 Repeat"** checkbox
   - Hold a pad down
   - The pad repeats at the current grid rate (e.g., 16th notes)
   - ✅ Great for hi-hat rolls and rapid-fire hits

### Troubleshooting
- **Notes don't record?** Check that clip is armed with "Arm clip"
- **Timing is off?** Adjust recording quantize settings
- **Repeat too fast/slow?** Change grid resolution in Pads or Transport settings

### What You Learned
✓ How to record pads live into clips  
✓ Velocity sensitivity for dynamics  
✓ Note repeat for rapid hits  

---

## Workflow 3: Melodic Mode and Scales (5 minutes)

### Goal
Switch from drums to melodic mode, play chords and scales, and use a sampler bank.

### Steps

1. **Switch to melodic mode (synth)**
   - In Pads panel, find **"Melodic Mode"** dropdown
   - Select **"synth"**
   - Pads now trigger pitched notes using the built-in synth
   - ✅ You can play melodies and chords

2. **Enable scale mode**
   - Check the **"Scale Mode"** checkbox
   - Select a **scale root** (C, D, E, etc.)
   - Select a **scale type** (major, minor, dorian, etc.)
   - Pads now only play notes in that scale
   - ✅ You can't play "wrong" notes

3. **Play with scales**
   - Click pads or use keyboard
   - Every pad hits a note in the scale (no chromatic notes)
   - Change root/type to explore different sounds
   - ✅ Instant music theory assistance

4. **Enable chord mode**
   - Check the **"Chord Mode"** checkbox
   - Select a **chord type** (major, minor, sus4, dim, aug, etc.)
   - Each pad now triggers a chord (3+ notes)
   - ✅ Instant harmony

5. **Combine scale + chord mode**
   - Enable both Scale Mode and Chord Mode
   - Pads trigger chords built from scale notes
   - Example: C major scale + major chords = I, ii, iii, IV, V, vi, vii° chords
   - ✅ Instant diatonic harmony

6. **Switch to sampler bank**
   - In **"Melodic Mode"**, select **"bank"**
   - Choose a sampler bank from the dropdown (see [Learn: Samples](./learn-samples.md))
   - Pads now trigger the sampler across its keyzone range
   - ✅ Play realistic instruments (piano, strings, etc.)

7. **Enable latch mode**
   - Check the **"🔒 Latch"** checkbox
   - Play a pad—it sustains until you play another pad
   - ✅ Useful for holding chords while playing melody

### Troubleshooting
- **Pads sound robotic?** Use humanization in Mixer or add velocity variations
- **Can't find scale?** Try major/minor first, then explore modes (dorian, phrygian, etc.)
- **Bank not available?** Import a sampler bank first (see [Learn: Samples](./learn-samples.md))

### What You Learned
✓ How to switch to melodic mode  
✓ Scale mode constrains notes to a scale  
✓ Chord mode triggers chords  
✓ Sampler banks for realistic instruments  
✓ Latch mode sustains notes  

---

## Key Concepts

### Drum Mode
- Pads trigger one-shot samples (kick, snare, hihat, etc.)
- Each pad = one drum sound
- Ideal for rhythm and percussion

### Melodic Mode
- Pads trigger pitched notes (synth or sampler)
- Two sub-modes:
  - **synth**: Built-in oscillator (sine, saw, square, triangle)
  - **bank**: Sampler bank (multi-zone instrument)

### Scale Mode
- Constrains pads to a musical scale
- Prevents "wrong" notes (no chromatic outside scale)
- Helps non-musicians create musical patterns

### Chord Mode
- Each pad triggers a chord (3+ notes)
- Chord types: major, minor, sus4, dim, aug, etc.
- Combine with scale mode for diatonic chords

### Velocity Sensitivity
- Mouse/keyboard position affects note velocity (loudness)
- Top of pad = loud (velocity ~110)
- Bottom of pad = quiet (velocity ~60)

### Note Repeat
- Hold a pad to repeat at grid rate
- Useful for hi-hat rolls, rapid arpeggios
- Grid rate set by transport/clip resolution

### Latch Mode
- Notes sustain until next pad is played
- Useful for holding chords
- Works in melodic mode

---

## Tips and Tricks

1. **Keyboard shortcuts**: Enable **Keyboard** mode and use Q/W/E/R/A/S/D/F/Z/X/C/V keys
2. **Random Kit**: Click multiple times to cycle through different random kits
3. **Generate Fill**: Click **"🎵 Fill"** to auto-generate a 1-bar drum fill at the end of your clip
4. **Scale experiments**: Try Dorian (jazzy), Phrygian (exotic), Mixolydian (bluesy)
5. **Chord progressions**: Use chord mode with scale mode to build I-IV-V-I progressions
6. **Velocity variations**: Manually adjust velocity or use **Velocity Sens** for dynamic performances
7. **Sampler + Scale**: Combine sampler bank with scale mode for realistic instrument constraints
8. **Latch for ambient**: Use latch mode with reverb effects for ambient pads

---

## Common Workflows

### Recording a Drum Beat
1. Open Pads panel
2. Click "Random Kit" to load drums
3. Arm a clip with "Arm clip"
4. Enable metronome
5. Press Space to start
6. Play pads (kick, snare, hats)
7. Stop and listen back

### Creating a Chord Progression
1. Switch to Melodic Mode: synth
2. Enable Scale Mode (C major)
3. Enable Chord Mode (major)
4. Arm a clip
5. Press Space
6. Play 4 pads in sequence (I-IV-V-I)
7. Stop and loop

### Playing a Melodic Riff
1. Switch to Melodic Mode: bank
2. Select a sampler bank (piano, strings, etc.)
3. Enable Scale Mode (E minor)
4. Disable Chord Mode
5. Arm a clip
6. Play a melody across pads
7. Record and loop

---

## Next Steps

- [Learn: Clip Editor](./learn-clip-editor.md) - Edit recorded notes
- [Learn: Tracker](./learn-tracker.md) - Fast row-based editing
- [Learn: Piano Roll](./learn-piano-roll.md) - Visual piano roll editor
- [Learn: Mixer](./learn-mixer.md) - Add effects to pad tracks

---

## Reference

### Pad Controls

| Control | Description |
|---------|-------------|
| 🎯 Arm clip | Select a clip as recording target |
| 🎲 Random Kit | Randomize drum kit samples |
| 🎵 Fill | Generate 1-bar drum fill |
| ⌨️ Keyboard | Enable keyboard triggering |
| 🎚️ Velocity Sens | Mouse position affects velocity |
| 🔁 Repeat | Hold to repeat at grid rate |
| 🔒 Latch | Sustain until next pad |

### Melodic Mode

| Mode | Description |
|------|-------------|
| synth | Built-in oscillator (sine/saw/square/triangle) |
| bank | Sampler bank (multi-zone instrument) |

### Scale Types

- Major, Minor (natural/harmonic/melodic)
- Dorian, Phrygian, Lydian, Mixolydian, Locrian (modes)
- Pentatonic (major/minor)
- Blues, Whole tone, Chromatic

### Chord Types

- Major, Minor, Diminished, Augmented
- Suspended (sus2, sus4)
- 7th chords (maj7, min7, dom7, dim7)
- Extended chords (9th, 11th, 13th)

---

## Troubleshooting

**Q: Pads don't trigger sounds**  
A: Check that samples are loaded (Samples panel) or synth mode is selected

**Q: Keyboard triggering doesn't work**  
A: Enable the **Keyboard** checkbox and ensure no other input fields are focused

**Q: Notes record at wrong pitch**  
A: Check that melodic mode is correct (synth vs. bank) and scale mode settings

**Q: How do I change pad assignments?**  
A: Currently auto-assigned. Use "Random Kit" for drums or change samples in Samples panel

**Q: Velocity sensitivity too extreme**  
A: Adjust with mouse position carefully, or edit velocities afterward in Clip Editor

**Q: Can I use MIDI controller?**  
A: MIDI input support is planned. Use keyboard mode for now.
