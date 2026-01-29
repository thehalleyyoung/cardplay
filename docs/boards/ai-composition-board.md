# AI Composition Board

**Control Level:** Directed  
**Difficulty:** Advanced  
**Philosophy:** "Describe intent, system drafts"

## Overview

The AI Composition board provides a collaborative composition workflow where you describe musical intent through prompts and constraints, the system generates draft compositions, and you review and refine in notation or tracker views. Think of it as a compositional assistant that understands your goals and proposes solutions.

## Board Layout

```
┌──────────────┬────────────────────────────────┐
│  AI Composer │  Notation Score (Center)       │
│  (Left)      │  or Pattern Editor (Tab)       │
│  Prompt Box  │                                │
│  Constraints │                                │
│  Generate    │                                │
├──────────────┴────────────────────────────────┤
│  Timeline (Bottom - Arrange Generated Clips)  │
└───────────────────────────────────────────────┘
```

## Key Features

### 1. Prompt-Based Generation
- **Command Palette:** `Cmd+K` to open
- Natural language prompts (e.g., "gentle melody in C major")
- Constraint-based prompts (e.g., "4-bar phrase, chord tones only")
- Style hints (e.g., "Bach-inspired counterpoint")

### 2. Local Prompt Templates
No external AI services required - uses built-in mappings:

**Melodic Templates:**
- "Simple melody" → sparse density, stepwise motion
- "Complex melody" → dense notes, larger intervals
- "Arpeggio pattern" → chord tone emphasis
- "Scale run" → sequential scalar motion

**Rhythmic Templates:**
- "Steady rhythm" → even note values
- "Syncopated" → off-beat emphasis
- "Sparse" → long notes, rests
- "Dense" → short notes, high activity

**Harmonic Templates:**
- "Following chords" → chord tone selection
- "Tension notes" → scale extensions
- "Chromatic approach" → leading tones
- "Pedal tone" → sustained notes

### 3. Constraint-Based Generation
Fine-tune generation with explicit constraints:

**Musical Constraints:**
- Key signature
- Chord progression (uses chord track if present)
- Density (notes per bar)
- Register (pitch range)
- Rhythm feel (swing, straight, triplets)

**Structural Constraints:**
- Target scope: selection, clip, section, track
- Duration (bars/beats)
- Voice count (monophonic, polyphonic)
- Articulation style

### 4. Draft Review Workflow
Generated drafts are non-destructive:

**Generate Actions:**
- **Generate Draft** (`Cmd+G`) - Creates new stream + clip
- **Replace Selection** (`Cmd+Shift+G`) - Replaces selected events
- **Append** (`Cmd+Option+G`) - Adds to end of current stream
- **Generate Variation** (`Cmd+Shift+V`) - Variation of selection

**Review Actions:**
- **Accept Draft** (`Cmd+Enter`) - Commits to SharedEventStore
- **Reject Draft** (`Cmd+Backspace`) - Discards without mutating stores
- **Regenerate** (`Cmd+R`) - Generate new draft with same prompt
- **Edit Draft** - Modify in notation/tracker before accepting

### 5. Diff Preview
Visual comparison of existing vs proposed:
- **Green highlights:** Added events
- **Red strikethrough:** Removed events
- **Yellow highlights:** Modified events
- Accept/reject individual changes or all at once

## Workflow

### 1. Define Intent
1. Open AI Composition board
2. Press `Cmd+K` to open composer palette
3. Type your prompt or select a template
4. Set constraints if needed (key, chords, density, register)

### 2. Generate Draft
1. Select target scope (selection, clip, section)
2. Click "Generate" or press `Cmd+G`
3. System creates draft in new stream
4. Draft appears in notation/tracker view

### 3. Review and Refine
1. Review draft in notation or tracker (switch with `Cmd+1`/`Cmd+2`)
2. Play draft to audition
3. Edit notes if needed (draft is editable before accepting)
4. Compare with original if replacing (diff preview)

### 4. Accept or Reject
1. **Accept** (`Cmd+Enter`) - Commits draft to SharedEventStore
2. **Reject** (`Cmd+Backspace`) - Discards draft, restores original
3. **Regenerate** (`Cmd+R`) - Try another variation
4. **Save as Phrase** (`Cmd+Shift+S`) - Add to phrase library

### 5. Iterate
1. Select accepted material
2. Generate variations on successful ideas
3. Build up composition incrementally
4. Arrange clips in timeline

## Keyboard Shortcuts

### Composer Palette
- `Cmd+K` - Open composer palette
- `Cmd+G` - Generate draft
- `Cmd+Shift+G` - Replace selection
- `Cmd+Option+G` - Append to stream
- `Cmd+Shift+V` - Generate variation

### Draft Review
- `Cmd+Enter` - Accept draft
- `Cmd+Backspace` - Reject draft
- `Cmd+R` - Regenerate with same prompt
- `Space` - Play/audition draft

### Navigation
- `Cmd+1` - Switch to notation view
- `Cmd+2` - Switch to tracker view
- `Cmd+3` - Switch to timeline view

### Commit to Library
- `Cmd+S` - Commit to library (saves current state)
- `Cmd+Shift+S` - Save as phrase (adds to phrase database)

### Global
- `Cmd+Z` - Undo
- `Cmd+Shift+Z` - Redo
- `Escape` - Stop playback

## Prompt Examples

### Melodic Generation
```
"Simple melody in C major, 8 bars, stepwise motion"
"Complex jazz line following chord changes"
"Pentatonic melody, sparse rhythm, high register"
"Bach-style countermelody to existing voice"
```

### Harmonic Generation
```
"4-voice chorale, traditional voice leading"
"Jazz voicings, rootless, 3-note chords"
"String quartet harmony, close spacing"
"Pad texture, sustained notes, ambient"
```

### Rhythmic Generation
```
"16th note groove, emphasis on downbeats"
"Syncopated bass line, funk style"
"Latin clave pattern, 4/4 time"
"Minimalist pulse, sparse, evolving"
```

### Structural Generation
```
"Call and response phrase, 4+4 bars"
"Build phrase with increasing density"
"Descending sequence, 2-bar motif"
"Variation on selected phrase, more ornaments"
```

## Integration with Chord Track

When a chord track exists in the active context:

### Automatic Chord-Following
- Prompts automatically consider chord context
- Generated notes prioritize chord tones
- Voice-leading rules applied across chord changes
- Non-chord tones used as passing/neighbor tones

### Compose to Chords
Enable in constraints UI:
- ✅ "Follow chord track"
- Specify voice-leading style (common tone, contrary motion, etc.)
- Set non-chord tone usage (none, passing, neighbor, all)

## Commit to Phrase Library

Generated material can be saved for reuse:

### Save as Phrase (Cmd+Shift+S)
1. Select generated events you want to save
2. Press `Cmd+Shift+S`
3. Dialog opens with:
   - Phrase name input
   - Tags (instrument, mood, style)
   - Chord context (optional)
   - Duration/tempo info
4. Click "Save" - phrase added to phrase database

### Using Saved Phrases
- Drag from phrase library deck
- Available in other boards (Tracker + Phrases, etc.)
- Can be adapted to new chord contexts

## Safety Rails

### Non-Destructive Generation
- **Draft Mode:** All generation creates previews first
- **Undo Support:** All accept/reject actions are undoable
- **Confirmation:** Destructive operations require confirmation
- **Never Overwrites:** Original events preserved until explicit accept

### Clear Visual Feedback
- **Draft Badge:** Draft clips show "DRAFT" badge
- **Green Border:** Draft material has green border
- **Diff Preview:** Replacements show before/after comparison
- **Undo History:** All operations logged in undo stack

### Guardrails
- **Max Events:** Generation limited to prevent memory issues
- **Timeout:** Long generations timeout with partial results
- **Validation:** Generated events validated before commit
- **Rollback:** Failed commits automatically rollback

## Diff Preview UI

When replacing selection:

```
Before:                After:
C  C  E  G            C  D  E  F  G  A  G  E
🔵 🔵 🔵 🔵           🔵 🟢 🔵 🟢 🔵 🟢 🔵 🔵

Legend:
🔵 Unchanged
🟢 Added
🔴 Removed
🟡 Modified
```

**Accept Options:**
- Accept All
- Accept Selected Changes
- Reject All
- Cancel (keep editing)

## Technical Details

### Generator Integration
Prompt templates map to generator configurations:
- `src/ai/generators/melody-generator.ts`
- `src/ai/generators/chord-generator.ts`
- `src/ai/generators/arpeggio-generator.ts`

### Prompt Parsing
Local prompt parser extracts:
- Intent keywords ("melody", "harmony", "rhythm")
- Style hints ("jazz", "classical", "minimal")
- Constraints (key, tempo, register)
- Structural directives (bars, phrases, voices)

### Constraint Application
Constraints filter/guide generation:
- **Key signature** → Scale tone filtering
- **Chord progression** → Chord tone emphasis
- **Density** → Event count per bar
- **Register** → Pitch range limitation
- **Rhythm feel** → Timing quantization

### Draft Management
Drafts use temporary storage:
- Draft streams created in `SharedEventStore`
- Draft clips created in `ClipRegistry`
- On reject: streams/clips deleted
- On accept: marked as permanent

## Related Boards

- **AI Arranger** - Section-based arrangement generation
- **Generative Ambient** - Continuous generation without prompts
- **Composer (Hybrid)** - Mix manual and AI per track
- **Notation Manual** - Pure notation editing after accepting drafts

## Best Practices

### 1. Start with Clear Intent
- Be specific in prompts
- Use musical terminology
- Set constraints before generating
- Provide context (key, chords, style)

### 2. Iterate Incrementally
- Generate small sections first
- Accept successful ideas
- Build on accepted material
- Use variations of successful drafts

### 3. Mix AI and Manual
- Generate initial ideas with AI
- Accept and edit manually
- Use AI for variations and fills
- Reserve judgment for manual refinement

### 4. Leverage Chord Track
- Set up chord progression first
- Enable chord-following in constraints
- Generate melodic material that fits chords
- Use voice-leading options for smooth transitions

### 5. Build a Phrase Library
- Save successful generated phrases
- Tag thoroughly for discoverability
- Reuse phrases across projects
- Adapt phrases to new contexts

## Troubleshooting

### Generation doesn't match prompt
- Check constraint settings
- Try more specific prompt language
- Verify chord track if using
- Regenerate with adjusted constraints

### Drafts are too similar
- Increase variation seed
- Change style hint
- Adjust density/register constraints
- Try different prompt phrasing

### Can't accept draft
- Check for validation errors (console)
- Verify target stream exists
- Ensure undo stack not full
- Try generating to new clip instead

### Chord-following not working
- Verify chord track has events
- Enable "follow chord track" in constraints
- Check chord event timing (should cover target range)
- Regenerate after adjusting chord track

## Future Enhancements

### Planned Features
- Multi-voice generation (SATB, string quartet)
- Style learning from user's music
- Real-time generation during editing
- Collaborative drafting (multiple users)
- Export drafts as MIDI templates

### Under Consideration
- Neural network integration (optional)
- Cloud-based style models (opt-in)
- Voice-leading analysis of user edits
- Auto-suggest mode while composing
- Compositional pattern recognition

## Workflow Examples

### Example 1: Generate Melody
1. Open AI Composition board
2. Set key to C major in constraints
3. Press `Cmd+K` → type "simple melody, 8 bars"
4. Press `Cmd+G` to generate
5. Review in notation (`Cmd+1`)
6. Accept with `Cmd+Enter`

### Example 2: Harmonize Melody
1. Select existing melody
2. Press `Cmd+K` → type "4-voice harmony, traditional"
3. Set constraints: key, voice ranges
4. Generate → review → accept
5. Edit voice-leading manually if needed

### Example 3: Generate Variation
1. Select phrase to vary
2. Press `Cmd+Shift+V`
3. System generates variation
4. Diff preview shows changes
5. Accept all or specific changes

### Example 4: Build Composition
1. Generate 4-bar motif
2. Accept motif
3. Select motif → generate variation
4. Accept variation
5. Arrange in timeline
6. Generate bridge material
7. Assemble full composition

## Advanced Techniques

### Constraint Layering
Combine multiple constraints:
- Key + chord progression + register + rhythm feel
- Creates highly specific generation
- Requires more processing time
- Results in focused output

### Template Customization
Create custom prompt templates:
- Define reusable patterns
- Save constraint combinations
- Share templates with collaborators
- Build style-specific workflows

### Diff-Based Refinement
Use diff preview to blend AI and manual:
- Generate variation
- Review diff
- Accept only desired changes
- Reject unwanted additions
- Creates hybrid result

### Phrase Evolution
Iterative variation process:
1. Generate initial phrase
2. Generate variation of phrase
3. Accept best elements from both
4. Generate variation of hybrid
5. Repeat until satisfied
