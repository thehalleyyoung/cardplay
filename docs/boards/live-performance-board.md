# Live Performance Board

**Control Level:** Collaborative (Hybrid)  
**Difficulty:** Advanced  
**Primary View:** Session (Clip Launching)

## Overview

The Live Performance Board is a performance-optimized hybrid board designed for live clip launching and real-time control. It combines a session grid with arranger sections, modular routing visualization, and mixer controls for maximum performance flexibility. Supports both manual clip triggering and automated arrangement with per-track control level mixing.

## Philosophy

**"Performance-first, mix manual + arranger - optimized for live control"**

The Live Performance Board emphasizes:
- **Session-first workflow**: Launch clips and scenes in real-time
- **Visual feedback**: Large, clear controls for stage visibility
- **Quick access**: Essential controls within reach
- **Hybrid control**: Mix manual clips with generated/arranged parts
- **Performance macros**: Real-time parameter control

## Board Layout

### Top: Arranger Strip
- Section markers and structure controls
- Energy/intensity sliders per section
- Quick section navigation
- Visual overview of song structure
- Collapsible for more session space

### Center: Session Grid
- Primary clip launching interface
- Scene launching (launch full rows)
- Clip status indicators (playing/queued/stopped)
- Per-track recording arm
- Large hit targets for stage use

### Right: Routing Panel
- **Modular Routing** (default): Visual routing graph
- Connection patching in real-time
- Modulation matrix visualization
- Audio/MIDI routing overview
- Collapsible for more session space

### Bottom: Mixer Panel
- Quick mute/solo controls per track
- Visual meters (large for stage visibility)
- Essential mixing without deep diving
- Performance-optimized layout
- Collapsible for more session space

### Performance Macros (Tab)
- 8 assignable macro knobs
- Drive multiple parameters per macro
- MIDI learn support
- Save macro mappings per board

## Key Features

### Session Launching (I057, I069)
- **Launch Scene**: `1-5` - Launch scene by number
- **Next Scene**: `Down` - Move to next scene
- **Prev Scene**: `Up` - Move to previous scene
- **Stop All**: `Cmd+Shift+.` - Stop all playing clips

### Tempo Control (I061, I069)
- **Tempo Tap**: `T` - Tap tempo in real-time
- **Metronome**: `M` - Toggle click track
- Quantized launch settings per clip
- Count-in before recording

### Track Control (I060, I069)
- **Arm Track**: `Cmd+R` - Arm for recording
- **Mute Track**: `Cmd+M` - Mute output
- **Solo Track**: `Cmd+S` - Solo this track
- Visual activity indicators

### Emergency Controls (I065, I069)
- **Panic**: `Cmd+Shift+P` - All notes off
- **Stop All Clips**: `Cmd+Shift+.` - Emergency stop
- Reset routing to default
- Clear all queued actions

### Deck Reveal (I063)
- **Toggle Reveal**: `Cmd+E` - Show instrument details
- Quick parameter tweaking
- Return to session view
- MIDI activity per track

## Tool Configuration (I054)

- **Phrase Database**: Browse-only (live inspiration)
- **Harmony Explorer**: Display-only (show key/chord context)
- **Phrase Generators**: On-demand (generate during performance)
- **Arranger Card**: Chord-follow (automated arrangement)
- **AI Composer**: Hidden (focus on performance, not composition)

## Deck Types (I057-I062)

1. **Session Grid** (`session-deck`): Primary clip launching
2. **Arranger** (`arranger-deck`): Section structure + energy
3. **Routing** (`routing-deck`): Modular routing + modulation
4. **Mixer** (`mixer-deck`): Quick mute/solo + meters
5. **Transport** (`transport-deck`): Playback + tempo tap
6. **Performance Macros** (`properties-deck`): 8 macro knobs

## Keyboard Shortcuts (I069)

### Transport & Tempo
- `Space`: Play/Pause
- `Cmd+.`: Stop
- `T`: Tempo tap
- `M`: Toggle metronome

### Scene Launching
- `1-5`: Launch scene 1-5
- `Down`: Next scene
- `Up`: Previous scene

### Track Control
- `Cmd+R`: Arm track
- `Cmd+M`: Mute track
- `Cmd+S`: Solo track

### Emergency
- `Cmd+Shift+P`: Panic (all notes off)
- `Cmd+Shift+.`: Stop all clips

### Deck Reveal
- `Cmd+E`: Toggle deck reveal

### Global
- `Cmd+Z`: Undo
- `Cmd+Shift+Z`: Redo

## Workflow Examples

### Basic Performance Flow
1. **Load project**: Open session with pre-arranged clips
2. **Arm tracks**: Arm tracks for live recording
3. **Launch scenes**: Trigger scenes with number keys
4. **Mix live**: Adjust levels, mute/solo tracks
5. **Tempo adjustments**: Tap tempo to match vibe
6. **Record output**: Capture performance to arrangement

### Hybrid Performance
1. **Manual clips**: Launch pre-recorded loops manually
2. **Generated parts**: Use arranger for automated background
3. **Per-track control**: Some tracks manual, others generated
4. **Real-time routing**: Patch modulation in routing panel
5. **Macro control**: Twist macros for dynamic changes
6. **Emergency stops**: Use panic if things go wrong

### Improvised Session
1. **Empty grid**: Start with blank session
2. **Record loops**: Record clips on the fly
3. **Build arrangement**: Layer loops progressively
4. **Generate fills**: Use generators for transitions
5. **Dynamic mixing**: Mute/solo tracks for variation
6. **Capture to timeline**: Save good takes to arrangement

## Per-Track Control Levels (I067-I068)

The Live Performance Board supports **per-track control levels**, allowing you to mix:
- **Manual tracks**: Full manual clip launching
- **Assisted tracks**: Clips with harmony hints
- **Directed tracks**: Arranger-generated clips
- **Generative tracks**: Continuously generated content

### Visual Indicators
- **Color strips**: Each track shows control level color
- **Session headers**: Control level badge on each column
- **Mixer strips**: Color coding on mixer channels
- **Activity lights**: Visual feedback during performance

## Board Policy (I054, I067)

- **Tool Toggles**: Not allowed (lock tools during performance)
- **Per-Track Control Levels**: Allowed (mix manual + generated)
- **Deck Customization**: Not allowed (lock layout during performance)
- **Layout Customization**: Not allowed (prevent accidental changes)

## Performance Optimization

### Visual Design (I052, I069)
- **Larger text**: 14pt for stage visibility
- **High contrast**: Dark background, bright accents
- **Large hit targets**: Easy to click during performance
- **Activity indicators**: Clear visual feedback
- **Color coding**: Red (live), amber (armed), green (playing)

### CPU Management (I073)
- Meter updates throttled to 30fps
- Render loop uses `requestAnimationFrame`
- Efficient clip state updates
- Minimal garbage collection during playback

### MIDI Resilience (I074)
- Handle device disconnect gracefully
- Reconnect without crashing
- Clear error messages
- MIDI activity visualization per track

## Related Boards

- **Basic Session Board**: Manual-only session view
- **Composer Board**: Composition-focused hybrid
- **Producer Board**: Timeline-focused production

## Technical Notes (I051-I062)

- Board ID: `live-performance`
- Control Level: `collaborative`
- Primary View: `session`
- Category: `Hybrid`
- Difficulty: `advanced`

## Future Enhancements (I063-I075)

- **Deck Reveal**: Quick instrument parameter access
- **MIDI Activity**: Visual MIDI input per track
- **Panic Controls**: Enhanced emergency stop features
- **Performance Capture**: Record session launch history
- **60fps Updates**: Optimize visual feedback loop
- **Tempo Sync**: Accurate generator tempo following

## Performance Tips

1. **Pre-arm tracks**: Arm tracks before starting performance
2. **Use scenes**: Organize clips into logical scenes
3. **Learn shortcuts**: Memorize scene launch numbers
4. **Test panic**: Practice emergency stops before show
5. **Monitor meters**: Watch for clipping/distortion
6. **Use macros**: Assign key parameters to macros
7. **Lock layout**: Prevent accidental panel changes
8. **Large display**: Use external monitor for better visibility

## Troubleshooting

### Clips not launching
- Check track arm status
- Verify clip exists and is valid
- Check transport is playing
- Verify quantization settings

### Tempo drift
- Use tempo tap to resync
- Check generator tempo settings
- Verify transport sync mode

### MIDI issues
- Check device connections
- Verify MIDI learn mappings
- Test with panic/all notes off
- Reconnect device if needed

## See Also

- [Board System Overview](./board-api.md)
- [Session View Guide](./session-view.md)
- [Hybrid Boards Guide](./hybrid-boards.md)
- [Control Levels](./control-levels.md)
- [Performance Macros](./macros.md)
