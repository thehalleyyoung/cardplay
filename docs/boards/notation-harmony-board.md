# Notation + Harmony Board

**Board ID:** `notation-harmony`  
**Category:** Assisted  
**Difficulty:** Intermediate to Advanced  
**Philosophy:** Write notes, get harmonic guidance - learn composition through practice

## Overview

The Notation + Harmony Board combines traditional score editing with intelligent harmonic suggestions. As you compose, the board suggests chord progressions, highlights voice leading opportunities, and provides harmonic analysis. Perfect for classical composers, orchestrators, and anyone wanting to improve their harmonic writing.

## When to Use

- Learning voice leading and part writing
- Composing with harmonic awareness (SATB, chamber, orchestral)
- Exploring chord progressions with suggestions
- Educational contexts (teaching harmony through composition)
- When you want suggestions but retain final control
- Classical/jazz composition with theory support

## Control Philosophy

**Assisted:** The board suggests next chords, highlights voice leading paths, and provides harmonic analysis. You choose whether to accept suggestions. All final decisions are yours. No auto-application without confirmation.

## Layout

Three-panel layout optimized for score composition with harmony:

- **Left Panel (Harmony):** Harmony helper with suggestions and analysis
- **Center Panel (Score):** Notation score (main workspace)
- **Right Panel (Inspector):** Properties for note/chord/voice settings

## Available Decks

### Notation Score Deck (Center Panel)
- **Type:** `notation-deck`
- **Purpose:** Main score editing surface
- **Harmony Integration:**
  - Chord tones highlighted in staff (subtle overlay)
  - Voice leading indicators (arrows between notes)
  - Non-destructive analysis (no mutation of score)
- **Features:**
  - Standard notation entry (mouse, MIDI, keyboard)
  - Multiple staves with part extraction
  - Engraving quality output
  - Print/export PDF

### Harmony Helper Deck (Left Panel)
- **Type:** `harmony-deck`
- **Purpose:** Harmonic suggestions and analysis
- **Features:**
  - Current key/chord display
  - **Suggested next chords** (clickable to insert)
  - Roman numeral analysis
  - Voice leading quality indicators
  - Chord tone list
  - Scale degree labels
- **Suggestion System:**
  - Analyzes existing harmony
  - Proposes likely next chords (I, IV, V, ii, vi, etc.)
  - Shows voice leading distance for each option
  - Non-intrusive: suggestions are offers, not commands

### Instrument Browser Deck (Optional Tab)
- **Type:** `instruments-deck`
- **Purpose:** Browse and load virtual instruments
- **Gating:** Manual instruments + sampled instruments

### Properties Deck (Right Panel)
- **Type:** `properties-deck`
- **Purpose:** Edit selected note/chord/voice properties
- **Harmony Features:**
  - Set chord symbol (writes to chord track)
  - Set key/modulation
  - Voice leading mode selector
  - Snap-to-chord-tones helper (optional)
  - Reharmonization options

## Harmony Suggestion System

### How It Works

1. **Analysis:** Board analyzes existing harmony in score
2. **Context:** Determines key, current chord, voice leading state
3. **Suggestions:** Proposes likely next chords based on common progressions
4. **Ranking:** Orders by voice leading quality and harmonic strength
5. **Display:** Shows suggestions in harmony helper deck

### Suggestion Types

- **Functional Progressions:** I→IV, V→I, ii→V, etc.
- **Voice Leading:** Smooth voice motion preferred
- **Modal Interchange:** Borrowed chords (if enabled)
- **Jazz Extensions:** 7ths, 9ths, alterations (if jazz mode)

### Accepting Suggestions

- **Click Suggestion:** Inserts chord symbol into chord track
- **Optional:** Can auto-harmonize selection with chord tones
- **Always Undoable:** Full undo/redo support
- **Manual Override:** You can ignore suggestions entirely

## Keyboard Shortcuts

### Harmony Actions
- **Cmd+Shift+C** - Set chord symbol
- **Cmd+Shift+K** - Set key / modulation
- **Cmd+H** - Toggle chord tone highlights
- **Cmd+Shift+H** - Show suggested harmonizations
- **Cmd+J** - Apply voice leading optimization (snap to best voice motion)
- **Cmd+R** - Toggle roman numeral analysis
- **Cmd+Shift+R** - Reharmonize selection (show alternatives)

### Notation Entry (Standard)
- **C, D, E, F, G, A, B** - Note names
- **1, 2, 4, 8, 6** - Note durations
- **Shift+3, Shift+Minus** - Accidentals (sharp, flat)
- **T** - Toggle tie
- **Period** - Toggle dot

### Navigation
- **Arrow Keys** - Move cursor
- **Cmd+Left/Right** - Jump measures
- **Cmd+Up/Down** - Jump staves

### Standard
- **Cmd+Z** - Undo
- **Cmd+Shift+Z** - Redo
- **Cmd+E** - Export PDF

## Recommended Workflows

### Learning Voice Leading (SATB)

1. Set key (e.g., "C major")
2. Write soprano melody
3. Enable chord tone highlights
4. See harmony suggestions for each melody note
5. Click suggestion to set chord
6. Write alto/tenor/bass following voice leading hints
7. Toggle `Cmd+J` to snap to smooth voice motion
8. Learn which voice motions sound best

### Composing with Chord Progressions

1. Plan chord progression in harmony helper
2. Write progression into chord track (click suggestions)
3. Compose melody using chord tone highlights
4. Fill in harmonization using voice leading hints
5. Adjust for musical taste (suggestions are guides, not rules)

### Reharmonization

1. Select existing melody
2. Press `Cmd+Shift+R` to see alternative harmonizations
3. Compare options (voice leading quality shown)
4. Click to apply alternative
5. Undo if you prefer original

### Exploring Modulations

1. Set initial key
2. Write transition passage
3. Press `Cmd+Shift+K` at pivot point
4. Set new key
5. See suggestions adapt to new tonal center
6. Harmony helper guides smooth modulation

## Tools Enabled

- **Harmony Explorer:** `suggest` mode
  - Suggests next chords based on context
  - Provides voice leading hints
  - Displays roman numeral analysis
  - Offers reharmonization alternatives
  - Non-intrusive (suggestions, not auto-application)

## Tools Optional (Can Enable)

- **Phrase Database:** `browse-only` mode (for classical phrase examples)

## Tools Disabled

- **Phrase Generators:** Hidden (use manual composition)
- **Arranger Card:** Hidden (manual form/structure)
- **AI Composer:** Hidden (manual note-by-note composition)

## Theme

The board uses an **assisted notation palette** optimized for readability:

- **Primary:** Deep navy (score background)
- **Secondary:** Soft gold (harmony suggestions)
- **Accent:** Warm red (voice leading hints)
- **Background:** Light mode for print preview compatibility

Chord tone highlights are subtle (pastel colors) and non-distracting.

## Recommendations

This board is recommended for:

- **"Traditional composer"** wanting harmony support
- **"Orchestral / education"** workflows
- **"Jazz composer"** learning voice leading
- **"Beginner"** learning harmony through composition
- **"Classical"** writers (SATB, chamber music)

## Educational Use

Perfect for:
- Teaching four-part harmony and voice leading
- Learning functional harmony through composition
- Understanding chord progressions by seeing suggestions
- Developing harmonic ear through visual reinforcement
- Part-writing exercises with immediate feedback

## Harmonic Analysis Features

### Roman Numeral Analysis (Optional)
- Shows function of each chord (I, IV, V, ii, vi, etc.)
- Displays inversions (I⁶, V⁷, etc.)
- Secondary dominants (V/V, V/vi, etc.)
- Modal interchange indicators

### Voice Leading Quality Indicators
- **Good:** Smooth motion, common tones, minimal leaps
- **Acceptable:** Some leaps, good voice independence
- **Poor:** Parallel fifths/octaves, awkward leaps, crossing

### Suggested Chord Rankings
1. ★★★ - Strong progression, smooth voice leading
2. ★★☆ - Good progression, acceptable voice leading
3. ★☆☆ - Unusual progression, may require adjustment

## Integration with Other Boards

### Switching Away
- Score data preserved in SharedEventStore
- Chord track persists (can be used in other boards)
- Harmony suggestions are view-only (no stored changes)

### Switching To This Board
- Inherits score from manual notation board
- Applies harmonic analysis to existing notes
- Can set key/chord to analyze existing compositions

### Export to Manual Board
- Freeze suggested harmonizations
- Switch to Notation (Manual) board
- Continue editing without suggestions

## Performance Considerations

- **Suggestion Speed:** Near-instant (< 50ms) for typical scores
- **Score Size:** Tested with 200+ measure orchestral scores
- **Voice Leading Analysis:** Efficient (O(n) per chord change)
- **Memory:** Suggestions computed on-demand (no storage overhead)

## Examples

### Simple SATB Progression

```
Key: C major
Soprano: C → D → E → F → E → D → C
Harmony suggestions adapt:
  C: I (C major) or vi (A minor)
  D: V (G major) or ii (D minor)
  E: I (C major) or iii (E minor)
  F: IV (F major) or ii (D minor)

Voice leading hints show:
  - Alto/tenor common tones (hold C between chords)
  - Bass contrary motion to soprano
  - Smoothest voice paths highlighted
```

### Jazz II-V-I with Extensions

```
Key: C major
Harmony suggestions include:
  Dm7 → G7 → Cmaj7 (standard)
  Dm7 → G7alt → Cmaj9 (jazz extensions)
  Dm7b5 → G7#9 → Cmaj7 (altered ii-V)

Voice leading shows guide tones:
  3rd and 7th of each chord
  Half-step resolutions
  Chromatic voice motion
```

### Classical Cadence Suggestions

```
Approaching cadence:
  - Perfect Authentic Cadence (V → I)
  - Half Cadence (ii → V)
  - Deceptive Cadence (V → vi)
  - Plagal Cadence (IV → I)

Ranked by context and voice leading quality.
```

## Advanced Features

### Snap to Chord Tones (`Cmd+J`)
- Adjusts selected notes to nearest chord tone
- Preserves rhythm
- Fully undoable
- Optional helper (not forced)

### Reharmonization (`Cmd+Shift+R`)
- Shows 3-5 alternative chord progressions
- Maintains melody
- Compares voice leading quality
- Click to apply, undo to revert

### Voice Leading Optimization
- Analyzes SATB parts
- Flags parallel fifths/octaves (common errors)
- Suggests smoother voice motion
- Educational tool for learning rules

## Technical Notes

- **Chord Track:** Stored as dedicated stream with chord events
- **Key Context:** Stored in ActiveContext (persists across boards)
- **Suggestions:** Computed via Prolog-based harmony rules
- **Voice Leading:** Analyzed using voice-leading distance metrics
- **Performance:** All analysis is local (no network required)

## Common Questions

### Q: Do I have to accept suggestions?
**A:** No! Suggestions are entirely optional. You can compose freely and ignore all hints.

### Q: Will it auto-correct my harmony?
**A:** No. The board never changes your notes without explicit action. Suggestions require click to apply.

### Q: Can I disable harmony features?
**A:** Yes. Toggle chord highlights off, close harmony panel, or switch to Notation (Manual) board.

### Q: Does it enforce voice leading rules?
**A:** No. It flags potential issues (parallel fifths) but doesn't prevent them. You decide.

### Q: Can I use non-functional harmony?
**A:** Yes. Suggestions are based on common patterns, but you can write any harmony you want.

## See Also

- [Notation Board (Manual)](./notation-board-manual.md) - Pure manual notation
- [Tracker + Harmony Board](./tracker-harmony-board.md) - Tracker with harmony hints
- [Harmony Explorer Tool](./tool-modes.md#harmony-explorer) - Tool mode reference
- [Composer Board](./composer-board.md) - Full hybrid composition board
