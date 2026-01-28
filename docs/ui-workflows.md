# UI Workflows
Assumes canonical model and terminology in `cardplay2.md` (repo root).

## “Make sound” (quick)

1. Open **Getting Started** → load the beginner demo project.
2. Open **Audio** → click Start audio.
3. Open **Session** → click Launch on a scene.
4. Press `Space` to play.

## “Edit a clip”

1. In **Session**, click a slot (creates a clip if empty and selects it).
2. Use **Clip Editor** to toggle notes on the step grid.
3. Use **Tracker** for a tick-row editor and selection operations.
4. Use **Piano Roll** for drag/resize note rectangles (experimental).

## “Export audio”

1. Open **Audio** → Offline render section.
2. Choose selection: session/scene/clip/selection.
3. Render, then Download (WAV or MediaRecorder formats).

## “Export/import layout”

1. Use topbar **Layout** (or `Ctrl/Cmd`+`Shift`+`L`).
2. Export: Copy or Download the JSON.
3. Import: paste JSON or import a JSON file, then Apply + reload.

## “Share a report link (local)”

1. Open **Graph Report**.
2. Click **Share link (local)** to generate a link and copy it.
3. Use **Shared links (local)** → Copy URL / Delete / Clear all to manage stored links.

## “Export/import a ZIP bundle”

1. Open **Persistence**.
2. Export ZIP: creates a `.zip` with `bundle.json` + `slot.json`.
3. Import ZIP: loads `slot.json` and migrates it to the current schema if needed.

## “Install packs”

1. Open **Card Packs**.
2. Import from URL or JSON bundle.
3. Review permissions prompts; allow only what you need.

## “Use samples (Sampler)”

Checklist (import → use → playback):

1. Open **Audio** → Start audio (optional, but useful for audition).
2. Open **Samples**:
   - Import a single file → creates a user sample id
   - Import as Sampler… / Folder → Sampler… → creates a **bank id** (multi-sample instrument)
3. In **Samples**, click **Copy id** for the sample/bank (or use a builtin like `kick`).
4. Create/modify a clip so note events include `payload.sampleId=<id>` (see Event<P> payload in cardplay2.md §2.0.1):
   - Drum pads: Pads writes builtin `sampleId`s when recording
   - Melodic sampler: Pads → set “Melodic pads = Sampler bank”, select a bank, then record notes
5. Press `Space` (Session playback) or use **Audio** → Offline render to confirm sampler playback.

## "Render and export" (enhanced)

### Quick render
1. Open **Audio** → Offline render section
2. Click "Open Render Dialog" button (or `Ctrl/Cmd` + `E`)
3. Choose format (WAV/MP3/OGG), sample rate, and bit depth
4. Click "Start Render"
5. Download when complete

### Export stems for mixing
1. Open **Audio** panel
2. Click "Export Stems" button (or `Ctrl/Cmd` + `Shift` + `E`)
3. Each track will be exported as a separate WAV file
4. Import files into your favorite DAW for final mixing

### Export specific content
- **Export Scene**: Right-click a scene → Export Scene (or use dialog)
- **Export Clip**: Select a clip → Audio panel → Export Clip
- **Export Selection**: Use time range selector → Export Selection

## "Session workflow" (tracker-style)

1. **Setup**:
   - Open **Session** panel
   - Create a new scene or load a template
   - Add tracks (right-click track list)

2. **Build clips**:
   - Click empty slots to create clips
   - Use **Tracker** for precise note entry
   - Use **Pads** for real-time recording

3. **Arrange**:
   - Create multiple scenes for song sections
   - Launch scenes to audition arrangements
   - Use **Mixer** to balance levels

4. **Export**:
   - Use **Render Dialog** for final mixdown
   - Or export stems for external mixing

## "Stack Builder workflow"

1. **Create a signal chain**:
   - Open **Stack Builder**
   - Click "Add Card" to browse card library
   - Drag cards to reorder

2. **Connect cards**:
   - Cards auto-connect when compatible
   - Use **Graph Report** to view connection graph
   - Apply suggested adapters for type mismatches

3. **Test and refine**:
   - Use **Runtime Panel** to test execution
   - Check **Graph Report** for warnings
   - Apply fixes suggested by type system

4. **Save as preset**:
   - Export stack as JSON
   - Share with others or reuse in projects

## "Recording workflow"

1. **Prepare**:
   - Start audio in **Audio** panel
   - Set BPM and time signature
   - Enable metronome if needed

2. **Record**:
   - Press `R` or click Record button
   - Play pads/MIDI controller
   - Notes are captured to active clip

3. **Edit**:
   - Open **Tracker** or **Piano Roll**
   - Quantize, transpose, or adjust velocities
   - Delete mistakes, copy/paste sections

4. **Layer**:
   - Create additional tracks
   - Record more layers
   - Use **Mixer** to balance

5. **Export**:
   - Render final mix or export stems
