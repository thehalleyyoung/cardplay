# CardPlay Keyboard Shortcuts Reference

> **Phase J - J056**: Comprehensive keyboard shortcuts documentation for all boards and contexts.

## Overview

CardPlay uses a unified keyboard shortcut system that adapts to the active board and context. Shortcuts are organized by:

1. **Global Shortcuts** - Available across all boards
2. **Board-Specific Shortcuts** - Active only for specific boards
3. **Deck-Specific Shortcuts** - Active when a deck has focus
4. **Context-Aware Shortcuts** - Paused in text inputs (except undo/redo)

## Architecture

The keyboard shortcut system is implemented in:
- `src/ui/keyboard-shortcuts.ts` - Main shortcut manager
- `src/ui/keyboard-navigation.ts` - Navigation helpers
- `src/ui/ui-event-bus.ts` - Event coordination
- `src/boards/switching/` - Board-specific shortcut registration

## Global Shortcuts

### Universal (Always Available)

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Cmd/Ctrl+Z` | Undo | Works in text fields |
| `Cmd/Ctrl+Shift+Z` | Redo | Works in text fields |
| `Cmd/Ctrl+Y` | Redo (alternate) | Windows-style |

### Board & Navigation (J014)

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Cmd+B` | Open Board Switcher | Global board switch |
| `Escape` | Close Modal | Closes active modal/overlay |
| `Cmd+,` | Open Settings | Application settings |
| `Cmd+/` | Toggle Help Panel | Contextual help |

### Transport (J017)

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Space` | Play/Pause | Toggle playback |
| `Enter` | Play from Start | Reset to beginning and play |
| `Cmd+Enter` | Stop | Stop playback |

### Deck Management (J015)

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Cmd+1..9` | Switch to Deck N | Active deck tab switching |
| `Cmd+W` | Close Active Deck | Close current deck/tab |
| `Cmd+Shift+W` | Close All Decks | Close all decks in panel |

## Board-Specific Shortcuts

### Manual Boards

#### Notation Board (Manual)

| Shortcut | Action | Category |
|----------|--------|----------|
| `N` | Add Note | Note entry |
| `R` | Add Rest | Note entry |
| `Cmd+T` | Add Text | Annotation |
| `Cmd+E` | Export PDF | File operations |
| `Cmd+P` | Print | File operations |

#### Basic Tracker Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `0-9, A-F` | Note Entry (Hex) | Tracker input |
| `Shift+0-9` | Effect Entry | Effect column |
| `Cmd+D` | Clone Pattern | Pattern operations |
| `Cmd+Shift+E` | Open Effect Rack | DSP chain |

#### Basic Sampler Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+I` | Import Sample | Sample management |
| `Cmd+Shift+C` | Chop Sample | Sample editing |
| `Cmd+L` | Loop Selection | Playback control |

#### Basic Session Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+L` | Launch Clip | Clip playback |
| `Cmd+Shift+L` | Launch Scene | Scene playback |
| `Cmd+K` | Stop Clip/Scene | Playback control |
| `Cmd+Shift+R` | Record Arm Toggle | Recording |

### Assisted Boards

#### Tracker + Harmony Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+H` | Toggle Harmony Colors | Visualization |
| `Cmd+Shift+H` | Set Chord | Harmony editing |
| `Cmd+R` | Toggle Roman Numerals | Notation mode |

#### Tracker + Phrases Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+F` | Open Phrase Search | Phrase library |
| `Cmd+Shift+P` | Preview Phrase | Audition |
| `Cmd+Shift+S` | Save as Phrase | Library management |

#### Session + Generators Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+G` | Generate | Generator execution |
| `Cmd+Shift+G` | Regenerate | Re-generate with new seed |
| `Cmd+Shift+F` | Freeze Track | Lock generated content |

#### Notation + Harmony Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+H` | Open Harmony Suggestions | Chord suggestions |
| `Cmd+Shift+A` | Accept Suggestion | Apply chord |
| `Cmd+Shift+H` | Toggle Highlights | Visualization |

### Generative Boards (Phase H)

#### AI Arranger Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+G` | Generate Section | Arranger |
| `Cmd+Shift+G` | Regenerate Section | Arranger |
| `Cmd+Shift+F` | Freeze Section | Lock content |
| `Cmd+Shift+M` | Switch to Manual Board | Workflow transition |

#### AI Composition Board (J016)

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+K` | Open AI Composer Palette | Command palette |
| `Cmd+Enter` | Accept Draft | Apply generation |
| `Cmd+Shift+R` | Reject Draft | Discard generation |
| `Cmd+G` | Regenerate | New variation |

#### Generative Ambient Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+A` | Accept Candidate | Commit to store |
| `Cmd+D` | Reject Candidate | Discard |
| `Cmd+Shift+C` | Capture Live | Record window |
| `Cmd+Shift+F` | Freeze Layer | Lock layer |

### Hybrid Boards (Phase I)

#### Composer Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+G` | Generate Part | Generator |
| `Cmd+K` | Open Generator Settings | Configuration |
| `Cmd+Shift+S` | Sync Scroll | View coordination |

#### Producer Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+J` | Consolidate | Arrangement |
| `Cmd+Shift+F` | Freeze Track | Bounce to audio |
| `Cmd+E` | Export Mix | File operations |

#### Live Performance Board

| Shortcut | Action | Category |
|----------|--------|----------|
| `Space` | Launch Scene | Performance |
| `Cmd+P` | Panic (All Off) | Emergency stop |
| `T` | Tempo Tap | Tempo control |

## Routing Overlay Shortcuts (Phase J)

| Shortcut | Action | Category |
|----------|--------|----------|
| `Cmd+Shift+R` | Toggle Routing Overlay | View |
| `Cmd+N` | New Connection | Routing |
| `Delete` | Delete Connection | Routing |
| `Cmd+D` | Duplicate Connection | Routing |

## Input Context Detection (J019)

The shortcut system automatically detects when the user is typing in text fields and pauses most shortcuts, except:

**Always Active:**
- `Cmd/Ctrl+Z` - Undo
- `Cmd/Ctrl+Shift+Z` - Redo
- `Escape` - Close/Cancel

**Paused in Text Inputs:**
- All single-key shortcuts (letters, numbers)
- Space for playback (only outside text fields)
- Navigation shortcuts

**Implementation:**
```typescript
// From keyboard-shortcuts.ts
private isPausableInInput(shortcut: KeyboardShortcut): boolean {
  // Undo/redo always work
  if (shortcut.id === 'undo' || shortcut.id === 'redo') {
    return false;
  }
  return true;
}
```

## User Remapping (J020)

Future feature: Users will be able to remap shortcuts via settings panel.

**Design Goals:**
- Per-board shortcut customization
- Conflict detection and warnings
- Export/import shortcut configurations
- Reset to defaults option

**Planned Implementation:**
- Shortcut editor UI in settings
- JSON configuration format
- Runtime rebinding without restarts
- Cloud sync for shortcut presets

## Accessibility

All shortcuts have accessible alternatives:
- Every action is reachable via mouse
- Context menus provide action discovery
- Help panel (`Cmd+/`) shows active shortcuts
- Tooltip hints show shortcuts on hover

## Platform Differences

| Symbol | macOS | Windows/Linux |
|--------|-------|---------------|
| `Cmd` | ⌘ Command | Ctrl |
| `Option` | ⌥ Option | Alt |
| `Shift` | ⇧ Shift | Shift |

The shortcut system automatically adapts to the platform, displaying the correct modifier keys in UI.

## Related Documentation

- `docs/boards/board-api.md` - Board shortcut registration
- `docs/boards/theming.md` - Shortcut UI styling
- `docs/accessibility.md` - Keyboard-only workflows
- `INTEGRATION_FIXES_CHECKLIST.md` - Phase G.4 keyboard implementation

## Developer Guide

### Registering Board-Specific Shortcuts

```typescript
// In your board definition
shortcuts: {
  'generate': 'Cmd+G',
  'freeze': 'Cmd+Shift+F',
  'accept-draft': 'Cmd+Enter'
}

// Handled automatically by board switching system
```

### Custom Shortcut Registration

```typescript
import { KeyboardShortcutManager } from '@cardplay/ui/keyboard-shortcuts';

const manager = KeyboardShortcutManager.getInstance();
manager.register({
  id: 'my-action',
  key: 'g',
  modifiers: { meta: true },
  description: 'My custom action',
  category: 'custom',
  action: () => { /* implementation */ }
});
```

### Cleanup on Unmount

```typescript
// Board lifecycle hooks handle cleanup automatically
onDeactivate: () => {
  // Shortcuts unregistered automatically
}
```

---

**Status**: Phase J - J056 ✅ Complete
**Last Updated**: 2026-01-29
**Version**: 1.0.0
