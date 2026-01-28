# Learn: Samples
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers the Samples panel, where you import audio samples, manage sample libraries, create multi-zone sampler instruments, and access built-in samples.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Basic understanding of audio samples and samplers

## Workflow 1: Using Built-in Samples (2 minutes)

### Goal
Trigger built-in samples without importing any files.

### Steps

1. **Open the Samples panel**
   - Click the **Samples** tab in the main interface
   - You'll see a list of available samples
   - Built-in samples are always ready (no import needed)

2. **Browse built-in samples**
   - Scroll through the sample list
   - Built-in IDs include:
     - `kick`, `snare`, `hihat`, `clap` (drum sounds)
     - `bank:drums:*` (full drum kits)
     - Other preset sounds
   - ✅ These work immediately in your clips

3. **Use a sample in a note event**
   - Create a clip in the Session (see [Learn: Session](./learn-session.md))
   - Open Clip Editor or Tracker
   - Add a note event (`Event<Voice<P>>` — see cardplay2.md §2.0.1)
   - Set the note's `sampleId` property in the payload (e.g., `kick`)
   - ✅ The note triggers that sample when played

4. **Preview a sample**
   - In the Samples panel, find a sample
   - Click the **Play** button (▶) next to the sample
   - 🎵 You hear the sample play once

### Troubleshooting
- **No built-in samples shown?** Check that the sample library is loaded (should be automatic)
- **Sample doesn't play in clip?** Verify the `sampleId` matches exactly (case-sensitive)

### What You Learned
✓ How to find built-in samples  
✓ How to preview samples  
✓ How to use sample IDs in note events  

---

## Workflow 2: Importing Your Own Samples (4 minutes)

### Goal
Load audio files from your computer into Cardplay's sample library.

### Steps

1. **Prepare your samples**
   - Gather audio files (WAV, MP3, OGG, etc.)
   - Organize them by type (drums, synths, vocals, etc.)
   - ✅ Short samples (< 5 seconds) work best for one-shots

2. **Import single samples**
   - In the Samples panel, click **"Import…"**
   - A file picker opens
   - Select one or more audio files
   - Click **Open**
   - ✅ Samples are loaded into memory

3. **Import a folder of samples**
   - Click **"Import folder…"** (uses webkitdirectory, best-effort)
   - Select a folder containing audio files
   - All audio files in the folder are imported
   - ✅ Fast way to load entire drum kits or sample packs

4. **Configure import options**
   - Before importing, set options in the toolbar:
     - **Normalize**: Scale to max volume (recommended for consistency)
     - **Trim silence**: Remove silence at start/end (saves memory)
     - **Root MIDI**: Default pitch for melodic samples (60 = C4)
     - **Mode**: 
       - **oneshot** (play once, ignore note-off)
       - **gate** (sustain while note is held)

5. **View imported samples**
   - After import, samples appear in the list
   - Each sample shows:
     - Name (filename without extension)
     - ID (auto-generated or based on filename)
     - Duration
     - Action buttons (Play, Copy ID, Delete)

6. **Copy a sample ID**
   - Find the sample in the list
   - Click **"Copy id"** button
   - The sample ID is copied to clipboard
   - Paste it into your note event's `sampleId` property
   - ✅ Now the note triggers your custom sample

### Troubleshooting
- **Import fails?** Check that the file is a valid audio format (WAV, MP3, OGG)
- **Sample too quiet?** Enable **Normalize** before importing
- **Clicks at start/end?** Enable **Trim silence**
- **Sample disappears after reload?** User samples are in-memory only (not persisted yet)

### What You Learned
✓ How to import audio files as samples  
✓ How to import entire folders  
✓ Import options (normalize, trim, root MIDI, mode)  
✓ How to copy sample IDs for use in clips  

---

## Workflow 3: Creating Sampler Instruments (6 minutes)

### Goal
Build a multi-zone sampler instrument (like a melodic keyboard instrument) from audio samples.

### Steps

1. **Prepare melodic samples**
   - Gather audio files of pitched sounds (e.g., piano notes, synth tones)
   - Ideally, have samples at different pitches (e.g., C3, C4, C5)
   - Name files with pitch info if possible (e.g., `piano_C4.wav`, `synth_G3.wav`)
   - ✅ This helps auto-detect root pitches

2. **Import as Sampler**
   - In the Samples panel, click **"Import as Sampler…"**
   - Select your audio files
   - Click **Open**
   - A sampler bank is created with multi-zone mapping

3. **Understand sampler banks**
   - A sampler bank maps samples to MIDI pitch ranges (keyzones)
   - Example: C3 sample plays for MIDI 48-59, C4 sample for 60-71, etc.
   - When you play a note, the engine picks the closest sample and pitch-shifts it
   - ✅ This creates a full melodic instrument from a few samples

4. **Auto-detection of root pitches**
   - Cardplay tries to infer root MIDI from filenames
   - Recognized patterns: `C4`, `G#3`, `A2`, etc.
   - If not found, uses the **Root MIDI** setting (default 60 = C4)
   - ✅ Name your files well for automatic mapping

5. **Import folder as Sampler**
   - Click **"Folder → Sampler…"**
   - Select a folder with many pitched samples
   - All samples are combined into one sampler bank
   - ✅ Fast way to create complex multi-sample instruments

6. **Use the sampler bank**
   - After import, the bank appears in the "Sampler Instruments" section
   - Copy the **bank ID** (e.g., `bank:custom:1234`)
   - In the Pads panel, select **"Melodic Mode: bank"**
   - Choose your bank from the dropdown
   - ✅ Pads now trigger the sampler across the keyboard range

7. **Test the sampler**
   - In the Samples panel, find **"Test note"** input
   - Enter a MIDI note (e.g., 60 = C4, 72 = C5)
   - Click **Play** next to the bank
   - 🎵 You hear the sampler at that pitch

### Troubleshooting
- **All notes sound the same?** Check that root MIDI values were detected correctly
- **Pitch too high/low?** Adjust root MIDI for individual zones (advanced)
- **Not enough samples?** You can create a bank from just one sample (it pitch-shifts)
- **Bank not in Pads dropdown?** Refresh or check the bank ID is correct

### What You Learned
✓ How to create sampler banks from audio files  
✓ Keyzones map samples to MIDI pitch ranges  
✓ Auto-detection of root pitches from filenames  
✓ How to use sampler banks in Pads and clips  

---

## Key Concepts

### Sample
- A single audio file loaded into memory
- Can be triggered by note events using `sampleId`
- Examples: drum hits, vocal chops, synth stabs

### Sample ID
- A unique identifier for a sample (e.g., `kick`, `snare`, `user:sample123`)
- Use this in note events to specify which sample to play
- Copy from the Samples panel to clipboard

### Sampler Bank
- A collection of samples mapped to pitch ranges (keyzones)
- Allows one instrument to cover the full keyboard
- Bank ID format: `bank:custom:1234` or `bank:drums:*`

### Keyzone
- A MIDI pitch range assigned to a sample
- Example: Sample at C4 (MIDI 60) covers 60-71
- The engine pitch-shifts the sample for in-between notes

### Normalize
- Scale sample peak to maximum volume (0 dB)
- Ensures consistent loudness across samples
- Recommended for imported samples

### Trim Silence
- Remove silence at the start and end of a sample
- Reduces memory usage and tightens sample timing
- Useful for drums and one-shots

### Root MIDI
- The original pitch of a melodic sample
- Default: 60 (C4)
- Used to calculate pitch-shifting for keyzones

### Mode
- **oneshot**: Sample plays once, ignores note-off (drums, stabs)
- **gate**: Sample sustains while note is held, stops on note-off (pads, strings)

---

## Tips and Tricks

1. **Organize samples by type**: Use folders like "Drums", "Synths", "Vocals"
2. **Name files with pitches**: `piano_C3.wav`, `bass_E2.wav` for auto-detection
3. **Normalize everything**: Keeps your mix balanced
4. **Trim drum samples**: Removes unwanted silence, tightens timing
5. **Start with one-shots**: Easier than sustaining samples for beginners
6. **Use built-in samples first**: No import needed, always available
7. **Sampler banks for melodies**: Import folder → Sampler for instant instruments
8. **Copy IDs to notes**: Use the clipboard to paste sample IDs into Clip Editor

---

## Common Workflows

### Creating a Drum Kit
1. Prepare 8-16 drum samples (kick, snare, hats, etc.)
2. Enable **Normalize** and **Trim silence**
3. Import all samples with **"Import folder…"**
4. Copy IDs: `kick`, `snare`, `hihat`, etc.
5. Use in Pads (drum mode) or Tracker/Clip Editor

### Building a Melodic Instrument
1. Record or find 5-10 pitched samples (C2, C3, C4, etc.)
2. Name files: `instrument_C2.wav`, `instrument_C3.wav`, etc.
3. Set **Root MIDI** to 60 (or auto-detect from filename)
4. Import with **"Import as Sampler…"**
5. Use bank ID in Pads (melodic mode: bank)

### Using Found Samples from Freesound
1. Download CC0 samples from Freesound API (see API docs)
2. Import with **"Import…"**
3. Normalize and trim as needed
4. Use in your tracks

---

## Next Steps

- [Learn: Pads](./learn-pads.md) - Trigger samples with the pad interface
- [Learn: Clip Editor](./learn-clip-editor.md) - Add sample IDs to note events
- [Learn: Mixer](./learn-mixer.md) - Mix tracks with samples

---

## Reference

### Sample List Display

Each sample shows:
- **Name**: Filename (without extension)
- **ID**: Unique identifier (for `note.payload.sampleId`)
- **Duration**: Length in seconds
- **Actions**: Play, Copy ID, Delete

### Import Options

| Option | Values | Description |
|--------|--------|-------------|
| Normalize | on/off | Scale peak to max volume |
| Trim silence | on/off | Remove silence at ends |
| Root MIDI | 0-127 | Default pitch (60 = C4) |
| Mode | oneshot/gate | Playback behavior |

### Built-in Sample IDs

| ID | Type | Description |
|----|------|-------------|
| `kick` | Drum | Kick drum |
| `snare` | Drum | Snare drum |
| `hihat` | Drum | Hi-hat |
| `clap` | Drum | Handclap |
| `bank:drums:*` | Bank | Full drum kits |

### Sampler Bank Structure

```typescript
{
  id: "bank:custom:1234",
  name: "My Instrument",
  zones: [
    { sample: "sample1", rootMidi: 60, loKey: 60, hiKey: 71 },
    { sample: "sample2", rootMidi: 72, loKey: 72, hiKey: 83 },
  ]
}
```

---

## Troubleshooting

**Q: Imported samples disappear after refresh**  
A: User samples are in-memory only. Persistence is a future feature. Use built-in samples or re-import.

**Q: How do I delete a sample?**  
A: Click the **Delete** button next to the sample in the list.

**Q: Sample plays at wrong pitch**  
A: Check the **Root MIDI** setting. Adjust if the sample's original pitch wasn't detected correctly.

**Q: Can I use MP3 files?**  
A: Yes, but WAV is recommended for best quality and compatibility.

**Q: Sample is too quiet after import**  
A: Enable **Normalize** before importing to automatically boost volume.

**Q: How do I create velocity layers?**  
A: Import multiple samples with different velocities (e.g., soft, medium, hard). Use `splitVelocityLayers` utility (advanced).

**Q: Can I load samples from URLs?**  
A: Not yet. Use file import or Freesound API integration.
