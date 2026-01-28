# 🎴 CardPlay

**A unified, parametric music creation system built on cards, events, and streams.**

CardPlay reimagines music software by treating every musical action—notes, automation, modulation, structure—as typed **Events** flowing through composable **Cards**. Whether you're a beatmaker, classical composer, tracker enthusiast, or algorithmic artist, CardPlay speaks your language through a single, consistent data model.

---

## ✨ Vision

### One System, Every Musician

CardPlay is designed for:

| Persona | Interface | Focus |
|---------|-----------|-------|
| 🥁 **Beatmaker** | Pads, clips, session view | Immediate audio feedback |
| 📊 **Tracker User** | Row/column grid, microtiming | Compact, precise control |
| 🎼 **Notator** | Engraved score, dynamics | Traditional notation |
| 🧬 **Algorithmic Composer** | Phrase rules, grammars | Generative transformations |
| 🎵 **Raga/Tala Composer** | Cyclic time, ornaments | Carnatic/non-Western traditions |
| 🔊 **Sound Sculptor** | Spectral analysis, timbre | Sound design |
| 🎤 **Live Performer** | Recording, launching takes | Real-time capture |

All personas work with the **same underlying Event model**—just different views.

### Core Principles

1. **Extensibility at the Edges** — New cards can be added by users (or AI) via a typed API. The system remains type-safe even with never-before-seen card types.

2. **Progressive Disclosure** — Beginners see a friendly, minimal surface. Experts peel back into trackers, automation lanes, and routing graphs. The data model stays identical.

3. **One Abstraction** — Every time-based action is an `Event<P>`. Every transformation is a `Card`. Every container (pattern, clip, scene, score) uses the same `EventContainer` type.

4. **Full Lineage** — Every sound is explained by a traceable graph from source events through card transformations to final audio output.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BOARD SYSTEM                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Tracker │ │Notation │ │ Session │ │ Sampler │ │Composer │   │
│  │  Board  │ │  Board  │ │  Board  │ │  Board  │ │  Board  │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼──────────┼──────────┼──────────┼──────────┼─────────────┘
        │          │          │          │          │
        └──────────┴──────────┴──────────┴──────────┘
                              │
                    ┌─────────▼─────────┐
                    │    CARD STACKS    │
                    │ (Typed Morphisms) │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   EVENT STREAMS   │
                    │ Stream<Event<P>>  │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   AUDIO ENGINE    │
                    │  WebAudio + WASM  │
                    └───────────────────┘
```

### Type System

CardPlay uses **parametric polymorphism** as its unifying principle:

```typescript
// Core event type - the atomic unit of all musical data
type Event<P> = {
  id: EventId;
  kind: EventKind;
  start: Tick;           // Integer ticks at global PPQ
  duration: TickDuration;
  payload: P;            // Strongly typed payload
  lanes?: Lane<any>[];   // Attached modulation
};

// Cards are typed functions on event streams
type Card<I, O> = {
  signature: { input: PortType<I>; output: PortType<O> };
  process: (input: Stream<Event<I>>) => Stream<Event<O>>;
};

// Stacks compose cards with automatic adapter insertion
type Stack = Card<any, any>[];
```

---

## 🎛️ Features

### Implemented

- **Event System** — Full `Event<P>` model with kinds, payloads, and lanes
- **Container System** — Patterns, clips, scenes, scores, takes
- **Card Model** — Typed cards with signatures, parameters, and state
- **Stack Composition** — Serial/parallel stacks with type inference
- **Tracker View** — Row/column editing with microtiming
- **Piano Roll** — Visual note editing
- **Notation Rendering** — VexFlow-powered professional scores
- **Audio Engine** — WebAudio-based playback with voice allocation
- **State Management** — Centralized store with undo/redo
- **AI Integration** — Board-centric Prolog-based reasoning system

### In Progress

- **Board System** — Configurable workspaces for different personas
- **Card Packs** — User-installable card extensions with sandboxing
- **Advanced Notation** — Multi-voice, multi-staff, ornaments
- **Session View** — Clip launching and scene triggering
- **Arrangement View** — Timeline-based composition

### Planned

- **Prolog AI Engine** — Rule-based compositional assistance
- **WASM DSP** — High-performance Rust audio processing
- **Carnatic Support** — Raga, tala, gamaka, konnakol
- **Phrase Grammar** — RapidComposer-style harmonic tooling
- **Spectral Analysis** — Timbre-first sound design

---

## 📁 Project Structure

```
cardplay/
├── src/
│   ├── events/       # Event types and normalization
│   ├── containers/   # Pattern, clip, scene, score types
│   ├── cards/        # Card definitions and registry
│   ├── streams/      # Event stream operations
│   ├── state/        # Central store and actions
│   ├── audio/        # WebAudio engine, scheduler, voices
│   ├── tracker/      # Tracker view and input handling
│   ├── notation/     # VexFlow notation rendering
│   ├── ui/           # UI components and panels
│   ├── ai/           # Board queries and AI integration
│   ├── user-cards/   # CardScript and pack system
│   └── types/        # Shared type definitions
├── docs/
│   ├── boardcentric/ # Board system architecture
│   ├── ai/           # AI and query documentation
│   └── ...           # Reference documentation
└── assets/           # Fonts and static resources
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Type check
npm run typecheck

# Build for production
npm run build
```

---

## 📊 Development Status

CardPlay is in active development. The roadmap is organized into phases:

| Phase | Name | Status |
|-------|------|--------|
| A | Baseline & Repo Health | 🔄 In Progress |
| B | Board System Core | 🔄 In Progress |
| C | Board Switching UI | ⏳ Planned |
| D | Card Availability & Gating | ⏳ Planned |
| E | Deck/Stack/Panel Unification | ⏳ Planned |
| F | Manual Boards | ⏳ Planned |
| G | Assisted Boards | ⏳ Planned |
| H | Generative Boards | ⏳ Planned |
| I | Hybrid Boards | ⏳ Planned |
| J | Routing, Theming, Shortcuts | ⏳ Planned |
| K | QA, Performance, Docs | ⏳ Planned |
| L | Prolog AI Foundation | ⏳ Planned |
| M | Persona-Specific Enhancements | ⏳ Planned |
| N | Advanced AI Features | ⏳ Planned |
| O | Community & Ecosystem | ⏳ Planned |
| P | Polish & Launch | ⏳ Planned |

See [currentsteps.md](currentsteps.md) for detailed task tracking (~2,800 steps).

---

## 🎯 Design Philosophy

### "As Much or As Little AI as You Want"

The AI system is **Prolog-based** (rule-based reasoning, not neural networks):
- Declarative logic over music theory and compositional patterns
- Users choose their level of AI assistance:
  - **Manual Boards**: Pure human control (notation, tracker)
  - **Assisted Boards**: Hints and suggestions (harmony helper, scale suggestions)
  - **Generative Boards**: AI-driven composition (arranger, ambient generator)
  - **Hybrid Boards**: Full power-user control with AI augmentation

### Cards as First-Class Citizens

Every musical operation is a **Card**:
- Cards have typed input/output signatures
- Cards compose into **Stacks** (serial) and **Graphs** (parallel)
- Type mismatches are resolved by automatic **Adapter** insertion
- Users can create custom cards via **CardScript** (a safe DSL)

### Events as Universal Currency

Every musical concept maps to `Event<P>`:
- Notes → `Event<NotePayload>`
- Automation → `Event<AutomationPayload>`
- Markers → `Event<MarkerPayload>`
- MIDI → `Event<MidiPayload>`
- Custom → `Event<YourPayload>`

---

## 🤝 Contributing

CardPlay welcomes contributions! Areas of interest:

- **Views**: New visualization modes (spectral, graph, etc.)
- **Cards**: Domain-specific transformations
- **Audio**: DSP and synthesis
- **Documentation**: Examples and tutorials

---

## 📜 License

MIT

---

## 🙏 Acknowledgments

CardPlay draws inspiration from:
- **Ableton Live** — Session/arrangement duality
- **Renoise** — Tracker precision and efficiency
- **VexFlow** — Music notation rendering
- **RapidComposer** — Phrase-based composition
- **Carnatic Music Theory** — Raga, tala, and ornamentation systems

---

<p align="center">
  <em>Making music creation as flexible as the music itself.</em>
</p>
