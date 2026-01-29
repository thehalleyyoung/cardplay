# Control Spectrum

**Phase K Task:** K020
**Last Updated:** 2026-01-29

## Overview

The **Control Spectrum** is CardPlay's core philosophy for musical control. Every board, deck, and tool exists somewhere on the spectrum from full manual control to autonomous generation.

**Key Principle:** You choose your level of control. More control = more work, more precision. Less control = faster results, more surprises.

---

## The Five Control Levels

### 1. Full Manual (`full-manual`)

**Philosophy:** "I write every note."

- **Boards:** Basic Tracker, Basic Notation, Basic Sampler, Basic Session
- **Tools:** All composition assistance disabled/hidden
- **Typical User:** Traditional composers, tracker purists, sound designers
- **Workflow:** 100% hands-on creation with no suggestions or generation

**What you get:**
- ✅ Complete control over every parameter
- ✅ No unexpected changes or suggestions
- ✅ Traditional DAW/notation/tracker workflow
- ❌ No AI assistance (not even hints)
- ❌ Manual phrase entry (no phrase library drag/drop)

**Example boards:**
- **Basic Notation Board:** Pure score writing with manual instrument assignment
- **Basic Tracker Board:** Traditional tracker with pattern editor only
- **Basic Session Board:** Manual clip launching with no generation

---

### 2. Manual with Hints (`manual-with-hints`)

**Philosophy:** "I write notes, you show me suggestions."

- **Boards:** Tracker + Harmony, Notation + Harmony
- **Tools:** Harmony display, scale highlighting, chord tone coloring
- **Typical User:** Learning musicians, composers exploring theory
- **Workflow:** Manual creation with visible theory/harmony overlays

**What you get:**
- ✅ Full manual control (you make all decisions)
- ✅ Non-intrusive visual hints (chord tones, scale tones)
- ✅ Theory reference (current key/chord/scale)
- ❌ No auto-generation or phrase suggestions
- ❌ Hints are display-only (never modify your notes)

**Example boards:**
- **Tracker + Harmony Board:** Tracker with chord tone coloring
- **Notation + Harmony Board:** Score editor with harmonic analysis overlay

**Visual indicators:**
- 🟢 Green cells/notes = chord tones
- 🔵 Blue cells/notes = scale tones (not in chord)
- 🔴 Red cells/notes = chromatic (out of scale)

---

### 3. Assisted (`assisted`)

**Philosophy:** "I direct the composition, you provide building blocks."

- **Boards:** Tracker + Phrases, Session + Generators, Notation + Harmony (suggest mode)
- **Tools:** Phrase library (drag/drop), on-demand generators, harmony suggestions
- **Typical User:** Fast workflow composers, producers sketching ideas
- **Workflow:** Manual + assisted: drag phrases, trigger generation, then edit

**What you get:**
- ✅ Phrase library with drag-and-drop
- ✅ On-demand generation (click "generate" when you want it)
- ✅ Full manual editing of generated content
- ✅ Undo integration for all generation
- ❌ No autonomous generation (always explicit trigger)

**Example boards:**
- **Tracker + Phrases Board:** Drag MIDI phrases into tracker, adapt to harmony
- **Session + Generators Board:** Generate clips on demand, then edit/launch
- **Notation + Harmony Board:** Suggest next chords, click to accept

**Phrase adaptation:**
- Phrases auto-transpose to current key/chord
- Voice-leading mode for smooth harmonic motion
- Rhythm preserved, pitches adapted

---

### 4. Directed (`directed`)

**Philosophy:** "I set direction and constraints, you generate parts."

- **Boards:** AI Arranger, AI Composition
- **Tools:** Arranger (chord-follow), phrase generators, AI composer (command palette)
- **Typical User:** Producers, composers working from chord progressions
- **Workflow:** Define structure/chords/style → system generates → you curate

**What you get:**
- ✅ High-level control (chords, sections, style, density)
- ✅ Multi-part arrangement generation (drums, bass, pads, melody)
- ✅ "Freeze" action to lock parts you like
- ✅ "Regenerate" action to re-roll sections
- ✅ Full manual editing after generation
- ❌ System doesn't generate without your explicit structure

**Example boards:**
- **AI Arranger Board:** Define sections + chords → generate full arrangement
- **AI Composition Board:** Prompt-driven generation with review/accept flow

**Typical workflow:**
1. Set chord progression (or use template)
2. Define sections (intro, verse, chorus, bridge, outro)
3. Choose style/mood presets
4. Click "Generate"
5. Review generated parts in tracker/notation/session
6. Freeze parts you like, regenerate others
7. Edit generated notes manually as needed

---

### 5. Generative (`generative`)

**Philosophy:** "System generates continuously, I curate the best moments."

- **Boards:** Generative Ambient, Live Performance (autonomous mode)
- **Tools:** Continuous generators, autonomous arranger, evolving parameters
- **Typical User:** Ambient composers, live performers, sound artists
- **Workflow:** Set global constraints → system evolves → capture moments you like

**What you get:**
- ✅ Autonomous background generation
- ✅ Evolving parameters and textures
- ✅ "Capture" action to freeze best moments
- ✅ Per-layer freeze (stop updates, keep events editable)
- ⚠️ System generates without explicit trigger (within constraints)
- ⚠️ You curate rather than compose

**Example boards:**
- **Generative Ambient Board:** Continuous drone/texture generation
- **Live Performance Board:** Autonomous backing tracks while you play live

**Typical workflow:**
1. Set global mood/density/harmony constraints
2. System generates continuous stream of candidates
3. Listen and watch visual preview
4. Click "Accept" to commit candidate to project
5. Click "Freeze" to lock a layer (stop updates)
6. Capture time windows as clips for arrangement

**Safety guardrails:**
- Maximum events per second (prevent CPU overload)
- Maximum layers (prevent cacophony)
- Global density slider (sparse → dense)
- Per-layer freeze (lock when you like it)

---

## Collaborative Control (Hybrid Boards)

Some boards support **per-track control levels**, mixing manual and generated tracks in the same project.

**Hybrid boards:**
- **Composer Board:** Mix manual notation, assisted phrases, and directed generation
- **Producer Board:** Mix manual arrangement with generated fills
- **Live Performance Board:** Mix manual live input with autonomous backing

**Per-track control level:**
```typescript
// Each track can have its own control level
track1: 'full-manual'    // You play/write manually
track2: 'assisted'       // Phrase library + manual editing
track3: 'directed'       // Follows chord progression
track4: 'generative'     // Autonomous texture layer
```

**Visual indicators:**
- Track headers show control level badge (color-coded)
- Mixer strips show control level color bar
- Session grid headers show control level indicator
- Arrangement timeline shows control level lane markers

---

## Control Level vs Tool Configuration

Each board's control level determines which **tools are enabled**:

### Tool Mode Matrix

| Control Level | Phrase DB | Harmony | Generators | Arranger | AI Composer |
|---------------|-----------|---------|------------|----------|-------------|
| full-manual   | hidden    | hidden  | hidden     | hidden   | hidden      |
| manual-hints  | hidden    | display | hidden     | hidden   | hidden      |
| assisted      | drag-drop | suggest | on-demand  | hidden   | hidden      |
| directed      | drag-drop | suggest | on-demand  | chord-follow | command-palette |
| generative    | browse    | suggest | continuous | autonomous | inline-suggest |

**Tool modes:**
- **hidden:** Tool not visible, not accessible
- **display-only:** Visual hints, no interaction
- **browse-only:** Read-only library, no drag
- **drag-drop:** Interactive drag to compose surface
- **suggest:** Click to accept suggestions
- **on-demand:** Click "Generate" button
- **chord-follow:** Auto-generates following chord track
- **continuous:** Background generation stream
- **autonomous:** Self-triggering generation
- **command-palette:** Prompt-driven with preview
- **inline-suggest:** As-you-type completions

---

## Choosing Your Control Level

### Questions to ask yourself:

**Are you learning music theory?**
→ Start with **manual-with-hints** (see what notes fit)

**Do you want traditional composition workflow?**
→ Use **full-manual** (pure notation/tracker/session)

**Do you want to work faster with building blocks?**
→ Use **assisted** (phrase library + manual editing)

**Do you have chords but need arrangement?**
→ Use **directed** (arranger generates parts from chords)

**Do you want evolving textures and ambience?**
→ Use **generative** (continuous generation, curate best moments)

**Do you want to mix approaches?**
→ Use **collaborative** (hybrid boards with per-track control)

---

## Recommendations by User Type

From `src/boards/recommendations.ts`:

| User Type | Recommended Boards |
|-----------|-------------------|
| traditional-composer | Basic Notation (manual), Notation + Harmony (hints) |
| tracker-purist | Basic Tracker (manual) |
| renoise-user | Basic Tracker (manual), Tracker + Phrases (assisted) |
| ableton-user | Basic Session (manual), Session + Generators (assisted), Producer Board (collaborative) |
| sample-based | Basic Sampler (manual) |
| learning-harmony | Tracker + Harmony (hints), Notation + Harmony (hints) |
| fast-workflow | Tracker + Phrases (assisted), Session + Generators (assisted) |
| chord-progressions | AI Arranger (directed), AI Composition (directed) |
| ambient-composer | Generative Ambient (generative) |
| live-performer | Live Performance Board (collaborative/generative) |
| power-user | Composer Board (collaborative), Producer Board (collaborative) |

---

## Board Switching and Control Levels

You can **switch boards anytime** without losing data:

**Example workflow:**
1. Start in **AI Arranger Board** (directed) → generate arrangement from chords
2. Switch to **Tracker + Phrases Board** (assisted) → refine melody with phrases
3. Switch to **Basic Tracker Board** (manual) → fine-tune individual notes
4. Switch to **Producer Board** (collaborative) → mix and arrange

**What persists:**
- ✅ All event streams (notes, chords, automation)
- ✅ All clips (same data, different view)
- ✅ Routing and parameters
- ✅ Undo history (can undo across board switches)

**What changes:**
- 🔄 Visible decks (tracker/notation/session/etc)
- 🔄 Available tools (phrase library, generators, etc)
- 🔄 Panel layout (per-board persistence)
- 🔄 Control level constraints

**Safety:** Generated content is marked with metadata (`meta.generated: true`). Use **"Freeze"** action to mark as user-owned (prevents regeneration).

---

## Visual Design Language

### Control Level Colors (from `src/boards/ui/theme-applier.ts`)

**Manual (full-manual):**
- Primary: `#4A90E2` (blue)
- Badge: Blue dot
- Philosophy: "Traditional control"

**Hints (manual-with-hints):**
- Primary: `#7B68EE` (medium slate blue)
- Badge: Purple dot
- Philosophy: "Learn as you compose"

**Assisted:**
- Primary: `#50C878` (emerald green)
- Badge: Green dot
- Philosophy: "Drag and drop"

**Directed:**
- Primary: `#FF8C42` (coral orange)
- Badge: Orange dot
- Philosophy: "Set direction"

**Generative:**
- Primary: `#E63946` (red)
- Badge: Red dot
- Philosophy: "Curate results"

**Collaborative (hybrid):**
- Primary: Gradient or per-track colors
- Badge: Multi-color indicator
- Philosophy: "Best of all worlds"

### UI Indicators

**Track headers:**
```
[🔵 Manual] Track 1
[🟢 Assisted] Track 2
[🟠 Directed] Track 3
```

**Mixer strips:**
```
━━━━━━━━━━
| 🔵       | ← Blue bar = manual
| 🟢       | ← Green bar = assisted
| 🟠       | ← Orange bar = directed
━━━━━━━━━━
```

**Session grid:**
```
Track 1 [🔵]  Track 2 [🟢]  Track 3 [🟠]
┌────────┐  ┌────────┐  ┌────────┐
│ Clip A │  │ Clip B │  │ Clip C │
└────────┘  └────────┘  └────────┘
```

---

## Developer Reference

### Type Definitions

```typescript
// From src/boards/types.ts

export type ControlLevel =
  | 'full-manual'
  | 'manual-with-hints'
  | 'assisted'
  | 'directed'
  | 'generative'
  | 'collaborative';

export interface Board {
  id: string;
  name: string;
  controlLevel: ControlLevel;
  compositionTools: CompositionToolConfig;
  // ... other fields
}

export type ToolMode<K extends ToolKind> =
  K extends 'phraseDatabase'
    ? 'hidden' | 'browse-only' | 'drag-drop'
  : K extends 'harmonyExplorer'
    ? 'hidden' | 'display-only' | 'suggest'
  : K extends 'phraseGenerators'
    ? 'hidden' | 'on-demand' | 'continuous'
  : K extends 'arrangerCard'
    ? 'hidden' | 'manual-trigger' | 'chord-follow' | 'autonomous'
  : K extends 'aiComposer'
    ? 'hidden' | 'command-palette' | 'inline-suggest'
  : never;
```

### Gating Rules

From `src/boards/gating/is-card-allowed.ts`:

```typescript
// Cards are gated based on control level
function getAllowedCardKinds(controlLevel: ControlLevel): BoardCardKind[] {
  switch (controlLevel) {
    case 'full-manual':
      return ['manual']; // Only manual instruments/effects

    case 'manual-with-hints':
      return ['manual', 'hint']; // Manual + visual helpers

    case 'assisted':
      return ['manual', 'hint', 'assisted']; // Add phrase library

    case 'directed':
      return ['manual', 'hint', 'assisted', 'generative']; // Add generators

    case 'generative':
      return ['manual', 'hint', 'assisted', 'generative', 'autonomous'];

    case 'collaborative':
      return ['manual', 'hint', 'assisted', 'generative', 'autonomous']; // All
  }
}
```

---

## Best Practices

### For Users

1. **Start conservative:** Begin with full-manual or manual-with-hints
2. **Learn gradually:** Add assistance as you understand what it does
3. **Freeze liberally:** When AI generates something you like, freeze it immediately
4. **Switch boards freely:** Your data is safe, experiment with different views
5. **Use undo:** All generation is undoable, including regeneration

### For Board Authors

1. **Respect control level:** Don't expose tools beyond board's control level
2. **Clear indicators:** Always show control level visually (badges, colors)
3. **Undo integration:** All mutations must be undoable
4. **Freeze support:** Generated content must support "freeze" action
5. **Validate factories:** Ensure all deck types have factories registered

### For Extension Developers

1. **Declare control level:** Custom boards must specify control level
2. **Follow tool mode rules:** Custom tools must respect mode constraints
3. **Test gating:** Verify cards are correctly hidden/shown per control level
4. **Document philosophy:** Explain to users what control level means for your board

---

## Related Documentation

- [Board API](./board-api.md) - Core board types and interfaces
- [Tool Modes](./tool-modes.md) - Detailed tool mode reference
- [Gating](./gating.md) - Card visibility and tool gating rules
- [Board Switching](./board-switching.md) - What happens when you switch
- [Theming](./theming.md) - Control level visual design tokens

---

## Summary

**The Control Spectrum is CardPlay's answer to "how much AI do you want?"**

- Want **none?** → Use full-manual boards
- Want **hints?** → Use manual-with-hints boards
- Want **building blocks?** → Use assisted boards
- Want **arrangement?** → Use directed boards
- Want **evolving textures?** → Use generative boards
- Want **everything?** → Use collaborative boards with per-track control

**You're always in control.** Even on generative boards, you curate results and can always freeze, edit, or undo.
