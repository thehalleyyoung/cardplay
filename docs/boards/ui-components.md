# UI Components Guide

This guide covers the beautiful UI components in CardPlay's board system.

## Chord Visualizer

Location: `src/ui/components/chord-visualizer.ts`

The chord visualizer provides rich visual feedback for harmony-assisted workflows.

### Features

- **Interactive Piano Keyboard**: Shows chord tones highlighted on a full octave
- **Circle of Fifths**: Visual navigation showing current chord in harmonic context
- **Roman Numeral Analysis**: Shows chord function in the current key
- **Chord Info Panel**: Displays chord tones, quality, and scale degrees

### Usage

```typescript
import { createChordVisualizer } from '@cardplay/ui/components/chord-visualizer';

const visualizer = createChordVisualizer({
  chord: 'Cmaj7',
  key: 'C',
  showKeyboard: true,
  showCircle: true,
  showRomanNumerals: true,
  onChordToneClick: (note) => {
    console.log(`Clicked chord tone: ${note}`);
  },
});

container.appendChild(visualizer);
```

### Supported Chord Types

- Major: `C`, `C6`, `Cmaj7`, `Cmaj9`
- Minor: `Cm`, `Cm6`, `Cm7`, `Cm9`
- Dominant: `C7`, `C9`
- Diminished: `Cdim`
- Augmented: `Caug`
- Suspended: `Csus4`, `Csus2`

### Visual Design

The chord visualizer follows the board system's design tokens:

- **Primary Color**: Used for chord tone highlights and active elements
- **Accent Color**: Used for key context and secondary highlights
- **Surface Colors**: Adapt to dark/light mode automatically
- **Shadows**: Add depth with glowing effects for active chord tones

### Accessibility

- **Keyboard Navigation**: Piano keys are focusable buttons
- **High Contrast**: Border widths increase, shadows removed
- **Reduced Motion**: Transitions disabled when preference is set
- **Screen Readers**: Chord information exposed via ARIA labels

### Integration with Harmony Boards

The chord visualizer is designed for use in:

- **Tracker + Harmony Board**: Shows chord tones while editing tracker patterns
- **Notation + Harmony Board**: Provides harmonic guidance for notation editing
- **Composer Board**: Helps with chord progression planning

## Phrase Cards Browser

Location: `src/ui/components/phrase-cards.ts`

The phrase cards browser provides an elegant card-based UI for browsing and selecting phrases.

### Features

- **Card Grid Layout**: Responsive grid adapts to container width
- **Search**: Real-time search across phrase names, descriptions, and tags
- **Tag Filters**: Filter phrases by genre, mood, instrument, etc.
- **Favorites**: Star phrases to quickly find them later
- **Drag and Drop**: Drag phrases directly into editors
- **Preview**: Play phrase audio before inserting
- **Visual Previews**: Each card shows a mini-visualization of the phrase

### Usage

```typescript
import { createPhraseCards, type PhraseCardData } from '@cardplay/ui/components/phrase-cards';

const phrases: PhraseCardData[] = [
  {
    id: 'phrase-1',
    name: 'Jazzy Piano Fill',
    description: 'Chromatic ascending fill',
    tags: ['jazz', 'piano', 'fill'],
    duration: 2,
    noteCount: 16,
    isFavorite: false,
    bpm: 120,
  },
  // ... more phrases
];

const browser = createPhraseCards({
  phrases,
  searchText: '',
  activeFilters: [],
  showOnlyFavorites: false,
  onPhraseSelect: (phrase) => {
    console.log(`Selected: ${phrase.name}`);
  },
  onPhraseDragStart: (phrase) => {
    console.log(`Dragging: ${phrase.name}`);
  },
  onFavoriteToggle: (phraseId, isFavorite) => {
    // Update favorites in your state
  },
  onPreview: (phraseId) => {
    // Play phrase audio preview
  },
});

container.appendChild(browser);
```

### Card Display

Each phrase card shows:

- **Visual Preview**: Mini piano roll or waveform visualization
- **Favorite Button**: Star icon in top-right corner
- **Phrase Name**: Bold, truncated if too long
- **Metadata**: Note count and duration in beats
- **Tags**: Up to 3 tags displayed as colored badges
- **Preview Button**: Click to audition the phrase

### Drag and Drop

Phrases can be dragged directly into:

- **Tracker Panel**: Inserts notes at cursor position
- **Piano Roll**: Inserts notes at playhead
- **Notation View**: Inserts notes at selection
- **Timeline**: Creates a new clip with the phrase

The drag payload includes:

```typescript
{
  type: 'phrase',
  phraseId: string
}
```

### Filtering

**Search**: Searches across:
- Phrase name
- Description
- Tags

**Tag Filters**: 
- Select multiple tags
- Phrases must match ALL selected tags (AND logic)

**Favorites Filter**:
- Toggle to show only favorited phrases
- Favorites persist across sessions

### Visual Design

- **Card Hover**: Blue border and subtle lift effect
- **Empty State**: Friendly message when no results
- **Responsive Grid**: Adapts from 1-4 columns based on width
- **Dark Mode**: Colors automatically adapt
- **Smooth Transitions**: Hover and interaction feedback

### Accessibility

- **Keyboard Navigation**: Cards are focusable, Enter to select
- **Screen Reader Support**: ARIA labels on all interactive elements
- **High Contrast**: Borders and text remain readable
- **Reduced Motion**: Animations disabled when preference is set

### Performance

- **Virtual Scrolling**: Can handle 1000+ phrases smoothly
- **Efficient Filtering**: Debounced search, memoized results
- **Lazy Preview**: Audio previews loaded on demand

### Integration with Assisted Boards

The phrase browser is designed for:

- **Tracker + Phrases Board**: Primary phrase selection interface
- **Session + Generators Board**: Quick phrase insertion
- **Composer Board**: Phrase library as optional side panel

## Session Grid Panel

Location: `src/ui/components/session-grid-panel.ts`

The session grid provides an Ableton-style clip launcher interface.

### Features

- **Grid Layout**: Tracks (columns) × Scenes (rows)
- **Clip Slots**: Visual indication of empty/filled/playing/queued
- **Scene Launch**: Launch entire scenes (horizontal rows)
- **Track Headers**: Track names and controls
- **Play State Colors**: Visual feedback for clip state
- **Selection**: Active clip highlighted

### Visual States

Each clip slot can be in one of these states:

- **Empty**: Dark background, dashed border
- **Stopped**: Clip present, dimmed
- **Playing**: Bright color, pulsing animation
- **Queued**: Orange tint, waiting for next beat

### Accessibility

All session grid UI components follow WCAG 2.1 AA standards:

- Minimum contrast ratios (4.5:1 for text, 3:1 for UI elements)
- Keyboard navigation (Tab, Arrow keys, Enter, Space)
- Screen reader support (ARIA roles, labels, descriptions)
- Focus indicators (visible focus rings)
- Reduced motion support (respects `prefers-reduced-motion`)

## Theming

All UI components use CSS custom properties from the board theme system:

```css
--color-primary: Main accent color (default: #00a6ff)
--color-secondary: Secondary accent (default: #ff8c00)
--color-surface: Background surface (default: #1a1a1a)
--color-surface-elevated: Raised surfaces (default: #222)
--color-border: Border color (default: #333)
--color-text: Primary text (default: #fff)
--color-text-muted: Secondary text (default: #999)
```

Components automatically adapt to:

- **Dark/Light Mode**: Via `prefers-color-scheme`
- **High Contrast**: Via `prefers-contrast`
- **Reduced Motion**: Via `prefers-reduced-motion`

## Best Practices

### Component Lifecycle

1. **Create**: Use factory functions like `createChordVisualizer()`
2. **Mount**: Append to DOM container
3. **Update**: Re-create or use update functions
4. **Cleanup**: Remove from DOM, components handle their own cleanup

### Performance

- Components use efficient DOM manipulation
- Event listeners properly cleaned up on unmount
- Animations use `requestAnimationFrame`
- Large lists use virtual scrolling

### Customization

All components accept options for:

- **Colors**: Via CSS custom properties
- **Callbacks**: Via options object
- **Layout**: Via boolean flags (showKeyboard, showCircle, etc.)

### Testing

Components are tested with:

- **Unit Tests**: Vitest with jsdom
- **Visual Tests**: Storybook stories (planned)
- **Accessibility Tests**: axe-core automated checks
- **Manual Testing**: Keyboard-only navigation

## See Also

- [Board API Reference](board-api.md)
- [Deck Types Reference](decks.md)
- [Theming Guide](theming.md)
- [Accessibility Checklist](../accessibility.md)
