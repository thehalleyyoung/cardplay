# Learn: Mixer
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Session Mixer panel, where you control track audio settings, effects, routing, groove, and humanization for your Session tracks.

> **Note:** The mixer uses "track" to refer to audio mixer channels (gain, pan, FX). This is distinct from `Track<K, A, B>`, which is a bidirectional lens into containers (cardplay2.md §2.3). See also [mixer-semantics.md](./mixer-semantics.md).

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Completed [Learn: Session](./learn-session.md)
- At least one track created in the Session

## Workflow 1: Basic Track Mixing (3 minutes)

### Goal
Adjust volume, pan, and waveform for individual tracks to balance your mix.

### Steps

1. **Open the Session Mixer panel**
   - Click the **Mixer** tab in the main interface
   - You'll see a row for each track in your Session
   - Each row shows: Track name, Gain, Pan, Waveform, and FX

2. **Adjust track gain (volume)**
   - Find the **Gain** slider for a track
   - Default is 0.7 (70% volume)
   - Drag to increase (louder) or decrease (quieter)
   - Range: 0.0 (silent) to 1.0 (full volume)
   - ✅ Use this to balance drums vs. melody vs. bass

3. **Adjust stereo pan**
   - Find the **Pan** slider for a track
   - Default is 0 (center)
   - Drag left: -1.0 (full left)
   - Drag right: +1.0 (full right)
   - ✅ Spread instruments across the stereo field for width

4. **Choose waveform (for synth tracks)**
   - Find the **Wave** dropdown
   - Options: sine, triangle, sawtooth, square
   - **sine**: Smooth, pure tone (good for bass)
   - **triangle**: Soft, mellow (good for pads)
   - **sawtooth**: Bright, buzzy (good for leads)
   - **square**: Hollow, retro (good for chiptune)
   - ✅ This only applies to tracks using the simple synth

### Troubleshooting
- **No sound after changing gain?** Check that gain is above 0.1
- **Pan not working?** Ensure you have stereo output (not mono speakers)
- **Waveform has no effect?** It only affects tracks using the built-in synth, not sampler tracks

### What You Learned
✓ How to adjust track volume (gain)  
✓ How to pan tracks left/right  
✓ How to choose synth waveforms  

---

## Workflow 2: Applying Quick Effects (4 minutes)

### Goal
Add common audio effects to tracks using the FX preset system.

### Steps

1. **Locate FX preset dropdown**
   - In the Mixer, each track has an **FX** dropdown
   - Default is "none" (no effects)
   - Options include:
     - **warm** (lowpass filter)
     - **echo** (delay)
     - **space** (reverb)
     - **dirt** (distortion)
     - **combo** (lowpass + delay + distortion)

2. **Add warmth with lowpass**
   - Select **warm** from the FX dropdown
   - This applies a lowpass filter at 2200 Hz
   - Effect: Removes harsh high frequencies, sounds warmer
   - ✅ Great for bass and drums

3. **Add echo/delay**
   - Select **echo** from the FX dropdown
   - Creates a repeating delay effect (180ms, 28% feedback, 25% mix)
   - Effect: Rhythmic echo that bounces in time
   - ✅ Great for melodic elements and vocals

4. **Add space with reverb**
   - Select **space** from the FX dropdown
   - Applies reverb (1.4s size, 3.2s decay, 18% mix)
   - Effect: Sounds like the instrument is in a large room
   - ✅ Great for creating depth and atmosphere

5. **Add grit with distortion**
   - Select **dirt** from the FX dropdown
   - Applies distortion (drive: 4, 22% mix)
   - Effect: Adds harmonic saturation and grit
   - ✅ Great for aggressive sounds (drums, bass, leads)

6. **Use the combo preset**
   - Select **combo** for a multi-effect chain
   - Combines lowpass + delay + distortion
   - Effect: Warm, dirty, spacious sound
   - ✅ Instant lo-fi character

### Troubleshooting
- **Effect too subtle?** Effects are set conservatively—adjust mix/params in code if needed
- **Effect too strong?** Switch back to "none" or try a different preset
- **CPU issues?** Disable effects on tracks you don't need

### What You Learned
✓ How to apply FX presets to tracks  
✓ Warm (lowpass), echo (delay), space (reverb), dirt (distortion)  
✓ The combo preset for multi-effect chains  

---

## Workflow 3: Groove and Humanization (5 minutes)

### Goal
Add swing, groove, and human feel to your tracks using the timing and velocity humanization controls.

### Steps

1. **Understand groove**
   - Groove shifts the timing of notes to create swing or shuffle
   - This happens at playback time—your notes aren't permanently changed
   - Common in electronic music (house, hip-hop, jazz)

2. **Select a groove template**
   - In the Mixer, find the **Groove** dropdown (bottom of panel)
   - Options include:
     - **None**: Straight timing (no swing)
     - **Swing 55%**, **Swing 60%**: Light to moderate swing
     - **Shuffle**: Heavy shuffle feel
     - **MPC Light**, **MPC Heavy**: Classic MPC-style groove
     - **Renoise Tight**, **Renoise Loose**: Tracker-style groove
     - **Triplet Feel**: Triplet-based swing
     - **Half-time Bounce**: Half-time groove for trap/hip-hop

3. **Adjust groove amount**
   - Find the **Groove Amount** slider (0.0 to 1.0)
   - 0.0: No groove applied (straight timing)
   - 1.0: Full groove effect
   - ✅ Start at 0.5 and adjust to taste

4. **Enable humanization**
   - Check the **Humanize** checkbox
   - This adds random variations to timing and velocity
   - Makes programmed music sound more natural and human

5. **Adjust humanize timing**
   - Find the **Timing** slider (0.0 to 1.0)
   - Controls how much notes drift from the grid (in ticks)
   - 0.0: Perfect timing (robotic)
   - 1.0: Maximum timing variation (loose)
   - ✅ Try 0.15-0.30 for subtle humanization

6. **Adjust humanize velocity**
   - Find the **Velocity** slider (0.0 to 1.0)
   - Controls how much note velocities vary
   - 0.0: All notes at programmed velocity
   - 1.0: Maximum velocity variation
   - ✅ Try 0.10-0.25 for realistic dynamics

7. **Change humanize seed**
   - Find the **Seed** input (number)
   - Each seed produces a different random pattern
   - Change the seed to get a new humanization variation
   - ✅ Useful for creating multiple "takes" of the same pattern

### Troubleshooting
- **Groove feels wrong?** Try a different template or reduce the amount
- **Too much humanization?** Lower the timing/velocity sliders
- **Sounds sloppy?** Disable humanize or reduce timing slider

### What You Learned
✓ How to apply groove templates (swing, shuffle, MPC)  
✓ How to adjust groove amount  
✓ How to enable humanization for timing and velocity  
✓ How to use seeds to vary humanization  

---

## Key Concepts

### Gain
- Track volume (0.0 to 1.0)
- Controls the loudness of a track in the mix
- Adjust to balance instruments (e.g., quiet bass, loud drums)

### Pan
- Stereo position (-1.0 left to +1.0 right)
- Center (0) = equal in both speakers
- Use to create stereo width and separation

### Waveform
- Oscillator shape for the built-in synth
- **sine**: Pure tone, smooth
- **triangle**: Soft, mellow
- **sawtooth**: Bright, buzzy
- **square**: Hollow, retro

### FX Presets
- Quick audio effects you can apply to tracks
- **warm**: Lowpass filter (removes highs)
- **echo**: Delay (repeating echoes)
- **space**: Reverb (room ambience)
- **dirt**: Distortion (harmonic saturation)
- **combo**: Multi-effect chain

### Groove
- Shifts note timing to create swing or shuffle
- Templates include MPC, Renoise, triplet, shuffle, etc.
- Amount (0-1) controls how much groove is applied

### Humanization
- Adds random variations to timing and velocity
- Makes programmed music sound less robotic
- Timing: How much notes drift (in ticks)
- Velocity: How much velocity varies
- Seed: Different random patterns

---

## Tips and Tricks

1. **Start with gain**: Before adding effects, balance track volumes with gain
2. **Spread the stereo field**: Pan drums center, melody left, bass center-right for width
3. **Use reverb sparingly**: Too much "space" muddies the mix
4. **Combo preset for lo-fi**: Instant vintage/lo-fi sound
5. **Groove experiments**: Try "MPC Heavy" for hip-hop, "Renoise Tight" for electronic
6. **Humanize drums**: Adds realism to programmed drum patterns (0.15 timing, 0.20 velocity)
7. **Seed variations**: Use different seeds to create multiple versions of the same pattern

---

## Common Workflows

### Balancing a Multi-Track Mix
1. Start with all tracks at gain 0.7
2. Identify the loudest element (usually drums)
3. Adjust other tracks relative to drums
4. Pan melody left, chords right, bass/drums center
5. Add "warm" to bass, "space" to melody

### Creating Swing Feel
1. Select "Swing 60%" groove template
2. Set groove amount to 0.6
3. Play your track—eighth notes now swing
4. Adjust amount to taste (0.4-0.8 typical)

### Humanizing Programmed Music
1. Enable humanize checkbox
2. Set timing to 0.20 (subtle drift)
3. Set velocity to 0.15 (slight variations)
4. Play and listen—notes sound less robotic
5. Try different seeds for variations

---

## Next Steps

- [Learn: Audio](./learn-audio.md) - Audio engine settings, recording, export
- [Learn: Samples](./learn-samples.md) - Import samples and build sampler instruments
- [Learn: Session](./learn-session.md) - Back to Session view
- [Learn: Clip Editor](./learn-clip-editor.md) - Edit notes in clips

---

## Reference

### Mixer Panel Controls

| Control | Description | Range |
|---------|-------------|-------|
| Gain | Track volume | 0.0 to 1.0 |
| Pan | Stereo position | -1.0 (left) to +1.0 (right) |
| Wave | Synth waveform | sine/triangle/sawtooth/square |
| FX | Effects preset | none/warm/echo/space/dirt/combo |
| Groove | Timing template | none/swing/shuffle/MPC/Renoise/etc. |
| Groove Amount | Groove strength | 0.0 to 1.0 |
| Humanize | Enable variations | checkbox |
| Timing | Humanize timing | 0.0 to 1.0 |
| Velocity | Humanize velocity | 0.0 to 1.0 |
| Seed | Humanize pattern | integer |

### FX Preset Details

| Preset | Effect | Parameters | Use Case |
|--------|--------|-----------|----------|
| warm | Lowpass | 2200 Hz, Q 0.7 | Remove harshness, warm bass |
| echo | Delay | 180ms, 28% feedback, 25% mix | Rhythmic repeats |
| space | Reverb | 1.4s size, 3.2s decay, 18% mix | Room ambience, depth |
| dirt | Distortion | Drive 4, 22% mix | Harmonic saturation, grit |
| combo | Multi-FX | Lowpass + Delay + Distortion | Instant lo-fi character |

### Groove Templates

| Template | Feel | Use Case |
|----------|------|----------|
| Swing 55% | Light swing | Jazz, blues |
| Swing 60% | Moderate swing | Electronic, house |
| Shuffle | Heavy shuffle | Blues, funk |
| MPC Light | Subtle MPC | Hip-hop, boom bap |
| MPC Heavy | Strong MPC | Aggressive hip-hop |
| Renoise Tight | Precise tracker | Electronic, techno |
| Renoise Loose | Relaxed tracker | Ambient, chill |
| Triplet Feel | Triplet-based | Waltz, shuffle |
| Half-time Bounce | Half-time groove | Trap, hip-hop |

---

## Troubleshooting

**Q: Why doesn't waveform change the sound?**  
A: Waveform only affects tracks using the built-in synth. Sampler tracks use audio samples instead.

**Q: My groove sounds wrong**  
A: Different templates suit different genres. Try MPC for hip-hop, Renoise for electronic, Swing for jazz.

**Q: Humanization makes my music sound sloppy**  
A: Reduce the timing slider to 0.05-0.15 for subtle humanization. Or disable it for tight, robotic grooves.

**Q: Can I have different groove per track?**  
A: Currently, groove applies to all tracks globally. Per-track groove is a future enhancement.

**Q: How do I create custom effects?**  
A: FX presets are built-in. For custom effects, use the Stack Builder to add effect cards to your audio routing.
