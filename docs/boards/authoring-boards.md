# Board Authoring Guide

**Phase K Task:** K002
**Last Updated:** 2026-01-29

## Overview

This guide explains how to create a new board for CardPlay from scratch. By the end of this guide, you'll be able to:

1. Define a board configuration
2. Register it in the board system
3. Test it in the browser
4. Add documentation

---

## Prerequisites

- Familiarity with TypeScript
- Understanding of CardPlay's deck system (see [decks.md](./decks.md))
- Familiarity with the control spectrum (see [index.md](./index.md#control-spectrum))

---

## Step 1: Understand the Board Type

A **Board** consists of:

```typescript
interface Board {
  id: string;                           // Unique board identifier
  name: string;                         // Display name
  description: string;                  // Short description
  icon: string;                         // Icon (emoji or icon name)
  category: BoardCategory;              // manual | assisted | directed | generative | hybrid
  controlLevel: ControlLevel;           // Control spectrum position
  difficulty: BoardDifficulty;          // beginner | intermediate | advanced | expert
  primaryView: ViewType;                // Main editing surface
  layout: BoardLayout;                  // Panel arrangement
  decks: BoardDeck[];                   // Deck definitions
  compositionTools: CompositionToolConfig; // Tool enablement
  connections?: BoardConnection[];      // Optional routing connections
  theme?: BoardTheme;                   // Optional theme overrides
  shortcuts?: BoardShortcutMap;         // Optional keyboard shortcuts
  onActivate?: () => void;              // Optional activation hook
  onDeactivate?: () => void;            // Optional deactivation hook
}
```

**Key concepts:**

- **controlLevel**: Where on the spectrum from `full-manual` to `generative`
- **compositionTools**: Which AI/phrase/harmony tools are enabled and how
- **decks**: Which editing surfaces and tool panels are visible
- **layout**: How panels are arranged (left, right, center, bottom, top)

---

## Step 2: Plan Your Board

Before coding, answer these questions:

### 1. **Who is this board for?**
   - Beginner, intermediate, advanced, or expert?
   - What's their background? (Tracker user, notation composer, producer, etc.)

### 2. **What's the control philosophy?**
   - Full manual control? (like Notation Board)
   - Manual with hints? (like Tracker + Harmony)
   - Assisted with on-demand generation? (like Session + Generators)
   - Directed with AI filling gaps? (like AI Arranger)
   - Fully generative? (like Generative Ambient)

### 3. **What's the primary editing surface?**
   - Tracker pattern editor?
   - Notation score?
   - Session clip grid?
   - Timeline/arrangement?
   - Custom composer view?

### 4. **What tools are needed?**
   - Instrument/sample browsers?
   - Phrase library?
   - Harmony display?
   - Generators?
   - Mixer?
   - Properties panel?
   - DSP chain?

### 5. **What layout makes sense?**
   - Vertical split (browser | editor | properties)?
   - Horizontal split (arranger top | session center | mixer bottom)?
   - Custom multi-panel layout?

---

## Step 3: Create the Board Definition File

Create a new file in `src/boards/builtins/` named after your board:

```
src/boards/builtins/my-custom-board.ts
```

### Example: A "Bass Producer Board" (Manual)

```typescript
/**
 * @fileoverview Bass Producer Board - Manual bass composition & production
 * 
 * A specialized board for bass music producers focusing on sub-bass design,
 * rhythmic programming, and manual sequencing with tracker-style precision.
 * 
 * Control Level: Full Manual (zero AI, pure composition)
 * Primary View: Tracker (pattern-based sequencing)
 * Tools: Sample browser, DSP chain, spectrum analyzer
 */

import type { Board, BoardDeck, BoardLayout, CompositionToolConfig } from '../types';

/**
 * Bass Producer Board definition
 */
export const bassProducerBoard: Board = {
  // ===== IDENTITY =====
  id: 'bass-producer',
  name: 'Bass Producer',
  description: 'Manual bass sequencing with sub-bass focus and spectrum analysis',
  icon: '🔊',
  category: 'manual',
  controlLevel: 'full-manual',
  difficulty: 'intermediate',
  tags: ['bass', 'dubstep', 'dnb', 'producer', 'manual'],

  // ===== PRIMARY VIEW =====
  primaryView: 'tracker',

  // ===== LAYOUT =====
  layout: {
    type: 'split-vertical',
    orientation: 'horizontal',
    panels: [
      {
        id: 'browser-panel',
        role: 'browser',
        position: 'left',
        defaultWidth: 280,
        collapsible: true
      },
      {
        id: 'editor-panel',
        role: 'composition',
        position: 'center',
        defaultWidth: 0 // Takes remaining space
      },
      {
        id: 'analysis-panel',
        role: 'properties',
        position: 'right',
        defaultWidth: 320,
        collapsible: true
      },
      {
        id: 'mixer-panel',
        role: 'mixer',
        position: 'bottom',
        defaultHeight: 200,
        collapsible: true
      }
    ]
  },

  // ===== DECKS =====
  decks: [
    // Pattern editor (primary)
    {
      id: 'bass-pattern-editor',
      type: 'pattern-editor',
      title: 'Bass Pattern',
      cardLayout: 'stack',
      panelId: 'editor-panel',
      allowReordering: false,
      allowDragOut: false,
      defaultState: {
        patternLength: 64,  // 64-step patterns for bass
        octave: 2,          // Lower octave range
        followPlayback: true
      }
    },

    // Sample/instrument browser
    {
      id: 'bass-instruments',
      type: 'instrument-browser',
      title: 'Bass Instruments',
      cardLayout: 'stack',
      panelId: 'browser-panel',
      allowReordering: true,
      allowDragOut: false,
      filterBy: ['bass', 'synth', 'sub']  // Only show bass instruments
    },

    // DSP effects chain
    {
      id: 'bass-fx-chain',
      type: 'dsp-chain',
      title: 'Bass FX',
      cardLayout: 'stack',
      panelId: 'analysis-panel',
      allowReordering: true,
      allowDragOut: false
    },

    // Spectrum analyzer (custom deck)
    {
      id: 'spectrum-analyzer',
      type: 'visualization',  // Custom deck type
      title: 'Spectrum',
      cardLayout: 'stack',
      panelId: 'analysis-panel',
      allowReordering: true,
      allowDragOut: false,
      defaultState: {
        frequencyRange: [20, 200],  // Focus on sub-bass range
        showPeaks: true,
        showRMS: true
      }
    },

    // Mixer
    {
      id: 'bass-mixer',
      type: 'mixer',
      title: 'Mix',
      cardLayout: 'tabs',
      panelId: 'mixer-panel',
      allowReordering: false,
      allowDragOut: false
    },

    // Properties inspector
    {
      id: 'bass-properties',
      type: 'properties',
      title: 'Properties',
      cardLayout: 'stack',
      panelId: 'analysis-panel',
      allowReordering: true,
      allowDragOut: false
    }
  ],

  // ===== TOOL CONFIGURATION =====
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: false, mode: 'hidden' },
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' }
  },

  // ===== THEME =====
  theme: {
    primaryColor: '#4a0e78',      // Deep purple for bass
    accentColor: '#8b00ff',       // Bright purple accent
    backgroundColor: '#0a0a0a',   // Very dark background
    surfaceColor: '#1a1a1a',
    textColor: '#e0e0e0',
    controlLevelColor: '#4a0e78'  // Match primary
  },

  // ===== SHORTCUTS =====
  shortcuts: {
    'mod+enter': 'preview-note',     // Preview bass note
    'mod+shift+a': 'analyze-spectrum', // Analyze frequency content
    'mod+d': 'duplicate-pattern',    // Duplicate pattern
    'mod+shift+s': 'export-stem'     // Export bass stem
  },

  // ===== LIFECYCLE HOOKS =====
  onActivate: () => {
    console.log('[Bass Producer Board] Activated');
    // Could set up spectrum analyzer updates, load bass presets, etc.
  },

  onDeactivate: () => {
    console.log('[Bass Producer Board] Deactivated');
    // Could clean up spectrum analyzer, save state, etc.
  }
};
```

---

## Step 4: Validate Your Board

Before registration, ensure your board:

### Required Fields
- ✅ Has a unique `id` (no spaces, kebab-case)
- ✅ Has a descriptive `name`
- ✅ Has a `description` explaining the use case
- ✅ Has a `controlLevel` matching the philosophy
- ✅ Has at least one deck
- ✅ Has all deck `panelId` references matching `layout.panels`

### Tool Configuration Rules
- ✅ If `controlLevel: 'full-manual'`, all tools should be `{ enabled: false, mode: 'hidden' }`
- ✅ If `controlLevel: 'manual-with-hints'`, `harmonyExplorer` might be `display-only`
- ✅ If `controlLevel: 'assisted'`, at least one tool should be enabled
- ✅ Tool `enabled: true` and `mode: 'hidden'` is invalid

### Deck Rules
- ✅ At least one deck must be primary (in center panel typically)
- ✅ All `type` values must have registered factories (see [decks.md](./decks.md))
- ✅ Deck IDs are unique within the board
- ✅ Panel IDs referenced by decks exist in `layout.panels`

---

## Step 5: Register Your Board

Add your board to the builtin registry:

**File:** `src/boards/builtins/register.ts`

```typescript
import { bassProducerBoard } from './bass-producer-board';

export function registerBuiltinBoards(): void {
  const registry = getBoardRegistry();

  // ... existing boards ...

  // Your new board
  registry.register(bassProducerBoard);
  
  console.log('✅ Bass Producer Board registered');
}
```

---

## Step 6: Add to Recommendations (Optional)

If your board targets a specific user type, add it to recommendations:

**File:** `src/boards/recommendations.ts`

```typescript
export const USER_TYPE_TO_BOARDS: Record<UserType, string[]> = {
  // ... existing mappings ...
  
  'bass-producer': [
    'bass-producer',        // Your board!
    'basic-tracker',        // Fallback
    'basic-session'
  ]
};
```

---

## Step 7: Test Your Board

### In the Browser

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open board switcher:**
   - Press `Cmd+B` (Mac) or `Ctrl+B` (Windows/Linux)

3. **Search for your board:**
   - Type "Bass Producer" in the search box

4. **Switch to your board:**
   - Click or press Enter

5. **Verify:**
   - ✅ All decks appear in correct panels
   - ✅ Deck titles and icons display correctly
   - ✅ Tools are hidden/shown according to configuration
   - ✅ Shortcuts work (test with `Cmd+D`, etc.)
   - ✅ Theme colors apply correctly

### Automated Tests

Add tests in `src/boards/builtins/bass-producer-board.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { bassProducerBoard } from './bass-producer-board';
import { validateBoard } from '../validate';

describe('Bass Producer Board', () => {
  it('should be valid', () => {
    const result = validateBoard(bassProducerBoard);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should be full manual', () => {
    expect(bassProducerBoard.controlLevel).toBe('full-manual');
  });

  it('should have all tools disabled', () => {
    const tools = bassProducerBoard.compositionTools;
    expect(tools.phraseDatabase.enabled).toBe(false);
    expect(tools.harmonyExplorer.enabled).toBe(false);
    expect(tools.phraseGenerators.enabled).toBe(false);
    expect(tools.arrangerCard.enabled).toBe(false);
    expect(tools.aiComposer.enabled).toBe(false);
  });

  it('should have pattern editor as primary deck', () => {
    const primaryDeck = bassProducerBoard.decks.find(
      d => d.type === 'pattern-editor'
    );
    expect(primaryDeck).toBeDefined();
    expect(primaryDeck?.panelId).toBe('editor-panel');
  });

  it('should have spectrum analyzer for bass focus', () => {
    const spectrum = bassProducerBoard.decks.find(
      d => d.id === 'spectrum-analyzer'
    );
    expect(spectrum).toBeDefined();
  });
});
```

Run tests:
```bash
npm test bass-producer-board
```

---

## Step 8: Add Documentation

Create a board-specific doc in `docs/boards/`:

**File:** `docs/boards/bass-producer-board.md`

````markdown
# Bass Producer Board

**Control Level:** Full Manual
**Category:** Manual
**Difficulty:** Intermediate

## Overview

The Bass Producer Board is designed for electronic music producers focusing on
sub-bass design and rhythmic programming. It provides a tracker-style pattern
editor with spectrum analysis tools for precise frequency control.

## Use Cases

- Dubstep bass design
- Drum & Bass production
- Sub-bass focused tracks
- Manual bass sequencing

## Layout

```
┌─────────────┬─────────────────────────┬─────────────────┐
│  Browser    │   Pattern Editor        │  Analysis       │
│  (left)     │   (center)              │  (right)        │
│             │                         │                 │
│ • Bass      │  64-step tracker        │ • Spectrum      │
│   Instr.    │  Octave 2 default       │   Analyzer      │
│ • Samples   │  Sub-bass focus         │ • DSP Chain     │
│             │                         │ • Properties    │
│             │                         │                 │
├─────────────┴─────────────────────────┴─────────────────┤
│  Mixer (bottom)                                         │
│  • Track levels • Meters • EQ                           │
└─────────────────────────────────────────────────────────┘
```

## Decks

### Pattern Editor (Primary)
- **Type:** `pattern-editor`
- 64-step patterns (good for bass rhythms)
- Octave 2 default (bass frequency range)
- Follow playback enabled

### Bass Instruments (Browser)
- **Type:** `instrument-browser`
- Filtered to show bass/synth/sub categories only
- Drag/drop to pattern editor

### Spectrum Analyzer
- **Type:** `visualization`
- Frequency range: 20-200 Hz (sub-bass focus)
- Shows peaks and RMS levels
- Real-time analysis

### DSP Chain
- **Type:** `dsp-chain`
- Effect chain for bass processing
- EQ, compression, saturation, etc.

### Mixer
- **Type:** `mixer`
- Track levels and meters
- Solo/mute/arm controls

### Properties
- **Type:** `properties`
- Edit selected note/clip properties
- Pattern metadata

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+B` | Switch board |
| `Cmd+Enter` | Preview bass note |
| `Cmd+Shift+A` | Analyze spectrum |
| `Cmd+D` | Duplicate pattern |
| `Cmd+Shift+S` | Export bass stem |
| `Space` | Play/Pause |
| `Esc` | Stop |

## Workflow

1. **Load/create bass instrument** from browser
2. **Sequence pattern** in tracker (64 steps)
3. **Monitor frequencies** in spectrum analyzer
4. **Apply FX** via DSP chain
5. **Mix levels** in mixer
6. **Export stem** for arrangement

## Tips

- **Sub-bass range:** 20-60 Hz (fundamental)
- **Mid-bass range:** 60-200 Hz (harmonics)
- Use **mono** for sub-bass (better phase coherence)
- Use **spectrum analyzer** to avoid frequency mud
- **High-pass filter** everything above bass (in mixer)

## No AI Tools

This board is **purely manual** — no phrase generation, no harmony hints, no AI composition. You have full control over every note and parameter.

## Who Is This For?

- Electronic music producers (dubstep, DnB, trap)
- Sound designers focused on bass
- Producers who want tracker-style precision
- Users who prefer manual sequencing over MIDI piano roll
````

---

## Step 9: Advanced Features (Optional)

### Custom Deck Types

If your board needs a deck type that doesn't exist, you'll need to create it:

1. **Define the deck type** in `src/boards/decks/runtime-types.ts`:
   ```typescript
   export type DeckType = 
     | 'pattern-editor'
     | 'visualization'  // Your new type
     | /* ... */;
   ```

2. **Create a deck factory** in `src/boards/decks/factories/`:
   ```typescript
   // src/boards/decks/factories/visualization-factory.ts
   export function createVisualizationDeck(
     deckDef: BoardDeck,
     ctx: DeckContext
   ): DeckInstance {
     // Create spectrum analyzer UI
     // Return DeckInstance
   }
   ```

3. **Register the factory**:
   ```typescript
   // src/boards/decks/factory-registry.ts
   import { createVisualizationDeck } from './factories/visualization-factory';
   
   registry.registerFactory('visualization', createVisualizationDeck);
   ```

See [authoring-decks.md](./authoring-decks.md) for full details.

### Per-Track Control Levels (Hybrid Boards)

For hybrid boards, you can define per-track control levels:

```typescript
{
  id: 'hybrid-producer',
  controlLevel: 'collaborative',
  decks: [
    {
      id: 'session',
      type: 'clip-session',
      // ...
      perTrackControlLevel: true,  // Enable per-track control
      defaultTrackControlLevel: 'full-manual'
    }
  ]
}
```

Then in your board's deck bar or UI, provide controls to set per-track levels.

### Connection Presets

Define default routing connections:

```typescript
{
  id: 'modular-board',
  connections: [
    {
      id: 'osc-to-filter',
      sourceNodeId: 'oscillator-1',
      sourcePort: 'output',
      targetNodeId: 'filter-1',
      targetPort: 'input',
      connectionType: 'audio'
    }
  ]
}
```

---

## Checklist

Before finalizing your board:

- [ ] Board definition file created
- [ ] Board registered in `register.ts`
- [ ] Board validates without errors
- [ ] All deck types have registered factories
- [ ] Tool configuration matches control level
- [ ] Theme colors are readable (pass contrast checks)
- [ ] Keyboard shortcuts documented
- [ ] Tests written and passing
- [ ] Documentation created in `docs/boards/`
- [ ] Tested in browser (board switcher → your board)
- [ ] Verified all decks render correctly
- [ ] Verified shortcuts work
- [ ] Verified theme applies correctly
- [ ] Added to recommendations (if applicable)

---

## Common Issues

### "Deck type 'xyz' not found"
**Solution:** Register a factory for that deck type in `factory-registry.ts`.

### "Panel ID 'abc' not found"
**Solution:** Ensure all `panelId` references in `decks` match `layout.panels[].id`.

### "Tool mode 'hidden' but enabled: true"
**Solution:** Set `enabled: false` when `mode: 'hidden'`.

### Board not appearing in switcher
**Solution:** Ensure `registerBuiltinBoards()` is called at app startup and check for validation errors in console.

### Deck not rendering
**Solution:** Check deck factory implementation and ensure it returns a valid `DeckInstance` with a `render()` method.

---

## Next Steps

- Read [Deck Authoring Guide](./authoring-decks.md) (K003)
- Study existing boards in `src/boards/builtins/`
- Explore [Project Compatibility](./project-compatibility.md) (K004)
- Learn about [Board Switching Semantics](./board-switching.md) (K005)

---

**Happy board authoring!** Your custom board can serve a specific workflow, persona, or genre. The board system is designed to be extensible and flexible. 🎵
