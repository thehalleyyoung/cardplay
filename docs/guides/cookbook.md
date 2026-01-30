# CardPlay Cookbook

**Collection of recipes and patterns for common musical tasks**

---

## Table of Contents

1. [Quick Start Recipes](#quick-start-recipes)
2. [Composition Patterns](#composition-patterns)
3. [Production Techniques](#production-techniques)
4. [Sound Design Workflows](#sound-design-workflows)
5. [Performance Setups](#performance-setups)
6. [Advanced Patterns](#advanced-patterns)

---

## Quick Start Recipes

### Recipe 1: Create a Lofi Beat in 5 Minutes

**Board:** Session + Generators Board

**Steps:**
1. Load template: "Lofi Hip Hop Beat"
2. In Generator deck, select "Drums" → Generate with "lofi" style
3. Generate bass line with "walking bass" pattern
4. Add Rhodes pad from phrase library
5. Apply tape saturation effect to master
6. Adjust swing to 60% for that laid-back feel

**Result:** Complete lofi beat ready for vocals or instrumental release.

---

### Recipe 2: Four-Part Harmony from Melody

**Board:** Notation + Harmony Board

**Steps:**
1. Write your melody in the notation deck
2. Set key/scale in harmony display (e.g., C major)
3. Select melody notes
4. Apply "Four-Part SATB" harmonization from context menu
5. Review voice leading suggestions (green = good, yellow = warning)
6. Accept or manually adjust voicings

**Result:** Professional four-part harmony with proper voice leading.

---

### Recipe 3: Quick Arrangement from Chord Progression

**Board:** AI Arranger Board

**Steps:**
1. Enter chord progression in arranger deck (e.g., "| Cmaj7 | Am7 | Dm7 | G7 |")
2. Set tempo and time signature
3. Enable parts: Drums, Bass, Pad, Melody
4. Click "Generate Arrangement"
5. Adjust part density/complexity sliders
6. Freeze parts you like, regenerate others

**Result:** Full arrangement with multiple parts following your chords.

---

## Composition Patterns

### Pattern: Modal Composition

**Concept:** Write in a specific mode to create a particular mood.

**Steps:**
1. Choose mode (e.g., Dorian for jazzy, Phrygian for dark)
2. Set scale constraint card to lock to mode
3. Use harmony display to show available chord qualities
4. Emphasize characteristic note of the mode (e.g., major 6th in Dorian)
5. Avoid standard cadences; use modal progressions

**Example:** D Dorian progression: Dm7 → Em7 → G → Dm7

---

### Pattern: Rhythmic Displacement

**Concept:** Create interest by shifting rhythmic patterns.

**Steps:**
1. Create a simple rhythmic motif (e.g., quarter, eighth, eighth)
2. Copy pattern to new track
3. Apply time offset (e.g., +1 eighth note)
4. Layer original and displaced versions
5. Adjust velocity profiles for call-and-response effect

**Result:** Polyrhythmic texture from simple material.

---

### Pattern: Counterpoint Exercise

**Concept:** Write two independent melodic lines that work together.

**Steps:**
1. Use Notation Board (Manual)
2. Write cantus firmus (whole notes)
3. Add counterpoint line following species rules:
   - Contrary motion preferred
   - No parallel 5ths/octaves
   - Independent rhythmic character
4. Use notation check to verify rules
5. Add third voice using same principles

**Resources:** Reference library deck has counterpoint rules.

---

### Pattern: Chord Substitution Chain

**Concept:** Transform basic progression into jazz harmony.

**Steps:**
1. Start with basic progression (e.g., I-IV-V-I)
2. Apply tritone substitutions to dominants
3. Add secondary dominants
4. Replace with relative minors where appropriate
5. Add passing chords (e.g., chromatic approach)

**Example:** C-F-G-C → Cmaj7-Fmaj7-Db7-Cmaj7

---

## Production Techniques

### Technique: Sidechain Compression Setup

**Board:** Producer Board

**Steps:**
1. Select bass or pad track in mixer
2. Add compressor to DSP chain
3. Set sidechain source to kick drum
4. Adjust ratio (4:1 typical), threshold (-20dB typical)
5. Fast attack (1ms), medium release (100-200ms)
6. Mix to taste (30-50% for subtle ducking)

**Result:** Kick cuts through mix, creating rhythmic pumping.

---

### Technique: Parallel Compression

**Board:** Producer Board

**Steps:**
1. Duplicate track or use aux send
2. Add heavy compression to duplicate (10:1 ratio, low threshold)
3. Mix compressed signal (20-40%) with original
4. EQ compressed signal to emphasize desired frequencies
5. Adjust to taste

**Result:** Punchy sound with natural dynamics preserved.

---

### Technique: Stereo Widening

**Board:** Producer Board

**Steps:**
1. Select track in mixer
2. Use stereo imaging visualizer to see current width
3. Add stereo widener plugin to DSP chain
4. Start with subtle widening (110-120%)
5. Check mono compatibility with phase meter
6. Apply only to non-bass frequencies (use EQ split)

**Warning:** Don't widen bass frequencies; keep them mono.

---

### Technique: Automation Curve Drawing

**Board:** Producer Board (Timeline view)

**Steps:**
1. Select parameter to automate (e.g., filter cutoff)
2. Enable automation lane for parameter
3. Choose curve type (linear, exponential, S-curve)
4. Draw automation points with mouse
5. Adjust curve tension with bezier handles
6. Preview with transport playback

**Tip:** Use exponential curves for natural-sounding filter sweeps.

---

## Sound Design Workflows

### Workflow: Creating a Signature Pad Sound

**Board:** Sound Design Lab Board

**Steps:**
1. Start with 2-3 oscillators (saw, square, sine)
2. Detune slightly for thickness (±0.05 semitones)
3. Add unison (3-5 voices) with moderate spread
4. Apply low-pass filter with envelope modulation
5. Add chorus for width
6. Layer with subtle noise (pink or filtered white)
7. Apply long reverb (3-5 seconds)
8. Save preset with descriptive tags

**Result:** Rich, evolving pad sound unique to your project.

---

### Workflow: Modulation Matrix Patching

**Board:** Sound Design Lab Board

**Steps:**
1. Open modulation matrix deck
2. Choose modulation source (LFO, envelope, velocity, etc.)
3. Choose target parameter (filter, pitch, amplitude, etc.)
4. Set modulation amount (0-100%)
5. Adjust source rate/shape
6. Add secondary modulation (modulate the modulator)
7. Test with MIDI keyboard input

**Example:** LFO1 → Filter Cutoff (50%), LFO2 → LFO1 Rate (30%)

---

### Workflow: Sample Chopping & Arrangement

**Board:** Basic Sampler Board

**Steps:**
1. Import sample to sample browser
2. Use waveform zoom to find transients
3. Place slice markers at transients (or use auto-chop)
4. Extract slices to separate sample pool
5. Drag slices to timeline in new arrangement
6. Apply per-slice pitch/time/reverse effects
7. Add groove quantization

**Result:** Creative rearrangement of original sample.

---

### Workflow: Layering Synthesis

**Board:** Sound Design Lab Board

**Steps:**
1. Create base layer (analog warmth - saw/square)
2. Add mid layer (digital clarity - FM/wavetable)
3. Add top layer (sparkle - filtered noise/sine)
4. Match envelopes across layers
5. Tune levels: base 80%, mid 50%, top 30%
6. Group layers to single instrument
7. Apply final processing to group

**Result:** Complex, multi-dimensional sound.

---

## Performance Setups

### Setup: Live Looping Rig

**Board:** Live Performance Board

**Steps:**
1. Configure 8 clip slots for loops
2. Set global quantization to 1 bar
3. Assign macro 1-4 to loop volumes
4. Assign macro 5-8 to effect sends
5. Set up scene progression for song structure
6. Enable MIDI foot controller for hands-free launching
7. Test clip launching with count-in

**Result:** Hands-free live looping performance rig.

---

### Setup: DJ-Style Performance

**Board:** Live Performance Board

**Steps:**
1. Load tracks into clip slots (A1-A8, B1-B8)
2. Set crossfader routing (A tracks → left, B tracks → right)
3. Assign EQ controls to performance macros
4. Set up effects (reverb, delay, filter) on sends
5. Configure tempo sync and beat matching
6. Test clip launching and crossfading
7. Practice transitions between scenes

**Result:** DJ-style two-deck performance setup.

---

### Setup: Live Coding / Generative Performance

**Board:** Generative Ambient Board

**Steps:**
1. Enable continuous generation mode
2. Set mood preset (e.g., "Drone" or "Shimmer")
3. Configure generation constraints (density, register, rhythm)
4. Assign macros to real-time constraint adjustment
5. Enable "capture live" for saving interesting moments
6. Set randomness seed for repeatable variations
7. Test freeze/unfreeze for live control

**Result:** Evolving generative performance with manual curation.

---

## Advanced Patterns

### Pattern: Polymetric Layering

**Concept:** Layer patterns with different time signatures.

**Steps:**
1. Create pattern 1 in 4/4 (kick/snare)
2. Create pattern 2 in 3/4 (melody)
3. Create pattern 3 in 5/4 (percussion)
4. Align to common downbeat (every 60 beats for 4/4, 3/4, 5/4)
5. Adjust velocities to create hierarchy
6. Add occasional unison hits for anchoring

**Result:** Complex polymetric texture that aligns periodically.

---

### Pattern: Microtonality & Alternate Tunings

**Concept:** Use scales beyond 12-TET.

**Steps:**
1. Use microtonal scale extension or Prolog KB predicates
2. Define EDO (equal divisions of octave) tuning (e.g., 19-EDO)
3. Generate scale degrees and cents values
4. Apply to synth with microtonal support
5. Write music using scale degrees instead of MIDI notes
6. Export tuning as Scala .scl file

**Example:** 19-EDO gives access to super-neutral intervals.

---

### Pattern: Algorithmic Composition

**Concept:** Use Prolog KB rules to generate music.

**Steps:**
1. Define music theory rules in Prolog KB
2. Set up constraints (key, style, density, register)
3. Query KB for valid note sequences
4. Filter results by aesthetic preferences
5. Generate multiple candidates
6. Manual selection and editing
7. Iterate with refined constraints

**Result:** AI-assisted composition with full control.

---

### Pattern: Voice Leading Optimization

**Concept:** Smooth voice leading between chords.

**Steps:**
1. Enter chord progression
2. Enable voice leading analyzer
3. Review suggested voicings (minimal motion preferred)
4. Apply voice leading transformation
5. Check parallel motion warnings
6. Manually adjust for color (wider leaps for effect)
7. Export to notation or MIDI

**Result:** Smooth, singable voice leading across progression.

---

## Tips & Best Practices

### General Tips

1. **Start Simple:** Begin with basic patterns, add complexity gradually
2. **Use Templates:** Save time with genre-specific project templates
3. **Reference Tracks:** Import reference audio for A/B comparison
4. **Save Often:** Use incremental saves (Cmd+Shift+S) for project versions
5. **Label Tracks:** Clear names help large projects stay organized

### Workflow Tips

1. **Capture Ideas Quickly:** Use Session + Generators for fast sketching
2. **Polish in Manual Boards:** Switch to manual boards for detailed editing
3. **Use Undo Generously:** Don't fear experimentation with solid undo history
4. **Leverage AI Suggestions:** Use AI for starting points, not final results
5. **Learn Keyboard Shortcuts:** Speed up workflow with board-specific shortcuts

### Sound Design Tips

1. **Record Automation:** Capture knob movements for natural modulation
2. **Layer Subtly:** Multiple quiet layers often better than one loud one
3. **Reference Waveforms:** Use spectrum analyzer to guide EQ decisions
4. **Save Presets:** Build personal library of go-to sounds
5. **Study Vintage Gear:** Understand limitations that created classic sounds

### Mixing Tips

1. **Gain Stage Early:** Set levels before adding effects
2. **Use Subtractive EQ:** Cut problems before boosting pleasures
3. **Bus Similar Elements:** Group drums, vocals, etc. for cohesive processing
4. **Check in Mono:** Ensure mix translates to single-speaker playback
5. **Take Breaks:** Fresh ears reveal mix issues that fatigue hides

---

## Contributing Recipes

Have a great recipe or pattern? Consider submitting it to the community!

**Requirements:**
- Clear, step-by-step instructions
- Specified board and deck setup
- Expected result description
- (Optional) Audio or visual example

**How to Submit:**
- Create markdown file following cookbook format
- Include metadata (difficulty, time estimate, genre tags)
- Submit via GitHub pull request or community forum

---

*This cookbook grows with the community. Check back for new recipes and patterns from CardPlay users worldwide!*
