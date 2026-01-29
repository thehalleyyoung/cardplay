# Board API Reference

## Overview

The Board System provides a type-safe, configurable architecture for creating different compositional environments. Each board defines which tools, decks, and cards are available, creating a focused workspace tailored to specific workflows and control levels.

## Core Types

### ControlLevel

Defines the degree of automation/AI involvement:

- `'full-manual'` - You control everything
- `'manual-with-hints'` - Manual + suggestions
- `'assisted'` - Your ideas + tool execution
- `'collaborative'` - 50/50 with AI
- `'directed'` - You direct, AI creates
- `'generative'` - AI creates, you curate

### ViewType

Primary view type for a board:

- `'tracker'` - Pattern-based editor
- `'notation'` - Score editor
- `'session'` - Clip launcher
- `'arranger'` - Timeline arrangement
- `'composer'` - Full composition environment
- `'sampler'` - Sample-based workflow

### DeckType

Available deck types (containers for cards/panels):

- `'pattern-deck'` - Tracker pattern editor
- `'notation-deck'` - Notation editor
- `'piano-roll-deck'` - Piano roll editor
- `'session-deck'` - Session view clips
- `'arrangement-deck'` - Timeline arrangement
- `'instruments-deck'` - Instrument rack
- `'effects-deck'` - Effect rack
- `'samples-deck'` - Sample browser
- `'phrases-deck'` - Phrase library
- `'harmony-deck'` - Harmony explorer
- `'generators-deck'` - Generator cards
- `'mixer-deck'` - Mixer channels
- `'routing-deck'` - Routing graph
- `'automation-deck'` - Automation lanes
- `'properties-deck'` - Properties inspector
- `'ai-advisor-deck'` - AI Advisor panel

## Board Interface

```typescript
interface Board {
  // Identification
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  
  // Classification
  readonly controlLevel: ControlLevel;
  readonly difficulty: BoardDifficulty;
  readonly category: string;
  readonly tags: readonly string[];
  
  // Composition Tools
  readonly compositionTools: CompositionToolConfig;
  
  // Layout
  readonly primaryView: ViewType;
  readonly layout: BoardLayout;
  readonly decks: readonly BoardDeck[];
  
  // Optional
  readonly connections?: readonly BoardConnection[];
  readonly theme?: BoardTheme;
  readonly shortcuts?: BoardShortcutMap;
  readonly onActivate?: () => void;
  readonly onDeactivate?: () => void;
}
```

## Registry API

### getBoardRegistry()

Returns the singleton board registry.

```typescript
const registry = getBoardRegistry();
```

### register(board: Board)

Registers a board. Throws if board ID is duplicate or validation fails.

```typescript
registry.register(myBoard);
```

### get(boardId: string)

Returns a board by ID, or undefined if not found.

```typescript
const board = registry.get('basic-tracker');
```

### list()

Returns all registered boards, sorted by category and name.

```typescript
const allBoards = registry.list();
```

### search(query: string)

Searches boards by name, description, and tags.

```typescript
const results = registry.search('tracker');
```

### getByControlLevel(level: ControlLevel)

Filters boards by control level.

```typescript
const manualBoards = registry.getByControlLevel('full-manual');
```

## State Store API

### getBoardStateStore()

Returns the singleton board state store.

```typescript
const store = getBoardStateStore();
```

### getState()

Returns the current board state.

```typescript
const state = store.getState();
```

### subscribe(listener: (state: BoardState) => void)

Subscribes to state changes. Returns unsubscribe function.

```typescript
const unsubscribe = store.subscribe(state => {
  console.log('Board changed:', state.currentBoardId);
});
```

### setCurrentBoard(boardId: string)

Sets the current board and updates recent boards list.

```typescript
store.setCurrentBoard('basic-tracker');
```

### toggleFavorite(boardId: string)

Toggles favorite status for a board.

```typescript
store.toggleFavorite('basic-tracker');
```

### setFirstRunCompleted()

Marks first-run experience as completed.

```typescript
store.setFirstRunCompleted();
```

## Switching API

### switchBoard(boardId: string, options?: BoardSwitchOptions)

Switches to a different board with optional configuration.

```typescript
import { switchBoard } from '@cardplay/boards';

switchBoard('notation-manual', {
  resetLayout: false,
  resetDecks: false,
  preserveActiveContext: true,
  preserveTransport: true
});
```

### BoardSwitchOptions

```typescript
interface BoardSwitchOptions {
  resetLayout?: boolean;           // Reset panel sizes to defaults
  resetDecks?: boolean;             // Reset deck states to defaults
  preserveActiveContext?: boolean;  // Keep active stream/clip/track
  preserveTransport?: boolean;      // Keep transport state
}
```

## Context Store API

### getBoardContextStore()

Returns the singleton board context store.

```typescript
const context = getBoardContextStore();
```

### setActiveStream(streamId: string)

Sets the active stream ID.

```typescript
context.setActiveStream('stream-1');
```

### setActiveClip(clipId: string)

Sets the active clip ID.

```typescript
context.setActiveClip('clip-1');
```

## Validation

### validateBoard(board: Board)

Validates a board definition. Throws ValidationError if invalid.

```typescript
import { validateBoard } from '@cardplay/boards';

try {
  validateBoard(myBoard);
} catch (error) {
  console.error('Board validation failed:', error.message);
}
```

Validates:
- Board ID is non-empty and unique
- Deck IDs are unique within the board
- Deck types are known
- Tool configs are consistent
- Panel IDs are unique and positions are valid

## Recommendations

### getRecommendedBoards(userType: string, registry: BoardRegistry)

Returns recommended boards for a user type.

```typescript
import { getRecommendedBoards } from '@cardplay/boards';

const recommended = getRecommendedBoards('tracker-purist', registry);
```

## See Also

- [Board State Persistence](./board-state.md)
- [Layout Runtime](./layout-runtime.md)
- [Board Migration](./migration.md)
