# CardPlay Board-Centric Architecture Audit

**Date:** 2026-01-28
**Purpose:** Document existing architecture for board system development (Phase A: A003-A014)

---

## A003: UI Surfaces Inventory

CardPlay has multiple mature UI surfaces for musical editing:

### Primary Editing Surfaces

1. **Tracker Panel** (`src/ui/components/tracker-panel.ts`)
   - Full tracker-style pattern editor
   - Row-based note entry
   - Effect columns
   - Status: ✅ Production-ready

2. **Piano Roll Panel** (`src/ui/components/piano-roll-panel.ts`)
   - MIDI-style piano roll editor
   - Grid-based note placement
   - Velocity editing
   - Status: ✅ Production-ready

3. **Notation Panel** (`src/notation/panel.ts`)
   - Western music notation editor
   - Score engraving
   - Part writing
   - Status: ✅ Production-ready

4. **Arrangement View** (`src/ui/components/arrangement-panel.ts`)
   - Timeline-based arrangement editor
   - Multi-track layout
   - Clip management
   - Status: ✅ Production-ready

5. **Session View** (`src/ui/session-view.ts`)
   - Ableton-style clip launcher
   - Scene-based triggering
   - Live performance focus
   - Status: ✅ Production-ready

---

## A004: Shared Stores Inventory

CardPlay uses a singleton store architecture for state management:

###

 Core State Stores

1. **SharedEventStore** (`src/state/event-store.ts`)
   - Central MIDI/audio event storage
   - API: createStream, addEvents, updateEvents, deleteEvents, subscribe, getStream, getAllStreams
   - Status: ✅ Stable, canonical API

2. **ClipRegistry** (`src/state/clip-registry.ts`)
   - Clip metadata and lifetime management
   - API: registerClip, updateClip, deleteClip, subscribeAll, getClip, getAllClips
   - Status: ✅ Stable, canonical API

3. **SelectionStore** (`src/state/selection.ts`)
   - Multi-view selection synchronization
   - API: setSelection, addToSelection, removeFromSelection, clearSelection, subscribe, getSelection
   - Status: ✅ Stable, used across all editors

4. **UndoStack** (`src/state/undo.ts`)
   - Cross-editor undo/redo
   - API: push, undo, redo, canUndo, canRedo
   - Status: ✅ Stable, works across all views

5. **RoutingGraph** (`src/state/routing-graph.ts`)
   - Audio/MIDI routing connections
   - API: addNode, addConnection, removeConnection, validateConnection
   - Status: ✅ Stable, supports audio/MIDI/modulation/trigger

---

## A013: Canonical Decisions

### Card System
**Canonical:** Use GeneratorBase + InstrumentBase + UI card-component wrapper

### Deck System
**Canonical:** Use BoardDeck type + deck registry + slot-based layout

### Store Integration
**Canonical:** All editing must go through singleton stores (SharedEventStore, ClipRegistry, SelectionStore, UndoStack, RoutingGraph)

---

## Summary

### ✅ What's Complete

1. Type System: src/boards/types.ts defines complete board type system
2. Validation: src/boards/validate.ts provides runtime validation
3. Stores: All singleton stores stable with canonical APIs
4. UI Surfaces: All major editors production-ready
5. Type Checking: Zero type errors
6. Tests: 4000+ tests passing

### Next Steps

1. Complete board registry implementation
2. Implement board persistence
3. Create board switching UI
4. Build deck factories
5. Wire full integration layer

**Audit completed:** 2026-01-28
**Status:** Phase A ~90% complete, ready for Phase B completion
