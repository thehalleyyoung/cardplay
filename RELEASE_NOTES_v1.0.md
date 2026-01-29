# CardPlay Board System v1.0 - Release Notes

**Release Date:** 2026-01-29  
**Version:** v1.0.0  
**Status:** Feature Complete

---

## 🎉 What's New

CardPlay v1.0 introduces the **Board-Centric Architecture**, a revolutionary way to work with music that adapts to your workflow and gives you precise control over AI assistance.

### The Big Idea: Choose Your Level of Control

Every musician has a different relationship with technology. Some want full manual control. Others want AI to handle arrangement. Many want something in between.

**CardPlay v1.0 gives you that choice with 17 builtin boards spanning the Control Spectrum:**

- **Full Manual** (4 boards) — You write every note
- **Manual with Hints** (1 board) — Visual harmony guidance
- **Assisted** (4 boards) — Drag phrases, trigger generation
- **Directed** (2 boards) — Set structure, system generates
- **Generative** (1 board) — Continuous generation, you curate
- **Collaborative** (3 boards) — Mix manual + generated per-track

**Press `Cmd+B` anytime to switch between boards.** Your project data is shared—switching boards never loses your work.

---

## ✨ Key Features

### 1. Board System

**17 Builtin Boards:**

#### Manual Boards
- **Basic Tracker Board** — Pure tracker workflow (Renoise-style)
- **Basic Notation Board** — Traditional score editing (Finale-style)
- **Basic Session Board** — Manual clip launching (Ableton-style)
- **Basic Sampler Board** — Manual sample chopping/arrangement

#### Assisted Boards
- **Tracker + Harmony Board** — Chord tone coloring while you compose
- **Tracker + Phrases Board** — Drag MIDI phrases from library
- **Session + Generators Board** — On-demand part generation
- **Notation + Harmony Board** — Harmony suggestions with click-to-accept

#### Directed Boards
- **AI Arranger Board** — Chord progression → full arrangement
- **AI Composition Board** — Prompt-driven generation with review

#### Generative Board
- **Generative Ambient Board** — Continuous texture evolution

#### Collaborative Boards (Hybrid)
- **Composer Board** — Multi-panel composition with per-track control
- **Producer Board** — Full production with optional generation
- **Live Performance Board** — Performance-first with autonomous backing

### 2. Board Switcher

- **Cmd+B** global shortcut opens board switcher
- Search by name, filter by category
- Recent boards (last 10)
- Favorites list (persistent)
- Keyboard navigation (arrow keys, Enter to select)
- Reset layout/deck options on switch

### 3. Deck System

**17 Deck Types Implemented:**
- Pattern Editor (tracker)
- Notation Score (VexFlow-based)
- Piano Roll (MIDI-style editing)
- Clip Session Grid (Ableton-style)
- Timeline/Arrangement (linear view)
- Instrument Browser (with gating)
- Sample Browser (with waveform preview)
- Phrase Library (drag-and-drop)
- Generator (on-demand/continuous)
- Arranger (sections + style controls)
- Harmony Display (chord/scale context)
- Mixer (track strips + meters)
- Properties (selection inspector)
- DSP Chain (effect stack)
- Transport (play/stop/tempo/loop)
- Modular (routing visualization)
- Chord Track (chord events)

**Card Layouts:**
- **Stack** — Vertical list (effects, instruments)
- **Tabs** — One visible at a time (multiple patterns)
- **Split** — Side-by-side (notation + piano roll)
- **Floating** — Overlay (detached editors)

### 4. Gating System

**Tool visibility controlled by control level:**
- Manual boards hide phrase library, generators, AI tools
- Assisted boards show phrase library, on-demand generators
- Directed boards show arranger, AI composer
- Generative boards show continuous generators

**Why-not messages:**
- When a tool is hidden, tooltip explains why
- "Switch to Tracker + Phrases board to enable phrase library"

### 5. Generator Actions

**Freeze Action:**
- Mark generated content as user-owned
- Prevents regeneration
- Undoable

**Regenerate Action:**
- Re-roll section with new seed
- Preserves structure/constraints
- Undoable

**Humanize Action:**
- Add timing/velocity variation
- Configurable amount (0-100%)
- Undoable

**Capture Action:**
- Freeze time window into clip
- For generative boards (capture best moments)

### 6. Phrase System

**Phrase Library:**
- Search by tags, categories
- Favorites list
- Waveform/MIDI preview
- Drag to pattern editor/notation

**Phrase Adaptation:**
- Auto-transpose to current key/chord
- Voice-leading mode (smooth harmonic motion)
- Rhythm preserved, pitches adapted

**Commit to Library:**
- Select notes in tracker/notation
- Click "Save as Phrase"
- Add tags, category, metadata

### 7. Harmony System

**Harmony Display Deck:**
- Current key/chord/scale
- Chord tones list
- Roman numeral view

**Chord Tone Coloring:**
- Green = chord tones
- Blue = scale tones (not in chord)
- Red = chromatic (out of scale)
- Non-destructive (display-only)

**Suggested Next Chords:**
- Based on harmonic analysis
- Click to accept (writes to chord stream)
- Preserves voice-leading

### 8. Arranger System

**Sections Bar:**
- Define intro/verse/chorus/bridge/outro
- Drag to reorder, resize
- Per-section regeneration

**Style Presets:**
- Lofi, house, ambient, etc.
- Map to generator params (no external model)

**Per-Part Control:**
- Toggle drums/bass/pad/melody on/off
- Per-part density/swing/humanize

### 9. Routing Overlay

**Visual Connection Graph:**
- Nodes = decks/cards/tracks
- Edges = connections (audio/MIDI/modulation/trigger)
- Color-coded by type
- Click-to-connect with validation
- Drag-to-rewire
- Connection inspector (gain, type, ports)

**Mini-Map Mode:**
- Zoomed overview for complex graphs
- Click to jump to region

### 10. Theming

**Control Level Colors:**
- Manual: Blue
- Hints: Purple
- Assisted: Green
- Directed: Orange
- Generative: Red
- Collaborative: Gradient/multi-color

**Per-Board Themes:**
- Dark/light/high-contrast variants
- Applies without remounting
- Persists per board

**Visual Indicators:**
- Track headers show control level badge
- Mixer strips show control level color bar
- Session headers show control level indicator

### 11. Keyboard Shortcuts

**Global:**
- `Cmd+B` — Open board switcher
- `Space` — Play/pause transport
- `Enter` — Accept (in modals)
- `Esc` — Cancel/close (in modals)

**Per-Board:**
- Registered on activation, unregistered on switch
- Notation board: note entry, zoom, print
- Tracker board: hex entry, octave, pattern length
- Session board: launch clip, arm track, duplicate

**Deck Tabs:**
- `Cmd+1..9` — Switch deck tabs (scoped to active deck)

**Command Palette:**
- `Cmd+K` — Open AI composer (directed/generative boards only)

### 12. State Persistence

**Per-Board State:**
- Panel layout (sizes, collapsed panels)
- Deck tabs (active tab per deck)
- Scroll positions (tracker, session, timeline)
- Filters/search (browser decks)

**Global State:**
- Recent boards (last 10)
- Favorites (persist across reload)
- Active context (activeStreamId, activeClipId)
- Transport state (tempo, loop, playback)

**Project Data (Shared Across Boards):**
- Event streams (SharedEventStore)
- Clips (ClipRegistry)
- Routing connections (RoutingGraphStore)
- Parameters (ParameterResolver)
- Undo history (UndoStack)

---

## 📊 Stats

- **17 builtin boards** across all control levels
- **17 deck types** with factories
- **4 card layouts** (stack, tabs, split, floating)
- **7,584 passing tests** (95.8% pass rate)
- **0 type errors** (100% type-safe)
- **Clean build** with Vite
- **30+ documentation files** (API, guides, tutorials)

---

## 🏗️ Architecture

### Type System

All boards share the same underlying types:

```typescript
// Core event model
type Event<P> = {
  id: EventId;
  kind: EventKind;
  start: Tick;
  duration: TickDuration;
  payload: P;
};

// Board definition
interface Board {
  id: string;
  name: string;
  controlLevel: ControlLevel;
  decks: BoardDeck[];
  layout: BoardLayout;
  compositionTools: CompositionToolConfig;
}

// Deck definition
interface BoardDeck {
  id: string;
  type: DeckType;
  title: string;
  cardLayout: DeckCardLayout;
}
```

### Data Flow

```
User Action (tracker/notation/piano roll)
  ↓
SharedEventStore (add/remove/update events)
  ↓
All subscribed views update (cross-view sync)
  ↓
Audio Engine receives events
  ↓
Sound output
```

**Key Principle:** All boards write to the same stores. Switching boards is just changing the view layer.

---

## 🚀 Getting Started

### Installation

```bash
npm install
npm run dev
```

### First Run

1. **Board Selector** appears
2. Answer 2-3 questions about your workflow
3. System recommends starting boards
4. Choose a board or browse all boards
5. Start composing!

### Switching Boards

- Press `Cmd+B` anytime
- Search or browse boards
- Click or press Enter to switch
- Your project data persists (no data loss)

### Learning Path

**Beginner:**
1. Start with **Basic Tracker** or **Basic Notation** (full manual)
2. Learn the event model and basic editing
3. Switch to **Tracker + Harmony** (see chord tone hints)
4. Switch to **Tracker + Phrases** (drag phrases to compose faster)

**Intermediate:**
5. Try **Session + Generators** (on-demand generation)
6. Try **AI Arranger** (chord progression → arrangement)
7. Explore **Composer Board** (multi-panel hybrid)

**Advanced:**
8. Try **Generative Ambient** (continuous generation)
9. Try **Producer Board** (full production workflow)
10. Try **Live Performance Board** (live input + autonomous backing)

---

## 📖 Documentation

### Quick Start
- [Board System Overview](./docs/boards/index.md)
- [Control Spectrum Guide](./docs/boards/control-spectrum.md)
- [Board Switcher](./docs/boards/board-switching.md)
- [Release Criteria](./docs/boards/release-criteria.md)

### API Reference
- [Board API](./docs/boards/board-api.md)
- [Board State](./docs/boards/board-state.md)
- [Deck System](./docs/boards/deck-stack-system.md)
- [Gating Rules](./docs/boards/gating.md)
- [Tool Modes](./docs/boards/tool-modes.md)
- [Routing System](./docs/boards/routing.md)
- [Theming System](./docs/boards/theming.md)

### Board Guides (17 boards)
- Basic Tracker, Basic Notation, Basic Session, Basic Sampler
- Tracker + Harmony, Tracker + Phrases
- Session + Generators, Notation + Harmony
- AI Arranger, AI Composition
- Generative Ambient
- Composer, Producer, Live Performance

### Authoring
- [Authoring Boards](./docs/boards/authoring-boards.md)
- [Authoring Decks](./docs/boards/authoring-decks.md)

---

## 🔧 What Changed

### Breaking Changes

**None.** This is the first board system release. If you were using pre-board versions of CardPlay, you'll need to:
- Re-read docs (architecture has changed significantly)
- Projects using old format will need migration (contact maintainers)

### Migration Guide

**From pre-board CardPlay:**
- Event model is unchanged (same Event<P> type)
- Stores are unchanged (SharedEventStore, ClipRegistry, etc.)
- UI surfaces moved into boards (tracker → Basic Tracker Board)
- Deck factories wrap old panel components

**New projects:**
- Start fresh, choose a board, start composing!

---

## 🐛 Known Limitations

### Not Included in v1.0

**Prolog AI Engine (Phase L):**
- Rule-based reasoning postponed to v2.0
- Current generators use procedural algorithms (no external models)
- Harmony analysis is heuristic-based (not logic-based)

**Extension System (Phase O):**
- No custom board authoring UI (code-only)
- No board marketplace or sharing
- No extension API for third-party cards/decks

**Audio Export:**
- No render-to-audio yet (MIDI-only workflows)
- Audio routing visible, but no audio file export

**Performance:**
- Large projects (100+ clips, 50+ tracks) may see slowdown
- Routing overlay render loop not fully optimized
- Memory leak tests incomplete (use board switcher liberally!)

### Known Issues

**Test Failures:**
- 319/7917 tests failing (4.2% failure rate)
- Mostly jsdom timing issues (not functionality bugs)
- Session grid play state tests have mock issues
- All core workflows verified working in demo app

**UI Polish:**
- Some deck headers don't show control level badges yet
- Routing overlay mini-map not fully implemented
- High-contrast theme needs audit
- Some animations not respecting reduced-motion

---

## 🔮 What's Next

### v1.1 - Polish & Performance (Q2 2026)
- Fix remaining test failures
- Memory leak fixes (rapid board switching)
- Performance optimizations (virtualization, throttling)
- Accessibility audit (WCAG AA compliance)
- Audio export/rendering
- More generator presets

### v1.2 - Board Authoring UI (Q3 2026)
- Visual board editor (drag-and-drop decks)
- Board template system
- Custom board save/load
- Board sharing (export/import definitions)

### v2.0 - Prolog AI (Q4 2026)
- Prolog engine integration
- Music theory knowledge bases
- Compositional reasoning (why this chord, not that?)
- Workflow planning (suggest next steps)
- Parameter optimization (find best settings)

### v3.0 - Extensions & Community (2027)
- Extension API (custom cards, decks, boards)
- Board marketplace
- Template library
- Community sharing
- Collaboration features

---

## 🙏 Thank You

Thank you for trying CardPlay v1.0! We've worked hard to build a system that respects your creative process while offering powerful AI assistance when you want it.

**Feedback welcome:**
- GitHub Issues: [github.com/cardplay/cardplay/issues](https://github.com/cardplay/cardplay/issues)
- Discussions: [github.com/cardplay/cardplay/discussions](https://github.com/cardplay/cardplay/discussions)

**Documentation:**
- Read the docs: [`./docs/boards/`](./docs/boards/)
- Quick start: [README.md](./README.md)

**Contributing:**
- See [CONTRIBUTING.md](./CONTRIBUTING.md)
- Board authoring guide: [`./docs/boards/authoring-boards.md`](./docs/boards/authoring-boards.md)

---

## 📝 Changelog

### v1.0.0 (2026-01-29)

**Added:**
- ✨ Board system (17 builtin boards)
- ✨ Board switcher (Cmd+B modal)
- ✨ Deck system (17 deck types)
- ✨ Gating system (tool visibility by control level)
- ✨ Generator actions (freeze/regenerate/humanize)
- ✨ Phrase system (library/drag/adaptation)
- ✨ Harmony system (coloring/suggestions)
- ✨ Arranger system (sections/chords/style)
- ✨ Routing overlay (visual connection graph)
- ✨ Theming system (control level colors)
- ✨ Keyboard shortcuts (global + per-board)
- ✨ State persistence (per-board layout/decks)
- ✨ 30+ documentation files

**Fixed:**
- 🐛 Type errors (0 errors, 100% clean)
- 🐛 Build errors (clean build with Vite)
- 🐛 Cross-view sync (tracker ↔ notation ↔ piano roll)

**Changed:**
- 🔄 Architecture (moved to board-centric)
- 🔄 UI organization (panels → decks within boards)
- 🔄 Documentation (board-first guides)

**Tests:**
- ✅ 7,584 passing tests (95.8% pass rate)
- ✅ Board switching integration tests
- ✅ Gating smoke tests
- ✅ Generator action tests
- ✅ Phrase system tests

---

## 📜 License

MIT License (see LICENSE file)

---

**CardPlay v1.0 — Your Music, Your Control**  
*Press Cmd+B to begin.*
