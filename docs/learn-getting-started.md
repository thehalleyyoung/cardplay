# Learn: Getting Started
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide walks you through the absolute basics of Cardplay: making your first sound, creating clips, and launching scenes.

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Headphones or speakers connected
- 5-10 minutes of focused time

## Workflow 1: Your First Sound (2 minutes)

### Goal
Hear audio from Cardplay and verify your setup works.

### Steps

1. **Open Cardplay** in your browser
   - Navigate to the application URL
   - You should see the main interface with multiple panels

2. **Start the audio engine**
   - Look for the "Audio" panel (or "Getting Started" panel)
   - Click the **"Start Audio"** button
   - Your browser may ask for permission to play audio—allow it
   - ✅ Status should show "Audio engine running"

3. **Enable the metronome**
   - In the Session panel or Audio panel, find the **metronome toggle**
   - Turn it ON
   - The metronome provides a click track to verify audio works

4. **Press Play**
   - Click the **Play button** (⏵) in the transport controls, or press **Space**
   - 🎵 You should hear a steady metronome click (tick-tock pattern)
   - If you don't hear anything, check your system volume and audio output device

### Troubleshooting
- **No sound?** Check that your browser has audio permission
- **Still no sound?** Open the Audio panel and verify the correct audio output device is selected
- **Clicks or distortion?** Increase the buffer size in Audio settings

### What You Learned
✓ How to start the audio engine  
✓ How to enable the metronome  
✓ How to use the transport Play button  

---

## Workflow 2: Loading and Playing Your First Clip (3 minutes)

### Goal
Load a demo project and launch clips with music.

### Steps

1. **Load the demo project**
   - Open the **Getting Started** panel
   - Click **"Load Demo"**
   - A pre-built session with drums, bass, and melody will load
   - ✅ You should see tracks appear in the Session panel

2. **Navigate to Session view**
   - Click the **Session** panel tab
   - You'll see a grid:
     - **Columns** = Tracks (Drums, Bass, Melody, etc.) — audio mixer channels
     - **Rows** = Scenes (`Container<"scene">` — see cardplay2.md §2.0.1)
     - **Cells** = Clips (`Container<"clip">` holding events)

3. **Launch a scene**
   - Each scene has a **"Launch"** button on the right
   - Click **"Launch"** for Scene 1
   - The scene will arm (highlighted)

4. **Press Play**
   - Press **Space** or click **Play** (⏵)
   - 🎵 You should hear music: drums, bass, and melody playing together
   - The transport position bar moves forward
   - Clips flash or highlight to show they're active

5. **Try another scene**
   - Stop playback (press **Space** again or click Stop)
   - Launch **Scene 2** and press Play
   - Notice the different arrangement and instruments

### What You Learned
✓ How to load demo projects  
✓ How to navigate the Session panel  
✓ How to launch scenes  
✓ How tracks and clips work together  

---

## Workflow 3: Exploring Panels and Navigation (3 minutes)

### Goal
Get comfortable with the panel layout and where to find key features.

### Steps

1. **Understand the main panels**
   - **Session**: Clip matrix, scene launching
   - **Tracker**: Row-by-row note editing (like a spreadsheet)
   - **Piano Roll**: Visual note editing (like a piano)
   - **Pads**: Trigger sounds with keyboard or mouse
   - **Mixer**: Adjust volume, pan, and effects
   - **Audio**: Audio engine settings, MIDI, recording
   - **Samples**: Browse and assign audio samples
   - **Clip Editor**: Edit individual clip properties
   - **Stack Builder**: Add and configure processing cards
   - **Card Library**: Browse available cards (generators, effects, transforms)

2. **Switch between panels**
   - Click the panel tabs at the top or side of the interface
   - Each panel serves a different purpose in your workflow
   - Try opening **Tracker**, **Piano Roll**, and **Pads** to see the different views

3. **Open the Keyboard Shortcuts reference**
   - Look for **Help** or **"?"** icon
   - Or check the docs at `docs/ui-keyboard-shortcuts-reference.md`
   - Key shortcuts:
     - **Space**: Play/Stop
     - **Cmd/Ctrl + S**: Save project
     - **R**: Start/stop recording
     - **Tab**: Switch focus between panels
     - **Esc**: Cancel/close modal

4. **Try the Getting Started panel workflows**
   - The **Getting Started** panel has guided quick-start actions:
     - Load Demo
     - Export WAV
     - Access Help and FAQs
   - Use it whenever you're stuck or need inspiration

### What You Learned
✓ Overview of all major panels  
✓ How to navigate the interface  
✓ Where to find help and shortcuts  

---

## Next Steps

Now that you've made your first sound and launched clips, you're ready to:

- **Create your own clips** → See [Learn: Session](./learn-session.md)
- **Edit notes in Tracker or Piano Roll** → See [Learn: Tracker](./learn-tracker.md)
- **Assign and play samples** → See [Learn: Samples](./learn-samples.md)
- **Add effects and processing** → See [Learn: Stack Builder](./learn-stack-builder.md)
- **Export your music** → Use Export WAV in Getting Started or Audio panel

## Common Beginner Questions

**Q: Why doesn't the metronome sound like a real metronome?**  
A: The metronome is a simple click (tick-tock) to verify audio. It's not meant for musical practice.

**Q: Can I load my own audio files?**  
A: Yes! Use the Audio panel's "Import" feature or drag files into the Samples panel.

**Q: Where are projects saved?**  
A: Projects are saved as JSON files. Use **Cmd/Ctrl + S** or the Persistence panel to save/load.

**Q: How do I change the BPM (tempo)?**  
A: Look for the BPM control in the Transport bar (usually top-left or bottom).

**Q: What if I break something?**  
A: Use **Cmd/Ctrl + Z** to undo, or reload the demo to start fresh.

---

**Congratulations!** You've completed the Getting Started guide. Experiment, explore, and have fun making music. 🎉
