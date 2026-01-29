# Board Capabilities System

## Overview

The Board Capabilities system provides a centralized way to determine what features, actions, and UI elements are available on a given board. It translates board configuration (control level + tool modes) into actionable boolean flags and lists.

**Module**: `@cardplay/boards/gating/capabilities`  
**Phase**: D (Card Availability & Tool Gating)  
**Status**: ✅ Complete (D049, D050, D051)

## Core Concepts

### 1. BoardCapabilities Interface

```typescript
interface BoardCapabilities {
  // Deck visibility
  visibleDeckTypes: readonly DeckType[];
  
  // Card filtering
  allowedCardIds: string[];
  allowedCardKinds: BoardCardKind[];
  
  // Feature flags
  canDragPhrases: boolean;
  canAutoSuggest: boolean;
  canInvokeAI: boolean;
  canControlOtherCards: boolean;
  canShowHarmonyHints: boolean;
  canGenerateContinuously: boolean;
  canFreezeGenerated: boolean;
  canRegenerateContent: boolean;
}
```

### 2. Capability Computation

Capabilities are computed from:
- **Control Level**: `full-manual`, `manual-with-hints`, `assisted`, `directed`, `collaborative`, `generative`
- **Tool Configuration**: Each tool's `enabled` and `mode` settings

```typescript
import { computeBoardCapabilities } from '@cardplay/boards/gating/capabilities';

const board = getBoardRegistry().get('tracker-harmony');
const caps = computeBoardCapabilities(board);

if (caps.canDragPhrases) {
  enablePhraseDragDrop();
}
```

## Capability Flags Reference

### Phrase Capabilities

#### canDragPhrases
**When True**:
- `phraseDatabase.mode === 'drag-drop'`

**When False**:
- `phraseDatabase.mode === 'browse-only'` or `'hidden'`

**UI Impact**:
- Phrase library items become draggable
- Drop zones in pattern editors accept phrase drops
- Drag image/preview shown during drag

**Example**:
```typescript
// In phrase-library-factory.ts
const capabilities = computeBoardCapabilities(board);
const isDragEnabled = capabilities.canDragPhrases;

item.draggable = isDragEnabled;
if (isDragEnabled) {
  item.addEventListener('dragstart', handleDragStart);
}
```

### Harmony Capabilities

#### canShowHarmonyHints
**When True**:
- `harmonyExplorer.mode !== 'hidden'`

**When False**:
- `harmonyExplorer.mode === 'hidden'`

**UI Impact**:
- Harmony deck shows key and chord display
- Note coloring based on chord tones
- Scale tone indicators

#### canAutoSuggest
**When True**:
- `harmonyExplorer.mode === 'suggest'`

**When False**:
- Any other mode

**UI Impact**:
- Suggested next chords appear
- Modulation planner visible
- Chord progression suggestions
- Voice-leading recommendations

**Example**:
```typescript
// In harmony-display-factory.ts
const capabilities = computeBoardCapabilities(board);
const showSuggestions = capabilities.canAutoSuggest;

if (showSuggestions) {
  renderModulationPlanner();
  renderChordSuggestions();
}
```

### Generator Capabilities

#### canRegenerateContent
**When True**:
- `phraseGenerators.mode === 'on-demand'` OR `'continuous'`

**When False**:
- `phraseGenerators.mode === 'hidden'`

**UI Impact**:
- "Regenerate" button enabled
- Seed controls visible
- Parameter variation controls

#### canGenerateContinuously
**When True**:
- `phraseGenerators.mode === 'continuous'`

**When False**:
- Any other mode

**UI Impact**:
- Background generation active
- Accept/reject candidate UI
- Real-time preview stream

#### canFreezeGenerated
**When True**:
- Control level is `assisted`, `directed`, `collaborative`, or `generative`

**When False**:
- Control level is `full-manual` or `manual-with-hints`

**UI Impact**:
- "Freeze" button available on generated content
- Frozen state badge display
- Lock icon on frozen events

### AI Capabilities

#### canInvokeAI
**When True**:
- `aiComposer.mode !== 'hidden'`

**When False**:
- `aiComposer.mode === 'hidden'`

**UI Impact**:
- AI composer panel visible
- Cmd+K command palette shows AI actions
- "Generate draft" actions available
- Prompt input visible

#### canControlOtherCards
**When True**:
- Control level is `collaborative` or `generative`

**When False**:
- Any other control level

**UI Impact**:
- Cross-card parameter control UI
- Method invocation on other cards
- Arranger can control track instruments
- Host actions can modify card state

## Usage Patterns

### Pattern 1: Deck Factory Integration

```typescript
// In a deck factory create() method
export const myDeckFactory: DeckFactory = {
  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance {
    // Get board and compute capabilities
    const board = getBoardRegistry().get(ctx.boardId);
    const caps = board ? computeBoardCapabilities(board) : null;
    
    // Extract flags with safe defaults
    const canDrag = caps?.canDragPhrases ?? false;
    const canSuggest = caps?.canAutoSuggest ?? false;
    
    // Use flags to configure UI
    return {
      render: () => createUI(canDrag, canSuggest),
      // ...
    };
  }
};
```

### Pattern 2: Component-Level Checks

```typescript
function renderFeature(board: Board) {
  if (hasCapability(board, 'canInvokeAI')) {
    return renderAIPanel();
  } else {
    return renderEmptyState('AI features not available on this board');
  }
}
```

### Pattern 3: Action Gating

```typescript
function handleAction(board: Board) {
  const caps = computeBoardCapabilities(board);
  
  if (!caps.canRegenerateContent) {
    showToast('Regeneration not available on manual boards');
    return;
  }
  
  // Proceed with action
  regeneratePattern();
}
```

## Control Level Matrix

| Capability | full-manual | manual-with-hints | assisted | directed | collaborative | generative |
|------------|-------------|-------------------|----------|----------|---------------|------------|
| canDragPhrases | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool |
| canShowHarmonyHints | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool |
| canAutoSuggest | ❌ No | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool |
| canRegenerateContent | ❌ No | ❌ No | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool |
| canGenerateContinuously | ❌ No | ❌ No | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool |
| canFreezeGenerated | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| canInvokeAI | ❌ No | ❌ No | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool | ⚙️ Tool |
| canControlOtherCards | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |

**Legend**:
- ✅ **Yes**: Capability always available at this control level
- ❌ **No**: Capability never available at this control level
- ⚙️ **Tool**: Availability depends on tool configuration

## Tool Mode Dependencies

### phraseDatabase
- `hidden` → canDragPhrases = false
- `browse-only` → canDragPhrases = false
- `drag-drop` → canDragPhrases = true

### harmonyExplorer
- `hidden` → canShowHarmonyHints = false, canAutoSuggest = false
- `display-only` → canShowHarmonyHints = true, canAutoSuggest = false
- `suggest` → canShowHarmonyHints = true, canAutoSuggest = true

### phraseGenerators
- `hidden` → canRegenerateContent = false, canGenerateContinuously = false
- `on-demand` → canRegenerateContent = true, canGenerateContinuously = false
- `continuous` → canRegenerateContent = true, canGenerateContinuously = true

### aiComposer
- `hidden` → canInvokeAI = false
- `command-palette` → canInvokeAI = true
- `inline-suggest` → canInvokeAI = true

## Helper Functions

### hasCapability()
Check if a specific capability is enabled:

```typescript
import { hasCapability } from '@cardplay/boards/gating/capabilities';

if (hasCapability(board, 'canDragPhrases')) {
  showPhrasePalette();
}
```

### getCapabilitiesSummary()
Get human-readable capability description:

```typescript
import { getCapabilitiesSummary } from '@cardplay/boards/gating/capabilities';

const summary = getCapabilitiesSummary(board);
// "assisted, phrase drag-drop, harmony hints, auto-suggestions"
```

## Board Examples

### Basic Tracker (Manual)
```typescript
{
  controlLevel: 'full-manual',
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: false, mode: 'hidden' },
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' }
  }
}

// Results in:
// - All capabilities false
// - Pure manual editing only
```

### Tracker + Harmony (Assisted Hints)
```typescript
{
  controlLevel: 'manual-with-hints',
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: true, mode: 'display-only' },
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' }
  }
}

// Results in:
// - canShowHarmonyHints = true
// - canAutoSuggest = false (display-only mode)
// - All other capabilities false
```

### Session + Generators (Assisted)
```typescript
{
  controlLevel: 'assisted',
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: false, mode: 'hidden' },
    phraseGenerators: { enabled: true, mode: 'on-demand' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' }
  }
}

// Results in:
// - canRegenerateContent = true
// - canFreezeGenerated = true
// - canGenerateContinuously = false (on-demand mode)
```

### Composer (Collaborative)
```typescript
{
  controlLevel: 'collaborative',
  compositionTools: {
    phraseDatabase: { enabled: true, mode: 'drag-drop' },
    harmonyExplorer: { enabled: true, mode: 'suggest' },
    phraseGenerators: { enabled: true, mode: 'on-demand' },
    arrangerCard: { enabled: true, mode: 'chord-follow' },
    aiComposer: { enabled: false, mode: 'hidden' }
  }
}

// Results in:
// - canDragPhrases = true
// - canShowHarmonyHints = true
// - canAutoSuggest = true
// - canRegenerateContent = true
// - canFreezeGenerated = true
// - canControlOtherCards = true
```

## Implementation Notes

### Performance
- Capability computation is fast (O(#tools))
- No memoization needed for typical use
- Safe to call on every render if needed

### Type Safety
- All flags are boolean (no undefined)
- Arrays are readonly for immutability
- null/undefined handled with ?? operators

### Extensibility
To add a new capability:

1. Add field to `BoardCapabilities` interface
2. Add computation logic in `computeBoardCapabilities()`
3. Document in this file
4. Update UI components to use the flag

## Testing

Capability computation is tested in:
- `src/boards/gating/capabilities.test.ts` (unit tests)
- `src/boards/gating/manual-board-gating-smoke.test.ts` (smoke tests)
- `src/boards/builtins/*.test.ts` (integration tests)

## Related Documentation

- [Gating System](./gating.md) - Overall gating architecture
- [Tool Modes](./tool-modes.md) - Tool configuration reference
- [Control Spectrum](./control-spectrum.md) - Control level philosophy
- [Board API](./board-api.md) - Board type definitions

## Changelog

- **2026-01-29**: Created documentation
- **2026-01-29**: Implemented D050 (canDragPhrases)
- **2026-01-29**: Implemented D051 (canAutoSuggest)

## Future Work

- **D052**: Wire canInvokeAI into command palette
- **D066-D068**: Dynamic capability recomputation on board switch
- Add capability-based feature discovery UI
- Per-track capability overrides
