# CardPlay UI Specification: Board-Centric Architecture

> **CardPlay puts you in the driver's seat—at whatever level of control you want. Choose boards that are fully manual, AI-assisted, or anywhere in between. The same project can use a traditional Notation Board for melody and an AI Arranger Board for accompaniment.**

---

## Table of Contents

1. [The Control Spectrum](#part-i-the-control-spectrum)
2. [Board Architecture](#part-ii-board-architecture)
3. [Manual Boards (Full Control)](#part-iii-manual-boards-full-control)
4. [Assisted Boards (You + Tools)](#part-iv-assisted-boards-you--tools)
5. [Generative Boards (AI-Driven)](#part-v-generative-boards-ai-driven)
6. [Hybrid Workflows](#part-vi-hybrid-workflows)
7. [Deck and Stack System](#part-vii-deck-and-stack-system)
8. [Connection Routing](#part-viii-connection-routing)
9. [Theming and Styling](#part-ix-theming-and-styling)
10. [Implementation](#part-x-implementation)

---

## Part I: The Control Spectrum

### 1.1 You Choose Your Level of Control

CardPlay is not one thing. It's a spectrum of workflows, from **fully manual** to **heavily generative**, and you choose where you want to be:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           THE CONTROL SPECTRUM                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  FULL MANUAL                                                    FULL GENERATIVE │
│  ◄────────────────────────────────────────────────────────────────────────────► │
│                                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   NOTATION   │  │   TRACKER    │  │  TRACKER +   │  │  AI ARRANGER │        │
│  │    BOARD     │  │    BOARD     │  │   PHRASES    │  │    BOARD     │        │
│  │              │  │              │  │              │  │              │        │
│  │ Write every  │  │ Type every   │  │ Type + drag  │  │ Play chords, │        │
│  │ note by hand │  │ note by hand │  │ from library │  │ AI does rest │        │
│  │              │  │              │  │              │  │              │        │
│  │ Traditional  │  │ Tracker      │  │ Tracker with │  │ Arranger-    │        │
│  │ composer     │  │ purist       │  │ assistance   │  │ keyboard     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                 │
│        ▲                  ▲                  ▲                  ▲               │
│        │                  │                  │                  │               │
│   "I control         "I control        "I control         "I provide           │
│    everything"        everything"       the ideas"         direction"          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 The Same Project, Different Control Levels

A single project can mix control levels:

- **Melody**: Notation Board (full manual) — you write every note
- **Harmony**: Tracker Board with Phrase Library — you drag pre-made progressions
- **Drums**: AI Arranger Board — you set style, AI generates patterns
- **Bass**: Session Board with Generator — you trigger, AI varies

**You're always in the driver's seat.** The difference is whether you're steering every wheel or letting autopilot handle some lanes.

### 1.3 Board Categories by Control Level

| Control Level | Board Type | You Control | System Provides |
|---------------|------------|-------------|-----------------|
| **100% Manual** | Notation Board | Every note, every articulation | Playback only |
| **100% Manual** | Basic Tracker Board | Every note, every effect | Playback only |
| **100% Manual** | Basic Sampler Board | Every sample, every chop | Playback only |
| **90% Manual** | Tracker + Harmony | Notes, but see chord suggestions | Harmonic hints |
| **80% Manual** | Tracker + Phrases | Structure, drag phrases for fills | Phrase library |
| **70% You** | Session + Generator | Song structure, trigger generation | Clip generation |
| **50/50** | Assisted Arranger | Chords, energy, style | Parts, patterns |
| **30% You** | AI Composition Board | High-level direction | Most content |
| **20% You** | Generative Board | Style and constraints | Everything |

### 1.4 Core Principle: Boards, Not Modes

Different control levels aren't hidden behind menus—they're **different boards**:

```typescript
// User picks their control level by choosing a board
const BOARD_REGISTRY: BoardCategory[] = [
  {
    category: 'Manual',
    description: 'Full control over every note and sound',
    boards: [
      'notation-board',
      'basic-tracker-board',
      'basic-sampler-board',
      'basic-session-board'
    ]
  },
  {
    category: 'Assisted',
    description: 'Your ideas + helpful tools',
    boards: [
      'tracker-harmony-board',
      'tracker-phrases-board',
      'session-phrases-board',
      'notation-harmony-board'
    ]
  },
  {
    category: 'Generative',
    description: 'AI and algorithms create, you direct',
    boards: [
      'arranger-board',
      'ai-composition-board',
      'generative-ambient-board',
      'algorithmic-drums-board'
    ]
  },
  {
    category: 'Hybrid',
    description: 'Mix manual and generative in one view',
    boards: [
      'composer-board',
      'producer-board',
      'live-performance-board'
    ]
  }
];
```

---

## Part II: Board Architecture

### 2.1 What is a Board?

A **Board** is a complete workspace environment with a specific control philosophy:

```typescript
interface Board {
  id: string;
  name: string;
  description: string;
  icon: string;
  
  // Control philosophy
  controlLevel: ControlLevel;
  philosophy: string;                    // e.g., "You write every note"
  
  // Layout
  layout: BoardLayout;
  panels: PanelDefinition[];
  decks: BoardDeck[];
  
  // What tools are available
  compositionTools: CompositionToolConfig;
  
  // Routing and defaults
  connections: BoardConnection[];
  defaultCards: BoardCardSlot[];
  
  // Interaction
  shortcuts: KeyboardShortcutMap;
  
  // Metadata
  author: string;
  version: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

type ControlLevel = 
  | 'full-manual'           // You control everything
  | 'manual-with-hints'     // Manual + suggestions
  | 'assisted'              // Your ideas + tool execution
  | 'collaborative'         // 50/50 with AI
  | 'directed'              // You direct, AI creates
  | 'generative';           // AI creates, you curate
```

### 2.2 Type-Theoretic Foundation: Boards as Typed Environments

The Board is not just a UI layout—it is a **typed environment** that constrains which Cards are available and how they compose. This is the formal foundation.

#### 2.2.1 The Core Insight: Boards Parameterize Card Availability

A Board is a **type-level configuration** that restricts the space of available Cards:

```typescript
// A Board is parameterized by:
// - L: the ControlLevel (affects which card types are available)
// - C: the CompositionToolConfig (concrete availability of tools)
// - V: the primary View type (tracker, notation, session, etc.)

type Board<
  L extends ControlLevel,
  C extends CompositionToolConfig,
  V extends ViewType
> = {
  controlLevel: L;
  compositionTools: C;
  primaryView: V;
  
  // Type-level constraint: only cards compatible with L and C are allowed
  allowedCards: CardFilter<L, C>;
  
  // The deck slots are typed by what cards they can hold
  decks: DeckSlot<CardFilter<L, C>>[];
};

// CardFilter is a type-level function that returns allowed card types
type CardFilter<L extends ControlLevel, C extends CompositionToolConfig> = 
  L extends 'full-manual' ? ManualCards :
  L extends 'manual-with-hints' ? ManualCards | HintCards :
  L extends 'assisted' ? ManualCards | HintCards | AssistedCards :
  L extends 'collaborative' ? ManualCards | HintCards | AssistedCards | CollaborativeCards :
  L extends 'directed' ? AllCards :
  L extends 'generative' ? AllCards :
  never;

// Card type categories
type ManualCards = TrackerCard | NotationCard | SamplerCard | InstrumentCard | EffectCard;
type HintCards = HarmonyDisplayCard | ScaleOverlayCard | ChordToneHighlightCard;
type AssistedCards = PhraseDatabaseCard | OnDemandGeneratorCard | CommandPaletteAICard;
type CollaborativeCards = InlineSuggestionCard | ContextualGeneratorCard;
type GenerativeCards = ArrangerCard | AutonomousGeneratorCard | AIComposerCard;
type AllCards = ManualCards | HintCards | AssistedCards | CollaborativeCards | GenerativeCards;
```

#### 2.2.2 Why This Matters: Type Safety Prevents UI Confusion

When you choose a Board, you're making a **type-level commitment** about what tools are available:

```typescript
// Manual Board: only ManualCards compile
const basicTrackerBoard: Board<'full-manual', typeof FULL_MANUAL_TOOLS, 'tracker'> = {
  controlLevel: 'full-manual',
  compositionTools: FULL_MANUAL_TOOLS,
  primaryView: 'tracker',
  allowedCards: ManualCards,  // Type: ManualCards only
  decks: [
    { slot: 'pattern-editor', accepts: TrackerCard },
    { slot: 'instruments', accepts: InstrumentCard },
    { slot: 'effects', accepts: EffectCard }
    // Cannot add: { slot: 'generator', accepts: GeneratorCard } — type error!
  ]
};

// Generative Board: AllCards compile
const aiArrangerBoard: Board<'directed', typeof GENERATIVE_TOOLS, 'arranger'> = {
  controlLevel: 'directed',
  compositionTools: GENERATIVE_TOOLS,
  primaryView: 'arranger',
  allowedCards: AllCards,  // Type: everything allowed
  decks: [
    { slot: 'arranger', accepts: ArrangerCard },
    { slot: 'generators', accepts: GenerativeCards },
    { slot: 'manual-override', accepts: ManualCards }  // Can still use manual cards
  ]
};
```

#### 2.2.3 The Composition Tool Config as a Type-Level Record

The `CompositionToolConfig` is a record type where each field's mode determines what operations are available:

```typescript
// CompositionToolConfig is a product type
type CompositionToolConfig = {
  phraseDatabase: ToolConfig<'phraseDatabase'>;
  harmonyExplorer: ToolConfig<'harmonyExplorer'>;
  phraseGenerators: ToolConfig<'phraseGenerators'>;
  arrangerCard: ToolConfig<'arrangerCard'>;
  aiComposer: ToolConfig<'aiComposer'>;
};

// Each tool has a mode that restricts its capabilities
type ToolConfig<K extends ToolKind> = {
  enabled: boolean;
  mode: ToolMode<K>;
};

// Modes are tool-specific
type ToolMode<K> = 
  K extends 'phraseDatabase' ? 'hidden' | 'browse-only' | 'drag-drop' | 'auto-suggest' :
  K extends 'harmonyExplorer' ? 'hidden' | 'display-only' | 'suggest' | 'auto-apply' :
  K extends 'phraseGenerators' ? 'hidden' | 'on-demand' | 'continuous' :
  K extends 'arrangerCard' ? 'hidden' | 'manual-trigger' | 'chord-follow' | 'autonomous' :
  K extends 'aiComposer' ? 'hidden' | 'command-palette' | 'inline-suggest' | 'autonomous' :
  never;

// UI behavior is determined by mode at the type level
type UIBehavior<K extends ToolKind, M extends ToolMode<K>> = {
  canDrag: M extends 'drag-drop' | 'auto-suggest' ? true : false;
  canAutoSuggest: M extends 'auto-suggest' | 'continuous' | 'autonomous' ? true : false;
  showsInPanel: M extends 'hidden' ? false : true;
  requiresUserTrigger: M extends 'on-demand' | 'manual-trigger' | 'command-palette' ? true : false;
};
```

#### 2.2.4 Boards as Functors Over Card Categories

Mathematically, a Board is a **functor** from the category of ControlLevels to the category of available Cards:

```
Board : ControlLevel → Set<Card>

Where:
  Board('full-manual') = { TrackerCard, NotationCard, SamplerCard, ... }
  Board('assisted') = Board('full-manual') ∪ { PhraseDatabaseCard, GeneratorCard, ... }
  Board('generative') = Board('assisted') ∪ { ArrangerCard, AIComposerCard, ... }
```

This functor is **monotonic**: more permissive ControlLevels include all cards from less permissive levels. You can always "downgrade" to manual within a generative board.

```typescript
// Monotonicity: if L1 ⊆ L2, then CardFilter<L1> ⊆ CardFilter<L2>
type CardFilterMonotonicity = 
  CardFilter<'full-manual'> extends CardFilter<'assisted'> ? true : never;  // true
  CardFilter<'assisted'> extends CardFilter<'generative'> ? true : never;   // true
```

#### 2.2.5 Per-Track Control Level as Dependent Types

In hybrid boards, each track has its own control level. This is modeled as a **dependent type**:

```typescript
// TrackControlLevel depends on the track's configuration
type TrackWithControlLevel<T extends Track, L extends ControlLevel> = T & {
  controlLevel: L;
  allowedCards: CardFilter<L, any>;
};

// A hybrid board has tracks with different control levels
type HybridBoard = Board<'hybrid', AllToolsEnabled, 'composer'> & {
  tracks: Array<TrackWithControlLevel<Track, ControlLevel>>;
};

// Example: different tracks have different control levels
const composerProject: HybridBoard = {
  tracks: [
    { name: 'Melody', controlLevel: 'full-manual', allowedCards: ManualCards },
    { name: 'Bass', controlLevel: 'assisted', allowedCards: ManualCards | AssistedCards },
    { name: 'Drums', controlLevel: 'directed', allowedCards: AllCards }
  ]
};
```

### 2.3 UI Behavior Determined by Types

The type-level configuration directly determines UI behavior:

#### 2.3.1 Visibility Rules

```typescript
// What shows in the UI is a function of the board's CompositionToolConfig
function computeVisiblePanels(config: CompositionToolConfig): Panel[] {
  const panels: Panel[] = [];
  
  if (config.phraseDatabase.mode !== 'hidden') {
    panels.push({
      id: 'phrase-library',
      interactionMode: config.phraseDatabase.mode === 'browse-only' ? 'read-only' :
                       config.phraseDatabase.mode === 'drag-drop' ? 'drag-source' :
                       'auto-populate'
    });
  }
  
  if (config.harmonyExplorer.mode !== 'hidden') {
    panels.push({
      id: 'harmony-panel',
      interactionMode: config.harmonyExplorer.mode === 'display-only' ? 'display' :
                       config.harmonyExplorer.mode === 'suggest' ? 'clickable-suggestions' :
                       'auto-apply'
    });
  }
  
  // ... etc for each tool
  
  return panels;
}
```

#### 2.3.2 Interaction Mode by Tool Mode

| Tool | Mode | UI Behavior |
|------|------|-------------|
| Phrase Database | `hidden` | Not visible |
| Phrase Database | `browse-only` | Visible, can browse, cannot drag to editor |
| Phrase Database | `drag-drop` | Visible, can drag phrases to pattern |
| Phrase Database | `auto-suggest` | Visible + auto-populates suggestions based on context |
| Harmony Explorer | `hidden` | Not visible |
| Harmony Explorer | `display-only` | Shows current chord, no suggestions |
| Harmony Explorer | `suggest` | Shows current chord + clickable next-chord suggestions |
| Harmony Explorer | `auto-apply` | Auto-advances harmony, user can override |
| Phrase Generator | `hidden` | Not visible |
| Phrase Generator | `on-demand` | Button to generate, user clicks when wanted |
| Phrase Generator | `continuous` | Continuously generates, user picks from stream |
| AI Composer | `hidden` | Not visible |
| AI Composer | `command-palette` | Invoke via Cmd+K, type prompt, execute |
| AI Composer | `inline-suggest` | Ghost notes appear, Tab to accept |
| AI Composer | `autonomous` | AI writes, user curates |

#### 2.3.3 Event Flow Based on Control Level

The control level determines how events flow through the system:

```typescript
// Manual: User → Editor → Events → Playback
type ManualEventFlow = {
  source: 'user-input';
  path: ['editor', 'events', 'playback'];
  generatorInvolved: false;
};

// Assisted: User → Editor → Events → Playback
//           User → Generator (on demand) → Events → Playback
type AssistedEventFlow = {
  source: 'user-input' | 'user-triggered-generator';
  path: ['editor' | 'generator', 'events', 'playback'];
  generatorInvolved: 'on-demand';
};

// Directed: User → High-Level Input → Generator → Events → Playback
type DirectedEventFlow = {
  source: 'chord-input' | 'style-selection';
  path: ['high-level-input', 'generator', 'events', 'playback'];
  generatorInvolved: 'continuous';
};

// Generative: Generator → Events → Playback, User → Curation
type GenerativeEventFlow = {
  source: 'autonomous-generator';
  path: ['generator', 'events', 'playback'];
  userRole: 'curator';
  generatorInvolved: 'autonomous';
};
```

### 2.4 Board Switching as Type-Level Migration

When switching boards, we need to handle cards that are no longer allowed:

```typescript
// BoardSwitch checks compatibility
type BoardSwitch<FromL extends ControlLevel, ToL extends ControlLevel> = {
  // Cards that remain valid
  preserved: CardFilter<FromL> & CardFilter<ToL>;
  
  // Cards that become unavailable (need migration)
  deprecated: Exclude<CardFilter<FromL>, CardFilter<ToL>>;
  
  // Cards that become available (new options)
  newlyAvailable: Exclude<CardFilter<ToL>, CardFilter<FromL>>;
};

// Example: switching from AI Arranger to Basic Tracker
type ArrangerToTracker = BoardSwitch<'directed', 'full-manual'>;
// preserved: ManualCards
// deprecated: GenerativeCards, AssistedCards, HintCards, CollaborativeCards
// newlyAvailable: (none)

// UI behavior: prompt user about deprecated cards
function handleBoardSwitch<From extends ControlLevel, To extends ControlLevel>(
  from: Board<From, any, any>,
  to: Board<To, any, any>,
  currentCards: CardInstance[]
): SwitchResult {
  const incompatible = currentCards.filter(c => !isAllowedIn(c, to.allowedCards));
  
  if (incompatible.length > 0) {
    return {
      status: 'requires-migration',
      incompatibleCards: incompatible,
      options: [
        'freeze-to-events',  // Render generative output to static events
        'disable',           // Keep but disable
        'remove'             // Remove from project
      ]
    };
  }
  
  return { status: 'compatible' };
}
```

### 2.5 Practical UI Behavior: What Each Control Level Means

This section describes exactly what happens in the UI for each control level.

#### 2.5.1 Full-Manual: Zero AI, Zero Suggestions

In `full-manual` mode, the UI is completely passive:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        FULL-MANUAL UI BEHAVIOR                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WHAT YOU SEE:                          WHAT YOU DON'T SEE:                     │
│  ─────────────────────────────          ───────────────────────────────         │
│  • Pattern editor (empty)               • Phrase library panel                  │
│  • Instrument list                      • Harmony suggestions                   │
│  • Effect chain                         • "Generate" buttons                    │
│  • Playback controls                    • AI suggestions                        │
│  • Undo/redo                           • Chord detection                       │
│  • Copy/paste                          • Auto-complete hints                   │
│                                                                                  │
│  INTERACTIONS:                          NON-INTERACTIONS:                       │
│  ─────────────────                      ────────────────────                    │
│  • Type notes: C-4, D#5, etc.          • Drag from phrase library              │
│  • Set velocity: 00-FF                 • Click to accept suggestion            │
│  • Add effects: filter, delay          • Trigger generator                     │
│  • Adjust params: cutoff, res          • Ask AI for ideas                      │
│                                                                                  │
│  The editor is a BLANK CANVAS. It shows nothing until you put something there. │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Event Creation in Full-Manual Mode:**

```typescript
// In full-manual mode, events ONLY come from user input
type ManualEventSource = {
  kind: 'user-input';
  input: 
    | { type: 'keyboard'; key: string; row: number; column: number }
    | { type: 'midi'; note: number; velocity: number; channel: number }
    | { type: 'mouse'; x: number; y: number; action: 'create' | 'move' | 'resize' };
};

// The event creation pipeline is direct:
// User Input → Event Validator → Container
function createEventManual(source: ManualEventSource, container: Container): Event {
  const event = parseInputToEvent(source);
  validateAgainstSchema(event);  // Only structural validation
  return insertIntoContainer(event, container);
}

// There is NO suggestion step, NO generation step, NO AI step.
```

#### 2.5.2 Manual-with-Hints: Display Only, No Auto-Action

In `manual-with-hints` mode, the UI shows helpful context but never acts:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       MANUAL-WITH-HINTS UI BEHAVIOR                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HINT PANEL (read-only):               PATTERN EDITOR (you control):            │
│  ┌─────────────────────┐               ┌────────────────────────────────┐       │
│  │ Key: C Major        │               │  00 │ C-4 ← green (root)      │       │
│  │ Chord: Cmaj7        │               │  01 │ D-4 ← yellow (2nd)      │       │
│  │                     │               │  02 │ E-4 ← green (3rd)       │       │
│  │ Chord tones:        │               │  03 │ F#4 ← red (out of key!) │       │
│  │ ● C (root)          │               │  04 │ G-4 ← green (5th)       │       │
│  │ ● E (3rd)           │               └────────────────────────────────┘       │
│  │ ● G (5th)           │                                                        │
│  │ ○ B (7th)           │               Notes are COLOR-CODED by harmonic        │
│  │                     │               function, but YOU still type every       │
│  │ Scale tones:        │               note. The system NEVER inserts notes.    │
│  │ C D E F G A B       │                                                        │
│  └─────────────────────┘               The F#4 is red because it's out of key.  │
│                                        Maybe that's intentional. Your choice.   │
│                                                                                  │
│  The hint panel is PASSIVE. You can look at it or ignore it.                    │
│  It NEVER:                                                                       │
│  • Auto-inserts notes                                                           │
│  • Shows "click to add" suggestions                                             │
│  • Changes based on what you "might" type                                       │
│  • Highlights the "next" note you should use                                    │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Hint Display Without Suggestion:**

```typescript
// Hints are computed reactively but never push to the editor
type HintDisplay = {
  currentContext: {
    key: Key;
    scale: Scale;
    currentChord: Chord | null;
    chordTones: Pitch[];
    scaleTones: Pitch[];
  };
  
  // Color coding function (does NOT change events)
  colorForNote(pitch: Pitch): Color {
    if (this.chordTones.includes(pitch)) return 'green';
    if (this.scaleTones.includes(pitch)) return 'yellow';
    return 'red';  // Out of key
  }
  
  // NEVER includes:
  suggestNextNote(): never;     // Not in this mode
  autoCompletePhrase(): never;  // Not in this mode
  insertSuggestion(): never;    // Not in this mode
};
```

#### 2.5.3 Assisted: You Trigger, System Executes

In `assisted` mode, tools are available but only activate when you ask:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          ASSISTED UI BEHAVIOR                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PHRASE LIBRARY (drag-drop):           PATTERN EDITOR:                          │
│  ┌─────────────────────┐               ┌────────────────────────────────┐       │
│  │ 🔍 Search phrases   │   ──drag──→   │  00 │ C-4  01  40             │       │
│  │                     │               │  01 │ ----                     │       │
│  │ BASS                │               │  02 │ E-4  01  60             │       │
│  │ ├─ Walking          │               │  03 │ ----                     │       │
│  │ ├─ Synth            │               │  04 │ G-4  01  80             │       │
│  │ └─ Slap  ←─you drag │               └────────────────────────────────┘       │
│  │                     │                                                        │
│  │ DRUMS               │               When you drag a phrase, it EXPANDS       │
│  │ ├─ 4/4 Rock         │               into individual events. You can then    │
│  │ └─ Breakbeat        │               edit every note. It's NOT locked.       │
│  └─────────────────────┘                                                        │
│                                                                                  │
│  GENERATOR (on-demand):                YOU TRIGGER, SYSTEM EXECUTES:            │
│  ┌─────────────────────┐               ┌────────────────────────────────┐       │
│  │ Generate bass line  │               │ 1. You click [Generate]        │       │
│  │                     │               │ 2. Dialog: "Style? Length?"    │       │
│  │ Style: [Walking ▼]  │               │ 3. You confirm                 │       │
│  │ Length: [4 bars  ▼] │               │ 4. Generator runs              │       │
│  │ Complexity: [Med ▼] │               │ 5. Events appear in editor     │       │
│  │                     │               │ 6. You can edit everything     │       │
│  │ [Generate]          │               └────────────────────────────────┘       │
│  └─────────────────────┘                                                        │
│                                                                                  │
│  Nothing happens without your explicit action.                                  │
│  Generator is a TOOL you use, not an agent that acts.                           │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**On-Demand Generator Flow:**

```typescript
// Assisted mode: generators are functions you call, not agents that run
type OnDemandGenerator = {
  // User triggers
  trigger: 'button-click' | 'menu-select' | 'keyboard-shortcut';
  
  // User provides parameters
  params: {
    style: GeneratorStyle;
    length: BarCount;
    complexity: number;
  };
  
  // Generator runs once and returns events
  generate(params: GeneratorParams): Stream<Event<any>>;
  
  // Events are inserted into container (editable)
  insertResult(events: Stream<Event<any>>, container: Container): void;
  
  // NEVER includes:
  runContinuously(): never;           // Not in this mode
  autoTriggerOnChordChange(): never;  // Not in this mode
  suggestWithoutAsking(): never;      // Not in this mode
};
```

#### 2.5.4 Directed: You Provide High-Level Input, AI Fills In

In `directed` mode, you control the direction, AI handles the details:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          DIRECTED UI BEHAVIOR                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  YOUR INPUT:                           AI OUTPUT:                               │
│  ┌─────────────────────┐               ┌────────────────────────────────┐       │
│  │ Play chord on MIDI: │               │ DRUMS:  ░▓░▓░▓░▓░▓░▓░▓░▓      │       │
│  │                     │               │ BASS:   ▓░▓░░▓░░▓░▓░░▓░░      │       │
│  │     Cmaj7           │ ───auto───→   │ CHORDS: ▓▓▓▓▓▓▓▓░░░░░░░░      │       │
│  │                     │               │ PAD:    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      │       │
│  │ Style: Jazz Swing   │               └────────────────────────────────┘       │
│  │ Energy: ████░░░░░   │                                                        │
│  └─────────────────────┘               AI generates ALL PARTS based on          │
│                                        your chord + style + energy.             │
│  YOU CONTROL:                                                                   │
│  • What chord to play                  AI CONTROLS:                             │
│  • What style to use                   • Drum pattern                           │
│  • Energy level                        • Bass line                              │
│  • Which parts are on                  • Chord voicing                          │
│  • When to trigger fills               • Pad texture                            │
│                                                                                  │
│  It's like an ARRANGER KEYBOARD: you play, it accompanies.                      │
│  But unlike a keyboard, you can edit every generated note after.               │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Chord-Follow Arranger Flow:**

```typescript
// Directed mode: you provide high-level input, AI generates continuously
type ChordFollowArranger = {
  // Input: chord changes from MIDI keyboard or chord track
  input: Stream<Event<ChordPayload>>;
  
  // Parameters: style, energy, active parts
  style: ArrangerStyle;
  energy: number;  // 0-1
  activeParts: PartConfig[];
  
  // Output: continuous generation on each chord change
  generateForChord(chord: Chord): Map<PartName, Stream<Event<Voice>>>;
  
  // Generated events can be:
  outputMode: 
    | 'live-only'      // Play but don't save
    | 'capture-all'    // Save everything generated
    | 'capture-on-demand';  // Save when you click "keep"
  
  // User controls
  transitionTriggers: {
    fill: () => void;      // Trigger a fill
    build: () => void;     // Trigger a build
    drop: () => void;      // Trigger a drop
    breakdown: () => void; // Trigger a breakdown
  };
};
```

#### 2.5.5 Generative: AI Creates, You Curate

In `generative` mode, AI runs autonomously; you pick what to keep:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         GENERATIVE UI BEHAVIOR                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  AI IS RUNNING:                        YOUR ROLE:                               │
│  ┌─────────────────────┐               ┌────────────────────────────────┐       │
│  │ ✨ AI Composer      │               │ [Keep Section 1] [Regenerate]  │       │
│  │                     │               │ [Keep Section 2] [Regenerate]  │       │
│  │ "Generating         │               │ [Keep Section 3] [Regenerate]  │       │
│  │  melancholic jazz   │               └────────────────────────────────┘       │
│  │  ballad..."         │                                                        │
│  │                     │               You are the CURATOR, not the creator.   │
│  │ ▓▓▓▓▓▓▓░░░░░ 60%    │               AI proposes. You dispose.               │
│  │                     │                                                        │
│  │ Section 1: ✓ Done   │               CURATION ACTIONS:                        │
│  │ Section 2: ✓ Done   │               • Keep: accept into project              │
│  │ Section 3: ⟳ Gen... │               • Regenerate: try again                  │
│  └─────────────────────┘               • Edit: open in tracker for changes      │
│                                        • Morph: "more like section 1"           │
│                                        • Constrain: "no notes above C5"         │
│                                                                                  │
│  The AI NEVER STOPS until you tell it to.                                       │
│  It's a stream of ideas. You pick the good ones.                                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Autonomous Generation with Curation:**

```typescript
// Generative mode: AI generates continuously, you curate
type AutonomousGenerator = {
  // AI runs continuously
  state: 'running' | 'paused';
  
  // Generates a stream of proposals
  proposals: AsyncIterable<Proposal>;
  
  // Each proposal is a complete section
  interface Proposal {
    id: string;
    section: Stream<Event<any>>;
    description: string;  // "Melancholic intro, 8 bars"
    preview(): void;      // Play without committing
  }
  
  // User curation actions
  curation: {
    keep(proposalId: string): void;          // Accept into project
    regenerate(proposalId: string): void;    // Replace with new attempt
    morph(proposalId: string, target: string): void;  // "More like X"
    constrain(proposalId: string, rule: Rules): void; // Add constraint
    edit(proposalId: string): Container;     // Open in editor
  };
  
  // The key difference: AI acts without being asked
  // User responds rather than initiates
};
```

### 2.6 Composition Tools Configuration

Each board enables different levels of assistance:

```typescript
interface CompositionToolConfig {
  // Phrase database
  phraseDatabase: {
    enabled: boolean;
    mode: 'hidden' | 'browse-only' | 'drag-drop' | 'auto-suggest';
  };
  
  // Harmony tools
  harmonyExplorer: {
    enabled: boolean;
    mode: 'hidden' | 'display-only' | 'suggest' | 'auto-apply';
  };
  
  // Generators
  phraseGenerators: {
    enabled: boolean;
    mode: 'hidden' | 'on-demand' | 'continuous';
    types: GeneratorType[];
  };
  
  // Arranger
  arrangerCard: {
    enabled: boolean;
    mode: 'hidden' | 'manual-trigger' | 'chord-follow' | 'autonomous';
  };
  
  // AI assistance
  aiComposer: {
    enabled: boolean;
    mode: 'hidden' | 'command-palette' | 'inline-suggest' | 'autonomous';
  };
}
  
  // Generators
  phraseGenerators: {
    enabled: boolean;
    mode: 'hidden' | 'on-demand' | 'continuous';
    types: GeneratorType[];
  };
  
  // Arranger
  arrangerCard: {
    enabled: boolean;
    mode: 'hidden' | 'manual-trigger' | 'chord-follow' | 'autonomous';
  };
  
  // AI assistance
  aiComposer: {
    enabled: boolean;
    mode: 'hidden' | 'command-palette' | 'inline-suggest' | 'autonomous';
  };
}

// Examples for different control levels:

const FULL_MANUAL_TOOLS: CompositionToolConfig = {
  phraseDatabase: { enabled: false, mode: 'hidden' },
  harmonyExplorer: { enabled: false, mode: 'hidden' },
  phraseGenerators: { enabled: false, mode: 'hidden' },
  arrangerCard: { enabled: false, mode: 'hidden' },
  aiComposer: { enabled: false, mode: 'hidden' }
};

const ASSISTED_TOOLS: CompositionToolConfig = {
  phraseDatabase: { enabled: true, mode: 'drag-drop' },
  harmonyExplorer: { enabled: true, mode: 'suggest' },
  phraseGenerators: { enabled: true, mode: 'on-demand' },
  arrangerCard: { enabled: false, mode: 'hidden' },
  aiComposer: { enabled: true, mode: 'command-palette' }
};

const GENERATIVE_TOOLS: CompositionToolConfig = {
  phraseDatabase: { enabled: true, mode: 'auto-suggest' },
  harmonyExplorer: { enabled: true, mode: 'auto-apply' },
  phraseGenerators: { enabled: true, mode: 'continuous' },
  arrangerCard: { enabled: true, mode: 'chord-follow' },
  aiComposer: { enabled: true, mode: 'inline-suggest' }
};
```

---

## Part III: Manual Boards (Full Control)

### 3.1 Philosophy

> **"I write every note. I control every parameter. The system plays what I write."**

Manual boards are for composers who want complete control. No suggestions, no generation, no AI. Just you and your craft.

### 3.2 Notation Board (Manual)

**For**: Traditional composers, engravers, educators, classical musicians

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          🎼 NOTATION BOARD (Manual)                              │
│                     "Every note is yours. No suggestions."                       │
├───────────┬──────────────────────────────────────────────────────────┬───────────┤
│  PLAYERS  │                    FULL SCORE                            │PROPERTIES │
│ ┌───────┐ │  ┌─────────────────────────────────────────────────────┐ │ ┌───────┐ │
│ │Flute  │ │  │ Andante ♩= 72                                       │ │ │Note   │ │
│ │Oboe   │ │  │                                                      │ │ │───────│ │
│ │Clarinet│ │  │ Fl.  ─────────────────────────────────────────────  │ │ │Pitch  │ │
│ │Bassoon│ │  │      𝄞 4/4  ♩  ♪♪  ♩    │  ♩.    ♪  ♩    │  𝄐       │ │ │Dur.   │ │
│ │───────│ │  │                                                      │ │ │Voice  │ │
│ │Horn   │ │  │ Ob.  ─────────────────────────────────────────────  │ │ │───────│ │
│ │Trumpet│ │  │      𝄞 4/4  -      ♩    │  ♩     ♩  ♩    │  ♩.    ♪ │ │ │Artic. │ │
│ │Trombone││  │                                                      │ │ │Dyn.   │ │
│ └───────┘ │  └─────────────────────────────────────────────────────┘ │ └───────┘ │
├───────────┴──────────────────────────────────────────────────────────┴───────────┤
│  FLOWS: [1. Allegro] [2. Adagio] [3. Menuetto] [4. Presto]                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Write │ Engrave │ Play │ Print │                              Bar: 12/136       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Board Definition:**

```typescript
const NOTATION_BOARD_MANUAL: Board = {
  id: 'notation-board-manual',
  name: 'Notation Board',
  description: 'Traditional notation editor. You write every note.',
  icon: '🎼',
  controlLevel: 'full-manual',
  philosophy: 'Every note is yours. No suggestions, no generation.',
  
  compositionTools: FULL_MANUAL_TOOLS,  // Everything disabled
  
  layout: {
    type: 'notation-standard',
    panels: [
      { id: 'players', role: 'browser', position: 'left' },
      { id: 'score', role: 'composition', position: 'center' },
      { id: 'properties', role: 'properties', position: 'right' }
    ]
  },
  
  decks: [
    { id: 'score-deck', type: 'notation', tools: [] },  // No tools, just notation
    { id: 'players-deck', type: 'browser' }
  ],
  
  shortcuts: NOTATION_SHORTCUTS,
  difficulty: 'advanced'
};
```

### 3.3 Basic Tracker Board (Manual)

**For**: Tracker purists, chiptune composers, demoscene veterans

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       📊 BASIC TRACKER BOARD (Manual)                            │
│                      "You type every note. Pure tracker."                        │
├─────────────────────────┬────────────────────────────────────────────────────────┤
│  PATTERN SEQUENCE       │              PATTERN EDITOR                            │
│  ┌───┬───┬───┬───┐      │  Row │ Trk1 │ Trk2 │ Trk3 │ Trk4 │ Trk5 │ Trk6 │ Trk7 │
│  │ 0 │ 0 │ 1 │ 0 │      │  ────┼──────┼──────┼──────┼──────┼──────┼──────┼──────│
│  │ 1 │ 0 │ 1 │ 1 │      │  00  │ C-4  │ ---- │ G-4  │ ---- │ ---- │ ---- │ ---- │
│  │ 2 │ 1 │ 0 │ 1 │      │      │ 01   │      │ 02   │      │      │      │      │
│  │ 3 │ 1 │ 1 │ 0 │      │      │ 40   │      │ 80   │      │      │      │      │
│  └───┴───┴───┴───┘      │  01  │ ---- │ E-4  │ ---- │ D-4  │ ---- │ ---- │ ---- │
│                          │  02  │ D-4  │ ---- │ ---- │ ---- │ C-5  │ ---- │ ---- │
│  ┌────────────────┐     │  03  │ ---- │ ---- │ B-3  │ ---- │ ---- │ E-5  │ ---- │
│  │ INSTRUMENTS    │     │  04  │ C-4  │ ---- │ G-4  │ ---- │ ---- │ ---- │ ---- │
│  │ 00 Kick        │     │  ... │                                                 │
│  │ 01 Snare       │     │                                                        │
│  │ 02 Bass        │     │  NO PHRASE LIBRARY — NO GENERATORS — NO AI            │
│  └────────────────┘     │  Just you and the tracker.                             │
├─────────────────────────┴────────────────────────────────────────────────────────┤
│ BPM:140  LPB:4  Oct:4  Inst:01  │  [Edit] [Play] [Rec]                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Board Definition:**

```typescript
const BASIC_TRACKER_BOARD: Board = {
  id: 'basic-tracker-board',
  name: 'Basic Tracker Board',
  description: 'Pure tracker experience. You type every note.',
  icon: '📊',
  controlLevel: 'full-manual',
  philosophy: 'No assistance. No suggestions. Just you and the pattern.',
  
  compositionTools: FULL_MANUAL_TOOLS,  // Everything disabled
  
  layout: {
    type: 'tracker-classic',
    panels: [
      { id: 'sidebar', role: 'browser', position: 'left' },
      { id: 'pattern', role: 'composition', position: 'center' }
    ]
  },
  
  decks: [
    { id: 'pattern-matrix-deck', type: 'pattern-matrix' },
    { id: 'instruments-deck', type: 'instrument-list' },
    { id: 'pattern-editor-deck', type: 'tracker', tools: [] },  // No tools
    { id: 'dsp-deck', type: 'effect-chain' }
  ],
  
  shortcuts: RENOISE_SHORTCUTS,
  difficulty: 'advanced'
};
```

### 3.4 Basic Sampler Board (Manual)

**For**: Sample-based producers who want full control

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       🎚️ BASIC SAMPLER BOARD (Manual)                           │
│                    "You chop. You arrange. Full control."                        │
├─────────────────────┬────────────────────────────────────────────────────────────┤
│     SAMPLE POOL     │                    ARRANGEMENT                             │
│  ┌───────────────┐  │  ═══════════════════════════════════════════════════════   │
│  │ kick_01.wav   │  │  │ 1   │ 2   │ 3   │ 4   │ 5   │ 6   │ 7   │ 8   │        │
│  │ snare_01.wav  │  │  ───────────────────────────────────────────────────────   │
│  │ hihat_01.wav  │  │  Drums  │████████│        │████████│        │████████│     │
│  │ bass_loop.wav │  │  Bass   │    ████████████████████████████████████    │     │
│  │ vocal_chop.wav│  │  Chops  │        │████│   │    │████│        │████│        │
│  └───────────────┘  │                                                            │
├─────────────────────┴────────────────────────────────────────────────────────────┤
│                            WAVEFORM EDITOR                                       │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  kick_01.wav                                                                │ │
│  │  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                                                           │ │
│  │  │←─────────────→│  Chop: [1/4] [1/8] [1/16] [Manual]                      │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────┤
│ BPM:90  │  [Import] [Chop] [Stretch]  │  [Play] [Stop]                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 3.5 When to Choose Manual Boards

Choose a **Manual Board** when:

- You want complete creative control
- You're learning and want to understand every aspect
- You're a traditionalist who values craft
- You don't trust AI suggestions
- You have a specific vision that tools might interfere with
- You're creating something highly personal or experimental

---

## Part IV: Assisted Boards (You + Tools)

### 4.1 Philosophy

> **"I'm in control, but I appreciate helpful tools. Show me options, but I decide."**

Assisted boards give you full control over the final result, but provide tools that make the work easier—phrase libraries, harmony suggestions, generators you can trigger when you want them.

### 4.2 Tracker + Harmony Board

**For**: Tracker users who want to see harmonic context while they work

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    📊🎹 TRACKER + HARMONY BOARD (Assisted)                       │
│               "You write the notes. See what fits harmonically."                 │
├────────────────────┬─────────────────────────────────────────────────────────────┤
│  HARMONY HELPER    │              PATTERN EDITOR                                 │
│  ┌──────────────┐  │  Row │ Melody   │ Bass     │ Drums    │ Chords             │
│  │ Key: C Major │  │  ────┼──────────┼──────────┼──────────┼───────────────────  │
│  │              │  │  00  │ C-4  01  │ C-2  02  │ C-3  03  │ C-4 E-4 G-4 ← fits│
│  │ Current:     │  │      │ 40       │ 80       │ 80       │                     │
│  │  Cmaj7       │  │  01  │ ----     │ ----     │ ----     │                     │
│  │  C E G B     │  │  02  │ E-4  01  │ ----     │ D-3  03  │ ← E is chord tone  │
│  │              │  │      │ 60       │          │ 60       │                     │
│  │ Chord tones  │  │  03  │ D-4  01  │ G-2  02  │ ----     │ ← D is passing     │
│  │ shown in     │  │  04  │ G-4  01  │ ----     │ C-3  03  │ ← G is chord tone  │
│  │ pattern →    │  │      │ 80       │          │ 80       │                     │
│  │              │  │                                                             │
│  │ ● C (root)   │  │  Color coding in pattern:                                  │
│  │ ● E (3rd)    │  │  ● Green = chord tone                                      │
│  │ ● G (5th)    │  │  ● Yellow = scale tone                                     │
│  │ ○ B (7th)    │  │  ● Red = out of key (intentional?)                        │
│  │              │  │                                                             │
│  │ [Set Chord]  │  │  You still type every note.                                │
│  │              │  │  Harmony Helper just shows what fits.                      │
│  └──────────────┘  │                                                             │
├────────────────────┴─────────────────────────────────────────────────────────────┤
│ BPM:120  LPB:4  │ Key:C Maj │ Chord:Cmaj7  │  [Edit] [Play] [Set Chord]         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Board Definition:**

```typescript
const TRACKER_HARMONY_BOARD: Board = {
  id: 'tracker-harmony-board',
  name: 'Tracker + Harmony',
  description: 'Tracker with harmonic context display. You write, it hints.',
  icon: '📊🎹',
  controlLevel: 'manual-with-hints',
  philosophy: 'You write every note. See what fits the current chord.',
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },
    harmonyExplorer: { enabled: true, mode: 'display-only' },  // Shows, doesn't generate
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' }
  },
  
  layout: {
    type: 'tracker-with-sidebar',
    panels: [
      { id: 'harmony', role: 'tools', position: 'left', width: '200px' },
      { id: 'pattern', role: 'composition', position: 'center' }
    ]
  },
  
  // Features
  features: {
    chordToneHighlighting: true,     // Color notes by harmonic function
    scaleOverlay: true,               // Show scale notes in pattern
    outOfKeyWarning: true            // Highlight out-of-key notes
  }
};
```

### 4.3 Tracker + Phrases Board

**For**: Tracker users who want access to a phrase library for inspiration and speed

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    📊📚 TRACKER + PHRASES BOARD (Assisted)                       │
│              "You're in control. Drag phrases when you want them."               │
├────────────────────┬─────────────────────────────────────────────────────────────┤
│  PHRASE LIBRARY    │              PATTERN EDITOR                                 │
│  ┌──────────────┐  │  Row │ Melody   │ Bass     │ Drums    │ Lead               │
│  │ 🔍 [search]  │  │  ────┼──────────┼──────────┼──────────┼─────────────────── │
│  │              │  │  00  │ C-4  01  │ ----     │ C-3  03  │ ----               │
│  │ BASS         │  │  01  │ ----     │ ----     │ ----     │ ----               │
│  │ ├─ Walking   │  │  02  │ E-4  01  │ ----     │ D-3  03  │ ----               │
│  │ ├─ Synth     │  │  03  │ ----     │ ----     │ ----     │ ----               │
│  │ └─ Slap      │  │  04  │ G-4  01  │ ----     │ C-3  03  │ ----               │
│  │              │  │  ...                                                        │
│  │ DRUMS        │  │                                                             │
│  │ ├─ 4/4 Rock  │  │  ← Drag "Walking Bass" phrase here                         │
│  │ ├─ Breakbeat │  │    Phrase expands to tracker notation                      │
│  │ └─ Jazz      │  │    You can edit every note after                           │
│  │              │  │                                                             │
│  │ MELODY       │  │  You control:                                              │
│  │ ├─ Jazz Licks│  │  • What to drag                                            │
│  │ └─ Pop Hooks │  │  • Where to put it                                         │
│  │              │  │  • What to change after                                    │
│  │ [Browse All] │  │                                                             │
│  └──────────────┘  │  Library doesn't auto-suggest. You search and drag.        │
├────────────────────┴─────────────────────────────────────────────────────────────┤
│ BPM:128  LPB:4  │ Phrases: 10,247 available  │  [Edit] [Play]                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Board Definition:**

```typescript
const TRACKER_PHRASES_BOARD: Board = {
  id: 'tracker-phrases-board',
  name: 'Tracker + Phrases',
  description: 'Tracker with phrase library. Drag when you want, edit everything.',
  icon: '📊📚',
  controlLevel: 'assisted',
  philosophy: 'You search and drag. Library assists, never intrudes.',
  
  compositionTools: {
    phraseDatabase: { 
      enabled: true, 
      mode: 'drag-drop',              // Available, but you initiate
      autoSuggest: false,             // Doesn't suggest
      contextFilter: false            // Doesn't filter by harmony
    },
    harmonyExplorer: { enabled: true, mode: 'display-only' },
    phraseGenerators: { enabled: false, mode: 'hidden' },
    arrangerCard: { enabled: false, mode: 'hidden' },
    aiComposer: { enabled: false, mode: 'hidden' }
  },
  
  // Phrase integration
  phraseIntegration: {
    dragToTracker: true,              // Drag phrase to row
    expandToNotes: true,              // Becomes editable notes
    preservePhraseAsBlock: false,     // Don't keep as reference
    fullyEditable: true               // Every note can be changed
  }
};
```

### 4.4 Session + Generators Board

**For**: Session/clip-based users who want on-demand generation

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    🎛️✨ SESSION + GENERATORS BOARD (Assisted)                    │
│               "Right-click any slot to generate. You trigger it."                │
├─────────┬────────────────────────────────────────────────────────────────┬───────┤
│ BROWSER │                    SESSION VIEW                                │ MIXER │
│ ┌─────┐ │   🥁 Drums    🎸 Bass    🎹 Keys    🎤 Vox    🎚️ FX          │ ┌───┐ │
│ │Clips│ │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  │ │ D │ │
│ │     │ │  │ Beat 1 │  │ Bass 1 │  │ Chord 1│  │        │  │ Rise 1 │  │ │ █ │ │
│ │Gen  │ │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘  │ │ █ │ │
│ │     │ │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  │ ├───┤ │
│ │     │ │  │ Beat 2 │  │        │  │ Chord 2│  │ Hook 1 │  │        │  │ │ B │ │
│ │     │ │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘  │ │ █ │ │
│ └─────┘ │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  │ └───┘ │
│         │  │[+ Gen] │  │[+ Gen] │  │[+ Gen] │  │[+ Gen] │  │[+ Gen] │  │       │
│ Right-  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘  │       │
│ click   │                                                               │       │
│ to gen  │  Right-click empty slot → "Generate Clip..."                 │       │
│         │  You choose: Style, Length, Variation                        │       │
│         │  You decide when. Generator only runs when asked.            │       │
├─────────┴────────────────────────────────────────────────────────────────┴───────┤
│ ▶ 1.1.1   120 BPM   4/4   │  Generator: On-Demand Only   │   CPU: 8%            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**The Key Difference:**
- Generator only runs when you explicitly ask
- You choose what to generate
- You can edit everything it creates
- It doesn't auto-suggest or interrupt

### 4.5 When to Choose Assisted Boards

Choose an **Assisted Board** when:

- You want control but appreciate speed boosts
- You like having a phrase library for inspiration
- You want to see harmonic context while working
- You want to generate on-demand but stay in control
- You're learning and want educational feedback
- You want the option of help without it being forced

---

## Part V: Generative Boards (AI-Driven)

### 5.1 Philosophy

> **"I set the direction. AI creates the content. I curate and refine."**

Generative boards shift the balance toward AI and algorithms. You provide high-level direction—style, energy, mood—and the system generates content. You're still in charge, but you're directing rather than writing.

### 5.2 AI Arranger Board

**For**: Users who want arranger-keyboard-style composition at scale

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       🎹🤖 AI ARRANGER BOARD (Generative)                        │
│               "Play chords. AI creates drums, bass, pads, arps."                 │
├──────────────────────────────────────────────────────────────────────────────────┤
│                              ARRANGER CONTROL                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                            │ │
│  │  Style: [Jazz Swing    ▼]     Variation: [1] [2] [3] [4]                  │ │
│  │                                                                            │ │
│  │  Energy:     [░░░░░░▮▮▮▮▮▮▮▮▮░░░░░░]  ← You control feel               │ │
│  │  Complexity: [░░░░░░░░▮▮▮▮░░░░░░░░░]  ← You control density            │ │
│  │                                                                            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │ │
│  │  │ 🥁 DRUMS │ │ 🎸 BASS  │ │ 🎹 CHORDS│ │ 🎹 PAD   │ │ ♫ ARP    │        │ │
│  │  │    [●]   │ │    [●]   │ │    [●]   │ │    [○]   │ │    [○]   │        │ │
│  │  │ Swing    │ │ Walking  │ │ Comping  │ │  OFF     │ │  OFF     │        │ │
│  │  │ Vol: ▮▮▮ │ │ Vol: ▮▮░ │ │ Vol: ▮░░ │ │          │ │          │        │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │ │
│  │                                                                            │ │
│  │  [Intro] [Fill] [Build] [Drop] [Breakdown] [Ending]                       │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────┤
│                              CHORD INPUT                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  Current: Cmaj7          │  Play chords on MIDI keyboard                  │ │
│  │                          │  OR click: [C] [Dm] [Em] [F] [G] [Am] [Bdim]   │ │
│  │  ▼                       │                                                 │ │
│  │  AI generates all parts  │  You provide harmony → AI provides arrangement │ │
│  │  to fit this chord       │                                                 │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────┤
│                              OUTPUT                                              │
│  ○ Live to audio (play along)                                                   │
│  ○ Render to clips (edit later)                                                 │
│  ● Both (perform now, keep the clips)                                           │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ▶ Playing   128 BPM   4/4   │  Chord: Cmaj7 → Dm7 (next)  │   CPU: 15%         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Board Definition:**

```typescript
const AI_ARRANGER_BOARD: Board = {
  id: 'ai-arranger-board',
  name: 'AI Arranger Board',
  description: 'Like an arranger keyboard, but infinitely configurable.',
  icon: '🎹🤖',
  controlLevel: 'directed',
  philosophy: 'You play chords and set the feel. AI creates everything else.',
  
  compositionTools: {
    phraseDatabase: { enabled: false, mode: 'hidden' },  // Not needed
    harmonyExplorer: { enabled: true, mode: 'auto-apply' },
    phraseGenerators: { enabled: true, mode: 'continuous' },
    arrangerCard: { 
      enabled: true, 
      mode: 'chord-follow',           // Follows your chord input
      parts: ['drums', 'bass', 'chords', 'pad', 'arp'],
      styleLibrary: ['jazz', 'pop', 'rock', 'edm', 'latin', 'rnb'],
      realTimeGeneration: true        // Generates as you play
    },
    aiComposer: { enabled: true, mode: 'inline-suggest' }
  },
  
  // You control:
  userControls: {
    chordInput: true,                 // You play the chords
    style: true,                      // You choose the style
    energy: true,                     // You control energy (0-1)
    complexity: true,                 // You control complexity (0-1)
    partSelection: true,              // You choose which parts play
    transitionTriggers: true          // You trigger fills, builds, drops
  },
  
  // AI controls:
  aiControls: {
    drumPatterns: true,
    bassLines: true,
    chordVoicings: true,
    arpeggioPatterns: true,
    fillContent: true,
    transitionExecution: true
  }
};
```

### 5.3 AI Composition Board

**For**: Users who want high-level creative direction with AI execution

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       🤖✨ AI COMPOSITION BOARD (Generative)                     │
│              "Tell it what you want. AI creates. You curate."                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         AI COMPOSER                                         │ │
│  │                                                                             │ │
│  │  Tell me what you want:                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │ │
│  │  │ A melancholic jazz ballad with walking bass and sparse piano        │  │ │
│  │  └──────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                             [Generate ✨]  │ │
│  │                                                                             │ │
│  │  Or use quick settings:                                                     │ │
│  │  Mood:  [Melancholic ▼]  Genre: [Jazz ▼]  Energy: [Low ▼]  Tempo: [Slow ▼] │ │
│  │                                                                             │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         GENERATED CONTENT                                   │ │
│  │                                                                             │ │
│  │  Section 1: Intro (8 bars)          [Play ▶] [Edit ✎] [Regenerate ↻]       │ │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │ │
│  │  │ Piano  ░░░░▓▓▓▓░░░░░░░░▓▓▓▓░░░░░░░░▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░  │  │ │
│  │  │ Bass   ▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░  │  │ │
│  │  │ Drums  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │ │
│  │  └──────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                             │ │
│  │  Section 2: Verse (16 bars)         [Play ▶] [Edit ✎] [Regenerate ↻]       │ │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │ │
│  │  │ Piano  ▓▓░░▓▓░░▓▓░░▓▓░░▓▓░░▓▓░░▓▓░░▓▓░░▓▓░░▓▓░░▓▓░░▓▓░░▓▓░░▓▓░░  │  │ │
│  │  │ Bass   ▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░  │  │ │
│  │  │ Drums  ░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓░▓  │  │ │
│  │  └──────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                             │ │
│  │  [Accept All] [Edit in Tracker] [Regenerate All ↻] [Add Section +]         │ │
│  │                                                                             │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Status: Generated 2 sections (24 bars)   [Export] [Open in Tracker Board]       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**You control:** The creative direction, what to keep, what to regenerate
**AI controls:** Actual note generation, arrangement, instrumentation

### 5.4 Generative Ambient Board

**For**: Ambient/generative music where the system creates continuously

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     🌊✨ GENERATIVE AMBIENT BOARD                                │
│                  "Set parameters. Let it evolve. Intervene when inspired."       │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │   TEXTURE GEN 1     │  │   TEXTURE GEN 2     │  │   MELODY GEN        │      │
│  │                     │  │                     │  │                     │      │
│  │  Type: [Pad      ▼] │  │  Type: [Granular ▼] │  │  Scale: [Dorian ▼]  │      │
│  │  Motion: [Slow   ▼] │  │  Density: ▮▮▮░░     │  │  Density: ░▮░░░     │      │
│  │  Harmony: [5ths  ▼] │  │  Scatter: ▮▮░░░     │  │  Range: 2 octaves   │      │
│  │                     │  │                     │  │                     │      │
│  │  ▁▂▃▄▃▂▁▂▃▄▅▄▃▂▁▂  │  │  ▪▪ ▪  ▪▪▪ ▪ ▪▪   │  │  ♪   ♪    ♪  ♪     │      │
│  │  [evolving...]      │  │  [scattering...]    │  │  [generating...]    │      │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘      │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                          GLOBAL CONTROLS                                     ││
│  │                                                                              ││
│  │  Root: [E ▼]   Mode: [Dorian ▼]   Tempo: [Drift ▼]   Chaos: ▮▮▮▮░░░░░░    ││
│  │                                                                              ││
│  │  [Freeze ❄] [Evolve ↻] [Reset ⟳]    Recording: [●] Capturing to timeline   ││
│  │                                                                              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  CAPTURED MOMENTS (click to restore)                                        ││
│  │  [00:00 - Intro] [02:34 - Dense] [05:12 - Sparse] [08:45 - Climax]         ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Running: 12:34   Chaos: 0.4   Root: E   Mode: Dorian   [Stop] [Export]          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 When to Choose Generative Boards

Choose a **Generative Board** when:

- You want to explore ideas quickly
- You're looking for inspiration or starting points
- You're creating backing tracks or accompaniment
- You enjoy curation more than note-by-note writing
- You're doing ambient/generative music
- You want to perform with AI as a collaborator
- You're short on time but need complete arrangements

---

## Part VI: Hybrid Workflows

### 6.1 Mixing Control Levels in One Project

The same project can use multiple boards:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         HYBRID PROJECT EXAMPLE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TRACK          │ BOARD USED          │ CONTROL LEVEL  │ YOU DID / AI DID      │
│  ───────────────┼─────────────────────┼────────────────┼─────────────────────  │
│  Lead Melody    │ Notation Board      │ 100% Manual    │ Wrote every note      │
│  Harmony        │ Tracker + Harmony   │ 90% Manual     │ Wrote notes, saw hints│
│  Bass           │ Tracker + Phrases   │ 70% You        │ Dragged phrases, edited│
│  Drums          │ AI Arranger         │ 30% You        │ Set style, AI generated│
│  Pad/Texture    │ Generative Ambient  │ 10% You        │ Set parameters         │
│                                                                                 │
│  RESULT: A song where you fully controlled the melody and harmony,             │
│          used assistance for bass, and let AI handle drums and textures.       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 The Composer Board (Power User Hybrid)

**For**: Power users who want all tools available, choosing per-track

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    🎹📊🤖 COMPOSER BOARD (Hybrid)                                │
│           "All tools available. You choose what to use, per track."             │
├──────────────────────────────────────────────────────────────────────────────────┤
│                              TOP: COMPOSITION TOOLS                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │  PHRASE         │ │    ARRANGER     │ │    HARMONY      │ │   AI ASSIST   │  │
│  │  DATABASE       │ │    (optional)   │ │    EXPLORER     │ │   (optional)  │  │
│  │                 │ │                 │ │                 │ │               │  │
│  │  Drag phrases   │ │  OFF for this   │ │  Key: C Major   │ │  Available    │  │
│  │  when you want  │ │  project        │ │  Chord: Cmaj7   │ │  but not on   │  │
│  │                 │ │  (you chose)    │ │                 │ │               │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────┘  │
│                                                                                  │
│ ──────────────────────────────── [═══ RESIZE ═══] ───────────────────────────── │
│                                                                                  │
│                            BOTTOM: TRACKER + CLIPS                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Row │ Melody   │ Bass     │ Drums    │ Chords   │ Pad      │ Clips ▼   │   │
│  │  ────┼──────────┼──────────┼──────────┼──────────┼──────────┼───────────│   │
│  │  00  │ C-4  01  │ C-2  02  │ [AI Gen] │ C-4  05  │ [Gen]    │ ┌───────┐ │   │
│  │  01  │ ----     │ ----     │ [AI Gen] │ E-4      │ [Gen]    │ │ Drum1 │ │   │
│  │  02  │ E-4  01  │ ----     │ [AI Gen] │ G-4      │ [Gen]    │ └───────┘ │   │
│  │  03  │ ----     │ G-2  02  │ [AI Gen] │ ----     │ [Gen]    │ ┌───────┐ │   │
│  │  04  │ G-4  01  │ ----     │ [AI Gen] │ ----     │ [Gen]    │ │ Bass1 │ │   │
│  │  ...                                                         │ └───────┘ │   │
│  │                                                              │           │   │
│  │  Per-Track Control:                                          │           │   │
│  │  • Melody: MANUAL (you type)                                 │           │   │
│  │  • Bass: PHRASE-ASSISTED (you drag)                          │           │   │
│  │  • Drums: AI-GENERATED (arranger)                            │           │   │
│  │  • Chords: MANUAL (you type)                                 │           │   │
│  │  • Pad: GENERATIVE (ambient gen)                             │           │   │
│  │                                                                          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌───────────────┐ ┌───────────────────────────┐ ┌────────────────────────────┐ │
│  │ Pattern: 01   │ │ [▶] [⏹] [⏺] BPM:128 4/4  │ │ Session: ▣ ▣ ▣ ▢ ▣ ▢ ▣ ▣  │ │
│  └───────────────┘ └───────────────────────────┘ └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Board Definition:**

```typescript
const COMPOSER_BOARD: Board = {
  id: 'composer-board',
  name: 'Composer Board',
  description: 'All tools available. Choose per track. Maximum flexibility.',
  icon: '🎹📊🤖',
  controlLevel: 'hybrid',
  philosophy: 'Every tool available. You decide what to use where.',
  
  // ALL tools available
  compositionTools: {
    phraseDatabase: { enabled: true, mode: 'drag-drop' },
    harmonyExplorer: { enabled: true, mode: 'suggest' },
    phraseGenerators: { enabled: true, mode: 'on-demand' },
    arrangerCard: { enabled: true, mode: 'manual-trigger' },
    aiComposer: { enabled: true, mode: 'command-palette' }
  },
  
  // Per-track control level
  perTrackControl: {
    enabled: true,
    options: [
      'manual',              // No AI, no phrases
      'harmony-hints',       // See chord tones
      'phrase-assisted',     // Drag from library
      'generator-assisted',  // On-demand generation
      'ai-generated'         // AI creates content
    ]
  },
  
  layout: {
    type: 'composition-top',
    compositionZone: { position: 'top', collapsible: true },
    editingZone: { type: 'tracker', splitWith: 'session' }
  }
};
```

### 6.3 Switching Boards Mid-Project

You can switch boards without losing work:

```typescript
interface BoardSwitcher {
  // Current state
  currentBoard: Board;
  projectData: ProjectState;         // Data is separate from board
  
  // Switch to a different board
  switchBoard(newBoardId: string): void {
    // 1. Save current view state
    // 2. Load new board layout
    // 3. Project data stays the same
    // 4. New board's tools become available
  }
  
  // Common switches
  examples: [
    "Start with AI Arranger → switch to Tracker for detailed editing",
    "Compose in Notation → switch to Session for arrangement",
    "Sketch in AI Composition → switch to Basic Tracker for precision"
  ];
}
```

### 6.4 Board Recommendations by Workflow

| Your Workflow | Start With | Switch To | Why |
|---------------|------------|-----------|-----|
| Traditional composer | Notation Board | — | Full control throughout |
| Tracker purist | Basic Tracker | — | Pure tracker experience |
| Quick sketching | AI Composition | Tracker + Phrases | Fast start, refine later |
| Live performance | AI Arranger | — | Real-time generation |
| Sample-based | Basic Sampler | Session + Generators | Chop, then generate fills |
| Orchestral | Notation Board | Tracker + Harmony | Notation for melody, tracker for layers |
| Ambient | Generative Ambient | Basic Tracker | Generate, then capture and edit |
| Pop/EDM production | Session + Generators | Composer Board | Quick clips, detailed editing |

---

## Part VII: Deck and Stack System

### 7.1 What Are Decks?

A **Deck** is a collection of related cards that can be placed in a panel:

```typescript
interface Deck {
  id: string;
  name: string;
  type: DeckType;
  
  // Cards in this deck
  cards: Card[];
  
  // Deck behavior
  cardLayout: 'stack' | 'tabs' | 'split' | 'floating';
  allowReordering: boolean;
  allowDragOut: boolean;
  
  // Control level (inherits from or overrides board)
  controlLevel?: ControlLevel;
}

type DeckType = 
  | 'pattern-editor'      // Tracker grid
  | 'notation-score'      // Staff notation
  | 'clip-session'        // Clip launcher
  | 'instrument-browser'  // Instrument list
  | 'phrase-library'      // Phrase browser
  | 'generator'           // AI/algorithmic generators
  | 'arranger'            // Arranger controls
  | 'mixer'               // Channel strips
  | 'dsp-chain'           // Effect chain
  | 'modular'             // Modular routing
  | 'properties'          // Inspector/properties
  | 'timeline'            // Arrangement timeline
  | 'custom';             // User-defined
```

### 7.2 Stack Behavior

Cards within a deck stack and can be switched:

```
┌────────────────────────────────────┐
│  [Pattern 01] [Pattern 02] [+]     │   ← Tabs to switch patterns
├────────────────────────────────────┤
│  Row │ Ch1  │ Ch2  │ Ch3  │ Ch4    │
│  ────┼──────┼──────┼──────┼──────  │
│  00  │ C-4  │ ---- │ G-4  │ ----   │
│  01  │ ---- │ E-4  │ ---- │ D-4    │
│  02  │ D-4  │ ---- │ ---- │ ----   │
│  ...                               │
└────────────────────────────────────┘
     │
     ▼ Stack: multiple patterns in same space

┌────────────────────────────────────┐
│  [Pattern 01] [PATTERN 02] [+]     │   ← Now showing Pattern 02
├────────────────────────────────────┤
│  Row │ Ch1  │ Ch2  │ Ch3  │ Ch4    │
│  ────┼──────┼──────┼──────┼──────  │
│  00  │ G-4  │ ---- │ ---- │ C-5    │
│  01  │ ---- │ ---- │ B-4  │ ----   │
│  ...                               │
└────────────────────────────────────┘
```

### 7.3 Deck Types by Control Level

Different boards include different deck types:

```typescript
// Manual boards: minimal deck types
const MANUAL_DECK_TYPES: DeckType[] = [
  'pattern-editor',
  'notation-score',
  'instrument-browser',
  'dsp-chain',
  'properties'
];

// Assisted boards: add library and hints
const ASSISTED_DECK_TYPES: DeckType[] = [
  ...MANUAL_DECK_TYPES,
  'phrase-library',
  'harmony-display'    // Read-only harmony info
];

// Generative boards: add generators
const GENERATIVE_DECK_TYPES: DeckType[] = [
  ...ASSISTED_DECK_TYPES,
  'generator',
  'arranger',
  'ai-composer'
];

// Hybrid boards: everything
const HYBRID_DECK_TYPES: DeckType[] = [
  ...GENERATIVE_DECK_TYPES,
  'modular',
  'custom'
];
```

### 7.4 Dragging Between Decks

Content can be dragged between decks:

```
┌─────────────────┐                    ┌─────────────────────────────┐
│ PHRASE LIBRARY  │                    │       PATTERN EDITOR        │
│                 │                    │                             │
│ ├─ Jazz Licks   │    drag →         │  00 │ C-4  │ ---- │ G-4     │
│ │  └─ Lick 1 ───┼───────────────────→  01 │ E-4  │ ---- │ ----    │
│ │               │                    │  02 │ G-4  │ ---- │ ----    │
│ └─ Pop Hooks    │                    │  03 │ B-4  │ ---- │ ----    │
│                 │                    │      (phrase expanded)      │
└─────────────────┘                    └─────────────────────────────┘
```

---

## Part VIII: Connection Routing

### 8.1 How Boards Connect Cards

Each board defines how its cards route audio and MIDI:

```typescript
interface BoardConnection {
  from: CardSlot;
  to: CardSlot;
  type: 'audio' | 'midi' | 'cv' | 'data';
  
  // For generative boards
  generationFlow?: {
    direction: 'card-to-generator' | 'generator-to-card';
    trigger: 'manual' | 'automatic' | 'chord-follow';
  };
}

// Example: Basic Tracker Board (manual)
const BASIC_TRACKER_CONNECTIONS: BoardConnection[] = [
  { from: 'pattern-editor', to: 'track-dsp', type: 'midi' },
  { from: 'track-dsp', to: 'master', type: 'audio' }
  // Simple: pattern → instrument → master
];

// Example: AI Arranger Board (generative)
const ARRANGER_CONNECTIONS: BoardConnection[] = [
  { from: 'chord-input', to: 'arranger-engine', type: 'midi' },
  { 
    from: 'arranger-engine', 
    to: 'drum-track', 
    type: 'midi',
    generationFlow: { direction: 'generator-to-card', trigger: 'chord-follow' }
  },
  { 
    from: 'arranger-engine', 
    to: 'bass-track', 
    type: 'midi',
    generationFlow: { direction: 'generator-to-card', trigger: 'chord-follow' }
  },
  // Chord input → arranger engine → generates to multiple tracks
];
```

### 8.2 Per-Track Routing for Hybrid Boards

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                        HYBRID BOARD ROUTING                                   │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  CHORD INPUT ───────────────────┐                                            │
│        │                        │                                            │
│        ▼                        ▼                                            │
│  ┌──────────┐            ┌──────────────┐                                    │
│  │ ARRANGER │            │ PHRASE GEN   │                                    │
│  │ (drums)  │            │ (bass)       │                                    │
│  └────┬─────┘            └──────┬───────┘                                    │
│       │                         │                                            │
│       ▼                         ▼                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ DRUMS    │  │ MELODY   │  │ BASS     │  │ PAD      │                     │
│  │ (AI gen) │  │ (manual) │  │ (phrase) │  │ (manual) │                     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                     │
│       │             │             │             │                            │
│       └─────────────┴─────────────┴─────────────┘                            │
│                           │                                                  │
│                           ▼                                                  │
│                    ┌──────────────┐                                          │
│                    │    MASTER    │                                          │
│                    └──────────────┘                                          │
│                                                                               │
│  Each track has its own control level:                                       │
│  • DRUMS: Generated by arranger (AI control)                                 │
│  • MELODY: Manual input (user control)                                       │
│  • BASS: Phrase library with edits (assisted)                               │
│  • PAD: Manual input (user control)                                         │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Part IX: Theming and Styling

### 9.1 Theme System

Each board can have themed variants:

```typescript
interface BoardTheme {
  id: string;
  name: string;
  colors: ColorScheme;
  typography: TypographyScheme;
  iconSet: IconSet;
  
  // Control level indicator colors
  controlIndicators: {
    manual: string;       // e.g., blue
    assisted: string;     // e.g., green  
    generative: string;   // e.g., purple
  };
}

// Example: Color-code tracks by control level
const HYBRID_CONTROL_COLORS = {
  'full-manual': '#4A90D9',        // Blue - you control
  'manual-with-hints': '#5CB85C',  // Green - you control with help
  'assisted': '#F0AD4E',           // Orange - assisted
  'directed': '#9B59B6',           // Purple - AI with direction
  'generative': '#E74C3C'          // Red - AI creates
};
```

### 9.2 Visual Feedback for Control Level

Users always know what level of control they have:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                        TRACK CONTROL INDICATORS                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                 │
│  │ Melody  │ │ Bass    │ │ Drums   │ │ Pad     │ │ FX      │                 │
│  │ ●───────│ │ ●───────│ │ ─────●──│ │ ●───────│ │ ─────●  │                 │
│  │ Manual  │ │ Assisted│ │ AI Gen  │ │ Manual  │ │ AI Gen  │                 │
│  │ [BLUE]  │ │ [ORANGE]│ │ [PURPLE]│ │ [BLUE]  │ │ [PURPLE]│                 │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘                 │
│                                                                               │
│  ●──────────────────●  Control spectrum slider per track                     │
│  Manual          AI                                                          │
│                                                                               │
│  Blue tracks: You write every note                                           │
│  Orange tracks: You use tools (phrases, generators on-demand)               │
│  Purple tracks: AI generates content based on your parameters               │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Part X: Implementation

### 10.1 Board Registry

All boards are registered and discoverable:

```typescript
class BoardRegistry {
  private boards: Map<string, Board> = new Map();
  
  // Register a board
  register(board: Board): void {
    this.boards.set(board.id, board);
  }
  
  // Get boards by control level
  getByControlLevel(level: ControlLevel): Board[] {
    return Array.from(this.boards.values())
      .filter(b => b.controlLevel === level);
  }
  
  // Get recommended boards for user type
  getRecommended(userType: UserType): Board[] {
    const recommendations: Record<UserType, string[]> = {
      'traditional-composer': ['notation-board-manual'],
      'tracker-purist': ['basic-tracker-board'],
      'renoise-user': ['basic-tracker-board', 'tracker-phrases-board'],
      'ableton-user': ['session-generators-board', 'composer-board'],
      'fl-user': ['session-generators-board', 'tracker-phrases-board'],
      'beginner': ['starter-board', 'session-generators-board'],
      'power-user': ['composer-board'],
      'ambient-artist': ['generative-ambient-board'],
      'live-performer': ['ai-arranger-board']
    };
    return recommendations[userType].map(id => this.boards.get(id)!);
  }
}

// Built-in boards
const BOARD_REGISTRY = new BoardRegistry();

// Manual boards
BOARD_REGISTRY.register(NOTATION_BOARD_MANUAL);
BOARD_REGISTRY.register(BASIC_TRACKER_BOARD);
BOARD_REGISTRY.register(BASIC_SAMPLER_BOARD);
BOARD_REGISTRY.register(BASIC_SESSION_BOARD);

// Assisted boards
BOARD_REGISTRY.register(TRACKER_HARMONY_BOARD);
BOARD_REGISTRY.register(TRACKER_PHRASES_BOARD);
BOARD_REGISTRY.register(SESSION_GENERATORS_BOARD);
BOARD_REGISTRY.register(NOTATION_HARMONY_BOARD);

// Generative boards
BOARD_REGISTRY.register(AI_ARRANGER_BOARD);
BOARD_REGISTRY.register(AI_COMPOSITION_BOARD);
BOARD_REGISTRY.register(GENERATIVE_AMBIENT_BOARD);

// Hybrid boards
BOARD_REGISTRY.register(COMPOSER_BOARD);
BOARD_REGISTRY.register(PRODUCER_BOARD);
BOARD_REGISTRY.register(LIVE_PERFORMANCE_BOARD);
```

### 10.2 Board Switcher UI

```typescript
interface BoardSwitcher {
  currentBoard: Board;
  recentBoards: Board[];
  favoriteBoards: Board[];
  
  // UI actions
  showBoardPicker(): void;           // Full browser
  quickSwitch(): void;               // Cmd+B - recent boards
  switchTo(boardId: string): void;   // Direct switch
}

// Quick switch UI
/*
┌───────────────────────────────────────────┐
│  ⌘B Switch Board                          │
├───────────────────────────────────────────┤
│  Recent:                                   │
│  [1] Basic Tracker Board                   │
│  [2] Tracker + Phrases                     │
│  [3] AI Arranger Board                     │
│                                           │
│  Search: [____________]                    │
│                                           │
│  Categories:                              │
│  [Manual] [Assisted] [Generative] [Hybrid]│
└───────────────────────────────────────────┘
*/
```

### 10.3 First-Run Board Selection

New users choose their starting point:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         WELCOME TO CARDPLAY                                      │
│                                                                                  │
│  How do you want to work?                                                       │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  🎼 TRADITIONAL COMPOSER                                                     ││
│  │  "I write every note. No AI, no suggestions."                               ││
│  │  → Notation Board (Manual)                                                   ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  📊 TRACKER MUSICIAN                                                         ││
│  │  "I love trackers. Give me patterns and effects."                           ││
│  │  → Basic Tracker Board                                                       ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  🎹 ARRANGER-STYLE                                                           ││
│  │  "I play chords, let the system create arrangements."                       ││
│  │  → AI Arranger Board                                                         ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  ✨ EXPLORER                                                                 ││
│  │  "Show me everything. I'll figure out what I like."                         ││
│  │  → Composer Board (All tools available)                                      ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  You can change boards anytime. This just picks your starting point.            │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 10.4 Summary: The Control Spectrum in Action

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           CARDPLAY: YOU CHOOSE                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  100% YOU                                                         100% AI       │
│  ◄──────────────────────────────────────────────────────────────────────────►   │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Notation Board  │ Basic Tracker │ Tracker+Phrases │ AI Arranger │ AI Gen │  │
│  │                 │               │                 │             │        │  │
│  │ Every note is   │ You type      │ You drag        │ You play    │ You    │  │
│  │ handwritten     │ every note    │ phrases, edit   │ chords, AI  │ describe│  │
│  │                 │               │ details         │ fills in    │ AI does │  │
│  │                 │               │                 │             │        │  │
│  │ Traditional     │ Tracker       │ Fast but        │ Live        │ Rapid   │  │
│  │ composition     │ craft         │ controlled      │ arrangement │ ideation│  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  The same CardPlay. The same project format. Different workflows.              │
│  Switch boards anytime. Mix control levels per track.                          │
│                                                                                  │
│  YOU ARE ALWAYS IN THE DRIVER'S SEAT.                                           │
│  The question is: how much do you want to steer?                                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: Board Summary Table

| Board | Control Level | Best For | Composition Tools |
|-------|--------------|----------|-------------------|
| Notation Board | Full Manual | Traditional composers | None |
| Basic Tracker Board | Full Manual | Tracker purists | None |
| Basic Sampler Board | Full Manual | Sample choppers | None |
| Basic Session Board | Full Manual | Clip arrangers | None |
| Tracker + Harmony | Manual + Hints | Learning harmony | Harmony display |
| Tracker + Phrases | Assisted | Faster workflow | Phrase library |
| Session + Generators | Assisted | Clip-based production | On-demand generators |
| Notation + Harmony | Assisted | Orchestration | Chord suggestions |
| AI Arranger | Directed | Arranger-style | Chord-follow arranger |
| AI Composition | Directed | Rapid ideation | Full AI composer |
| Generative Ambient | Generative | Ambient music | Continuous generators |
| Composer Board | Hybrid | Power users | All tools, per-track |
| Producer Board | Hybrid | Full production | All tools + mix |
| Live Performance | Hybrid | Performance | Arranger + manual |

---

## Appendix B: Keyboard Shortcuts

Each board inherits from a base shortcut set and can override:

```typescript
const BASE_SHORTCUTS = {
  // Transport
  'Space': 'play/pause',
  'Enter': 'play-from-start',
  'Escape': 'stop',
  
  // Navigation
  'Cmd+B': 'switch-board',
  'Cmd+1-9': 'switch-deck-tab',
  
  // Editing
  'Cmd+Z': 'undo',
  'Cmd+Shift+Z': 'redo',
  'Cmd+C': 'copy',
  'Cmd+V': 'paste'
};

const TRACKER_SHORTCUTS = {
  ...BASE_SHORTCUTS,
  // Tracker-specific
  'Up/Down': 'move-cursor',
  'Tab': 'next-column',
  'Caps Lock': 'edit-mode-toggle'
};

const NOTATION_SHORTCUTS = {
  ...BASE_SHORTCUTS,
  // Notation-specific  
  'A-G': 'insert-note',
  'R': 'insert-rest',
  '1-9': 'set-duration'
};
```

---

*CardPlay: One platform. Many workflows. You choose your level of control.*
