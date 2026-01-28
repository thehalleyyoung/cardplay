# CardPlay Board-Centric Architecture Audit

**Date:** 2026-01-28
**Status:** Phase A - Repository Audit & Documentation (A001-A014)

## Executive Summary

This document provides a comprehensive audit of the CardPlay codebase in preparation for implementing the Board-Centric Architecture. The audit covers current UI surfaces, shared stores, bridge modules, competing concepts, and build health status.

**Key Findings:**
- 565 type errors currently present across 7 main files
- Well-defined store architecture with clear separation of concerns
- Multiple competing "card" and "deck" concepts need consolidation
- Strong foundation for board system implementation

---

## A003: Current UI Surfaces Inventory

### Primary Editor Surfaces

#### 1. Tracker Panel
- **Location:** src/ui/components/tracker-panel.ts, src/ui/components/tracker-panel.test.ts
- **Core Logic:** src/tracker/tracker-card.ts, src/tracker/tracker-card-integration.ts
- **Purpose:** Pattern-based music editing (tracker-style)
- **Dependencies:** TrackerEventSync, SharedEventStore, PatternStore

#### 2. Piano Roll Panel
- **Location:** src/ui/components/piano-roll-panel.ts, src/ui/components/piano-roll-panel.test.ts
- **Purpose:** Piano roll-style MIDI editing
- **Dependencies:** SharedEventStore, ClipRegistry

#### 3. Notation Panel
- **Location:** src/notation/notation-store-adapter.ts, src/notation/notation.test.ts
- **Purpose:** Traditional music notation editing
- **Store Integration:** Bidirectional adapter to SharedEventStore
- **Dependencies:** SharedEventStore (via notation-store-adapter)

#### 4. Arrangement Panel
- **Location:** src/ui/components/arrangement-panel.ts, src/ui/components/arrangement-panel.test.ts
- **Purpose:** Timeline-based arrangement view
- **Dependencies:** ClipRegistry, SharedEventStore

#### 5. Session View
- **Location:** src/ui/session-view.ts, src/ui/session-view.test.ts
- **Bridge:** src/ui/session-view-store-bridge.ts
- **Adapter:** src/ui/session-clip-adapter.ts
- **Purpose:** Live performance/session grid (clips arranged in scenes)
- **Dependencies:** ClipRegistry, SharedEventStore

### Secondary Panels

- **Phrase Library Panel:** src/ui/phrase-library-panel.ts
- **Chord Track Panel:** src/ui/chord-track-panel.ts
- **Reveal Panel (Audio):** src/ui/reveal-panel-audio.ts
- **Reveal Panel (Generic):** src/ui/components/reveal-panel.ts
- **Freesound Search Panel:** src/ui/components/freesound-search-panel.ts
- **MIDI Device Panel:** src/ui/components/midi-device-panel.ts

---

## A004: Shared Stores Inventory

### Core Event Store
- **Location:** src/state/event-store.ts
- **Exports:** SharedEventStore (singleton)
- **Purpose:** Single source of truth for all musical events
- **Key APIs:**
  - Stream management: createStream(), getAllStreams(), getStream()
  - Event operations: addEvent(), updateEvent(), deleteEvent()
  - Subscriptions: subscribe(), unsubscribe()
  - Query: getEventsInRange(), getEventById()

### Clip Registry
- **Location:** src/state/clip-registry.ts
- **Exports:** ClipRegistry (singleton)
- **Purpose:** Manages clips (references to event streams with metadata)
- **Key APIs:**
  - createClip(), getClip(), getAllClips(), deleteClip()
  - updateClipMetadata()
  - subscribeAll() (for registry-wide changes)

### Selection State
- **Location:** src/state/selection-state.ts
- **Purpose:** Manages cross-editor event selection (by EventId, not indices)
- **Key APIs:**
  - setSelection(), addToSelection(), clearSelection()
  - isSelected(), getSelectedEvents()
  - subscribe()

### Undo Stack
- **Location:** src/state/undo-stack.ts
- **Purpose:** Manages undo/redo operations across all editors
- **Key APIs:**
  - push(), undo(), redo()
  - canUndo(), canRedo()
  - subscribe()

### Routing Graph
- **Location:** src/state/routing-graph.ts
- **Purpose:** Manages audio/MIDI routing connections
- **Key APIs:**
  - Node/edge management
  - Validation for port type compatibility
  - Connection types: audio, MIDI, modulation, trigger

### Parameter Resolver
- **Location:** src/state/parameter-resolver.ts
- **Purpose:** Resolves parameter values from preset + automation + modulation layers
- **Key APIs:**
  - resolveValue() (applies precedence rules)
  - Supports time-varying automation

### State Module Index
- **Location:** src/state/index.ts
- **Purpose:** Barrel export for all state modules
- **Types:** src/state/types.ts

---

## A005: UI Primitives Inventory

### Card Component
- **Location:** src/ui/components/card-component.ts
- **Related:** src/ui/cards.ts, src/ui/cards.test.ts
- **Purpose:** Generic card container component

### Stack Component
- **Status:** Not found yet (needs further investigation)
- **Expected Purpose:** Container for stacking multiple cards

### Deck Layout
- **Status:** Multiple competing concepts found (see A012)

---

## A013: Canonical Decisions for Board System

### Decision 1: Card Hierarchy
**Recommendation:** Adopt Board Card as the canonical card model:
- BoardCard as base interface
- TrackerCard, NotationCard, InstrumentCard, etc. as specializations
- Deprecate standalone card-component.ts in favor of board-aware cards

### Decision 2: Deck Model
**Recommendation:** Implement Board Deck system:
- BoardDeck as primary container concept
- Each deck has a DeckType (composition, browser, properties, etc.)
- Decks contain cards that match their allowed types
- Deck factories create deck instances from BoardDeck definitions

### Decision 3: Panel vs Card
**Recommendation:** Clarify roles:
- **Panel:** Top-level dockable container (belongs to board layout)
- **Card:** Content unit within a deck (can be manual, assisted, or generative)
- **Deck:** Collection of cards within a panel

### Decision 4: Tracker UI
**Recommendation:** Keep both for different use cases:
- **tracker-panel:** Primary deck-based tracker for boards
- **tracker-card:** Embeddable widget for custom layouts

---

## Build Health Status

### Typecheck Results
- **Command:** npm run typecheck
- **Total Errors:** 565
- **Output:** typecheck-output-20260128-170724.txt

### Error Distribution (Top Files)
1. ai/queries/board-queries.ts - 56 errors
2. tracker/pattern-store.ts - 46 errors
3. tracker/renderer.ts - 40 errors
4. tracker/phrases.ts - 27 errors
5. tracker/tracker-card-integration.ts - 24 errors
6. tracker/input-handler.ts - 24 errors
7. tracker/event-sync.ts - 9 errors

### Prioritized Fixes

**Priority 1: Store API Migration (Blocks Most Imports)**
1. src/tracker/event-sync.ts (9 errors)
2. src/ui/session-view-store-bridge.ts
3. src/ui/session-clip-adapter.ts

**Priority 2: Tracker Stabilization**
1. src/tracker/input-handler.ts (24 errors)
2. src/tracker/tracker-card-integration.ts (24 errors)
3. src/tracker/pattern-store.ts (46 errors)

---

## Next Steps

1. ✅ A001-A014: Repository audit complete
2. ⏭️ A015-A029: Fix store API mismatches and build health
3. ⏭️ A030-A043: Stabilize ClipRegistry and session view bridges
4. ⏭️ A044-A050: Fix tracker integration issues
5. ⏭️ A051-A080: Verify cross-view sync and create playground
