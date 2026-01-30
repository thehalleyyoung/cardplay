# CardPlay System Requirements & Performance Characteristics

## System Requirements

### Minimum Requirements

**Hardware:**
- **CPU**: Any modern dual-core processor (2010 or newer)
  - Intel Core i3 / AMD Ryzen 3 or equivalent
  - Apple M1 or newer
- **RAM**: 4GB
- **Storage**: 500MB free space (for browser cache and projects)
- **Display**: 1280x720 resolution minimum
- **Audio**: Any audio output device (speakers/headphones)
- **Input**: Keyboard and mouse/trackpad

**Software:**
- **Operating System**: 
  - macOS 10.13 High Sierra or newer
  - Windows 10 or newer
  - Linux with modern kernel (Ubuntu 20.04+, Fedora 35+, etc.)
- **Browser** (one of):
  - Chrome/Chromium 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- **JavaScript**: Enabled (required)
- **Web Audio API**: Must be supported by browser
- **IndexedDB**: Must be enabled for project storage

### Recommended Requirements

**Hardware:**
- **CPU**: Quad-core processor (2015 or newer)
  - Intel Core i5/i7 / AMD Ryzen 5/7
  - Apple M1/M2
- **RAM**: 8GB or more
- **Storage**: 2GB+ free space
- **Display**: 1920x1080 (Full HD) or higher
  - Dual monitors supported and recommended
- **Audio**: Low-latency audio interface (optional but recommended for recording)
- **Input**: 
  - Keyboard and mouse
  - MIDI keyboard (optional, for musical input)
  - MIDI controller with knobs/faders (optional)

**Software:**
- **Browser**: Latest version of Chrome or Edge (best performance)
- **Browser extensions**: Minimal (disable ad blockers for best performance)

### Optimal Setup (Professional Use)

**Hardware:**
- **CPU**: 6+ core processor (2018 or newer)
  - Intel Core i7/i9 / AMD Ryzen 7/9
  - Apple M1 Pro/Max/Ultra or M2 equivalent
- **RAM**: 16GB+ (32GB for very large projects)
- **Storage**: SSD recommended (NVMe for best performance)
- **Display**: 
  - 2560x1440 (QHD) or 4K
  - Dual 1920x1080 or larger monitors
  - Color-accurate display for visual work
- **Audio**: 
  - Professional audio interface with ASIO/CoreAudio drivers
  - Studio monitors or high-quality headphones
- **Input**:
  - Full-size keyboard with numpad
  - Multi-button mouse or trackpad
  - MIDI keyboard with velocity-sensitive keys
  - MIDI controller with 8+ knobs/faders

**Software:**
- **Browser**: Chrome or Edge (latest), clean profile
- **Extensions**: None (for maximum performance)
- **OS**: Keep updated to latest version

---

## Performance Characteristics

### Browser Performance

#### Chrome/Edge (Chromium-based)
- ✅ **Best overall performance**
- ✅ Excellent Web Audio API implementation
- ✅ Fast canvas rendering
- ✅ Good memory management
- ⚠️ High RAM usage with many tabs

**Recommendation**: Best choice for professional use.

#### Firefox
- ✅ Good performance
- ✅ Respects user privacy
- ✅ Lower RAM usage than Chrome
- ⚠️ Slightly slower canvas operations
- ⚠️ Less aggressive JIT optimization

**Recommendation**: Excellent alternative, especially for privacy-conscious users.

#### Safari
- ✅ Best on macOS (native)
- ✅ Excellent battery life on MacBooks
- ✅ Good Web Audio API support
- ⚠️ Occasional compatibility quirks
- ⚠️ Slower JavaScript execution than Chrome

**Recommendation**: Good choice on macOS, especially for battery life.

#### Edge (Legacy)
- ❌ Not recommended
- ❌ Poor Web Audio API support
- ❌ No longer maintained by Microsoft

**Recommendation**: Upgrade to Chromium-based Edge.

### Performance Metrics

#### Startup Time
- **Cold start** (first load): 2-4 seconds
- **Warm start** (cached): 0.5-1 second
- **Board switching**: <100ms (instant feel)
- **Project loading**: 1-3 seconds (typical project)

#### Runtime Performance
- **UI frame rate**: 60 FPS target (maintained under normal load)
- **Audio latency**: 10-50ms (depends on buffer size)
  - 64 samples: ~1.5ms (may crackle)
  - 128 samples: ~3ms (recommended minimum)
  - 256 samples: ~6ms (stable, low latency)
  - 512 samples: ~12ms (very stable)
  - 1024 samples: ~23ms (maximum stability)
- **MIDI latency**: 5-15ms (browser-dependent)
- **Event processing**: 100,000+ events/sec

#### Memory Usage
- **Empty project**: ~50-100MB
- **Typical project** (10 tracks, 50 clips): ~200-400MB
- **Large project** (50 tracks, 200+ clips): ~500-800MB
- **Maximum recommended**: ~1GB (browser limits)

#### CPU Usage (Typical)
- **Idle** (not playing): 1-3%
- **Playback** (simple project): 5-15%
- **Playback** (complex project, many effects): 20-40%
- **Rendering/Export**: 50-100% (uses all available cores)

---

## Browser Settings for Best Performance

### General Settings

1. **Disable unnecessary extensions**
   - Ad blockers can interfere with audio timing
   - Script blockers will break the app
   - VPNs may add latency (disable for local use)

2. **Close other tabs**
   - Each tab consumes memory
   - Background tabs can steal CPU cycles
   - Aim for <10 total tabs when using CardPlay

3. **Enable hardware acceleration**
   - Chrome/Edge: `chrome://settings` → Advanced → System → "Use hardware acceleration"
   - Firefox: `about:preferences` → General → Performance → "Use hardware acceleration"

4. **Clear cache periodically**
   - Prevents slowdown from accumulated cached data
   - Chrome/Edge: `Cmd/Ctrl+Shift+Delete`
   - Firefox: `Cmd/Ctrl+Shift+Delete`

### Chrome/Edge Specific

1. **Increase site storage quota**
   - Chrome may limit IndexedDB storage
   - Check `chrome://settings/content/all` → cardplay domain

2. **Disable tab sleeping**
   - Chrome/Edge can suspend tabs to save memory
   - Settings → Performance → "Memory Saver" → Add CardPlay to exceptions

3. **Enable site isolation** (already default in recent versions)
   - Improves security and stability

### Firefox Specific

1. **Adjust process limits**
   - `about:config` → `dom.ipc.processCount` = 4 or higher
   - Allows more parallel processing

2. **Increase IndexedDB quota**
   - `about:config` → `dom.indexedDB.maxFileSize` = larger value (in KB)

3. **Enable multi-process audio**
   - Usually enabled by default in recent versions

---

## Platform-Specific Considerations

### macOS

**Advantages:**
- Excellent CoreAudio support (low latency)
- Safari optimized for battery life
- Trackpad gestures well-supported

**Tips:**
- Use Chrome/Edge for best performance
- Use Safari for best battery life
- Enable "Reduce Motion" if animations stutter (System Preferences → Accessibility → Display)

### Windows

**Advantages:**
- Widest hardware support
- Excellent Chrome/Edge performance
- ASIO drivers available for low latency

**Tips:**
- Use Chrome or Edge (Chromium)
- Install ASIO drivers for audio interface
- Disable Windows audio enhancements (can add latency)
- Use "High Performance" power plan when working

### Linux

**Advantages:**
- Very customizable
- Lightweight OS leaves more resources for browser
- Excellent for privacy-conscious users

**Tips:**
- Use Chrome or Firefox
- Configure JACK or PulseAudio for low latency
- Ensure `schedtool` or RT kernel for audio priority
- Consider dedicated audio user group with RT privileges

---

## Project Size Guidelines

### Small Project
- **Tracks**: 1-10
- **Clips**: 1-50
- **Events**: <10,000
- **RAM Usage**: ~100-200MB
- **Recommended Buffer**: 256 samples
- **Performance**: Excellent on any system

### Medium Project
- **Tracks**: 10-30
- **Clips**: 50-150
- **Events**: 10,000-50,000
- **RAM Usage**: ~300-500MB
- **Recommended Buffer**: 256-512 samples
- **Performance**: Good on recommended systems

### Large Project
- **Tracks**: 30-50
- **Clips**: 150-300
- **Events**: 50,000-100,000
- **RAM Usage**: ~500-800MB
- **Recommended Buffer**: 512-1024 samples
- **Performance**: Requires recommended or optimal system

### Very Large Project
- **Tracks**: 50+
- **Clips**: 300+
- **Events**: >100,000
- **RAM Usage**: ~800MB-1GB+
- **Recommended Buffer**: 1024 samples
- **Performance**: Requires optimal system, may hit browser limits

**Note**: If you hit browser memory limits, consider:
- Splitting project into multiple files
- Freezing AI-generated tracks
- Closing unused decks
- Reducing undo history
- Exporting stems and working with audio

---

## Troubleshooting Performance Issues

### Audio Crackling/Glitches
1. Increase buffer size (Settings → Audio → Buffer Size)
2. Close unused decks and browser tabs
3. Reduce number of active effects
4. Freeze tracks to reduce CPU load
5. Check CPU usage in Activity Monitor/Task Manager

### Slow UI / Laggy Interface
1. Close routing overlay when not needed
2. Reduce visual density (Settings → UI → Compact mode)
3. Disable visualizers temporarily
4. Restart browser to clear memory
5. Try different browser (Chrome usually fastest)

### Out of Memory Errors
1. Save project frequently
2. Close and reopen project (clears accumulated state)
3. Clear browser cache
4. Export project and start fresh session
5. Split into smaller projects

### High CPU Usage
1. Check for runaway processes in browser task manager
2. Disable AI features if not needed
3. Use manual boards instead of generative
4. Close other applications
5. Check for malware/crypto miners

---

## Mobile & Tablet Support

### Current Status
- ⚠️ **Experimental** - not officially supported
- Works on tablets with large screens (10"+)
- Not recommended for phones (screen too small)
- Touch interface functional but not optimized

### Limitations
- No keyboard shortcuts (on-screen keyboard required)
- Smaller hit targets (harder to tap precisely)
- Limited screen space for multiple decks
- May be slower due to mobile CPU/GPU
- Higher latency due to touch processing

### Future Plans
- Phase P may include tablet-optimized layouts
- Touch-friendly UI mode planned
- On-screen keyboard for note entry planned

**Current Recommendation**: Use desktop/laptop for best experience.

---

## Network Requirements

### Offline Capability
- ✅ **Fully offline** after initial load
- ✅ No cloud dependencies
- ✅ No analytics or tracking
- ✅ All AI runs locally (Prolog engine)

### Initial Load
- Requires internet connection to load application
- After first load, works entirely offline
- Browser caches all assets automatically

### Bandwidth Requirements
- **First load**: ~5-10MB download
- **Subsequent loads**: <1MB (cached)
- **Updates**: Automatic via browser cache

---

## Benchmarking Your System

To test if your system meets requirements:

1. **Open the demo project** (Help → Open Demo)
2. **Play for 2 minutes** and check:
   - Audio plays smoothly (no crackles)
   - UI stays responsive (60 FPS)
   - Memory usage stays reasonable (check browser task manager)

3. **Try complex operations**:
   - Create 20 tracks
   - Add 100 clips
   - Enable multiple effects
   - Open all decks simultaneously
   - Generate AI content

4. **Check browser task manager**:
   - Chrome/Edge: `Shift+Esc`
   - Firefox: `Shift+Esc` or `about:performance`
   - Look for: CPU %, Memory MB, FPS

If tests pass, your system is adequate!

---

*Last updated: 2026-01-29*

**Questions?** See the [Troubleshooting Guide](./troubleshooting.md) for performance optimization tips.
