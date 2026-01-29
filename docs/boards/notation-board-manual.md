# Notation Board (Manual)

## Overview

The **Notation Board (Manual)** provides a pure traditional score composition environment with no AI assistance or suggestions. It's designed for composers who want complete manual control over every note and articulation.

## Target Users

- Classical composers
- Film score composers
- Music educators preparing scores
- Arrangers preparing parts
- Anyone who prefers traditional notation workflow

## Philosophy

> "Manual notation composition only"

This board provides zero suggestions and zero automation. You have complete control over:
- Note placement and duration
- Articulations and dynamics
- Staff configuration
- Engraving rules
- Part extraction

## Layout

### Panel Configuration

```
┌─────────────────────────────────────────────────────────┐
│  Instruments (Left)    │  Score (Center)  │ Properties  │
│                        │                  │  (Right)    │
│  • Instrument Browser  │  • Notation Deck │  • Inspector│
│  • Add instruments     │  • Multiple      │  • Note     │
│  • Manual selection    │    staves        │    details  │
│                        │  • Engraving     │  • Dynamics │
│                        │                  │  • Timing   │
└─────────────────────────────────────────────────────────┘
```

### Decks

1. **Notation Score Deck** (Center)
   - Type: `notation-deck`
   - Primary composition surface
   - Multiple staff support
   - Full engraving control

2. **Instrument Browser** (Left)
   - Type: `instruments-deck`
   - Manual instruments only (no generators)
   - Drag to add to score

3. **Properties Panel** (Right)
   - Type: `properties-deck`
   - Edit selected notes/chords
   - Articulation controls
   - Voice assignment

## Keyboard Shortcuts

### Note Entry
- `C, D, E, F, G, A, B` - Enter note pitches
- `Shift+3` - Sharp accidental
- `Shift+-` - Flat accidental
- `Shift+=` - Natural accidental

### Durations
- `1` - Whole note
- `2` - Half note
- `4` - Quarter note
- `8` - Eighth note
- `6` - Sixteenth note
- `.` (Period) - Toggle dot
- `T` - Toggle tie

### Score Navigation
- `Cmd+Shift+S` - Add staff
- `K` - Change clef
- `Cmd+T` - Transpose selection

### Actions
- `Cmd+E` - Export PDF
- `Cmd+Z` - Undo
- `Cmd+Shift+Z` - Redo

## Tool Configuration

All composition tools are **disabled and hidden**:

```typescript
compositionTools: {
  phraseDatabase: { enabled: false, mode: 'hidden' },
  harmonyExplorer: { enabled: false, mode: 'hidden' },
  phraseGenerators: { enabled: false, mode: 'hidden' },
  arrangerCard: { enabled: false, mode: 'hidden' },
  aiComposer: { enabled: false, mode: 'hidden' }
}
```

This ensures a pure manual workflow with no suggestions.

## Theme

The notation board uses a clean, print-focused theme:

- **Primary Color:** `#2c3e50` (slate blue)
- **Secondary Color:** `#34495e` (darker slate)
- **Accent Color:** `#3498db` (bright blue)
- **Background:** `#ffffff` (white)
- **Font:** `"Bravura", "Academico", serif` (music fonts)

## Empty States

When no score is present:
> "No score yet — add notes or import MIDI"

Suggests manual actions only, no generation prompts.

## Import/Export

### Supported Imports
- MIDI files (.mid, .midi)
- MusicXML (.xml, .musicxml)
- Manual note entry

### Supported Exports
- PDF (print-ready)
- MusicXML (for sharing)
- MIDI (for playback)
- Lilypond (for advanced engraving)

## Data Flow

```
User Input (Keyboard/Mouse)
    ↓
Notation Deck (UI)
    ↓
notation-store-adapter.ts (Bidirectional)
    ↓
SharedEventStore (Source of Truth)
    ↓
← Sync to Piano Roll / Tracker (Same Stream)
```

All edits write to `SharedEventStore`, ensuring consistency across views.

## Best Practices

### Starting a New Score
1. Add staves for each instrument/voice
2. Set time signature and key
3. Enter notes using keyboard shortcuts
4. Use properties panel for articulations
5. Check engraving in print preview

### Part Extraction
1. Select specific staves
2. Export → Parts
3. Automated layout for individual parts
4. Manual adjustments in properties panel

### Collaboration
- Export MusicXML for sharing with notation software
- Import MIDI from DAWs for scoring
- All data stays in SharedEventStore (safe)

## Limitations

### What This Board Does NOT Do
- ❌ No chord suggestions
- ❌ No harmony analysis
- ❌ No phrase libraries
- ❌ No auto-voice leading
- ❌ No AI composition

### When to Switch Boards
If you want AI assistance, consider:
- **Notation + Harmony Board** (assisted) - Chord suggestions
- **Composer Board** (hybrid) - Mix manual + AI per track

## Related Documentation

- [Board API Reference](./board-api.md)
- [Notation Deck Implementation](./decks.md#notation-deck)
- [Tool Gating Rules](./gating.md)
- [Board State Persistence](./board-state.md)

## See Also

- [Basic Tracker Board](./basic-tracker-board.md) - For pattern-based composition
- [Basic Session Board](./basic-session-board.md) - For clip-based composition
- [Tracker + Harmony Board](./tracker-harmony-board.md) - Assisted alternative
