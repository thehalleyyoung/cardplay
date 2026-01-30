# CardPlay Troubleshooting Guide

Common issues and their solutions.

## Table of Contents

- [Audio Issues](#audio-issues)
- [Performance Issues](#performance-issues)
- [UI Issues](#ui-issues)
- [Board & Deck Issues](#board--deck-issues)
- [AI & Generation Issues](#ai--generation-issues)
- [Project & File Issues](#project--file-issues)
- [MIDI & Hardware Issues](#midi--hardware-issues)

---

## Audio Issues

### No Sound / Audio Not Playing

**Symptoms**: Press play but hear nothing.

**Solutions**:
1. **Check system audio**:
   - Verify system volume is not muted
   - Check your OS audio settings
   - Try playing audio from another application

2. **Check mixer levels**:
   - Open the mixer deck (`Cmd+M`)
   - Ensure track faders are not at zero
   - Ensure master fader is not at zero
   - Check for muted tracks (M button)

3. **Check audio routing**:
   - Toggle routing overlay (`Cmd+Shift+R`)
   - Verify instruments are connected to mixer
   - Verify mixer is connected to audio output
   - Look for broken connections (red indicators)

4. **Check Web Audio API**:
   - CardPlay uses Web Audio API
   - Ensure your browser supports it (Chrome, Firefox, Safari, Edge)
   - Try refreshing the page

### Audio Crackling / Glitches

**Symptoms**: Audio plays but has pops, clicks, or stutters.

**Solutions**:
1. **Increase buffer size**:
   - Settings → Audio → Buffer Size
   - Try 256, 512, or 1024 samples
   - Larger buffer = more latency but more stable

2. **Reduce CPU load**:
   - Close unused decks
   - Freeze AI-generated tracks
   - Disable routing overlay while playing
   - Close other browser tabs

3. **Simplify project**:
   - Reduce number of active tracks
   - Remove CPU-heavy effects (reverb, delay)
   - Use lower sample rates if applicable

4. **Check browser performance**:
   - Close other applications
   - Check Activity Monitor / Task Manager
   - Restart browser if memory is high

### Audio Latency / Delay

**Symptoms**: Audio plays late after pressing keys or notes.

**Solutions**:
1. **Decrease buffer size**:
   - Settings → Audio → Buffer Size
   - Try 128 or 64 samples (if stable)
   - Smaller buffer = less latency but less stable

2. **Use MIDI input mode**:
   - If using MIDI keyboard, latency should be minimal
   - Check MIDI settings if using hardware

3. **Browser limitations**:
   - Web Audio API has inherent latency (~10-20ms minimum)
   - For ultra-low latency, consider native audio applications

---

## Performance Issues

### Slow UI / Lagging

**Symptoms**: UI feels sluggish, animations stutter.

**Solutions**:
1. **Close unused decks**:
   - Only keep decks you're actively using open
   - Each deck has rendering overhead

2. **Disable effects**:
   - Disable routing overlay when not needed
   - Disable visualizers (spectrum, meters) temporarily
   - Settings → UI → Visual Density → Compact

3. **Browser optimization**:
   - Close other tabs
   - Restart browser to clear memory
   - Use latest browser version
   - Try Chrome/Edge for best performance

4. **Project size**:
   - Large projects (100+ clips) may be slower
   - Consider splitting into multiple projects
   - Freeze unused tracks

### Memory Issues / Crashes

**Symptoms**: Browser tab crashes or says "Out of Memory".

**Solutions**:
1. **Save frequently**:
   - Use `Cmd+S` to save project
   - Enable auto-save in settings

2. **Clear undo history**:
   - Very long undo histories consume memory
   - Edit → Clear Undo History (cannot be undone!)

3. **Reload project**:
   - Save project
   - Refresh browser page
   - Reopen project (clears accumulated state)

4. **Browser limits**:
   - Web browsers have memory limits
   - Very large projects may hit limits
   - Consider splitting project

---

## UI Issues

### Board Switcher Won't Open

**Symptoms**: Press `Cmd+B` but nothing happens.

**Solutions**:
1. **Check focus**:
   - Click anywhere in the window first
   - Ensure you're not typing in a text field

2. **Try mouse click**:
   - Look for board switcher button (usually top-left)
   - Click it directly

3. **Keyboard conflict**:
   - Check if another app is capturing `Cmd+B`
   - Try closing other applications

### Decks Not Showing / Missing

**Symptoms**: Expected deck is not visible after switching boards.

**Solutions**:
1. **Board configuration**:
   - Not all decks are available on all boards
   - Manual boards hide AI/generator decks (by design)
   - Check board documentation for included decks

2. **Deck state**:
   - Deck might be minimized or closed
   - Look for deck tabs at edges of window
   - Board → Reset Layout to restore defaults

3. **Screen space**:
   - With limited screen space, decks might be off-screen
   - Try maximizing window
   - Reset layout to defaults

### Can't Close / Resize Deck

**Symptoms**: Deck seems stuck or won't resize.

**Solutions**:
1. **Resize handles**:
   - Look for thin borders between decks
   - Drag these borders to resize
   - Some minimum sizes are enforced

2. **Close button**:
   - Look for ✕ in deck header (top-right)
   - Some core decks can't be closed
   - Try `Cmd+W` to close focused deck

3. **Reset layout**:
   - Board menu → Reset Layout
   - Restores default deck arrangement

---

## Board & Deck Issues

### Board Switch Doesn't Apply Changes

**Symptoms**: Switch boards but see the same layout.

**Solutions**:
1. **Verify switch**:
   - Check board name in top-left
   - Ensure it actually changed

2. **Persistence**:
   - Boards remember your customized layout
   - Board → Reset Layout to restore defaults

3. **Refresh if needed**:
   - Try refreshing browser page
   - Reopen project

### Tool Disabled / Grayed Out

**Symptoms**: Can't access phrase library, generators, or other features.

**Solutions**:
1. **Check board type**:
   - Manual boards intentionally disable AI features
   - Assisted boards enable phrase library
   - Directed boards enable generators
   - Switch to appropriate board (`Cmd+B`)

2. **Board gating**:
   - This is by design—boards control available features
   - Not a bug! Choose a board with the tools you need

3. **Context requirements**:
   - Some tools require active selection
   - Some tools require specific deck open

### Project Compatibility Warning

**Symptoms**: "Project uses tools not available on this board".

**Solutions**:
1. **Switch boards**:
   - The warning suggests compatible boards
   - Click suggested board to switch

2. **Ignore if desired**:
   - Project will still work
   - Disabled tools just won't be accessible
   - Your data is safe

3. **Duplicate project**:
   - If experimenting with different boards
   - File → Save As → use different name

---

## AI & Generation Issues

### AI Not Generating / No Suggestions

**Symptoms**: Click generate but nothing happens.

**Solutions**:
1. **Check board type**:
   - AI features disabled on manual boards
   - Switch to assisted/directed board (`Cmd+B`)

2. **Check constraints**:
   - Very strict constraints might produce no results
   - Try relaxing parameters
   - Try different style presets

3. **Prolog engine**:
   - AI uses Prolog-based reasoning (not neural nets)
   - No network required—all local
   - Check browser console for errors

### AI Generated Bad Results

**Symptoms**: Generated music doesn't sound good.

**Solutions**:
1. **Adjust parameters**:
   - Try different style presets
   - Adjust density, swing, energy settings
   - Use seed parameter for reproducibility

2. **Regenerate**:
   - Click "Regenerate" for new variation
   - Each generation is different

3. **Edit results**:
   - Generated output is fully editable
   - Use AI as starting point, then tweak
   - This is the intended workflow!

4. **Understand AI limits**:
   - AI is rule-based, not "creative"
   - Works best as assistant, not composer
   - Best results come from human + AI collaboration

### Freeze Not Working

**Symptoms**: Frozen tracks still regenerate.

**Solutions**:
1. **Verify freeze**:
   - Check for "frozen" indicator (❄️)
   - Click freeze button again to confirm

2. **Board mode**:
   - Freeze only available on generative boards
   - Other boards don't regenerate anyway

3. **Manual edits**:
   - Editing frozen tracks is allowed
   - Freeze prevents automatic regeneration only

---

## Project & File Issues

### Project Won't Save

**Symptoms**: `Cmd+S` doesn't save project.

**Solutions**:
1. **Browser storage**:
   - CardPlay uses browser storage (IndexedDB)
   - Check if storage is full (Settings → Storage)
   - Clear old projects if needed

2. **Export project**:
   - File → Export Project (.cardplay file)
   - Saves to your Downloads folder
   - Provides backup and portability

3. **Browser permissions**:
   - Ensure browser allows local storage
   - Check privacy/security settings

### Project Won't Load

**Symptoms**: Open project but it fails to load.

**Solutions**:
1. **Check file format**:
   - Ensure it's a .cardplay file (not .json or other)
   - Try re-exporting from last known-good state

2. **File corruption**:
   - If file is corrupted, earlier versions might work
   - Check auto-save backups (if enabled)

3. **Version compatibility**:
   - Very old projects might not load in new versions
   - Check migration notes in release documentation

### Lost Work / Undo Limit Reached

**Symptoms**: Made mistake but can't undo far enough back.

**Solutions**:
1. **Undo history browser**:
   - Help → Undo History Browser
   - Shows full timeline of actions
   - Jump to any previous state

2. **Revert to saved**:
   - File → Revert to Last Saved
   - Loses all changes since last save

3. **Prevention**:
   - Save frequently (`Cmd+S`)
   - Enable auto-save in settings
   - Export project before major experiments

---

## MIDI & Hardware Issues

### MIDI Keyboard Not Working

**Symptoms**: Play MIDI keyboard but no response.

**Solutions**:
1. **Browser MIDI access**:
   - First time: browser asks for MIDI permission
   - Allow MIDI device access
   - Refresh page and try again

2. **MIDI device selection**:
   - Settings → MIDI → Input Device
   - Select your keyboard from list
   - Ensure it's plugged in before opening CardPlay

3. **MIDI channel**:
   - Most instruments listen to all channels
   - Check if keyboard is sending on channel 1

4. **Test in other apps**:
   - Verify keyboard works elsewhere
   - Check drivers/firmware if not

### MIDI Latency / Delay

**Symptoms**: Notes play late after pressing keys.

**Solutions**:
1. **Audio buffer**:
   - Settings → Audio → Buffer Size
   - Try 128 samples for lower latency

2. **Browser limitation**:
   - Web MIDI API has some latency
   - For pro recording, consider native DAW

3. **Check MIDI device**:
   - Some USB MIDI devices have inherent latency
   - Try different USB port
   - Use MIDI cable instead of USB if possible

---

## General Tips

### When All Else Fails

1. **Restart browser**: Fixes 80% of weird issues
2. **Clear cache**: Browser → Clear browsing data → Cached images and files
3. **Export project**: Save `.cardplay` file before experimenting
4. **Check console**: F12 → Console tab → look for errors
5. **Try different browser**: Chrome, Firefox, Safari, Edge
6. **Check system resources**: Close other apps, restart computer

### Best Practices

- **Save frequently** (`Cmd+S`)
- **Export backups** (File → Export Project)
- **Use templates** for new projects
- **Start simple**, add complexity gradually
- **Learn shortcuts** (press `Cmd+?`)
- **Read board docs** before using unfamiliar boards
- **Undo freely** (everything is undoable!)

### Getting More Help

- **In-app help**: Press `Cmd+?`
- **What's This? mode**: `Shift+F1` then click elements
- **Tutorials**: Help → Tutorials
- **Documentation**: Help → Documentation
- **Keyboard shortcuts**: Help → Keyboard Reference

---

## Reporting Bugs

If you encounter a bug not listed here:

1. **Note steps to reproduce**: Exactly what you did
2. **Note expected behavior**: What should happen
3. **Note actual behavior**: What actually happened
4. **Check browser console**: F12 → Console, copy any errors
5. **Note your environment**:
   - Browser name and version
   - Operating system
   - CardPlay version (Help → About)
   - Board you were using

---

*Last updated: 2026-01-29*

**Remember**: Most issues have simple solutions. Don't panic, save your work, and try the solutions above!
