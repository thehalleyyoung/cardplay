# Learn: Audio
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This guide covers audio engine management, recording, MIDI, export, and troubleshooting audio issues in Cardplay.

## Prerequisites

- Completed [Learn: Getting Started](./learn-getting-started.md)
- Audio hardware (headphones/speakers, optionally a microphone or MIDI controller)

## Workflow 1: Audio Engine Setup and Configuration (3 minutes)

### Goal
Configure your audio settings for optimal performance and low latency.

### Steps

1. **Open the Audio panel**
   - Click the **Audio** tab in the main interface
   - You'll see several sections:
     - **Engine Status**: Running/Stopped, sample rate, latency
     - **Output Device**: Select your speakers/headphones
     - **Buffer Size**: Controls latency vs. CPU
     - **Input Device**: For recording microphone or line-in
     - **MIDI**: Connect MIDI controllers

2. **Start the audio engine**
   - Click **"Start Audio"**
   - The browser may ask for audio permission—allow it
   - ✅ Status should show: "Audio engine running"
   - Sample rate is typically 44100 Hz or 48000 Hz

3. **Adjust buffer size for latency**
   - **Low buffer (128 or 256 samples)**: Lower latency, better for live recording
   - **High buffer (512 or 1024 samples)**: Higher latency, better for CPU-intensive projects
   - Recommendation:
     - **Live recording/performance**: 128-256 samples
     - **Mixing/producing**: 512-1024 samples
   - Change the buffer and click **"Restart Audio Engine"** to apply

4. **Select your audio output device**
   - Use the **Output Device** dropdown
   - Choose your preferred speakers or headphones
   - If using USB audio interface, select it here
   - ✅ Test by playing the metronome (enable in Session settings, press Play)

5. **Monitor CPU and latency**
   - The Audio panel shows:
     - **CPU Load**: Percentage of processing power used
     - **Reported Latency**: Round-trip delay (input to output)
   - If CPU is consistently above 80%, increase buffer size
   - If latency is too high (>20ms), decrease buffer size

### Troubleshooting
- **No audio devices listed?** Check your system audio settings and browser permissions
- **High CPU load?** Simplify your project or increase buffer size
- **Clicks/pops?** Increase buffer size or close other apps

### What You Learned
✓ How to start and configure the audio engine  
✓ Buffer size trade-offs (latency vs. CPU)  
✓ How to select audio output devices  
✓ How to monitor performance  

---

## Workflow 2: Recording Audio Input (5 minutes)

### Goal
Record audio from a microphone or instrument into Cardplay.

### Steps

1. **Connect your audio input**
   - Plug in your microphone or audio interface
   - Ensure it's working in your system settings

2. **Select input device in Audio panel**
   - In the **Audio** panel, find **Input Device**
   - Choose your microphone or line-in from the dropdown
   - The browser may ask for microphone permission—allow it

3. **Enable input monitoring**
   - Click **"Monitor Input"** or similar toggle
   - Speak or play into the mic
   - ✅ You should see the input level meter move
   - Adjust input gain so the meter peaks around -6dB to -3dB (not clipping)

4. **Arm a track for recording**
   - Go to the **Session** panel
   - Select a track you want to record into
   - Click the **Arm** button (red circle icon) on the track
   - ✅ Track is now ready to capture input

5. **Start recording**
   - Press **R** or click **Record** in the transport
   - Press **Space** or click **Play** to start recording
   - Speak, sing, or play your instrument
   - 🎵 You'll hear yourself if monitoring is enabled
   - Recording indicator flashes

6. **Stop recording**
   - Press **R** again or click **Stop**
   - A new "take" is created and appears in the Audio panel's **Takes** section

7. **Play back your recording**
   - In the **Audio** panel, find your take in the **Takes** list
   - Click **Play** next to the take to audition it
   - The waveform preview shows your recording

8. **Use the take in your project**
   - You can assign the take to a track or clip
   - Drag the take from the Takes list to a pad or clip slot
   - Or use **"Assign to Track"** button

### Troubleshooting
- **Can't hear myself?** Enable input monitoring
- **Recording is too quiet?** Increase input gain in your system settings or audio interface
- **Recording is clipping?** Lower input gain
- **Latency is distracting?** Lower buffer size or use direct monitoring on your audio interface

### What You Learned
✓ How to select and configure audio input  
✓ How to arm tracks for recording  
✓ How to record audio takes  
✓ How to manage and use recorded takes  

---

## Workflow 3: Exporting Audio (3 minutes)

### Goal
Render your project to a WAV file for sharing or further production.

### Steps

1. **Prepare your project for export**
   - Ensure your session has clips and scenes
   - Each scene should have a bar length set (e.g., 4 bars, 8 bars)
   - Go to **Session** panel → right-click a scene → set **Follow After Bars**

2. **Open export options**
   - Open the **Getting Started** panel or **Audio** panel
   - Find the **"Export WAV"** button

3. **Configure export settings (if available)**
   - **Sample Rate**: 44100 Hz (standard) or 48000 Hz (higher quality)
   - **Bit Depth**: 16-bit (standard) or 24-bit (higher quality)
   - **Normalize**: Automatically adjust volume to prevent clipping
   - **Channels**: Mono or Stereo

4. **Click "Export WAV"**
   - The export process begins
   - You'll see a progress indicator: "Rendering… X/Y"
   - This renders all scenes in sequence, respecting scene bar lengths

5. **Download the file**
   - Once complete, a WAV file automatically downloads
   - Filename format: `cardplay-song-<timestamp>.wav`
   - Open in any audio player or DAW

6. **Listen to your export**
   - Play the WAV file to verify it sounds correct
   - If there are issues:
     - Check that scenes have bar lengths set
     - Ensure clips are not muted
     - Verify no scenes are empty

### Troubleshooting
- **Export failed?** Make sure at least one scene has `followAfterBars` > 0
- **Export is silent?** Check that tracks are not muted, clips are assigned, and transport mode is correct
- **Export is too loud/quiet?** Use the Mixer panel to adjust track gains, or enable normalization

### What You Learned
✓ How to prepare a project for export  
✓ How to configure export settings  
✓ How to render and download WAV files  

---

## MIDI Controller Support

Cardplay supports MIDI input for playing notes and controlling parameters.

### Connecting a MIDI Controller

1. **Plug in your MIDI controller** (USB or MIDI interface)
2. **Open the Audio panel**
3. **Select MIDI Input Device** from the dropdown
4. **Enable MIDI Monitor** to see incoming messages

### MIDI Features
- **Note input**: Play pads with MIDI keyboard
- **MIDI Clock sync**: Sync transport to external MIDI clock
- **CC mapping**: Map MIDI controllers to track gain, BPM, etc.
- **MIDI Learn**: Click "Learn" and move a controller to assign

### Example: Playing Pads with MIDI Keyboard

1. Connect MIDI keyboard
2. Select MIDI input device
3. Open **Pads** panel
4. Press keys on your MIDI keyboard
5. 🎵 Pads trigger corresponding to MIDI note numbers

---

## Audio Format Reference

### Supported Import Formats
- WAV (PCM, 16-bit, 24-bit)
- MP3 (decoded to PCM)
- OGG Vorbis (decoded to PCM)
- FLAC (decoded to PCM, if browser supports)

### Supported Export Formats
- WAV (PCM, 16-bit or 24-bit)
- Sample Rate: 44100 Hz, 48000 Hz
- Channels: Mono or Stereo

### Sample Rate Conversion
- Cardplay automatically resamples imported audio to match project sample rate
- Original files are not modified

---

## Common Audio Issues and Solutions

### Issue: Audio engine won't start
**Solutions:**
- Grant browser audio permission (check browser address bar)
- Close other apps using audio
- Restart browser
- Try a different browser

### Issue: High latency (delay between action and sound)
**Solutions:**
- Lower buffer size (128 or 256 samples)
- Use ASIO drivers (Windows) or CoreAudio (Mac)
- Close background apps
- Use a dedicated audio interface

### Issue: Clicks, pops, or glitches in audio
**Solutions:**
- Increase buffer size (512 or 1024 samples)
- Reduce CPU load (simplify project, freeze tracks)
- Close background apps
- Update audio drivers

### Issue: Recording is silent or very quiet
**Solutions:**
- Check input device selection
- Increase input gain in system settings
- Verify microphone is not muted
- Check browser microphone permissions

### Issue: Can't hear audio during recording
**Solutions:**
- Enable input monitoring
- Check that audio output device is correct
- Lower buffer size if latency is distracting

---

## Next Steps

Now that you understand audio configuration and recording:

- **Record vocals or instruments** → Experiment with takes and clips
- **Connect a MIDI controller** → Play pads and control parameters
- **Export polished tracks** → Share your music with others
- **Optimize performance** → Fine-tune buffer size and CPU load

## Advanced Audio Topics

For more details, see:
- [Audio Engine Architecture](./audio-engine-architecture.md)
- [Offline Render and Export](./offline-render-export.md)
- [Recording Semantics](./recording-semantics.md)

---

**You're now an audio pro!** 🎧 Experiment with recording, MIDI, and export to master your production workflow.
