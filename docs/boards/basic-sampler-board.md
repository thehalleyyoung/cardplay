# Basic Sampler Board (Manual)

## Overview

The **Basic Sampler Board** provides a manual sample-based composition environment. You import, chop, arrange, and process samples with complete manual control. No AI generation or auto-slicing.

## Target Users

- Sample-based producers
- Beat makers using samples
- Sound designers working with recordings
- SP-404/MPC-style workflow users
- Experimental musicians using found sounds

## Philosophy

> "You chop, you arrange - pure manual sampling"

This board gives you complete control over:
- Sample import and organization
- Manual and grid-based chopping
- Timeline arrangement
- DSP effects chain
- Sample properties (pitch, time-stretch, etc.)

## Layout

### Panel Configuration

```
┌────────────────────────────────────────────────────────────┐
│ Sample Pool   │  Arrangement (Timeline)      │ Properties  │
│  (Left)       │       (Center)               │  (Right)    │
│               ├──────────────────────────────┤             │
│ • Samples     │  Waveform Editor (Bottom)    │             │
│ • Folders     │  • Chop                      │             │
│ • Preview     │  • Stretch                   │             │
│               │  • Effects                   │             │
└────────────────────────────────────────────────────────────┘
```

### Decks

1. **Sample Browser Deck** (Left)
   - Type: `samples-deck`
   - Import WAV/AIFF files
   - Organize in folders
   - Waveform preview
   - Drag samples to timeline or pads

2. **Arrangement Deck** (Center)
   - Type: `arrangement-deck`
   - Timeline view of clips
   - Multi-track layout
   - Snap-to-grid support
   - Manual clip placement

3. **DSP Chain Deck** (Effects)
   - Type: `dsp-chain`
   - Per-track effect chain
   - Manual effects only (no AI processing)
   - Reorderable effect stack

4. **Properties Panel** (Right)
   - Type: `properties-deck`
   - Sample/clip metadata
   - Pitch shift controls
   - Time stretch settings
   - Loop points

## Keyboard Shortcuts

### Sample Management
- `Cmd+I` - Import sample(s)
- `Space` - Audition/preview sample

### Chopping
- `Cmd+K` - Chop to grid (quantized slices)
- `Cmd+Shift+K` - Manual chop at playhead
- `Cmd+E` - Split clip at playhead

### Waveform Editing
- `Cmd+Plus` - Zoom in waveform
- `Cmd+Minus` - Zoom out waveform
- `N` - Toggle snap to grid

### Processing
- `Cmd+T` - Time stretch dialog
- `Cmd+P` - Pitch shift dialog
- `Cmd+N` - Normalize selection
- `Cmd+R` - Reverse selection
- `Shift+I` - Fade in
- `Shift+O` - Fade out

### Arrangement
- `Cmd+D` - Duplicate selected clip
- `Delete` - Delete selected clip
- `Cmd+Z` / `Cmd+Shift+Z` - Undo/Redo

## Tool Configuration

All AI tools are **disabled and hidden**:

```typescript
compositionTools: {
  phraseDatabase: { enabled: false, mode: 'hidden' },
  harmonyExplorer: { enabled: false, mode: 'hidden' },
  phraseGenerators: { enabled: false, mode: 'hidden' },
  arrangerCard: { enabled: false, mode: 'hidden' },
  aiComposer: { enabled: false, mode: 'hidden' }
}
```

Pure manual sampling workflow with no generation.

## Theme

The sampler board uses a vibrant, production-focused dark theme:

- **Primary Color:** `#ff9f1c` (amber/orange)
- **Secondary Color:** `#2ec4b6` (teal)
- **Accent Color:** `#e71d36` (red for active states)
- **Background:** `#011627` (dark blue-black)
- **Font:** `"Inter", sans-serif` (clean modern sans)

Colors optimized for long sessions and waveform visibility.

## Workflow Examples

### Basic Beat Making
1. Import drum samples (kick, snare, hats)
2. Chop breakbeat loops to grid
3. Arrange clips on timeline
4. Add DSP effects (compression, EQ, reverb)
5. Export final mix

### Sample Manipulation
1. Import raw audio recording
2. Manual chop at transients
3. Time-stretch individual slices
4. Pitch-shift for harmonics
5. Arrange in musical sequence

### Pad-Based Performance (Future)
1. Load samples into pad grid
2. Assign to MIDI controller
3. Record performance to timeline
4. Edit and arrange recorded clips

## Data Integration

### Sample Storage
- Samples stored as asset references (not embedded)
- Waveform cached for fast preview
- Original files remain on disk
- Metadata stored in ClipRegistry

### Timeline Clips
```
Sample Reference
    ↓
ClipRecord (ClipRegistry)
    ↓
Timeline Placement
    ↓
Playback via Audio Engine
```

All clips reference streams in `SharedEventStore` for consistency.

## Import/Export

### Supported Import Formats
- WAV (16/24/32-bit)
- AIFF
- MP3 (decoded to WAV)
- FLAC (decoded to WAV)
- OGG (decoded to WAV)

### Export Options
- Render timeline to WAV/AIFF
- Bounce individual clips
- Export with/without effects
- Stem export (per-track)

## Empty States

When no samples are loaded:
> "No samples — import WAV/AIFF"

When timeline is empty:
> "No arrangement — drag clips from sample pool"

All prompts guide toward manual actions, never generation.

## Best Practices

### Organizing Samples
- Use folders by instrument type (Drums, Bass, Synths, FX)
- Tag samples with BPM and key
- Preview before dropping to timeline
- Keep originals separate from processed versions

### Chopping Strategies
- **Grid Chop:** Perfect for rhythmic material
- **Manual Chop:** Best for melodic content or speech
- **Transient Detection:** Use waveform zoom to find peaks

### Time Stretching
- Use high-quality algorithm for melodic content
- Use fast/granular for rhythmic percussion
- Preserve formants for vocal samples

### Effect Chain Order
Recommended signal flow:
1. EQ (cut/boost)
2. Compression
3. Saturation/Distortion
4. Reverb/Delay
5. Limiting (final)

## Performance Considerations

### Memory Management
- Large samples may need streaming mode
- Enable RAM preview for short samples
- Unload unused samples to free memory

### CPU Usage
- Time-stretch is CPU-intensive (render offline when possible)
- Limit real-time effects per track
- Freeze tracks with heavy processing

## Limitations

### What This Board Does NOT Do
- ❌ No auto-chopping or beat detection
- ❌ No AI-based sample suggestions
- ❌ No automatic time-stretching to project tempo
- ❌ No generative sample synthesis

### When to Switch Boards
If you want AI assistance:
- **Producer Board** (hybrid) - Mix sampling + generators
- **Session + Generators** (assisted) - Add generative parts
- **Live Performance Board** (hybrid) - Live sampling + effects

## Technical Details

### Sample Processing Pipeline
```
Import → Decode → Normalize → Slice → Arrange → Effect Chain → Mix
```

All steps are manual and undoable.

### Clip References
- Clips reference original sample file + start/end points
- Non-destructive editing (original file never modified)
- Processed versions cached for playback

## Related Documentation

- [Board API Reference](./board-api.md)
- [DSP Chain Implementation](./decks.md#dsp-chain)
- [Arrangement Deck](./decks.md#arrangement-deck)
- [Sample Browser Deck](./decks.md#sample-browser)
- [Tool Gating Rules](./gating.md)

## See Also

- [Basic Session Board](./basic-session-board.md) - Clip launching alternative
- [Producer Board](./producer-board.md) - Hybrid sampling + synthesis
- [Modular Routing Board](./modular-routing-board.md) - Advanced signal routing
