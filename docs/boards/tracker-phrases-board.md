# Tracker + Phrases Board

**Control Level:** Assisted  
**Philosophy:** Drag phrases, then edit - fast controlled tracker workflow

## Overview

The Tracker + Phrases board combines the precision of tracker-based editing with the speed of phrase library drag-and-drop. It's designed for users who want to compose quickly using pre-made musical phrases while maintaining full manual control over the final result.

This board is ideal for:
- Fast composition with reusable patterns
- Learning from existing musical phrases
- Building complex arrangements from modular parts
- Maintaining creative control while accelerating workflow

## Layout

```
┌─────────────┬──────────────────┬─────────────┐
│  Phrase     │   Pattern        │ Properties  │
│  Library    │   Editor         │             │
│  (Left)     │   (Center)       │  (Right)    │
│             │                  │             │
│  - Search   │   - Tracker      │ - Selected  │
│  - Tags     │   - Manual edit  │   phrase    │
│  - Preview  │   - Multi-track  │ - Adapt     │
│  - Favorites│   - Note entry   │   settings  │
└─────────────┴──────────────────┴─────────────┘
```

## Decks

### 1. Phrase Library Deck (Left Panel)
**Type:** `phrases-deck`  
**Purpose:** Browse and drag phrases into patterns

**Features:**
- **Search**: Find phrases by name, mood, instrument, or tags
- **Categories**: Organized by type (melody, bass, drums, chords)
- **Preview**: Audition phrases before dropping
- **Favorites**: Star frequently-used phrases
- **Metadata**: View phrase info (length, key, tempo feel)

**Drag & Drop:**
- Drag any phrase to the tracker at cursor position
- Phrase adapts to target row/track automatically
- Respects harmony context if set (chord-aware transposition)

### 2. Pattern Editor Deck (Center Panel)
**Type:** `pattern-deck`  
**Purpose:** Manual tracker-style pattern editing

**Features:**
- **Hex or Decimal**: Choose note entry format
- **Multi-track**: Edit multiple instrument tracks
- **Effect Commands**: Full tracker effect support
- **Pattern Length**: Adjustable (16-64 rows typical)
- **Follow Mode**: Playback follows cursor
- **Loop Region**: Set loop points for editing

**After Phrase Drop:**
- Phrase events are converted to regular tracker events
- Full manual editing of all note properties
- Undo/redo support for all operations
- No locked or "generated" events - everything is editable

### 3. Properties Deck (Right Panel)
**Type:** `properties-deck`  
**Purpose:** Inspect and configure phrase adaptation

**Features:**
- **Phrase Info**: Name, tags, original key/tempo
- **Adaptation Settings**:
  - Transpose: Semitone adjustment
  - Chord-tone mapping: Snap to current chord
  - Scale-degree: Preserve intervals in new key
  - Voice-leading: Smooth melodic transitions
- **Event Properties**: Edit selected note(s) in detail
- **Track Settings**: Volume, pan, routing per track

**Adaptation Modes:**
1. **Direct**: No adaptation, use phrase as-is
2. **Transpose**: Simple semitone shift to match key
3. **Chord-aware**: Map notes to current chord tones
4. **Scale-degree**: Preserve melodic function in new key
5. **Voice-leading**: Minimize interval jumps between chords

## Shortcuts

### Phrase Library
- **Cmd+L**: Focus phrase search
- **Space**: Preview selected phrase
- **Enter**: Drop phrase at cursor
- **Cmd+F**: Toggle favorites view

### Pattern Editor
- **Cmd+D**: Duplicate pattern
- **F**: Toggle follow mode
- **L**: Toggle loop region
- **Cmd+Up/Down**: Navigate patterns
- **Cmd+H**: Toggle hex/decimal display

### Phrase Actions
- **Cmd+Shift+S**: Save selection as new phrase
- **Cmd+Shift+T**: Tag selected phrase
- **Cmd+Shift+P**: Phrase adaptation settings

## Workflow Examples

### 1. Building a Beat
1. Search phrase library for "drums"
2. Preview drum phrases to find the right groove
3. Drag chosen phrase to track 1
4. Edit velocity, add variations manually
5. Duplicate and modify for verse/chorus

### 2. Melodic Composition
1. Set key context (e.g., C major) in harmony display
2. Search for "melody" phrases in compatible keys
3. Drop melody phrase, auto-transposes to C
4. Edit notes manually to personalize
5. Use phrase adaptation to try different chord contexts

### 3. Quick Arrangement
1. Drag bass phrase to track 1
2. Drag drum phrase to track 2
3. Drag chord phrase to track 3
4. Drag lead phrase to track 4
5. Edit timing and dynamics for cohesion

### 4. Learning & Iteration
1. Drop a phrase to study its structure
2. Modify notes to understand harmonic function
3. Save your variation as a new phrase
4. Build personal phrase library over time

## Phrase Library Organization

Phrases can be organized by:
- **Instrument**: Drums, bass, lead, pad, etc.
- **Mood**: Energetic, calm, dark, bright
- **Genre**: Rock, jazz, electronic, classical
- **Complexity**: Simple, intermediate, complex
- **Length**: Short (4-8 rows), medium (8-16), long (16+)

## Adaptation Best Practices

### When to Use Each Mode:

**Direct**
- Phrase is already in target key
- Chromatic or atonal material
- Drum patterns (no pitch adaptation needed)

**Transpose**
- Simple key changes
- Melodic sequences
- When preserving exact intervals is crucial

**Chord-aware**
- Harmonic accompaniment
- Chord tones and arpeggios
- Background parts that need to "fit"

**Scale-degree**
- Modal music (Dorian, Mixolydian, etc.)
- Melodies that define the key
- Lead lines that need to preserve character

**Voice-leading**
- Chord progressions
- Multiple simultaneous melodies
- Smooth harmonic motion

## Tips & Tricks

### Phrase Management
- **Star frequently-used phrases** for quick access
- **Tag your own phrases** as you create them
- **Use descriptive names** for easy searching
- **Organize by project** with custom tags

### Editing After Drop
- **Humanize timing**: Slight rhythm variations sound natural
- **Vary velocity**: Dynamic expression adds life
- **Add fills**: Manual edits for transitions
- **Layer phrases**: Multiple tracks for richness

### Performance
- **Phrase preview is non-destructive**: Plays temporary stream
- **Drop is undoable**: Cmd+Z removes dropped phrase
- **Adaptation is instant**: No waiting for processing
- **Search is fast**: Indexes update automatically

### Integration
- **Works with other boards**: Shared event store
- **Switch to piano roll**: Same stream, different view
- **Export to notation**: Render as score
- **Save as clip**: Use in session/arrangement views

## Limitations & Design Choices

### Manual-First Philosophy
- Phrases are **starting points**, not endpoints
- All drops create **fully editable** tracker events
- No "locked" or "protected" phrase regions
- User has complete control after drop

### Drag-Drop Only
- Phrase library does **not** auto-suggest
- No automatic phrase insertion
- User explicitly chooses when to use phrases
- Maintains "assisted" (not "generative") control level

### Adaptation Constraints
- Adaptation happens **at drop time**
- Once dropped, phrases are regular events
- To re-adapt, undo and drop again with new settings
- Encourages intentional, final choices

## Technical Details

### Phrase Format
Phrases store:
- Note events (pitch, duration, velocity)
- Metadata (name, tags, key, tempo feel)
- Optional harmony context (chord progression)
- Optional dynamics profile (crescendo, accent patterns)

### Adaptation Algorithm
1. Parse phrase events and extract pitches
2. Detect original key/chord context
3. Apply selected adaptation mode:
   - Transpose: Shift by semitones
   - Chord-aware: Map to closest chord tones
   - Scale-degree: Preserve relative scale position
   - Voice-leading: Minimize melodic jumps
4. Write adapted events to active stream
5. Preserve non-pitch attributes (duration, velocity)

### Undo Integration
- Phrase drop is **one undo unit**
- Undo removes all dropped events atomically
- Redo restores entire phrase
- Subsequent edits create new undo units

### Performance
- Phrase preview: Uses temporary audio stream
- Preview latency: < 50ms on typical hardware
- Drop latency: Instant (adaptation is fast)
- Large phrase libraries: Indexed for sub-100ms search

## Related Boards

### Simpler
- **Basic Tracker Board**: Pure manual, no phrase assistance
  - Use when learning tracker fundamentals
  - More focused, fewer distractions

### More Complex
- **Tracker + Harmony Board**: Adds chord/scale hints
  - Combines phrase workflow with harmony guidance
  - Better for learning theory while composing

### Different Approach
- **Session + Generators Board**: AI-generated clips
  - Use when you want the computer to generate ideas
  - Less manual editing, more curation

## FAQ

**Q: Can I use my own phrases?**  
A: Yes! Select any region in the tracker and press Cmd+Shift+S to save as a phrase. Add tags and it appears in your library.

**Q: Do phrases lock the pattern?**  
A: No. Once dropped, phrase events are regular tracker events. Edit freely.

**Q: Can I adapt a phrase after dropping?**  
A: Undo (Cmd+Z), change adaptation settings in Properties panel, then drop again.

**Q: How does chord-aware adaptation work?**  
A: If a harmony context is set, phrase notes are mapped to the nearest chord tones. This keeps melodic function while changing the harmony.

**Q: Can I preview multiple phrases?**  
A: Yes, but one at a time. Previewing a new phrase stops the previous preview.

**Q: What happens if I drop a phrase on existing notes?**  
A: The phrase is inserted at the cursor position. Existing notes are not overwritten; pattern length may extend.

**Q: Can I share phrases with others?**  
A: Yes! Phrases are stored as JSON. Export phrase files and share them. Import shared phrase collections.

## Summary

The Tracker + Phrases board accelerates composition while maintaining full creative control. Use the phrase library for speed, the tracker for precision, and the adaptation system to ensure phrases fit your musical context. It's the perfect balance of efficiency and control.

**Next Steps:**
- Browse the phrase library
- Try dropping a few phrases
- Edit the results manually
- Save your own phrases for reuse
- Experiment with adaptation modes
- Build your personal phrase collection

For more advanced harmony-aware workflows, try the **Tracker + Harmony Board**.  
For pure manual control without phrases, use the **Basic Tracker Board**.
