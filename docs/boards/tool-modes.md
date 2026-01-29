# Tool Modes Reference

## Overview

Each composition tool in CardPlay has multiple modes that control its UI behavior and capabilities. Tool modes determine:

- **Visibility:** Whether the tool appears in the UI
- **Interaction:** How users interact with the tool
- **Automation:** How much automation is applied
- **Persistence:** What state is saved

## Phrase Database Modes

### `hidden`

**UI Behavior:**
- Phrase library deck not shown
- No phrase-related actions in menus
- Phrase shortcuts disabled

**Use Cases:**
- Pure manual boards
- Workflow focused on direct note entry

**Example Boards:**
- Basic Tracker (Manual)
- Notation Board (Manual)

---

### `browse-only`

**UI Behavior:**
- Phrase library visible
- Phrases can be previewed (play)
- Drag/drop disabled
- Tags/search/favorites work

**Use Cases:**
- Learning/reference
- Viewing saved patterns
- Non-destructive exploration

**Example Boards:**
- Educational boards
- Reference libraries

---

### `drag-drop`

**UI Behavior:**
- Phrase library visible
- Drag payload: phrase events
- Drop target: tracker/notation/piano roll
- Events written to active stream
- Undo support

**Actions:**
- Drag phrase → editor (writes events)
- Preview phrase (temporary playback)
- Add to favorites
- Create phrase from selection

**Use Cases:**
- Fast composition with building blocks
- Pattern library workflows

**Example Boards:**
- Tracker + Phrases (Assisted)
- Notation + Phrases (Assisted)

---

### `auto-suggest`

**UI Behavior:**
- Everything from `drag-drop`
- Plus: phrase suggestions panel
- Suggestions based on context (key, chord, style)
- Click to apply (with undo)

**Actions:**
- All `drag-drop` actions
- Plus: "Apply Suggestion"
- Plus: "Next/Previous Suggestion"

**Use Cases:**
- Guided composition
- Breaking writer's block
- Learning harmonic patterns

**Example Boards:**
- AI-assisted boards (future)

---

## Harmony Explorer Modes

### `hidden`

**UI Behavior:**
- No harmony display
- No chord highlighting
- Scale overlays disabled

**Use Cases:**
- Pure manual composition
- No harmonic constraints

---

### `display-only`

**UI Behavior:**
- Harmony deck visible
- Shows: current chord, scale, key
- Chord tone highlighting (read-only)
- No suggestions, no auto-apply

**Actions:**
- Manual chord entry
- Scale selection
- Key signature setting

**Use Cases:**
- Visual reference
- Non-invasive hints
- Manual with awareness

**Example Boards:**
- Tracker + Harmony (Manual with Hints)

---

### `suggest`

**UI Behavior:**
- Everything from `display-only`
- Plus: suggested next chords
- Clickable suggestions
- Explanation tooltips

**Actions:**
- All `display-only` actions
- Plus: "Apply Suggestion" (writes chord event)
- Plus: "Explain Why" (shows theory)

**Use Cases:**
- Learning harmony
- Guided reharmonization
- Voice-leading assistance

**Example Boards:**
- Notation + Harmony (Assisted)

---

### `auto-apply`

**UI Behavior:**
- Everything from `suggest`
- Plus: automatic chord updates
- Continuous analysis of melody
- Accept/reject UI for auto-applied chords

**Actions:**
- All `suggest` actions
- Plus: "Auto-Harmonize Selection"
- Plus: "Freeze Harmony" (stop auto-updates)

**Use Cases:**
- Rapid sketching
- Background harmony for melody
- Educational: "what would fit here?"

**Example Boards:**
- AI Composition Board (Directed)

---

## Phrase Generators Modes

### `hidden`

**UI Behavior:**
- No generator deck
- No generation actions

**Use Cases:**
- Manual-only boards

---

### `on-demand`

**UI Behavior:**
- Generator deck visible
- "Generate" button per generator
- Settings: seed, style, density
- Preview before commit

**Actions:**
- Click "Generate" → writes events
- "Regenerate" → replace with undo
- "Freeze" → mark as user-owned

**Use Cases:**
- Controlled generation
- Generate-then-edit workflow
- Sketching ideas

**Example Boards:**
- Session + Generators (Assisted)

---

### `continuous`

**UI Behavior:**
- Everything from `on-demand`
- Plus: background generation
- Candidate proposals stream in
- Accept/reject per candidate

**Actions:**
- All `on-demand` actions
- Plus: "Accept Candidate"
- Plus: "Reject Candidate"
- Plus: "Pause Generation"

**Use Cases:**
- Generative ambient
- Continuous inspiration
- Curation-focused workflow

**Example Boards:**
- Generative Ambient Board (Generative)

---

## Arranger Card Modes

### `hidden`

**UI Behavior:**
- No arranger deck
- No section/structure tools

---

### `manual-trigger`

**UI Behavior:**
- Arranger deck visible
- Section timeline
- Manual "Arrange" button
- Settings: parts, density, style

**Actions:**
- Define sections (intro, verse, chorus)
- Click "Arrange" → generates parts for section
- Edit generated parts manually
- Regenerate per section

**Use Cases:**
- Structural planning
- Controlled arrangement
- High-level sketching

**Example Boards:**
- AI Arranger Board (Directed)

---

### `chord-follow`

**UI Behavior:**
- Everything from `manual-trigger`
- Plus: auto-update on chord changes
- Watches chord stream
- Regenerates affected sections

**Actions:**
- All `manual-trigger` actions
- Plus: "Freeze Section" (stop auto-updates)
- Plus: "Re-Arrange from Chord X"

**Use Cases:**
- Chord-driven arrangement
- Real-time experimentation
- Harmonic sketching

**Example Boards:**
- AI Arranger Board (Directed)
- Composer Board (Collaborative)

---

### `autonomous`

**UI Behavior:**
- Everything from `chord-follow`
- Plus: evolves structure over time
- Proposes new sections
- Accept/reject entire structure

**Actions:**
- All `chord-follow` actions
- Plus: "Accept Structure"
- Plus: "Reject Structure"
- Plus: "Lock Structure"

**Use Cases:**
- Generative composition
- High-level curation
- Exploratory workflows

**Example Boards:**
- Generative Ambient Board (Generative)

---

## AI Composer Modes

### `hidden`

**UI Behavior:**
- No AI composer UI
- No composition prompts

---

### `command-palette`

**UI Behavior:**
- Command palette (Cmd+K)
- Text prompt input
- Target scope selector (clip/section/track)
- "Generate" button
- Diff preview (accept/reject)

**Actions:**
- Type prompt → "compose a melody in C major"
- Select scope (which clip/track)
- Click "Generate"
- Review diff → Accept or Reject

**Use Cases:**
- Intent-driven composition
- Specific requests
- Iterative refinement

**Example Boards:**
- AI Composition Board (Directed)

---

### `inline-suggest`

**UI Behavior:**
- Everything from `command-palette`
- Plus: ghost text suggestions
- Inline as you edit
- Tab to accept, Esc to reject

**Actions:**
- All `command-palette` actions
- Plus: inline suggestions while editing
- Plus: Tab accepts, Esc dismisses

**Use Cases:**
- Flow-based composition
- Minimal interruption
- Fast iteration

**Example Boards:**
- Advanced AI boards (future)

---

### `autonomous`

**UI Behavior:**
- Everything from `inline-suggest`
- Plus: continuous composition
- Drafts full sections
- Stream of proposals

**Actions:**
- All `inline-suggest` actions
- Plus: "Pause Composition"
- Plus: "Accept Draft"
- Plus: "Reject Draft"

**Use Cases:**
- Generative composition
- High-level curation
- Exploratory workflows

**Example Boards:**
- Generative Ambient Board (Generative)

---

## Mode Compatibility Matrix

| Control Level | Phrase DB | Harmony | Generators | Arranger | AI Composer |
|---------------|-----------|---------|------------|----------|-------------|
| Full Manual | `hidden` | `hidden` | `hidden` | `hidden` | `hidden` |
| Manual+Hints | `hidden` | `display-only` | `hidden` | `hidden` | `hidden` |
| Assisted | `drag-drop` | `suggest` | `on-demand` | `hidden` | `hidden` |
| Directed | `drag-drop` | `suggest` | `on-demand` | `chord-follow` | `command-palette` |
| Collaborative | `drag-drop` | `suggest` | `on-demand` | `chord-follow` | `inline-suggest` |
| Generative | `auto-suggest` | `auto-apply` | `continuous` | `autonomous` | `autonomous` |

## Changing Modes at Runtime

**Board Policy** determines if tool modes can be toggled:

```typescript
import { canToggleTools } from '@cardplay/boards/policy';

const board = getBoardRegistry().get('composer-board');

if (canToggleTools(board)) {
  // Show tool mode toggles in settings
  showToolModeUI();
} else {
  // Board is a fixed preset
  hideToolModeUI();
}
```

Most boards are **fixed presets** (no runtime toggles). Power-user boards (Composer, Producer, Live Performance) may allow toggles.

## Persistence

Tool mode settings are persisted per board:

- **Global boards:** Tool modes in board definition (fixed)
- **Custom boards:** Tool modes in `perBoardState` (if policy allows)

## See Also

- [Board Gating](./gating.md) - Gating rules and examples
- [Board API](./board-api.md) - Board types
- [Board Policy](./board-api.md#board-policy) - Customization rules
