# Board System Documentation Index

**Last Updated:** 2026-01-29

## Overview

This directory contains comprehensive documentation for CardPlay's **Board-Centric Architecture** — a flexible workspace system that adapts to different user workflows, skill levels, and creative approaches.

**Core Principle:** One application, multiple boards — from pure manual control to AI-assisted to fully generative, all sharing the same underlying project data.

---

## Table of Contents

1. [**Core Concepts**](#core-concepts)
2. [**Builtin Boards Reference**](#builtin-boards-reference)
3. [**System Documentation**](#system-documentation)
4. [**Authoring Guides**](#authoring-guides)
5. [**Integration & API**](#integration--api)

---

## Core Concepts

### What is a Board?

A **Board** is a complete workspace configuration that includes:
- **Deck layouts** (which editors/tools are visible)
- **Control level** (manual → hints → assisted → directed → generative)
- **Tool configuration** (which AI/phrase/harmony tools are enabled and how)
- **Theme** (visual styling suited to the workflow)
- **Shortcuts** (keyboard bindings optimized for the board's focus)

### Control Spectrum

Boards span a **control spectrum** from full manual to fully autonomous:

| Level | Description | Example Use |
|-------|-------------|-------------|
| **Full Manual** | Zero AI, pure composition | Traditional notation editing |
| **Manual + Hints** | Visual cues, no generation | Harmony coloring in tracker |
| **Assisted** | On-demand generation | Drag phrases into pattern |
| **Directed** | Guided generation | Set style/energy, AI fills |
| **Generative** | Continuous creation | Ambient sound generation |

### Decks

**Decks** are the UI panels within a board. Each deck shows:
- An **editor** (tracker, notation, piano roll, session grid)
- A **browser** (instruments, samples, phrases)
- A **tool** (mixer, properties, harmony display, generator)

Decks can be:
- **Stacked** (cards within a single panel)
- **Tabbed** (switchable views)
- **Split** (side-by-side panes)
- **Floating** (detached windows)

---

## Builtin Boards Reference

### Manual Boards (Full Control)

#### 📝 [Notation Board (Manual)](./notation-board-manual.md)
- **Control Level:** Full Manual
- **Primary Deck:** Notation Score
- **Use Case:** Traditional composition, print preparation, orchestration
- **Tools:** Instrument browser, properties panel, DSP chain
- **For:** Classical composers, arrangers, music educators

#### 🔢 [Basic Tracker Board](./basic-tracker-board.md)
- **Control Level:** Full Manual
- **Primary Deck:** Pattern Editor (tracker)
- **Use Case:** Renoise-style pattern sequencing, chip tunes
- **Tools:** Instrument browser, DSP chain, properties
- **For:** Tracker purists, chip tune artists, demoscene

#### 🎚️ [Basic Sampler Board](./basic-sampler-board.md)
- **Control Level:** Full Manual
- **Primary Deck:** Sample Browser + Timeline
- **Use Case:** Sample-based production, chop/arrange workflow
- **Tools:** Waveform editor, DSP chain, clip properties
- **For:** Beat makers, sample-based producers

#### 🎹 [Basic Session Board](./basic-session-board.md)
- **Control Level:** Full Manual
- **Primary Deck:** Clip Session Grid
- **Use Case:** Ableton-style clip launching, live jamming
- **Tools:** Mixer, instrument browser, properties
- **For:** Live performers, improvisers, session producers

---

### Assisted Boards (Manual + Tools)

#### 🎼 [Tracker + Harmony Board](./tracker-harmony-board.md)
- **Control Level:** Manual + Hints
- **Primary Deck:** Pattern Editor with chord tone coloring
- **Use Case:** Learn harmony while tracking, visual scale guidance
- **Tools:** Harmony display (key/chord), chord picker
- **For:** Learning music theory, harmonic exploration

#### 🎵 [Tracker + Phrases Board](./tracker-phrases-board.md)
- **Control Level:** Assisted
- **Primary Deck:** Pattern Editor + Phrase Library
- **Use Case:** Drag/drop phrases, adapt to chords, fast composition
- **Tools:** Phrase browser (searchable), phrase adaptation settings
- **For:** Fast controlled workflows, building with pre-made parts

#### 🎛️ [Session + Generators Board](./session-generators-board.md)
- **Control Level:** Assisted
- **Primary Deck:** Clip Session + Generator Strip
- **Use Case:** Generate clips on-demand, curate results, live sketch
- **Tools:** Melody/bass/drums generators, humanize/quantize
- **For:** Quick sketching, jamming with AI, controlled generation

#### 🎹 [Notation + Harmony Board](./notation-harmony-board.md)
- **Control Level:** Assisted
- **Primary Deck:** Notation Score + Harmony Display
- **Use Case:** Notation with harmonic suggestions, voice-leading hints
- **Tools:** Harmony explorer (suggest mode), chord progression builder
- **For:** Orchestral composition, educational workflows

---

### Generative Boards (Directed/Autonomous)

#### 🤖 [AI Arranger Board](./ai-arranger-board.md) ⏳
- **Control Level:** Directed
- **Primary Deck:** Arranger + Clip Session
- **Use Case:** Set sections/chords/style, AI fills instrumentation
- **Tools:** Section builder, part toggles, style presets
- **For:** Rapid sketching, demo production, game audio
- **Status:** Board defined, runtime deferred to Phase K

#### 🎹 [AI Composition Board](./ai-composition-board.md) ⏳
- **Control Level:** Directed
- **Primary Deck:** AI Composer + Notation/Tracker
- **Use Case:** Prompt-based composition, draft → review → edit
- **Tools:** Command palette, constraint editor, diff preview
- **For:** Experimental composition, writer's block breaker
- **Status:** Board defined, runtime deferred to Phase K

#### 🌊 [Generative Ambient Board](./generative-ambient-board.md) ⏳
- **Control Level:** Generative
- **Primary Deck:** Continuous Generator Stream
- **Use Case:** Background ambient music, evolving soundscapes
- **Tools:** Mood presets, layer freeze/unfreeze, capture clips
- **For:** Ambient music, game soundtracks, installation art
- **Status:** Board defined, runtime deferred to Phase K

---

### Hybrid Boards (Power User)

#### 🎼 [Composer Board](./composer-board.md) ✅
- **Control Level:** Collaborative (per-track manual/assisted/directed)
- **Primary Decks:** Arranger + Chord Track + Session + Notation/Tracker
- **Use Case:** Professional composition with mixed control levels
- **Tools:** Composer deck bar (generate → preview → accept), phrase adapter
- **For:** Film composers, game composers, hybrid workflows
- **Status:** ✅ Complete (Phase I)

#### 🎚️ [Producer Board](./producer-board.md) ✅
- **Control Level:** Collaborative (optional generation per track)
- **Primary Decks:** Timeline + Mixer + DSP Chain + Session
- **Use Case:** Full production with freezing/bouncing, automation
- **Tools:** Freeze track, bounce to audio, automation lanes, routing overlay
- **For:** Producers, mix engineers, mastering workflows
- **Status:** ✅ Complete (Phase I)

#### 🎤 [Live Performance Board](./live-performance-board.md) ✅
- **Control Level:** Collaborative (live manual + arranger support)
- **Primary Decks:** Session Grid + Arranger + Mixer + Modular Routing
- **Use Case:** Live performance with real-time control + optional AI backing
- **Tools:** Performance macros, panic controls, MIDI activity viz, capture
- **For:** Live performers, DJs, improvisers
- **Status:** ✅ Complete (Phase I)

---

## System Documentation

### Architecture

- [**Board API Reference**](./board-api.md) — Board types, registry, validation
- [**Board State**](./board-state.md) — Persistence schema, localStorage keys
- [**Layout Runtime**](./layout-runtime.md) — Panel/deck layout model
- [**Migration Semantics**](./migration.md) — Board switching, state preservation

### Features

- [**Decks**](./decks.md) — All deck types and their backing components
- [**Panels**](./panels.md) — Panel roles and layout mapping
- [**Gating**](./gating.md) — Control level gating rules, card visibility
- [**Tool Modes**](./tool-modes.md) — Each tool's modes and UI behavior
- [**Routing**](./routing.md) — Routing overlay, validation rules
- [**Theming**](./theming.md) — Board themes, control indicators
- [**Shortcuts**](./shortcuts.md) — Global + per-board shortcuts

### Integration

- [**Drag/Drop System**](./drag-drop.md) — Payload types, drop handlers
- [**Store Integration**](./store-integration.md) — How boards use SharedEventStore, ClipRegistry
- [**Undo Integration**](./undo-integration.md) — Board action undo groups

---

## Authoring Guides

### For Developers

- [**Board Authoring Guide**](./authoring-boards.md) (K002) ⏳
  - How to create a new board from scratch
  - Required fields, validation rules
  - Registration and testing

- [**Deck Authoring Guide**](./authoring-decks.md) (K003) ⏳
  - How to add a new `DeckType`
  - Factory pattern, runtime state
  - Integration with gating and layout

- [**Project Compatibility**](./project-compatibility.md) (K004) ⏳
  - How boards share the same project format
  - Stream/clip references, no duplication
  - Board-agnostic data layer

### For Users

- [**Board Switching Semantics**](./board-switching.md) (K005) ⏳
  - What persists when switching boards
  - What resets, what migrates
  - Per-board vs global settings

---

## Integration & API

### TypeScript API

All board types are exported from `@cardplay/core`:

```typescript
import {
  type Board,
  type BoardDefinition,
  type BoardRegistry,
  getBoardRegistry,
  getBoardStateStore,
  switchBoard
} from '@cardplay/core';
```

### Board Registry

```typescript
import { getBoardRegistry } from '@cardplay/boards/registry';

const registry = getBoardRegistry();

// Search boards
const results = registry.search('tracker');

// Filter by control level
const manualBoards = registry.getByControlLevel('full-manual');

// Get recommendations
import { getRecommendedBoards } from '@cardplay/boards/recommendations';
const recommended = getRecommendedBoards('tracker-purist', registry);
```

### Board State Store

```typescript
import { getBoardStateStore } from '@cardplay/boards/store';

const store = getBoardStateStore();

// Get current board
const currentBoardId = store.getState().currentBoardId;

// Switch boards
import { switchBoard } from '@cardplay/boards/switching';
await switchBoard('basic-tracker', {
  resetLayout: false,
  preserveActiveContext: true
});

// Favorites and recents
store.toggleFavorite('notation-manual');
console.log(store.getState().favoriteBoardIds);
console.log(store.getState().recentBoardIds);
```

---

## Quick Reference

### Board Lifecycle

1. **Registration** → Boards registered in `src/boards/builtins/register.ts`
2. **Validation** → Board definitions validated on registration
3. **Persistence** → Board state stored in localStorage `cardplay.boardState.v1`
4. **Switching** → `switchBoard()` updates active board, persists recents
5. **Layout** → Deck layout runtime generated from board definition
6. **Cleanup** → Lifecycle hooks (`onDeactivate`, `onActivate`) called

### File Structure

```
src/boards/
├── types.ts              # Board, ControlLevel, ToolConfig types
├── validate.ts           # Board validation rules
├── registry.ts           # Board registry singleton
├── recommendations.ts    # UserType → board mapping
├── store/
│   ├── types.ts          # BoardState schema
│   ├── storage.ts        # localStorage helpers
│   └── store.ts          # BoardStateStore singleton
├── context/
│   ├── types.ts          # ActiveContext schema
│   └── store.ts          # BoardContextStore singleton
├── switching/
│   ├── types.ts          # BoardSwitchOptions
│   ├── switch-board.ts   # Board switching logic
│   └── migration-plan.ts # Deck migration heuristics
├── layout/
│   ├── runtime-types.ts  # LayoutRuntime schema
│   ├── adapter.ts        # Board → LayoutRuntime mapping
│   ├── serialize.ts      # Persist layout state
│   └── deserialize.ts    # Restore layout state
├── decks/
│   ├── runtime-types.ts  # DeckState schema
│   ├── factory-types.ts  # DeckFactory interface
│   └── factory-registry.ts # DeckType → factory mapping
├── gating/
│   ├── card-kinds.ts     # BoardCardKind classification
│   ├── tool-visibility.ts # Tool gating logic
│   ├── is-card-allowed.ts # Card visibility rules
│   └── capabilities.ts   # Board capability flags
├── theming/
│   ├── types.ts          # BoardTheme schema
│   ├── defaults.ts       # Per-control-level themes
│   └── apply.ts          # Apply theme to CSS vars
└── builtins/
    ├── ids.ts            # Builtin board IDs
    ├── register.ts       # Registration entry point
    ├── notation-board-manual.ts
    ├── basic-tracker-board.ts
    ├── basic-sampler-board.ts
    ├── basic-session-board.ts
    ├── tracker-harmony-board.ts
    ├── tracker-phrases-board.ts
    ├── session-generators-board.ts
    ├── notation-harmony-board.ts
    ├── ai-arranger-board.ts
    ├── ai-composition-board.ts
    ├── generative-ambient-board.ts
    ├── composer-board.ts
    ├── producer-board.ts
    └── live-performance-board.ts
```

---

## Status Summary (2026-01-29)

### ✅ Complete
- Phase A: Baseline & Repo Health (86/100)
- Phase B: Board System Core (137/150)
- Phase E: Deck/Stack/Panel Unification (82/88) — **Functionally Complete**
- Phase F: Manual Boards (105/120) — All 4 manual boards implemented
- Phase G: Assisted Boards (101/120) — All 4 assisted boards implemented
- Phase I: Hybrid Boards (57/75) — All 3 hybrid boards runtime complete!

### 🚧 In Progress
- Phase C: Board Switching UI (58/100) — Core features done
- Phase D: Card Availability & Gating (45/80) — Core logic complete
- Phase H: Generative Boards (34/75) — Boards defined, runtime deferred
- Phase J: Routing, Theming, Shortcuts (25/60) — Theming/routing done

### ⏳ Planned
- Phase K: QA, Performance, Docs, Release (0/30)
- Phase L-P: AI Foundation, Personas, Advanced Features, Community, Polish

---

## Getting Started

### For New Users

1. Launch CardPlay
2. **First-Run Experience** → Select your persona/workflow
3. **Board Switcher** (`Cmd+B`) → Browse available boards
4. **Start creating** → All boards share the same project data

### For Developers

1. Read [**Board API Reference**](./board-api.md)
2. Study an existing board (e.g., `basic-tracker-board.ts`)
3. Create your board definition following the schema
4. Register in `builtins/register.ts`
5. Add tests and docs

---

## Support & Feedback

- **Documentation:** This directory (ongoing updates)
- **Code:** `src/boards/` and `src/ui/components/board-*.ts`
- **Tests:** `src/boards/**/*.test.ts`
- **Roadmap:** `currentsteps-branchA.md`

**Phase K (QA & Launch)** will add comprehensive E2E tests, performance benchmarks, and accessibility audits.

---

**The board system is the heart of CardPlay's flexibility.** Choose your board, choose your control level, and create music your way. 🎵
