# Board Gating System

## Overview

The Board Gating System controls which cards, decks, and tools are visible and usable based on the active board's **control level** and **tool configuration**. This ensures a consistent, predictable user experience that matches the board's philosophy.

## Control Level Gating Rules

### Full Manual (`full-manual`)

**Allowed:**
- Manual editing cards (tracker, notation, piano roll, sampler)
- Core instrument cards (synthesizers, samplers)
- Effect cards (EQ, compression, reverb, delay)
- Manual mixing and routing

**Hidden:**
- All AI/generative tools
- Phrase databases
- Harmony explorers
- Auto-suggestions

**Philosophy:** "You control everything." No automation, no suggestions.

### Manual with Hints (`manual-with-hints`)

**Allowed:**
- Everything from Full Manual
- Harmony display (read-only)
- Scale overlays
- Chord tone highlighting

**Hidden:**
- Phrase drag/drop
- Generators
- AI composition

**Philosophy:** "You write, we hint." Visual guidance without automation.

### Assisted (`assisted`)

**Allowed:**
- Everything from Manual with Hints
- Phrase library (browse and drag)
- Harmony suggestions
- Pattern variations
- On-demand generators

**Hidden:**
- Continuous generation
- AI composer
- Autonomous arrangers

**Philosophy:** "Your ideas, tool execution." You decide what to use, tools execute.

### Directed (`directed`)

**Allowed:**
- Everything from Assisted
- AI Arranger (chord-follow mode)
- Phrase generators (on-demand)
- Command palette composition

**Hidden:**
- Autonomous/continuous generation

**Philosophy:** "You set direction, AI fills in." High-level intent, AI drafts.

### Collaborative (`collaborative`)

**Allowed:**
- Everything from Directed
- Per-track control level override
- Mixed manual/assisted/generative tracks
- Cross-card control actions

**Philosophy:** "50/50 with AI." Mix control levels per track.

### Generative (`generative`)

**Allowed:**
- Everything
- Continuous generation
- Autonomous arrangers
- AI composition (autonomous mode)

**Philosophy:** "AI creates, you curate." Accept/reject/freeze generated content.

## Tool Mode Gating

Each composition tool has modes that determine UI behavior:

### Phrase Database

| Mode | Drag Enabled | Auto-Suggest | Visibility |
|------|--------------|--------------|------------|
| `hidden` | No | No | Hidden |
| `browse-only` | No | No | Visible (read-only) |
| `drag-drop` | Yes | No | Visible (drag phrases) |
| `auto-suggest` | Yes | Yes | Visible + suggestions |

### Harmony Explorer

| Mode | Display | Suggestions | Auto-Apply |
|------|---------|-------------|------------|
| `hidden` | No | No | No |
| `display-only` | Yes | No | No |
| `suggest` | Yes | Yes | No |
| `auto-apply` | Yes | Yes | Yes (with undo) |

### Phrase Generators

| Mode | On-Demand | Continuous | Background |
|------|-----------|------------|------------|
| `hidden` | No | No | No |
| `on-demand` | Yes (button) | No | No |
| `continuous` | Yes | Yes | Yes (proposals) |

### Arranger Card

| Mode | Manual | Chord-Follow | Autonomous |
|------|--------|--------------|------------|
| `hidden` | No | No | No |
| `manual-trigger` | Yes (button) | No | No |
| `chord-follow` | Yes | Yes (auto-update) | No |
| `autonomous` | Yes | Yes | Yes (evolves) |

### AI Composer

| Mode | Command Palette | Inline | Autonomous |
|------|-----------------|--------|------------|
| `hidden` | No | No | No |
| `command-palette` | Yes (Cmd+K) | No | No |
| `inline-suggest` | Yes | Yes (ghost text) | No |
| `autonomous` | Yes | Yes | Yes (drafts) |

## Disallowed Card Examples

### Why Cards Are Hidden

#### Example 1: Phrase Library Hidden in Manual Board

**Board:** Basic Tracker (Full Manual)
**Card:** Phrase Browser
**Reason:** "Phrase library disabled in this board's tool configuration"

**Solution:** Switch to "Tracker + Phrases" board (Assisted)

#### Example 2: Generator Hidden in Manual Board

**Board:** Notation Board (Manual)
**Card:** Melody Generator
**Reason:** "Generators not available in manual control level"

**Solution:** Switch to "AI Composition" board (Directed)

#### Example 3: AI Composer Hidden in Assisted Board

**Board:** Session + Generators (Assisted)
**Card:** AI Composer
**Reason:** "AI Composer requires Directed control level or higher"

**Solution:** Switch to "AI Composition Board" (Directed)

## Checking Capabilities

Use the gating API to check capabilities:

```typescript
import { 
  computeBoardCapabilities, 
  hasCapability,
  isCardAllowed,
  whyNotAllowed
} from '@cardplay/boards/gating';

const board = getBoardRegistry().get('basic-tracker');
const caps = computeBoardCapabilities(board);

// Check boolean flags
if (caps.canDragPhrases) {
  enablePhraseDrag();
}

if (caps.canInvokeAI) {
  showAIComposerButton();
}

// Check card allowance
const cardMeta = { id: 'melody-gen', kind: 'generative' };
if (!isCardAllowed(board, cardMeta)) {
  const reason = whyNotAllowed(board, cardMeta);
  showTooltip(reason); // "Generators not available in manual control level"
}
```

## Migration & Compatibility

### Loading Projects with Disabled Tools

If you load a project that uses cards/tools not allowed by the current board:

1. **Warning Banner:** "This project uses tools not available in this board"
2. **One-Click Switch:** "Switch to [Recommended Board]" button
3. **View-Only:** Disabled cards are shown but not editable
4. **No Data Loss:** Switching boards preserves all content

### Recommended Board Suggestions

When a project contains disallowed tools, the system recommends:

- **Phrase cards present** → "Tracker + Phrases" (Assisted)
- **Generator cards present** → "Session + Generators" (Assisted)
- **AI Composer used** → "AI Composition Board" (Directed)
- **Multiple control levels** → "Composer Board" (Collaborative)

## Board Switching Behavior

Gating rules recompute when you switch boards:

```typescript
// Before: Basic Tracker (Manual)
// Phrase library deck: HIDDEN
// Allowed card kinds: ['manual']

switchBoard('tracker-phrases-board'); // Switch to Assisted

// After: Tracker + Phrases (Assisted)
// Phrase library deck: VISIBLE
// Allowed card kinds: ['manual', 'hint', 'assisted']
```

All shared state (streams, clips, routing) is preserved across switches.

## Performance Notes

- Gating computation is O(#cards + #decks)
- Results are memoized per board
- Cache is cleared on board switch
- Typical computation: <1ms for 100+ cards

## See Also

- [Board API](./board-api.md) - Board types and stores
- [Tool Modes](./tool-modes.md) - Tool mode behavior details
- [Board Switching](./migration.md) - Board switch semantics
