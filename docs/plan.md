# Cardplay Build Plan (Multi-pass)

Assumes canonical model and terminology in `cardplay2.md` (repo root).

This plan implements the system described in `cardplay2.md` using browser-only Vite + TypeScript + Rust/WASM.
It is intentionally multi-pass: each pass is usable, testable, and extensible.

---

## Pass 0: Project skeleton and toolchain

Goals:
- Working Vite + TypeScript app.
- Rust/WASM build pipeline integrated.
- Project structure and docs in place.

Deliverables:
- Vite app scaffolded.
- `wasm-core` crate with wasm-bindgen entry points.
- npm scripts: `wasm:build`, `dev`, `build`.
- Basic UI page loads and shows WASM output.

Exit criteria:
- `npm install` + `npm run wasm:build` + `npm run dev` shows WASM results.

---

## Pass 1: Core type system and data model

Goals:
- Implement the Event and Container model with strict invariants.
- Establish registry for event kinds, port types, protocols.
- Build minimal serialization for events and containers.

Deliverables:
- `src/types/event.ts`: Event types, normalization, invariants.
- `src/types/event-kind.ts`: registerEventKind, EventKind registry.
- `src/state/event-schema-registry.ts`: Event payload schemas and validation.
- `src/cards/card.ts`: registerPortType, port type registry.
- `src/canon/serialization.ts`: JSON serialization for canonical types.
- Unit tests for event CRUD and invariants.

Exit criteria:
- Events can be created/updated/deleted deterministically.
- Containers can be round-tripped to JSON.

---

## Pass 2: Card model and stack/graph typing

Goals:
- CardDefinition and CardInstance with signatures.
- Stack composition with type inference and adapter insertion.
- Basic graph representation with explicit wiring.

Deliverables:
- `src/core/card.ts`: CardDefinition, signatures, params/state.
- `src/core/stack.ts`: Stack types, inference, adapters.
- `src/registry/adapters.ts`: adapter registry and cost model.
- `src/core/graph.ts`: Node/edge graph model.
- Stack inspector data model (no UI yet).

Exit criteria:
- Serial and parallel stacks infer signatures.
- Adapter suggestions produced on mismatch.

---

## Pass 3: State system and event editors

Goals:
- Central store for deck state, containers, stacks, and UI selections.
- Shared EventEditor APIs for all views.

Deliverables:
- `src/state/store.ts`: store, actions, subscriptions.
- `src/state/actions.ts`: createEvent/updateEvent/deleteEvent.
- `src/state/selectors.ts`: derived selectors for UI.
- `src/core/editor.ts`: shared event editing logic.

Exit criteria:
- Changing an event updates store deterministically.

---

## Pass 4: Audio engine skeleton (WebAudio + WASM hooks)

Goals:
- Transport, scheduler, and basic voice allocation.
- WebAudio graph with simple oscillator/sampler nodes.
- Hook for WASM DSP functions.

Deliverables:
- `src/audio/transport.ts`: clock, tempo, time signature.
- `src/audio/scheduler.ts`: event windowing.
- `src/audio/engine.ts`: audio graph and render loop.
- `src/audio/voices.ts`: basic polyphony.
- `src/audio/wasm.ts`: WASM bridge and shared buffers.

Exit criteria:
- Basic note events produce audible sound.
- Tempo changes affect playback timing.

---

## Pass 5: UI foundation (deck, cards, registry)

Goals:
- Card library panel and deck surface.
- Basic card shell with params and ports.
- Stack grouping UI (visual only).

Deliverables:
- `src/ui/deck/Deck.ts` and `Deck.css`.
- `src/ui/card/Card.ts` for card shell.
- `src/ui/card/PortBadge.ts`.
- `src/ui/library/LibraryPanel.ts`.

Exit criteria:
- Cards can be added to the deck.
- Stack groups render with type signature badges.

---

## Pass 6: Sequencing views (tracker, piano roll, session)

Goals:
- Minimal tracker, piano roll, session views reading Containers.
- Shared event editing across views.

Deliverables:
- `src/ui/views/TrackerView.ts`.
- `src/ui/views/PianoRollView.ts`.
- `src/ui/views/SessionView.ts`.
- `src/ui/views/EventLanes.ts`.

Exit criteria:
- Editing in tracker is visible in piano roll.
- Session launches clips by emitting events.

---

## Pass 7: Notation and phrase tools

Goals:
- Notation view shell with event projection.
- Phrase/grammar generator scaffolding.

Deliverables:
- `src/ui/views/NotationView.ts`.
- `src/dsl/phrase.ts`: phrase definitions.
- `src/cards/phrase/phrase-card.ts`.

Exit criteria:
- Notation view displays note events.
- Phrase card generates an EventStream.

---

## Pass 8: Automation and modulation

Goals:
- Automation targets and lanes.
- Basic modulation sources.

Deliverables:
- `src/automation/registry.ts`.
- `src/automation/lanes.ts`.
- `src/automation/sources.ts`.

Exit criteria:
- Automation lane edits affect card params.

---

## Pass 9: CardScript sandbox and capability system

Goals:
- Implement CardScript parser/typechecker.
- Sandbox runtime (interpreter or WASM).
- Capability tokens and effect system.

Deliverables:
- `src/sandbox/cardscript/lexer.ts`.
- `src/sandbox/cardscript/parser.ts`.
- `src/sandbox/cardscript/types.ts`.
- `src/sandbox/runtime.ts`.
- `src/sandbox/capabilities.ts`.

Exit criteria:
- Simple CardScript cards can be loaded and run.
- Unauthorized effects are blocked.

---

## Pass 10: Card packs and library insertion

Goals:
- Install packs via UI and register cards locally.
- Capability prompt + approval workflow.

Deliverables:
- `src/sandbox/pack-loader.ts`.
- `src/ui/library/PackInstaller.ts`.
- `src/state/packs.ts`.

Exit criteria:
- A local pack appears in the card library.

---

## Pass 11: DSL import/export

Goals:
- Serialize deck + containers + events to DSL.
- Parse DSL back into project state.

Deliverables:
- `src/dsl/serializer.ts`.
- `src/dsl/parser.ts`.
- `src/dsl/schema.ts`.

Exit criteria:
- DSL roundtrip recreates the deck.

---

## Pass 12: Performance and polish

Goals:
- Optimize render loop and UI performance.
- Add stack inspector, adapter suggestions, and tutorial overlay.

Deliverables:
- `src/ui/inspector/StackInspector.ts`.
- `src/ui/tutorial/StackingTutorial.ts`.
- `src/engine/perf.ts`.

Exit criteria:
- Stable performance with multiple cards and events.

---

## Pass 13+: Expansion modules

Optional modules after core:
- Timbre analysis and spectral editing.
- Carnatic raga/tala editor.
- Audio analysis-driven modulation.
- Collaboration and cloud sync.
