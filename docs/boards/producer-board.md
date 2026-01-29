# Producer Board

**Control Level:** Collaborative (Hybrid)  
**Difficulty:** Advanced  
**Primary View:** Timeline (Arrangement)

## Overview

The Producer Board is a hybrid production board designed for complete track production workflows. It combines timeline-focused arrangement editing with a full mixer, device chains, and optional AI assistance for generating parts on demand. Perfect for users who want full production capabilities with the option to leverage generators when needed.

## Philosophy

**"Full production with optional generation - arrange, mix, and deliver"**

The Producer Board emphasizes:
- **Timeline-first workflow**: Arrange clips linearly for traditional DAW-style production
- **Full mixing capabilities**: Per-track volume, pan, effects, and routing
- **Optional AI assistance**: Generators available on-demand but not intrusive
- **Complete production**: From composition through mixing to final delivery

## Board Layout

### Center: Timeline
- Primary arrangement view showing clips across tracks
- Linear timeline editing (cut, copy, paste, trim, fade)
- Clip consolidation and bouncing
- Timeline-based automation editing

### Left: Browser Panel
- **Instrument Browser** (tab): Browse and add instruments to tracks
- **Sample Browser** (tab): Browse and audition samples
- Drag instruments/effects onto tracks
- Search and filter by category/tags

### Bottom: Mixer Panel
- Track volume, pan, mute, solo, arm controls
- Visual meters for level monitoring
- Quick access to essential mixing controls
- Collapsible for more timeline space

### Right: Inspector Panel
- **DSP Chain** (default): Device chain for selected track
- **Properties** (tab): Clip/event inspector
- **Session View** (tab): Alternative clip launching view
- Add/remove effects, reorder chain
- Edit clip properties (name, color, loop, duration)

### Top: Transport
- Play/pause, stop, record
- Tempo and time signature
- Loop region control
- Count-in settings

## Key Features

### Timeline Operations (I033, I045)
- **Split**: `S` - Split clip at playhead
- **Duplicate**: `Cmd+D` - Duplicate selected clips
- **Consolidate**: `Cmd+J` - Merge clips into single clip
- **Quantize**: `Q` - Quantize selected clips to grid
- **Bounce**: `Cmd+Shift+B` - Render selection to audio

### Mixing Workflow (I034, I045)
- Per-track mixer strips with full controls
- Visual level meters (peak + RMS)
- Mute/solo/arm buttons per track
- Quick mixer toggle: `Cmd+M`
- Automation lanes available as tab

### Device Chain (I036)
- DSP chain per track (effects rack)
- Drag effects from browser to chain
- Reorder effects within chain
- Bypass individual effects
- Edit effect parameters in properties

### Optional Generation (I029)
- Generators available on-demand
- Generate parts into new clips
- Does not replace manual workflow
- Full control over when to use AI

## Tool Configuration (I029)

- **Phrase Database**: Browse-only (inspiration without forcing AI)
- **Harmony Explorer**: Display-only (show key/chord context)
- **Phrase Generators**: On-demand (generate when requested)
- **Arranger Card**: Manual-trigger (user controls section structure)
- **AI Composer**: Hidden (focus on production, not composition AI)

## Deck Types (I033-I038)

1. **Timeline** (`arrangement-deck`): Primary arrangement view
2. **Instrument Browser** (`instruments-deck`): Add instruments
3. **Sample Browser** (`samples-deck`): Add samples
4. **Mixer** (`mixer-deck`): Mixing controls
5. **DSP Chain** (`dsp-chain`): Effect chain per track
6. **Properties** (`properties-deck`): Clip/event inspector
7. **Session View** (`session-deck`): Alternative clip view
8. **Transport** (`transport-deck`): Playback controls

## Keyboard Shortcuts (I045)

### Transport
- `Space`: Play/Pause
- `Cmd+.`: Stop
- `R`: Toggle record
- `L`: Toggle loop

### Timeline Editing
- `S`: Split clip at playhead
- `Cmd+D`: Duplicate selection
- `Cmd+J`: Consolidate clips
- `Q`: Quantize to grid
- `[`: Trim clip start
- `]`: Trim clip end
- `Cmd+[`: Fade in
- `Cmd+]`: Fade out
- `Cmd+Shift+B`: Bounce selection

### Mixer
- `Cmd+M`: Toggle mixer panel
- `A`: Toggle automation view

### Global
- `Cmd+Z`: Undo
- `Cmd+Shift+Z`: Redo
- `Cmd+X`: Cut
- `Cmd+C`: Copy
- `Cmd+V`: Paste
- `Cmd+A`: Select all

## Workflow Examples

### Basic Production Flow
1. **Add instruments**: Drag from browser to create tracks
2. **Record or import**: Record MIDI/audio or import clips
3. **Arrange**: Organize clips on timeline
4. **Mix**: Adjust levels, pan, add effects
5. **Automate**: Add automation for dynamic changes
6. **Bounce**: Export final mix

### Hybrid Workflow with Generation
1. **Generate drum pattern**: Use generator deck on-demand
2. **Accept or regenerate**: Listen and choose best take
3. **Edit manually**: Fine-tune generated pattern in timeline
4. **Generate bass line**: Use generator with chord context
5. **Mix generated + manual**: Treat all tracks equally
6. **Final production**: Mix, master, bounce to file

### Timeline-Focused Editing
1. **Import clips**: Drag samples or recordings to timeline
2. **Slice and arrange**: Split, move, trim clips
3. **Add transitions**: Crossfade between clips
4. **Add effects**: Insert effects on tracks
5. **Automate parameters**: Draw automation curves
6. **Consolidate regions**: Merge clips for simplicity

## Board Policy (I030, I045)

- **Tool Toggles**: Allowed (enable/disable generators)
- **Per-Track Control Levels**: Not allowed (consistent mixing workflow)
- **Deck Customization**: Allowed (rearrange panels)
- **Layout Customization**: Allowed (resize, collapse panels)

## Related Boards

- **Composer Board**: More composition-focused, less mixing
- **Basic Session Board**: Manual-only session view
- **Live Performance Board**: Performance-optimized session grid

## Technical Notes (I026-I038)

- Board ID: `producer`
- Control Level: `collaborative`
- Primary View: `arranger`
- Category: `Hybrid`
- Difficulty: `advanced`

## Future Enhancements (I039-I050)

- **Routing Overlay**: Visual routing graph for complex setups
- **Per-Track Control Badges**: Show manual vs generated tracks
- **Freeze Track**: Convert generated tracks to static audio
- **Render/Bounce**: Audio rendering with metadata
- **Automation Lanes**: Full parameter automation integration

## See Also

- [Board System Overview](./board-api.md)
- [Deck Types Reference](./decks.md)
- [Hybrid Boards Guide](./hybrid-boards.md)
- [Control Levels](./control-levels.md)
