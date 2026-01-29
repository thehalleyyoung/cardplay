# Composer Board

**Control Level:** Collaborative (Hybrid)  
**Difficulty:** Expert  
**Philosophy:** "Mix manual + assisted per track"

## Overview

The Composer Board is a hybrid power-user board that combines manual composition, AI assistance, phrase libraries, and harmony suggestions in a single comprehensive workspace. It supports **per-track control levels**, allowing you to mix fully manual tracks with AI-assisted or AI-directed tracks in the same project.

## Board Layout

```
┌────────────────────────────────────────────────────────┐
│  Arranger Sections Bar + Transport                    │
├────────────────────────────────────────────────────────┤
│  Chord Track Lane                                      │
├──────────────┬─────────────────────┬───────────────────┤
│  Phrase Lib  │  Session Grid       │  Generator Deck   │
│  (Left)      │  (Center)           │  (Right)          │
│              │                     │                   │
├──────────────┴─────────────────────┴───────────────────┤
│  Notation / Pattern Editor (Tabs)                     │
└────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Per-Track Control Levels (I021-I022)

The defining feature of the Composer Board is **per-track control**:

- **Manual tracks:** Pure manual composition, no AI interference
- **Assisted tracks:** Manual work with harmony hints and phrase suggestions
- **Directed tracks:** AI generates parts based on your chord progression

Control levels persist per-track in your project, so you can:
- Compose melody manually in notation
- Have AI generate a walking bass following your chords
- Add drum patterns from the phrase library
- Let harmony helper suggest chord progressions

### 2. Comprehensive Deck Set

#### Arranger Sections Bar (I008)
- Define song structure (Intro, Verse, Chorus, etc.)
- Set section lengths and transitions
- Follows chord track for harmonic context

#### Chord Track Lane (I009)
- Edit chord progressions visually
- Feeds harmony context to generators
- Supports voice-leading analysis

#### Session Grid (I010)
- Launch clips and scenes
- Selecting a clip updates notation/tracker editors
- Mix clip-based and timeline-based workflows

#### Notation Editor (I011)
- Full notation score editing
- Syncs to active clip's stream
- Tabbed with tracker for alternate view

#### Pattern Editor / Tracker (I012)
- Tracker-style event editing
- Same stream as notation (real-time sync)
- Tabbed with notation in same panel

#### Generator Deck (I014)
- On-demand part generation
- Follows chord track automatically
- Generate melody, bass, drums, pads

#### Phrase Library (I015)
- Drag/drop phrases into editors
- Adapts to current chord context
- Tag-based search and favorites

### 3. Intelligent Connections

The board automatically wires:
- Chord track → Generator (harmony context)
- Session grid → Editors (active clip context)
- Arranger → All decks (section timing)

### 4. Advanced Workflows

#### Hybrid Composition (I019-I020)
1. Set up chord progression in chord track
2. Generate bass and drums (directed mode)
3. Compose melody manually in notation
4. Add fills from phrase library
5. Freeze generated parts to edit details

#### Quick Sketching
1. Launch session scene with generators
2. Accept promising clips
3. Refine in notation/tracker
4. Arrange in arranger sections

## Shortcuts

### Composition
- `Cmd+G` — Generate part in active track
- `Cmd+Shift+G` — Regenerate part
- `Cmd+F` — Freeze part (make editable)

### Navigation
- `Cmd+1` — Focus notation editor
- `Cmd+2` — Focus tracker editor
- `Cmd+3` — Focus session grid

### Tools
- `Cmd+H` — Toggle harmony display
- `Cmd+P` — Toggle phrase library
- `Cmd+M` — Toggle mixer

### Transport
- `Space` — Play/pause
- `Cmd+Enter` — Play from start
- `Esc` — Stop

### Editing
- `Cmd+D` — Duplicate clip
- `Cmd+Shift+D` — Duplicate section
- `Cmd+J` — Consolidate clips

## Use Cases

### Orchestral Composition
- Use notation as primary editor
- Manual string parts, generated brass fills
- Phrase library for orchestral gestures
- Harmony helper for voice leading

### Electronic Production
- Session grid for clip launching
- Tracker for precise drum programming
- Generators for melodic variations
- Chord track for harmonic structure

### Hybrid Workflow
- Manual verse composition
- AI-generated chorus variations
- Phrase library for transitions
- Per-track control for maximum flexibility

## Tips

1. **Start with structure:** Define sections in arranger before composing
2. **Set up chords first:** Chord track guides all generators
3. **Mix control levels:** Don't be afraid to use different modes per track
4. **Freeze for detail:** Generate parts, then freeze to tweak manually
5. **Use tabs efficiently:** Notation for harmony, tracker for rhythm

## Technical Details

### Per-Track State Persistence (I022)
Track control levels are stored in board state:
```typescript
{
  trackId: 'bass',
  controlLevel: 'directed',
  generatorSettings: { density: 0.7, style: 'walking' }
}
```

### Scroll/Zoom Sync (I020)
All timeline views (arranger, chord track, session) share:
- Horizontal zoom level
- Scroll position
- Snap settings

### Connection Types
- **Modulation:** Chord track → Generator (harmony data)
- **Trigger:** Session → Editors (active clip changes)
- **Audio:** All decks → Master output

## Integration Tests (I024)

The board includes comprehensive integration tests:
- Selecting session clip updates notation editor
- Chord changes update generator suggestions
- Generated parts can be frozen and edited
- Per-track control levels persist across sessions

## Future Enhancements (I025+)

Planned features:
- AI composer inline suggestions (I005)
- Visual diff for generated variations (I017-I018)
- Performance capture to timeline (I066)
- Macro automation across decks (I062)

## Related Boards

- **Producer Board:** Timeline-focused production workflow
- **Live Performance Board:** Performance-optimized layout
- **AI Composition Board:** Full AI-driven composition
- **Notation + Harmony Board:** Assisted notation composition
