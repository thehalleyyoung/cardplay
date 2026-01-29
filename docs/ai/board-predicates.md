# Board & Deck Predicates Reference

This document provides a comprehensive reference for all Prolog predicates in the board layout knowledge base (`board-layout.pl`).

## Overview

The board layout knowledge base provides rule-based reasoning about:
- **Board Types**: Different UI configurations with varying levels of AI assistance
- **Deck Types**: Modular UI components that can be arranged on boards
- **Workflows**: User personas and their typical activities
- **Layout Rules**: Optimal deck positioning and sizing
- **Compatibility Rules**: Which decks work together at different control levels

## Board Definitions (L082)

### `board/2`

Defines available board types with their control levels.

```prolog
board(BoardId, ControlLevel).
```

**Control Levels:**
- `full_manual` - Complete user control, no AI assistance
- `manual_with_hints` - Manual control with optional suggestions
- `assisted` - Active AI suggestions, user maintains control
- `collaborative` - User and AI work together equally
- `directed` - AI leads, user provides guidance
- `generative` - AI-driven creation with user steering

**Examples:**
```prolog
board(notation_board, full_manual).
board(notation_harmony_board, manual_with_hints).
board(tracker_phrases_board, assisted).
board(composer_board, collaborative).
board(arranger_board, directed).
board(generative_ambient_board, generative).
```

**Available Boards:**
| Board ID | Control Level |
|----------|--------------|
| `notation_board` | `full_manual` |
| `basic_tracker_board` | `full_manual` |
| `basic_sampler_board` | `full_manual` |
| `basic_session_board` | `full_manual` |
| `tracker_harmony_board` | `manual_with_hints` |
| `tracker_phrases_board` | `assisted` |
| `session_phrases_board` | `assisted` |
| `notation_harmony_board` | `manual_with_hints` |
| `arranger_board` | `directed` |
| `ai_composition_board` | `directed` |
| `generative_ambient_board` | `generative` |
| `algorithmic_drums_board` | `generative` |
| `composer_board` | `collaborative` |
| `producer_board` | `collaborative` |
| `live_performance_board` | `collaborative` |

### `board_category/2`

Maps detailed control levels to simpler categories.

```prolog
board_category(BoardId, Category).
% Category: manual | assisted | generative | hybrid
```

## Deck Types (L083)

### `deck_type/1`

Declares available deck types.

```prolog
deck_type(DeckId).
```

**Available Deck Types:**
| Deck | Description |
|------|-------------|
| `pattern_editor` | Tracker-style pattern sequencer |
| `phrase_library` | Browse and manage musical phrases |
| `instrument_rack` | Load and configure instruments |
| `effect_chain` | Audio effects processing |
| `mixer` | Volume, pan, and routing |
| `harmony_explorer` | Chord and scale visualization |
| `arranger` | Song arrangement view |
| `timeline` | Linear time-based editing |
| `clip_launcher` | Session/clip-based workflow |
| `sampler` | Sample playback and manipulation |
| `notation_editor` | Traditional music notation |
| `transport` | Playback controls |
| `browser` | File and preset browser |
| `piano_roll` | MIDI note editing |
| `automation` | Parameter automation |
| `generator` | AI phrase generation |
| `ai_assistant` | AI composition assistant |
| `routing` | Audio/MIDI routing |
| `meter_bridge` | Metering display |

## Board-Deck Relationships (L084)

### `board_has_deck/2`

Defines which decks are present on each board.

```prolog
board_has_deck(BoardId, DeckType).
```

**Example:**
```prolog
board_has_deck(notation_board, notation_editor).
board_has_deck(notation_board, instrument_rack).
board_has_deck(notation_board, mixer).
board_has_deck(basic_tracker_board, pattern_editor).
board_has_deck(basic_tracker_board, browser).
```

## Deck Compatibility (L085)

### `deck_compatible_with_control_level/2`

Determines if a deck can be used at a given control level.

```prolog
deck_compatible_with_control_level(DeckType, ControlLevel).
```

**Rules:**
- Core decks (pattern_editor, mixer, etc.) work at all levels
- Phrase library requires at least `manual_with_hints`
- Generator decks require `assisted` or higher
- AI assistant requires `directed` or `generative`

**Example:**
```prolog
% Works everywhere
deck_compatible_with_control_level(pattern_editor, _).
deck_compatible_with_control_level(mixer, _).

% Requires hints or above
deck_compatible_with_control_level(phrase_library, Level) :-
    Level \= full_manual.

% AI features only
deck_compatible_with_control_level(ai_assistant, Level) :-
    member(Level, [directed, generative]).
```

## Tool Requirements (L086)

### `tool_required_for_deck/2`

Specifies which tools must be enabled for a deck to function.

```prolog
tool_required_for_deck(DeckType, ToolId).
```

**Examples:**
```prolog
tool_required_for_deck(phrase_library, phrase_database).
tool_required_for_deck(harmony_explorer, harmony_explorer_tool).
tool_required_for_deck(generator, phrase_generators).
tool_required_for_deck(arranger, arranger_tool).
tool_required_for_deck(ai_assistant, ai_composer).
```

### `deck_requires_no_tool/1`

Identifies decks that work without special tools.

```prolog
deck_requires_no_tool(DeckType).
```

## Layout Rules (L087-L088)

### `deck_layout_position/2`

Suggests optimal position for each deck type.

```prolog
deck_layout_position(DeckType, Position).
% Position: center | left | right | top | bottom
```

**Layout Conventions:**
- **Center**: Primary editing surfaces (pattern_editor, notation_editor, piano_roll)
- **Left**: Browsers and libraries (phrase_library, browser)
- **Right**: Assistants and explorers (harmony_explorer, ai_assistant, generator)
- **Bottom**: Mixing and routing (mixer, effect_chain, instrument_rack, transport)

### `panel_size_suggestion/3`

Suggests optimal panel dimensions.

```prolog
panel_size_suggestion(DeckType, Dimension, Percentage).
% Dimension: width | height
```

**Examples:**
```prolog
panel_size_suggestion(pattern_editor, width, 60).
panel_size_suggestion(pattern_editor, height, 70).
panel_size_suggestion(phrase_library, width, 20).
panel_size_suggestion(mixer, width, 100).
panel_size_suggestion(mixer, height, 20).
```

## Deck Pairing (L089)

### `deck_pairing/2`

Identifies decks that work well together.

```prolog
deck_pairing(DeckA, DeckB).
```

**Examples:**
```prolog
deck_pairing(pattern_editor, phrase_library).
deck_pairing(pattern_editor, harmony_explorer).
deck_pairing(notation_editor, harmony_explorer).
deck_pairing(clip_launcher, arranger).
deck_pairing(generator, timeline).
```

### `deck_pairs_with/2`

Symmetric version of deck_pairing.

```prolog
deck_pairs_with(A, B) :- deck_pairing(A, B).
deck_pairs_with(A, B) :- deck_pairing(B, A).
```

## Workflows (L090-L093)

### `workflow/2`

Defines user workflow types with descriptions.

```prolog
workflow(WorkflowId, Description).
```

**Available Workflows:**
| Workflow | Description |
|----------|-------------|
| `notation_composer` | Traditional notation-based composition |
| `tracker_user` | Tracker-style pattern sequencing |
| `beatmaker` | Sample-based beat production |
| `electronic_producer` | Electronic music production |
| `film_scorer` | Film and media scoring |
| `sound_designer` | Sound design and synthesis |
| `live_performer` | Live performance and improvisation |
| `ambient_artist` | Ambient and generative music |
| `jazz_musician` | Jazz composition and arrangement |
| `classical_arranger` | Classical orchestration |

### `workflow_requires_deck/2`

Essential decks for a workflow to function.

```prolog
workflow_requires_deck(WorkflowId, DeckType).
```

**Examples:**
```prolog
workflow_requires_deck(notation_composer, notation_editor).
workflow_requires_deck(notation_composer, instrument_rack).
workflow_requires_deck(tracker_user, pattern_editor).
workflow_requires_deck(beatmaker, sampler).
```

### `workflow_benefits_from_deck/2`

Optional decks that enhance a workflow.

```prolog
workflow_benefits_from_deck(WorkflowId, DeckType).
```

### `recommended_board/2`

Suggests boards for each workflow.

```prolog
recommended_board(WorkflowId, BoardId).
```

**Examples:**
```prolog
recommended_board(notation_composer, notation_board).
recommended_board(notation_composer, notation_harmony_board).
recommended_board(tracker_user, basic_tracker_board).
recommended_board(ambient_artist, generative_ambient_board).
```

## Board Transitions (L094)

### `board_transition/3`

Defines valid transitions between boards.

```prolog
board_transition(FromBoard, ToBoard, TransitionType).
% TransitionType: smooth | compatible | requires_migration
```

**Transition Types:**
- `smooth` - Same control level, seamless transition
- `compatible` - Adjacent control levels, minor adjustment
- `requires_migration` - Significant level change, may need adaptation

### `compatible_levels/2`

Defines which control levels can transition smoothly.

```prolog
compatible_levels(Level1, Level2).
```

## Deck Open Order (L095)

### `deck_open_order/2`

Suggests the order to open decks for a workflow.

```prolog
deck_open_order(WorkflowId, DeckList).
```

**Examples:**
```prolog
deck_open_order(notation_composer, [notation_editor, instrument_rack, mixer, harmony_explorer]).
deck_open_order(tracker_user, [pattern_editor, instrument_rack, mixer, phrase_library]).
deck_open_order(beatmaker, [sampler, pattern_editor, effect_chain, mixer]).
```

## Shortcuts and Theming (L105-L108)

### `shortcut_for_action/2`

Defines keyboard shortcuts.

```prolog
shortcut_for_action(ActionId, Shortcut).
```

**Standard Shortcuts:**
| Action | Shortcut |
|--------|----------|
| `play` | `Space` |
| `stop` | `Escape` |
| `record` | `R` |
| `undo` | `Cmd+Z` |
| `redo` | `Cmd+Shift+Z` |
| `save` | `Cmd+S` |
| `copy` | `Cmd+C` |
| `paste` | `Cmd+V` |

### `theme_appropriate/2`

Suggests themes for board types.

```prolog
theme_appropriate(ThemeName, BoardId).
```

**Examples:**
```prolog
theme_appropriate(dark, _).  % Dark works everywhere
theme_appropriate(notation_theme, notation_board).
theme_appropriate(tracker_theme, basic_tracker_board).
theme_appropriate(ambient_theme, generative_ambient_board).
```

### `color_coding_rule/3`

Defines colors for control level indicators.

```prolog
color_coding_rule(ControlLevel, Property, Value).
```

**Examples:**
```prolog
color_coding_rule(full_manual, indicator, blue).
color_coding_rule(manual_with_hints, indicator, green).
color_coding_rule(assisted, indicator, yellow).
color_coding_rule(collaborative, indicator, orange).
color_coding_rule(directed, indicator, purple).
color_coding_rule(generative, indicator, pink).
```

## Visibility and Safety (L109-L115)

### `deck_visibility_rule/3`

Determines deck visibility on a board.

```prolog
deck_visibility_rule(DeckType, BoardId, Visibility).
% Visibility: visible | hidden
```

### `performance_constraint/3`

Defines performance limits.

```prolog
performance_constraint(ConstraintType, Context, Limit).
```

**Examples:**
```prolog
performance_constraint(max_visible_decks, _, 8).
performance_constraint(max_pattern_editors, _, 4).
performance_constraint(max_generators, _, 2).
```

### `beginner_safety_rule/2`

Defines UX constraints for beginners.

```prolog
beginner_safety_rule(RuleType, Value).
```

**Examples:**
```prolog
beginner_safety_rule(hide_advanced_options, true).
beginner_safety_rule(max_visible_decks, 4).
beginner_safety_rule(show_tooltips, true).
beginner_safety_rule(simplified_mixer, true).
```

## Query Helpers

### `validate_deck_combination/3`

Validates if decks can coexist on a board.

```prolog
validate_deck_combination(DeckList, BoardId, Result).
% Result: valid | invalid(IncompatibleDeck)
```

### `suggest_next_deck/3`

Suggests the next deck to open based on workflow.

```prolog
suggest_next_deck(CurrentDecks, WorkflowId, Suggestion).
```

### `count_decks/2`

Counts decks on a board.

```prolog
count_decks(BoardId, Count).
```

## TypeScript API

The TypeScript wrappers in `board-queries.ts` provide type-safe access:

```typescript
import {
  getAllBoards,
  getAllDeckTypes,
  recommendBoardForWorkflow,
  suggestDeckLayout,
  validateDeckCombination,
  suggestNextDeckToOpen,
  optimizePanelSizes,
  getWorkflowInfo,
  getBoardTransitions
} from '@cardplay/ai/queries';

// Get recommended board for a workflow
const boards = await recommendBoardForWorkflow('notation_composer');
// ['notation_board', 'notation_harmony_board']

// Validate deck combination
const validation = await validateDeckCombination(
  ['pattern_editor', 'phrase_library'],
  'tracker_phrases_board'
);
// { valid: true }

// Get workflow info
const info = await getWorkflowInfo('tracker_user');
// { id: 'tracker_user', requiredDecks: [...], beneficialDecks: [...], ... }
```

## See Also

- [Music Theory Predicates](./music-theory-predicates.md) - Music theory knowledge base
- [Prolog Syntax](./prolog-syntax.md) - CardPlay Prolog conventions
- [Query Patterns](./query-patterns.md) - Common query patterns
