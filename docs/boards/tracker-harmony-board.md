# Tracker + Harmony Board (G028)

**Category:** Assisted  
**Control Level:** Manual with Hints  
**Difficulty:** Intermediate  
**Primary View:** Tracker

## Overview

The Tracker + Harmony Board combines the precision of tracker-based composition with non-intrusive harmony hints. Perfect for composers who want to learn music theory while maintaining full manual control of their compositions.

## Philosophy

**"You write, it hints - learn harmony naturally"**

This board never auto-generates or suggests changes. Instead, it provides real-time visual feedback about the harmonic context of your notes, helping you understand and internalize music theory concepts through composition.

## Target Users

- **Learning composers** who want to understand harmony while composing
- **Tracker users** transitioning to harmonic awareness
- **Theory students** applying concepts in a creative context
- **Composers** who prefer manual control with gentle guidance

## Layout

```
┌──────────────────┬────────────────────────────┬────────────────┐
│ Harmony Display  │    Pattern Editor          │   Properties   │
│                  │    (Tracker)               │                │
│ - Current Key    │                            │ - Event props  │
│ - Current Chord  │    [Tracker Grid with     │ - Chord props  │
│ - Chord Tones    │     Harmony Highlighting] │ - Key context  │
│ - Scale Display  │                            │                │
│                  │                            │                │
│ [Instruments]    │    Pattern Length: 64      │                │
│  (tab)           │    Octave: 4              │                │
└──────────────────┴────────────────────────────┴────────────────┘
```

## Features

### Harmony Display Deck (Left Panel)

The harmony display shows your current harmonic context:

- **Current Key:** Shows the active key signature (e.g., C Major, A Minor)
- **Current Chord:** Displays the chord at the current playback position
- **Chord Tones:** Lists the notes that belong to the current chord
- **Scale Tones:** Shows all notes in the current scale
- **Roman Numeral Analysis:** Optional toggle for theory notation

### Pattern Editor with Harmony Hints (Center)

The tracker grid includes visual highlighting:

- **Chord Tones** (strong highlight): Notes that are in the current chord
- **Scale Tones** (medium highlight): Notes that are in the scale but not the chord
- **Out-of-Key** (subtle highlight): Notes outside the current scale

**Important:** The coloring is purely visual - it never modifies your notes.

### Properties Inspector (Right Panel)

- **Event Properties:** Edit note values, velocities, durations
- **Chord Settings:** View and edit chord at cursor position
- **Key Context:** Set the active key signature

## Composition Tools

| Tool | Status | Mode |
|------|--------|------|
| Harmony Explorer | ✓ Enabled | Display Only |
| Phrase Database | ✗ Disabled | - |
| Phrase Generators | ✗ Disabled | - |
| Arranger Card | ✗ Disabled | - |
| AI Composer | ✗ Disabled | - |

## Keyboard Shortcuts

### Pattern Navigation
- `Cmd+Down` - Next pattern
- `Cmd+Up` - Previous pattern
- `Cmd+D` - Clone pattern
- `F` - Toggle follow playback
- `L` - Toggle loop

### Harmony Controls
- `Cmd+K` - Set chord
- `Cmd+Shift+K` - Set key
- `Cmd+H` - Toggle harmony colors
- `Cmd+Shift+H` - Toggle roman numerals
- `Alt+Right` - Next chord suggestion
- `Alt+Left` - Previous chord suggestion

### Note Entry
- `Ctrl+Up` - Octave up
- `Ctrl+Down` - Octave down
- `Backslash` - Note off

### Standard Edits
- `Cmd+Z` - Undo
- `Cmd+Shift+Z` - Redo
- `Cmd+X` - Cut
- `Cmd+C` - Copy
- `Cmd+V` - Paste

## Workflow Examples

### Learning Chord Progressions

1. Set your key with `Cmd+Shift+K` (e.g., C Major)
2. Enter notes in the tracker as usual
3. Press `Cmd+K` to set a chord at the current position (e.g., C major)
4. Observe how your notes are highlighted:
   - Strong highlight = chord tones (C, E, G)
   - Medium highlight = scale tones (D, F, A, B)
   - Subtle = out-of-key notes
5. Move to a new section and set a new chord (e.g., F major)
6. See how the highlighting updates based on the new chord

### Exploring Voice Leading

1. Create a chord progression using `Cmd+K` at different positions
2. Enter melodic lines in the tracker
3. Toggle harmony colors (`Cmd+H`) to clearly see:
   - Which notes are chord tones vs passing tones
   - Where you're using chromaticism
4. Experiment with different melodic choices
5. Use the visual feedback to understand which notes create tension and resolution

### Understanding Scale Degrees

1. Set a key with `Cmd+Shift+K`
2. Enable roman numeral view with `Cmd+Shift+H`
3. Create a progression and see the roman numeral analysis
4. Observe how different chords (I, IV, V, etc.) highlight different notes

## Theme & Appearance

The Tracker + Harmony board uses a green-tinted theme to distinguish "hint" highlighting from manual editing:

- **Primary Color:** Green (`#10b981`) for hint indicators
- **Font:** Monospace (Fira Code, Consolas) for tracker grid
- **Control Indicators:** Show hints only, no suggestions or generative badges

## Best Practices

### For Learning Theory

- Start with simple keys (C Major, A Minor)
- Use diatonic chords (I, IV, V) before exploring more complex progressions
- Toggle harmony colors off occasionally to test your understanding
- Use roman numerals to understand functional harmony

### For Composition

- Set key/chords AFTER writing initial melodies to analyze what you naturally wrote
- Use the hints to experiment with reharmonization
- Keep harmony colors subtle (don't let them distract from composition)
- Remember: hints are guides, not rules - breaking them is fine!

## Settings & Preferences

The board allows these customizations:

- **Tool Toggles:** Yes - you can disable harmony display if needed
- **Per-Track Control Override:** No - tracker stays fully manual
- **Deck Customization:** No - fixed deck layout for consistent workflow
- **Layout Customization:** Yes - resize/collapse panels as needed

## Persistence

The board persists:

- Key signature (per stream/project)
- Chord events (in chord track stream)
- Harmony colors toggle state (per board)
- Roman numeral view toggle (per board)
- Panel sizes and collapse states

## Technical Notes

### Chord Source

The harmony display reads from a dedicated "chord track" stream in `SharedEventStore`. This means:

- Chord changes are editable like any other events
- Chord progressions are stored as part of your project
- Multiple tracks can reference the same chord progression
- Undo/redo works for chord edits

### Coloring Implementation

The harmony coloring is purely view-layer:

- Does **not** mutate event data
- Updates in real-time as you change chords/keys
- Syncs across tracker, piano roll, and notation views (if you switch boards)
- Performance-optimized with dirty region rendering

### Harmony Context

The harmony context (key + current chord) is stored in:

1. `ActiveContext` for the active key
2. Chord stream events for chord changes
3. Board-local preferences for display settings

## Limitations

- No automatic chord detection (must set chords manually)
- No chord suggestions beyond what you explicitly set
- No automatic harmonization or voice leading corrections
- Harmony display deck requires a chord stream to be created

## Recommended Next Steps

After mastering this board, consider:

- **Notation + Harmony Board** for staff-based composition with hints
- **Tracker + Phrases Board** for assisted composition with phrase library
- **Basic Tracker Board** for pure manual workflow without hints

## Related Documentation

- [Board System API](./board-api.md)
- [Tool Modes](./tool-modes.md)
- [Gating System](./gating.md)
- [Basic Tracker Board](./basic-tracker-board.md)

## Version History

- **v1.0.0** (2026-01-29): Initial implementation (G001-G030)
