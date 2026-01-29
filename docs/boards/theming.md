# Board Theming System

Complete guide to the CardPlay board theming system.

**Status:** J001-J009 ✅

## Overview

The board theming system provides beautiful, distinctive visual experiences for each board type. Every board has a theme based on its control level, with optional board-specific overrides.

## Control Level Colors

Each control level has a distinct color palette for visual identification:

### Full Manual (Blue)
- **Primary:** `#2563eb` (Blue 600)
- **Philosophy:** "You control everything"
- **Visual Style:** Professional, clear, direct
- **Use Cases:** Tracker, notation, manual production

### Manual with Hints (Violet)
- **Primary:** `#7c3aed` (Violet 600)
- **Philosophy:** "Manual + suggestions"
- **Visual Style:** Subtle guidance overlays
- **Use Cases:** Tracker + harmony, notation + harmony

### Assisted (Emerald)
- **Primary:** `#059669` (Emerald 600)
- **Philosophy:** "Your ideas + tool execution"
- **Visual Style:** Helpful, collaborative
- **Use Cases:** Session + generators, tracker + phrases

### Collaborative (Orange)
- **Primary:** `#ea580c` (Orange 600)
- **Philosophy:** "50/50 with AI"
- **Visual Style:** Balanced partnership indicators
- **Use Cases:** Composer board, producer board

### Directed (Red)
- **Primary:** `#dc2626` (Red 600)
- **Philosophy:** "You direct, AI creates"
- **Visual Style:** Command-focused, directive
- **Use Cases:** AI arranger, AI composition

### Generative (Purple)
- **Primary:** `#9333ea` (Purple 600)
- **Philosophy:** "AI creates, you curate"
- **Visual Style:** Ethereal, flowing, generative
- **Use Cases:** Generative ambient, autonomous composition

## Theme Structure

```typescript
interface BoardTheme {
  colors?: {
    primary?: string;      // Main brand color
    secondary?: string;    // Supporting color
    accent?: string;       // Highlights and CTAs
    background?: string;   // Base background
  };
  typography?: {
    fontFamily?: string;   // Font stack
    fontSize?: number;     // Base font size in pixels
  };
  controlIndicators?: {
    showHints?: boolean;         // Show hint overlays
    showSuggestions?: boolean;   // Show suggestion UI
    showGenerative?: boolean;    // Show generative badges
  };
}
```

## CSS Custom Properties

Themes are applied via CSS custom properties for seamless integration with the design system:

### Board Theme Properties
- `--board-primary` - Primary brand color
- `--board-secondary` - Secondary color
- `--board-accent` - Accent color
- `--board-background` - Background color
- `--board-font-family` - Typography stack
- `--board-font-size` - Base font size

### Control Level Properties
- `--control-level-primary` - Control level brand color
- `--control-level-secondary` - Supporting color
- `--control-level-accent` - Highlight color
- `--control-level-background` - Background tint
- `--control-level-text` - Text color
- `--control-level-badge` - Badge color

### Indicator Flags
- `--board-show-hints` - `1` if hints enabled, `0` otherwise
- `--board-show-suggestions` - `1` if suggestions enabled, `0` otherwise
- `--board-show-generative` - `1` if generative badges enabled, `0` otherwise

## Board-Specific Theme Overrides

### Notation Boards
```typescript
{
  colors: {
    background: '#ffffff',  // Clean white
    primary: '#000000',     // Pure black for print
  },
  typography: {
    fontFamily: '"Bravura", "MusGlyphs", serif',  // Music fonts
  }
}
```

### Tracker Boards
```typescript
{
  typography: {
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: 14,
  },
  colors: {
    background: '#1a1a1a',  // Dark terminal-style
    primary: '#00ff00',     // Classic green
  }
}
```

### Sampler Boards
```typescript
{
  colors: {
    primary: '#ff6b35',     // Warm orange
    accent: '#f7931e',
    background: '#1e1e1e',  // Dark for waveforms
  }
}
```

### Session Boards
```typescript
{
  colors: {
    primary: '#00a8e8',     // Bright blue
    secondary: '#007ea7',
    accent: '#00e0ff',      // Cyan for clips
  }
}
```

## Theme Application

### Automatic Theme Switching

Themes are automatically applied when switching boards:

```typescript
import { switchBoard } from '@cardplay/boards/switching';

// Theme is applied automatically
switchBoard('basic-tracker');  // Blue manual theme
switchBoard('notation-manual'); // Black/white notation theme
```

### Manual Theme Application

For custom use cases:

```typescript
import { applyBoardTheme, getBoardTheme } from '@cardplay/boards/theme';

const theme = getBoardTheme('assisted', 'session-generators');
applyBoardTheme(theme);
```

### Theme Cleanup

```typescript
import { removeBoardTheme } from '@cardplay/boards/theme';

removeBoardTheme();  // Removes all board theme properties
```

## Control Indicators

### Visual Affordances

Control level indicators appear in multiple locations:

1. **Board Chrome Header**
   - Control level badge with color
   - Board name and icon

2. **Deck Headers**
   - Optional control level override badge
   - Per-deck autonomy indicators

3. **Track Headers**
   - Control level color strip (future)
   - Generated vs manual indicators

4. **Event Styling**
   - Lighter alpha for generated events
   - Badge for AI-authored content
   - Hint overlays for chord tones

### Badge Component

```typescript
<div class="control-level-badge" 
     style="background-color: var(--control-level-badge)">
  <span class="badge-icon">✨</span>
  <span class="badge-text">Generative</span>
</div>
```

## Accessibility

### Contrast Ratios

All control level colors meet WCAG AA contrast requirements:
- Text on background: ≥4.5:1
- Large text on background: ≥3:1
- UI component contrast: ≥3:1

### High Contrast Mode

The theme system respects `prefers-contrast: high`:
- Increased border widths
- Higher color contrast
- Simplified color palette

### Reduced Motion

Respects `prefers-reduced-motion: reduce`:
- No theme transition animations
- Instant color changes
- Static indicators

## Usage Examples

### Creating a Custom Board Theme

```typescript
import type { Board } from '@cardplay/boards/types';

const myBoard: Board = {
  // ... other board config
  theme: {
    colors: {
      primary: '#ff6b9d',
      accent: '#c06c84',
    },
    typography: {
      fontFamily: '"Comic Sans MS", cursive',  // (please don't)
    },
    controlIndicators: {
      showHints: true,
      showSuggestions: false,
      showGenerative: false,
    }
  }
};
```

### Using Theme Colors in Components

```typescript
// In your component CSS
.my-component {
  background: var(--board-background);
  color: var(--control-level-text);
  border-left: 3px solid var(--control-level-primary);
}

.my-component:hover {
  background: var(--control-level-accent);
}
```

### Conditional Styling Based on Control Level

```typescript
// In your component
const showHints = getComputedStyle(document.documentElement)
  .getPropertyValue('--board-show-hints') === '1';

if (showHints) {
  // Render hint overlays
}
```

## Implementation Details

### Theme System Architecture

```
src/boards/theme/
├── control-level-colors.ts  - Color palette definitions
├── board-theme-defaults.ts  - Default themes per control level
├── theme-applier.ts         - DOM application logic
└── index.ts                 - Public exports

src/boards/ui/
└── theme-applier.ts         - Board-specific theme application
```

### Integration Points

1. **Board Switching** (`src/boards/switching/switch-board.ts`)
   - Applies theme on activate
   - Clears theme on deactivate

2. **Board Initialization** (`src/boards/init.ts`)
   - Applies initial board theme on startup

3. **Design System** (`src/ui/theme.ts`)
   - Board themes compose with app-level design tokens

## Testing

Theme system is fully tested:
- ✅ Control level color definitions
- ✅ Theme merging and overrides
- ✅ CSS property generation
- ✅ Board-specific themes

See `src/boards/theme/*.test.ts` for test coverage.

## Future Enhancements

- [ ] User-customizable themes
- [ ] Theme import/export
- [ ] Per-board theme persistence
- [ ] Dark/light mode variants per board
- [ ] Accessibility theme presets

## See Also

- [Board API Reference](./board-api.md)
- [Control Spectrum](../../cardplayui.md#part-i-the-control-spectrum)
- [Visual Identity](../../cardplayui.md#part-ix-visual-identity-and-theming)
