# CardPlay Implementation Roadmap (Board-Centric Architecture)

## Overview

This roadmap integrates the **Board-Centric UI Architecture** from `cardplay/cardplayui.md` with the vision of a configurable board system for any type of user—from notation composers to graphic composers to tracker users to sound designers—with "as much or as little AI as you want."

The AI system will be **Prolog-based** (rule-based reasoning, not neural networks) using declarative logic over deck layouts, music theory, and compositional patterns. Reference implementation: https://github.com/kkty/prolog

### Roadmap Structure

The roadmap is organized into **logical phases** that build upon each other:

1. **Phase A: Baseline & Repo Health** (A001–A100) - Fix type errors, stabilize APIs, establish baseline
2. **Phase B: Board System Core** (B001–B150) - Core board types, registry, persistence, validation
3. **Phase C: Board Switching UI & Persistence** (C001–C100) - Board switcher, browser, first-run flow
4. **Phase D: Card Availability & Tool Gating** (D001–D080) - Runtime gating logic, tool visibility
5. **Phase E: Deck/Stack/Panel Unification** (E001–E090) - Deck instances, factories, drag/drop
6. **Phase F: Manual Boards** (F001–F120) - Pure manual boards (notation, tracker, sampler, session)
7. **Phase G: Assisted Boards** (G001–G120) - Manual + hints/phrases (tracker+harmony, etc.)
8. **Phase H: Generative Boards** (H001–H075) - AI-driven boards (arranger, composer, ambient)
9. **Phase I: Hybrid Boards** (I001–I075) - Power user boards (composer, producer, live performance)
10. **Phase J: Routing, Theming, Shortcuts** (J001–J060) - Visual polish, routing overlay, shortcuts
11. **Phase K: QA, Performance, Docs, Release** (K001–K030) - Final QA, benchmarks, release prep
12. **Phase L: Prolog AI Foundation** (L001–L400) - Prolog engine, knowledge bases, query system
13. **Phase M: Persona-Specific Enhancements** (M001–M400) - Deep persona workflows
14. **Phase N: Advanced AI Features** (N001–N400) - Learning, adaptation, advanced inference
15. **Phase O: Community & Ecosystem** (O001–O400) - Templates, marketplace, collaboration
16. **Phase P: Polish & Launch** (P001–P200) - Final polish, documentation, launch prep

**Total Steps: ~2,800** (expandable as needed)

---

## Phase A: Baseline & Repo Health (A001–A100)

**Goal:** Stabilize the codebase, fix type errors, document current architecture, and establish a clean baseline for board system development.

### Repository Audit & Documentation (A001–A014)

- [ ] A001 Re-read `cardplay/cardplayui.md` and extract required Board/Deck primitives.
- [ ] A002 Re-read `cardplay/currentsteps.md` and note overlaps with Board work.
- [ ] A003 Inventory current UI surfaces (tracker, piano roll, notation, arrangement, session).
- [ ] A004 Inventory shared stores (`event-store`, `clip-registry`, `selection`, `undo`, `routing`).
- [ ] A005 Inventory UI primitives (`card-component`, `stack-component`, `deck-layout`).
- [ ] A006 Inventory "bridge" modules (`layout-bridge`, `design-system-bridge`, onboarding bridges).
- [ ] A007 Document how tracker editing reaches stores (adapters + `TrackerEventSync`).
- [ ] A008 Document how piano roll editing reaches stores (store adapter path).
- [ ] A009 Document how notation editing reaches stores (`notation-store-adapter` path).
- [ ] A010 Document how arrangement reads clips/streams (ClipRegistry + timeline ops).
- [ ] A011 List competing "card" concepts (`src/cards/*` vs `src/audio/instrument-cards.ts`).
- [ ] A012 List competing "deck" concepts (`deck-layout`, `deck-layouts`, `deck-reveal`).
- [ ] A013 Write a short "canonical decisions" note (which card/deck concepts boards will use).
- [ ] A014 Create `cardplay/docs/boardcentric/audit.md` to store A003–A013 findings.

### Build Health & Type Safety (A015–A029)

- [x] A015 Run `cd cardplay && npm run typecheck` and capture output to a file (`cardplay/typecheck-output-20260128-180002.txt`).
- [x] A016 Run `cd cardplay && npm test` and capture output to a file (`cardplay/test-output-20260128-180224.txt`).
- [x] A017 Run `cd cardplay && npm run build` and capture output to a file (`cardplay/build-output-20260128-180002.txt`).
- [ ] A018 Categorize typecheck failures by file and dependency fan-out.
- [ ] A019 Prioritize fixes: pick the 5 files blocking the most imports.
- [ ] A020 Open `src/state/event-store.ts` and confirm the canonical store API surface.
- [ ] A021 In `src/audio/audio-engine-store-bridge.ts`, replace `subscribeToStream` with `subscribe`.
- [ ] A022 In `src/audio/audio-engine-store-bridge.ts`, replace `unsubscribeFromStream` with `unsubscribe`.
- [ ] A023 In `src/audio/audio-engine-store-bridge.ts`, replace `listStreamIds` with `getAllStreams()` mapping.
- [ ] A024 In `src/audio/audio-engine-store-bridge.ts`, replace `event.tick` reads with `event.start`.
- [ ] A025 In `src/audio/audio-engine-store-bridge.ts`, use `TransportSnapshot` where `tempo/currentTick/isPlaying` are needed.
- [ ] A026 Normalize transport usage: treat `TransportState` as the string union only (`snapshot.state`).
- [ ] A027 Add guards for possibly-undefined events in `audio-engine-store-bridge.ts`.
- [ ] A028 Fix `TrackHeader` construction under `exactOptionalPropertyTypes` in `audio-engine-store-bridge.ts`.
- [ ] A029 Re-run typecheck and confirm `audio-engine-store-bridge.ts` is clean.

### Store API Stabilization (A030–A043)

- [ ] A030 Open `src/state/clip-registry.ts` and confirm canonical subscription API names.
- [ ] A031 In `src/ui/session-view-store-bridge.ts`, replace `registry.subscribe(...)` with `subscribeAll(...)`.
- [ ] A032 In `src/ui/session-view-store-bridge.ts`, ensure `createStream` calls pass `{ name, events? }` objects.
- [ ] A033 In `src/ui/session-view-store-bridge.ts`, introduce `makeSessionSlotKey(track, scene)` helper and use everywhere.
- [ ] A034 In `src/ui/session-view-store-bridge.ts`, introduce `makeSessionSlotStreamId(track, scene)` helper and use everywhere.
- [ ] A035 In `src/ui/session-view-store-bridge.ts`, stop assigning `EventStreamRecord` objects to `EventStreamId` variables.
- [ ] A036 In `src/ui/session-view-store-bridge.ts`, stop assigning `ClipRecord` objects to `ClipId` variables.
- [ ] A037 In `src/ui/session-view-store-bridge.ts`, map `ClipRecord.duration` → slot length display value.
- [ ] A038 In `src/ui/session-view-store-bridge.ts`, map `ClipRecord.loop` → slot loop display value.
- [ ] A039 In `src/ui/session-view-store-bridge.ts`, fix `undefined` vs `null` mismatches (prefer `null` where typed).
- [ ] A040 In `src/ui/session-view-store-bridge.ts`, remove unused imports flagged by TS.
- [ ] A041 Re-run typecheck and confirm `session-view-store-bridge.ts` is clean.
- [ ] A042 In `src/ui/session-clip-adapter.ts`, fix `TrackHeader` creation to always include required fields.
- [ ] A043 Re-run typecheck and confirm `session-clip-adapter.ts` is clean.

### Tracker Integration Fixes (A044–A050)

- [ ] A044 Open `src/tracker/tracker-card-integration.ts` and reconcile `TrackerInputHandler.handleKeyDown` signature.
- [ ] A045 Update tracker card integration to call `handleKeyDown(e.key, trackerState, streamId, patternLength)`.
- [ ] A046 Ensure tracker card integration binds to a real `EventStreamId` (not private pattern copies).
- [ ] A047 Call `TrackerEventSync.bindStream(streamId, patternLength)` on mount and unbind on destroy.
- [ ] A048 Re-run typecheck and confirm tracker integration compiles.
- [ ] A049 Decide canonical tracker UI for boards: panel (`tracker-panel`) vs card (`tracker-card`), and document it.
- [ ] A050 If keeping both, define roles: deck uses panel; embeddable widgets use card.

### Cross-View Sync Verification (A051–A060)

- [ ] A051 Verify `tracker-panel` edits are routed through `SharedEventStore` (no local event truth).
- [ ] A052 Verify `piano-roll-panel` edits are routed through `SharedEventStore`.
- [ ] A053 Verify `notation-store-adapter` is bidirectional (store → notation and notation → store).
- [ ] A054 Verify `SelectionStore` is used across tracker/piano roll/notation (event IDs, not indices).
- [ ] A055 Add an integration test: edit a note in tracker, observe update in piano roll.
- [ ] A056 Add an integration test: edit a note in piano roll, observe update in notation.
- [ ] A057 Add an integration test: selection in notation highlights in tracker (same event IDs).
- [ ] A058 Create `cardplay/examples/board-playground/` for browser-based manual testing.
- [ ] A059 Add `cardplay/examples/board-playground/index.html` with a root element and CSS baseline.
- [ ] A060 Add `cardplay/examples/board-playground/main.ts` mounting tracker + piano roll + notation against one stream.

### Playground Setup & Smoke Tests (A061–A080)

- [ ] A061 In playground, use Vite dev server for fast iteration and HMR.
- [ ] A062 In playground, import `SharedEventStore` singleton and seed one test stream.
- [ ] A063 In playground, import `ClipRegistry` singleton and seed one test clip.
- [ ] A064 In playground, mount tracker panel to `#tracker` div.
- [ ] A065 In playground, mount piano roll panel to `#pianoroll` div.
- [ ] A066 In playground, mount notation panel to `#notation` div.
- [ ] A067 In playground, bind all three panels to the same `activeStreamId`.
- [ ] A068 In playground, add a manual "Add Note" button that writes an event to the store.
- [ ] A069 In playground, verify the note appears in all three views immediately.
- [ ] A070 In playground, add a manual "Select Event" button that writes to `SelectionStore`.
- [ ] A071 In playground, verify selection highlights in all three views.
- [ ] A072 In playground, add a manual "Undo" button that calls `UndoStack.undo()`.
- [ ] A073 In playground, verify undo works across all three views.
- [ ] A074 In playground, add a manual "Play" button that starts transport playback.
- [ ] A075 In playground, verify playhead updates in all three views during playback.
- [ ] A076 Run playground and confirm no console errors on mount.
- [ ] A077 Run playground and confirm no console errors on edit operations.
- [ ] A078 Run playground and confirm no memory leaks after 50+ edits.
- [ ] A079 Document playground setup in `cardplay/examples/board-playground/README.md`.
- [ ] A080 Add playground to `npm run dev:playground` script for easy access.

### Routing Graph & Parameter Resolution Verification (A081–A090)

- [ ] A081 Open `src/state/routing-graph.ts` and confirm API surface (nodes, edges, validation).
- [ ] A082 Verify routing graph supports audio/midi/modulation/trigger connection types.
- [ ] A083 Verify routing graph validation rejects incompatible port type connections.
- [ ] A084 Add an integration test: create a routing connection and verify it persists.
- [ ] A085 Add an integration test: delete a routing connection and verify cleanup.
- [ ] A086 Open `src/state/parameter-resolver.ts` and confirm API surface.
- [ ] A087 Verify parameter resolver supports preset + automation + modulation layers.
- [ ] A088 Verify parameter resolver computes final values correctly with precedence.
- [ ] A089 Add an integration test: set automation and verify resolved value changes over time.
- [ ] A090 Add an integration test: modulation source affects target parameter correctly.

### Final Baseline Verification (A091–A100)

- [ ] A091 Re-run `npm run typecheck` and confirm zero type errors.
- [ ] A092 Re-run `npm test` and confirm all existing tests pass.
- [ ] A093 Re-run `npm run build` and confirm clean build with no warnings.
- [ ] A094 Re-run `npm run lint` and fix any style violations.
- [ ] A095 Create `cardplay/docs/boardcentric/baseline.md` documenting clean baseline state.
- [ ] A096 In baseline doc, list all stable API surfaces (stores, adapters, sync mechanisms).
- [ ] A097 In baseline doc, list all known limitations and technical debt.
- [ ] A098 In baseline doc, list all decisions deferred to later phases.
- [ ] A099 Commit baseline fixes with message: "chore: stabilize baseline for board system work".
- [ ] A100 Mark Phase A complete and proceed to Phase B (Board System Core).

---

## Phase B: Board System Core (B001–B150)

**Goal:** Implement the foundational Board system types, registry, persistence, validation, and switching logic. This phase creates the core infrastructure that all boards will build upon.

### Core Type Definitions (B001–B024)

- [ ] B001 Create `cardplay/src/boards/` and add `cardplay/src/boards/index.ts` barrel export.
- [ ] B002 Add `cardplay/src/boards/types.ts` and define `ControlLevel` union.
- [ ] B003 In `types.ts`, define `ViewType` union (`tracker|notation|session|arranger|composer|sampler`).
- [ ] B004 In `types.ts`, define `BoardDifficulty` union (`beginner|intermediate|advanced|expert`).
- [ ] B005 In `types.ts`, define `ToolKind` union (`phraseDatabase|harmonyExplorer|phraseGenerators|arrangerCard|aiComposer`).
- [ ] B006 In `types.ts`, define `ToolMode<K>` conditional type per `cardplayui.md`.
- [ ] B007 In `types.ts`, define `ToolConfig<K>` with `enabled` and `mode`.
- [ ] B008 In `types.ts`, define `CompositionToolConfig` record of tool configs.
- [ ] B009 In `types.ts`, define `UIBehavior<K,M>` type mapping mode → capabilities.
- [ ] B010 In `types.ts`, define `PanelRole` union (`browser|composition|properties|mixer|timeline|toolbar|transport`).
- [ ] B011 In `types.ts`, define `PanelPosition` union (`left|right|top|bottom|center`).
- [ ] B012 In `types.ts`, define `PanelDefinition` interface (id, role, position, optional defaults).
- [ ] B013 In `types.ts`, define `BoardLayout` interface (type, panels, orientation hints).
- [ ] B014 In `types.ts`, define `DeckType` union per Part VII deck types.
- [ ] B015 In `types.ts`, define `DeckCardLayout` union (`stack|tabs|split|floating`).
- [ ] B016 In `types.ts`, define `BoardDeck` interface (id, type, cardLayout, allowReordering, allowDragOut, optional controlLevel override).
- [ ] B017 In `types.ts`, define `BoardConnection` interface (source deck/port, target deck/port, connectionType).
- [ ] B018 In `types.ts`, define `BoardTheme` interface (colors, typography, control indicators).
- [ ] B019 In `types.ts`, define `BoardShortcutMap` type (string → action id/handler name).
- [ ] B020 In `types.ts`, define `Board` interface matching `cardplayui.md` §2.1 fields.
- [ ] B021 In `types.ts`, define `Board<L,C,V>` generic alias for typed environments.
- [ ] B022 In `types.ts`, add `CardKind` taxonomy (`manual|hint|assisted|collaborative|generative`).
- [ ] B023 In `types.ts`, define `CardFilter<L,C>` conditional type (type-level allowed card kinds).
- [ ] B024 Add runtime counterparts: `AllowedCardKinds` and `AllowedToolModes`.

### Board Validation (B025–B030)

- [ ] B025 Add `cardplay/src/boards/validate.ts` with `validateBoard(board)` runtime checks.
- [ ] B026 In `validate.ts`, validate board IDs are unique and non-empty.
- [ ] B027 In `validate.ts`, validate deck IDs are unique per board.
- [ ] B028 In `validate.ts`, validate each deck's `DeckType` is known.
- [ ] B029 In `validate.ts`, validate tool config modes are consistent with `enabled`.
- [ ] B030 In `validate.ts`, validate panel IDs are unique and positions are valid.

### Board Registry (B031–B042)

- [ ] B031 Create `cardplay/src/boards/registry.ts` implementing `BoardRegistry` class.
- [ ] B032 In `registry.ts`, implement `register(board)` and throw on duplicate id.
- [ ] B033 In `registry.ts`, run `validateBoard(board)` during registration.
- [ ] B034 In `registry.ts`, implement `get(boardId)` returning board or undefined.
- [ ] B035 In `registry.ts`, implement `list()` returning all boards sorted by category/name.
- [ ] B036 In `registry.ts`, implement `getByControlLevel(level)` filter.
- [ ] B037 In `registry.ts`, implement `search(text)` over name/description/tags.
- [ ] B038 In `registry.ts`, implement `getByDifficulty(difficulty)` filter.
- [ ] B039 In `registry.ts`, export `getBoardRegistry()` singleton.
- [ ] B040 Create `cardplay/src/boards/recommendations.ts` with `UserType` → board ids mapping.
- [ ] B041 In `recommendations.ts`, align mapping with `cardplayui.md` §10.1 recommendations.
- [ ] B042 In `recommendations.ts`, add `getRecommendedBoards(userType, registry)` helper.

### Board State Store (B043–B064)

- [ ] B043 Create `cardplay/src/boards/store/types.ts` defining persisted BoardState schema.
- [ ] B044 In `store/types.ts`, include `version`, `currentBoardId`, `recentBoardIds`, `favoriteBoardIds`.
- [ ] B045 In `store/types.ts`, include `perBoardLayout` and `perBoardDeckState` maps.
- [ ] B046 In `store/types.ts`, include `firstRunCompleted` and `lastOpenedAt`.
- [ ] B047 Create `cardplay/src/boards/store/storage.ts` with localStorage read/write helpers.
- [ ] B048 In `storage.ts`, implement `loadBoardState()` with safe JSON parsing.
- [ ] B049 In `storage.ts`, implement `saveBoardState(state)` debounced.
- [ ] B050 Create `cardplay/src/boards/store/migrations.ts` with `migrateBoardState(raw)` function.
- [ ] B051 In `migrations.ts`, define `BoardStateV1` and migrate missing fields with defaults.
- [ ] B052 Create `cardplay/src/boards/store/store.ts` implementing `BoardStateStore`.
- [ ] B053 In `store.ts`, implement `getState()` and `subscribe(listener)` pub/sub.
- [ ] B054 In `store.ts`, implement `setCurrentBoard(boardId)` updating `recentBoardIds`.
- [ ] B055 In `store.ts`, implement `addRecentBoard(boardId)` with max length (e.g., 10).
- [ ] B056 In `store.ts`, implement `toggleFavorite(boardId)` updating `favoriteBoardIds`.
- [ ] B057 In `store.ts`, implement `setFirstRunCompleted()` for onboarding.
- [ ] B058 In `store.ts`, implement `getLayoutState(boardId)` accessors.
- [ ] B059 In `store.ts`, implement `setLayoutState(boardId, layoutState)` with persistence.
- [ ] B060 In `store.ts`, implement `resetLayoutState(boardId)` (remove entry).
- [ ] B061 In `store.ts`, implement `getDeckState(boardId)` accessors.
- [ ] B062 In `store.ts`, implement `setDeckState(boardId, deckState)` with persistence.
- [ ] B063 In `store.ts`, implement `resetDeckState(boardId)` (remove entry).
- [ ] B064 In `store.ts`, export `getBoardStateStore()` singleton.

### Active Context Store (B065–B071)

- [ ] B065 Create `cardplay/src/boards/context/types.ts` defining `ActiveContext`.
- [ ] B066 In `context/types.ts`, include `activeStreamId`, `activeClipId`, `activeTrackId`, `activeDeckId`.
- [ ] B067 In `context/types.ts`, include `activeViewType` (tracker/notation/session/etc).
- [ ] B068 Create `cardplay/src/boards/context/store.ts` with `BoardContextStore` (active context state).
- [ ] B069 In `context/store.ts`, implement `setActiveStream(streamId)` and `setActiveClip(clipId)`.
- [ ] B070 In `context/store.ts`, implement `subscribe(listener)` and ensure cross-board persistence.
- [ ] B071 In `context/store.ts`, implement persistence key `cardplay.activeContext.v1`.

### Project Structure (B072–B077)

- [ ] B072 Create `cardplay/src/boards/project/types.ts` for `Project` minimal structure.
- [ ] B073 In `project/types.ts`, represent project as references to stream ids + clip ids (no duplication).
- [ ] B074 Create `cardplay/src/boards/project/create.ts` with `createNewProject()` seeding default stream/clip.
- [ ] B075 In `project/create.ts`, seed one stream in `SharedEventStore` with name "Main".
- [ ] B076 In `project/create.ts`, seed one clip in `ClipRegistry` referencing that stream.
- [ ] B077 In `project/create.ts`, set `ActiveContext.activeStreamId/activeClipId` to the seeded IDs.

### Board Switching Logic (B078–B089)

- [ ] B078 Create `cardplay/src/boards/switching/types.ts` defining `BoardSwitchOptions`.
- [ ] B079 In `switching/types.ts`, include `resetLayout`, `resetDecks`, `preserveActiveContext`, `preserveTransport`.
- [ ] B080 Create `cardplay/src/boards/switching/switch-board.ts` implementing `switchBoard(boardId, options)`.
- [ ] B081 In `switch-board.ts`, validate board exists in registry before switching.
- [ ] B082 In `switch-board.ts`, update `BoardStateStore.setCurrentBoard(boardId)` and persist.
- [ ] B083 In `switch-board.ts`, call board lifecycle hooks (onDeactivate, onActivate) if defined.
- [ ] B084 In `switch-board.ts`, preserve `ActiveContext` by default; only reset if requested.
- [ ] B085 Create `cardplay/src/boards/switching/migration-plan.ts` defining `BoardMigrationPlan`.
- [ ] B086 In `migration-plan.ts`, include deck-to-deck mapping rules by `DeckType`.
- [ ] B087 In `migration-plan.ts`, define default heuristic: keep matching `DeckType` decks open.
- [ ] B088 In `migration-plan.ts`, define fallback: if target lacks a deck type, close it.
- [ ] B089 In `migration-plan.ts`, define mapping for primary view (`ViewType`) when switching.

### Layout Runtime (B090–B098)

- [ ] B090 Create `cardplay/src/boards/layout/runtime-types.ts` representing persisted layout runtime.
- [ ] B091 In `runtime-types.ts`, represent dock tree nodes compatible with `ui/layout.ts` structures.
- [ ] B092 In `runtime-types.ts`, include panel sizes, collapsed states, and active tab IDs.
- [ ] B093 Create `cardplay/src/boards/layout/adapter.ts` mapping `Board.layout` → layout runtime.
- [ ] B094 In `layout/adapter.ts`, implement `createDefaultLayoutRuntime(board)` (stable initial layout).
- [ ] B095 In `layout/adapter.ts`, implement `mergePersistedLayout(board, persisted)` (apply safe overrides).
- [ ] B096 Create `cardplay/src/boards/layout/serialize.ts` to serialize runtime without functions/DOM refs.
- [ ] B097 Create `cardplay/src/boards/layout/deserialize.ts` to rebuild runtime with defaults.
- [ ] B098 Add `cardplay/src/boards/layout/guards.ts` to validate persisted layout shapes.

### Deck Runtime Types (B099–B106)

- [ ] B099 Create `cardplay/src/boards/decks/runtime-types.ts` for per-deck state persistence.
- [ ] B100 In `decks/runtime-types.ts`, include active tab, scroll positions, focused item, filters/search.
- [ ] B101 Create `cardplay/src/boards/decks/factory-types.ts` defining `DeckFactory` interface.
- [ ] B102 In `factory-types.ts`, define `create(deckDef, ctx)` returning a `DeckInstance`.
- [ ] B103 Create `cardplay/src/boards/decks/factory-registry.ts` storing factories keyed by `DeckType`.
- [ ] B104 In `factory-registry.ts`, implement `registerFactory(deckType, factory)` with duplicate guards.
- [ ] B105 In `factory-registry.ts`, implement `getFactory(deckType)` and `hasFactory(deckType)`.
- [ ] B106 In `factory-registry.ts`, add `validateBoardFactories(board)` to ensure all deck types are buildable.

### Builtin Board Stubs (B107–B116)

- [ ] B107 Create `cardplay/src/boards/builtins/ids.ts` listing builtin board ids (string literal union).
- [ ] B108 Create `cardplay/src/boards/builtins/register.ts` exporting `registerBuiltinBoards()`.
- [ ] B109 In `register.ts`, register builtin boards (initially stubs) to prove plumbing.
- [ ] B110 In `register.ts`, ensure each builtin board has at least one deck (primary view).
- [ ] B111 Add `cardplay/src/boards/builtins/stub-basic-tracker.ts` as the first stub board object.
- [ ] B112 Add `cardplay/src/boards/builtins/stub-tracker-phrases.ts` as the second stub board object.
- [ ] B113 Add `cardplay/src/boards/builtins/stub-notation.ts` as the third stub board object.
- [ ] B114 Add `cardplay/src/boards/builtins/stub-session.ts` as the fourth stub board object.
- [ ] B115 Ensure stub boards' tool configs match their control level (manual vs assisted).
- [ ] B116 Add `cardplay/src/boards/builtins/index.ts` exporting all builtins.

### Module Exports & Integration (B117–B130)

- [ ] B117 Update `cardplay/src/boards/index.ts` to export registry/store/context/switching/builtins.
- [ ] B118 Add `cardplay/src/boards/registry.test.ts` verifying register/get/list/search.
- [ ] B119 Add `cardplay/src/boards/validate.test.ts` verifying invalid boards are rejected.
- [ ] B120 Add `cardplay/src/boards/recommendations.test.ts` verifying userType mapping returns boards.
- [ ] B121 Add `cardplay/src/boards/store/store.test.ts` verifying persistence round-trips.
- [ ] B122 Add `cardplay/src/boards/store/migrations.test.ts` verifying older schemas migrate.
- [ ] B123 Add `cardplay/src/boards/context/store.test.ts` verifying active context persistence.
- [ ] B124 Add `cardplay/src/boards/switching/switch-board.test.ts` verifying recents/favorites behavior.
- [ ] B125 Add `cardplay/src/boards/layout/adapter.test.ts` verifying default layout runtime generation.
- [ ] B126 Add `cardplay/src/boards/layout/serialize.test.ts` verifying serialize/deserialize stability.
- [ ] B127 Add `cardplay/src/boards/decks/factory-registry.test.ts` verifying factory registration.
- [ ] B128 Decide whether boards are exported from `cardplay/src/index.ts` (public API decision).
- [ ] B129 If exporting, add `export * from './boards'` in `cardplay/src/index.ts`.
- [ ] B130 If not exporting yet, export boards only from `cardplay/src/ui/index.ts` for internal use.

### Documentation (B131–B138)

- [ ] B131 Add `cardplay/docs/boards/board-api.md` documenting the Board types and stores.
- [ ] B132 Add `cardplay/docs/boards/board-state.md` documenting persistence keys and schema.
- [ ] B133 Add `cardplay/docs/boards/layout-runtime.md` documenting panel/deck layout persistence model.
- [ ] B134 Add `cardplay/docs/boards/migration.md` documenting board switching migration heuristics.
- [ ] B135 Ensure `npm run typecheck` passes after adding `src/boards` modules.
- [ ] B136 Ensure `npm test` passes after adding board tests.
- [ ] B137 Run `npm run lint` and fix style issues in `src/boards`.
- [ ] B138 Update `cardplay/docs/index.md` to include links to the new board docs.

### Playground Integration (B139–B150)

- [ ] B139 Add a "Board MVP" doc section listing the two stub MVP boards.
- [ ] B140 Wire stub board registry initialization in the playground (registry has content).
- [ ] B141 In playground, display current board id/name from `BoardStateStore`.
- [ ] B142 In playground, add a temporary UI to switch between stub boards using `switchBoard()`.
- [ ] B143 In playground, verify board switching preserves active stream/clip IDs.
- [ ] B144 In playground, verify board switching persists recent boards list.
- [ ] B145 In playground, verify board switching persists favorites list.
- [ ] B146 Add a fallback: if persisted `currentBoardId` is missing, select a default builtin board.
- [ ] B147 Add an invariant: registry must contain at least one board at startup.
- [ ] B148 Add startup validation that logs any invalid builtin definition (and skips it).
- [ ] B149 Confirm board core modules have no DOM dependency (UI-only code stays in `src/ui`).
- [ ] B150 Mark Board Core "ready" once registry/store/switching/layout runtime are tested and stable.

---

## Phase C: Board Switching UI & Persistence (C001–C100)

**Goal:** Create the user-facing UI for discovering, browsing, and switching between boards. Implement the board host, switcher modal, browser, and first-run experience.

### Board Host Component (C001–C005)

- [ ] C001 Create `cardplay/src/ui/components/board-host.ts` to mount the active board workspace.
- [ ] C002 In `board-host.ts`, subscribe to `BoardStateStore` and re-render on board changes.
- [ ] C003 In `board-host.ts`, read `BoardRegistry.get(currentBoardId)` and handle missing boards gracefully.
- [ ] C004 In `board-host.ts`, render a minimal "board chrome" header (board icon + name + control level).
- [ ] C005 In `board-host.ts`, expose a slot where decks/panels will be rendered (Phase E).

### Board Switcher Modal (C006–C020)

- [ ] C006 Create `cardplay/src/ui/components/board-switcher.ts` (Cmd+B quick switch modal).
- [ ] C007 In `board-switcher.ts`, render recent boards from `BoardStateStore.recentBoardIds`.
- [ ] C008 In `board-switcher.ts`, render favorite boards from `BoardStateStore.favoriteBoardIds`.
- [ ] C009 In `board-switcher.ts`, add a search input filtering `BoardRegistry.search(text)`.
- [ ] C010 In `board-switcher.ts`, show board category chips (Manual/Assisted/Generative/Hybrid).
- [ ] C011 In `board-switcher.ts`, display board metadata (icon, description, difficulty).
- [ ] C012 In `board-switcher.ts`, add "favorite/unfavorite" toggle inline for each result.
- [ ] C013 In `board-switcher.ts`, add keyboard navigation (Up/Down to move selection).
- [ ] C014 In `board-switcher.ts`, bind Enter to `switchBoard(selectedBoardId)`.
- [ ] C015 In `board-switcher.ts`, bind Esc to close the modal without switching.
- [ ] C016 In `board-switcher.ts`, implement focus trap (Tab cycles within modal).
- [ ] C017 In `board-switcher.ts`, set ARIA roles (dialog, labelledby, describedby).
- [ ] C018 In `board-switcher.ts`, restore focus to prior element on close.
- [ ] C019 In `board-switcher.ts`, add a "Reset layout on switch" checkbox (wires to switch options).
- [ ] C020 In `board-switcher.ts`, add a "Reset deck tabs" checkbox (wires to switch options).

### Board Browser (Full Library View) (C021–C028)

- [ ] C021 Create `cardplay/src/ui/components/board-browser.ts` (full board library view).
- [ ] C022 In `board-browser.ts`, group boards by category (control level buckets).
- [ ] C023 In `board-browser.ts`, add a "difficulty" filter (beginner→expert).
- [ ] C024 In `board-browser.ts`, add a "tools enabled" filter (phrase/harmony/generator/AI).
- [ ] C025 In `board-browser.ts`, show a per-board deck list preview (deck types + count).
- [ ] C026 In `board-browser.ts`, add "open" action that calls `switchBoard(boardId)`.
- [ ] C027 In `board-browser.ts`, add "favorite" action and persist via `BoardStateStore`.
- [ ] C028 In `board-browser.ts`, add "export board definition JSON" debug action (dev-only).

### First-Run Board Selection (C029–C038)

- [ ] C029 Create `cardplay/src/ui/components/first-run-board-selection.ts` (new user flow).
- [ ] C030 In `first-run-board-selection.ts`, detect `BoardStateStore.firstRunCompleted === false`.
- [ ] C031 In `first-run-board-selection.ts`, render 3–5 recommended boards based on user answers.
- [ ] C032 Reuse onboarding intent signals from `what-brings-you-selector.ts` (or map to `UserType`).
- [ ] C033 Reuse background/persona from `beginner-bridge.ts` (or map to `UserType`).
- [ ] C034 In `first-run-board-selection.ts`, call `getRecommendedBoards(userType)` to rank choices.
- [ ] C035 In `first-run-board-selection.ts`, show "control spectrum" explanation per `cardplayui.md` Part I.
- [ ] C036 In `first-run-board-selection.ts`, make selection set `currentBoardId` and mark first-run complete.
- [ ] C037 In `first-run-board-selection.ts`, provide "skip" option that defaults to a safe manual board.
- [ ] C038 In `first-run-board-selection.ts`, provide "learn more" link to open `board-browser`.

### Control Spectrum Badge & Indicators (C039–C042)

- [ ] C039 Create `cardplay/src/ui/components/control-spectrum-badge.ts` (small board indicator).
- [ ] C040 In `control-spectrum-badge.ts`, color-code by `controlLevel` (manual→generative).
- [ ] C041 In `control-spectrum-badge.ts`, show tooltip describing what tools are enabled/disabled.
- [ ] C042 Add a global "Boards" button in board chrome that opens `board-browser`.

### Global Modal System (C043–C050)

- [ ] C043 Add a global "Switch Board" button in board chrome that opens `board-switcher`.
- [ ] C044 Decide where global modals live (one overlay root for switcher/browser/help).
- [ ] C045 Create `cardplay/src/ui/components/modal-root.ts` managing z-index stacking and focus traps.
- [ ] C046 Style board modals using theme tokens from `src/ui/theme.ts` and `design-system-bridge.ts`.
- [ ] C047 Add `injectBoardSwitcherStyles()` pattern (single style tag, deduped) like other components.
- [ ] C048 Ensure board switcher respects reduced-motion preference (`prefersReducedMotion`).
- [ ] C049 Ensure board switcher is usable with keyboard only (no mouse required).
- [ ] C050 Add analytics hooks (optional) to record board switches (dev-only initially).

### Keyboard Shortcuts (C051–C055)

- [ ] C051 Wire `Cmd+B` to open board switcher via `KeyboardShortcutManager` (or unified shortcut system).
- [ ] C052 Add shortcut entry "switch-board" to the active board's shortcut map (Appendix B alignment).
- [ ] C053 Ensure shortcut handling is paused when typing in inputs (search box) except undo/redo.
- [ ] C054 Decide whether `keyboard-navigation.ts` or `keyboard-shortcuts.ts` owns modal shortcuts.
- [ ] C055 Implement a single "UI event bus" for opening/closing board modals (avoid cross-import tangles).

### Playground Integration & Verification (C056–C067)

- [ ] C056 In playground, mount `BoardHost` as the root and ensure it updates when switching boards.
- [ ] C057 In playground, add a top-level toggle to simulate "first run" (clears persisted board state).
- [ ] C058 In playground, verify first-run selection runs once and persists completion state.
- [ ] C059 In playground, verify favorites persist across reload.
- [ ] C060 In playground, verify recent boards persist and are ordered by last-used.
- [ ] C061 Add `cardplay/src/ui/components/board-switcher.test.ts` (jsdom) for open/close/switch behaviors.
- [ ] C062 Test: typing filters results and highlights the first match.
- [ ] C063 Test: arrow keys move selection; Enter switches board and closes.
- [ ] C064 Test: Esc closes modal and restores focus.
- [ ] C065 Add `cardplay/src/ui/components/board-browser.test.ts` verifying grouping and filter logic.
- [ ] C066 Add `cardplay/src/ui/components/first-run-board-selection.test.ts` verifying persistence on select.
- [ ] C067 Add `cardplay/src/ui/components/board-host.test.ts` verifying re-render on store updates.

### Board State Management Actions (C068–C075)

- [ ] C068 Add a "Reset layout" action per board in board chrome (clears persisted per-board layout).
- [ ] C069 Add a "Reset board state" action per board (clears persisted deck state + layout state).
- [ ] C070 Add a "Reset all board prefs" action (clears board state store key entirely).
- [ ] C071 Add a "Help" button in board chrome that opens shortcuts + board description panel.
- [ ] C072 Create `cardplay/src/ui/components/board-help-panel.ts` listing active board decks/tools/shortcuts.
- [ ] C073 In `board-help-panel.ts`, include links to docs: `docs/boards/*` and `cardplayui.md` sections.
- [ ] C074 Ensure help panel content is board-driven (no hard-coded board ids).
- [ ] C075 Add a small "Board changed" announcement for screen readers (reuse announcer from `FocusManager`).

### Board Switch Transition & Preservation (C076–C085)

- [ ] C076 Decide on board-switch transition UX (instant vs fade) and implement it.
- [ ] C077 Ensure switching boards does not destroy shared stores (streams/clips remain).
- [ ] C078 Ensure switching boards preserves transport by default (unless option says otherwise).
- [ ] C079 Ensure switching boards preserves active selection by default (unless option says otherwise).
- [ ] C080 Add an option: "on switch, clear selection" for users who prefer it.
- [ ] C081 Add a "board quick switch" list limited to 9 entries to pair with numeric shortcuts.
- [ ] C082 Wire `Cmd+1..9` to "switch to recent board N" only when board switcher is open.
- [ ] C083 Ensure `Cmd+1..9` remains reserved for deck tabs when switcher is closed.
- [ ] C084 Add board switcher affordance for power users: `Cmd+B`, type, Enter (no mouse).
- [ ] C085 Add a "board search" fuzzy match (prefix + contains) without extra deps.

### Empty States & Error Handling (C086–C093)

- [ ] C086 Add consistent empty states: "No boards registered", "No results", "First run not completed".
- [ ] C087 Add `BoardRegistry` sanity check UI in dev mode (lists all registered boards).
- [ ] C088 Ensure board UI modules do not import editor internals directly (go through deck factories).
- [ ] C089 Add a compile-time check that `registerBuiltinBoards()` is invoked by whoever boots the UI.
- [ ] C090 Document the required boot sequence in `docs/boards/board-api.md` (registry → store → host).
- [ ] C091 Add a "board state inspector" dev panel that prints JSON of persisted state (dev-only).
- [ ] C092 Add a "copy board state JSON" button to help debug persistence issues.
- [ ] C093 Add a "copy layout runtime JSON" button to help debug layout issues.

### Final Verification (C094–C100)

- [ ] C094 Ensure localStorage writes are throttled to avoid performance regressions during resizing.
- [ ] C095 Ensure modal-root z-index works with existing reveal panels and tooltips.
- [ ] C096 Ensure board modals don't break pointer events on underlying canvas/DOM editors.
- [ ] C097 Re-run `npm run typecheck` and confirm new board UI components compile.
- [ ] C098 Re-run `npm test` and confirm board UI tests pass.
- [ ] C099 Re-run playground manual test: switch boards rapidly and confirm no leaks/crashes.
- [ ] C100 Lock Phase C as "done" once switcher/browser/first-run flows are stable and tested.

---

## Phase D: Card Availability & Tool Gating (D001–D080)

**Goal:** Implement runtime gating logic that controls which cards, decks, and tools are visible based on the active board's control level and tool configuration.

### Card Classification System (D001–D008)

- [ ] D001 Create `cardplay/src/boards/gating/` folder for runtime gating logic.
- [ ] D002 Add `cardplay/src/boards/gating/card-kinds.ts` defining `BoardCardKind` taxonomy.
- [ ] D003 In `card-kinds.ts`, define `classifyCard(meta: CardMeta): BoardCardKind[]`.
- [ ] D004 In `classifyCard`, map `category/tags` from `src/cards/card.ts` into manual/hint/assisted/generative kinds.
- [ ] D005 In `classifyCard`, treat core editors (tracker/notation/piano roll) as `manual` kind.
- [ ] D006 In `classifyCard`, treat phrase database / phrase browser as `assisted` kind.
- [ ] D007 In `classifyCard`, treat harmony helper / scale overlay as `hint` kind.
- [ ] D008 In `classifyCard`, treat arranger/AI composer/generators as `generative` kind.

### Tool Visibility Logic (D009–D014)

- [ ] D009 Add `cardplay/src/boards/gating/tool-visibility.ts` implementing `computeVisibleDeckTypes(board)`.
- [ ] D010 In `tool-visibility.ts`, hide phrase decks when `phraseDatabase.mode === 'hidden'`.
- [ ] D011 In `tool-visibility.ts`, hide harmony decks when `harmonyExplorer.mode === 'hidden'`.
- [ ] D012 In `tool-visibility.ts`, hide generator decks when `phraseGenerators.mode === 'hidden'`.
- [ ] D013 In `tool-visibility.ts`, hide arranger decks when `arrangerCard.mode === 'hidden'`.
- [ ] D014 In `tool-visibility.ts`, hide AI composer decks when `aiComposer.mode === 'hidden'`.

### Card Allowance & Filtering (D015–D024)

- [ ] D015 Add `cardplay/src/boards/gating/is-card-allowed.ts` implementing `isCardAllowed(board, meta)`.
- [ ] D016 In `is-card-allowed.ts`, compute allowed kinds from `board.controlLevel` + tool config.
- [ ] D017 In `is-card-allowed.ts`, support deck-level `controlLevel` overrides.
- [ ] D018 Add `cardplay/src/boards/gating/why-not.ts` returning human-readable denial reasons.
- [ ] D019 In `why-not.ts`, include which board/tool setting blocks the card (e.g., "Phrase DB hidden").
- [ ] D020 Add `cardplay/src/boards/gating/get-allowed-cards.ts` to query `CardRegistry` and filter entries.
- [ ] D021 In `get-allowed-cards.ts`, implement `getAllowedCardEntries(board)` and `getAllCardEntries(board, includeDisabled)`.
- [ ] D022 Decide canonical card registry for gating (`src/cards/registry.ts`) and document it in code.
- [ ] D023 Add an adapter mapping `audio/instrument-cards.ts` to `CardMeta`-like records (if needed for UI).
- [ ] D024 In the adapter, assign instrument cards to `manual` (instruments) or `effect` kinds based on type.

### Validation & Constraints (D025–D030)

- [ ] D025 Add `cardplay/src/boards/gating/validate-deck-drop.ts` for drag/drop acceptance checks.
- [ ] D026 In `validate-deck-drop.ts`, enforce deck type constraints (e.g., dsp-chain accepts effects only).
- [ ] D027 In `validate-deck-drop.ts`, enforce tool mode constraints (e.g., phrase drag disabled in browse-only).
- [ ] D028 Add `cardplay/src/boards/gating/validate-connection.ts` validating routing connections by port type.
- [ ] D029 In `validate-connection.ts`, disallow connecting incompatible port types (audio→midi, etc.).
- [ ] D030 Add a single gating entry point: `computeBoardCapabilities(board)` returning allowed decks/cards/actions (including cross-card control actions like “set other card params” and “invoke other card methods”).

### UI Integration (D031–D048)

- [ ] D031 Update deck creation pipeline to filter out decks not in `computeVisibleDeckTypes(board)`.
- [ ] D032 Update any "add card" UX to consult `isCardAllowed(board, meta)` before showing the card.
- [ ] D033 In `StackComponent` add-card flow, hide disallowed card types by default.
- [ ] D034 In `StackComponent` add-card flow, add "Show disabled" toggle to reveal disallowed cards.
- [ ] D035 In "Show disabled" view, show `whyNotAllowed(board, meta)` tooltip per card.
- [ ] D036 Ensure disallowed cards cannot be dropped into a deck; show toast explanation on drop.
- [ ] D037 Add a board-level "capabilities" UI panel (dev-only) listing visible decks and enabled tools.
- [ ] D038 Ensure gating changes update live when board switches (no stale cached gating results).
- [ ] D039 Add unit tests for `classifyCard` against a representative set of card metas.
- [ ] D040 Add unit tests for `computeVisibleDeckTypes` across all tool mode combinations.
- [ ] D041 Add unit tests for `isCardAllowed` across `full-manual/manual-with-hints/assisted/directed/generative`.
- [ ] D042 Add unit tests for `whyNotAllowed` messaging (stable copy strings).
- [ ] D043 Add unit tests for `validate-deck-drop` (effect into dsp-chain allowed; generator into manual deck denied).
- [ ] D044 Add unit tests for `validate-connection` (audio ports compatible; mismatch rejected).
- [ ] D045 Add a smoke test that a manual board exposes no phrase/generator/AI decks via gating.
- [ ] D046 Add a smoke test that an assisted board exposes phrase library deck but not AI composer deck.
- [ ] D047 Add a smoke test that a directed board exposes generator + arranger decks.
- [ ] D048 Add a smoke test that a generative board exposes all decks (subject to board definition).

### Capability Flags & Tool Toggles (D049–D059)

- [ ] D049 Implement a "capability flag" surface for UI: `canDragPhrases`, `canAutoSuggest`, `canInvokeAI`, `canControlOtherCards` (set params / invoke methods on other cards via host actions).
- [ ] D050 Wire `canDragPhrases` into phrase library UI drag start behavior.
- [ ] D051 Wire `canAutoSuggest` into any "suggestions" UI (hide if false).
- [ ] D052 Wire `canInvokeAI` into command palette visibility (hide AI actions if false) and gate any cross-card method invocation UI behind `canControlOtherCards`.
- [ ] D053 Add a `BoardPolicy` concept: some boards may allow tool toggles, others fixed.
- [ ] D054 Implement `BoardPolicy` fields: `allowToolToggles`, `allowControlLevelOverridePerTrack`.
- [ ] D055 Add UI for tool toggles (dev-only first): flip phrase DB mode and see decks show/hide.
- [ ] D056 Ensure toggling tools updates persisted per-board settings (if policy allows it).
- [ ] D057 Add "safe defaults" for missing tool config fields during board migration (avoid crashes).
- [ ] D058 Add `validateToolConfig(board)` that warns when modes are inconsistent with control level.
- [ ] D059 Integrate `validateToolConfig(board)` into `validateBoard(board)` (Phase B).

### Documentation & Migration (D060–D069)

- [ ] D060 Add documentation: `docs/boards/gating.md` explaining control level gating rules.
- [ ] D061 In docs, include examples of why a card is disabled and how to switch boards to enable it.
- [ ] D062 Add documentation: `docs/boards/tool-modes.md` summarizing each tool mode and UI behavior.
- [ ] D063 Ensure gating does not block loading legacy projects (always show a migration path).
- [ ] D064 Add a "this project uses disabled tools" warning banner if project contains disallowed cards.
- [ ] D065 Provide one-click "switch to recommended board" action from the warning banner.
- [ ] D066 Add integration: when board switches, recompute visible decks and re-render deck containers.
- [ ] D067 Add integration: when board switches, recompute allowed cards list for add-card UI.
- [ ] D068 Add integration: when board switches, clear any cached "why not" results to avoid stale copy.
- [ ] D069 Add a perf check: gating computation must be O(#cards + #decks) and memoized safely.

### Performance & Debug Tools (D070–D080)

- [ ] D070 Add a perf test (micro-benchmark) for `getAllowedCardEntries` on large card registries.
- [ ] D071 Add a "gating debug overlay" in playground showing current board + enabled tools.
- [ ] D072 Ensure gating debug overlay is hidden in production builds.
- [ ] D073 Add a linter rule or code review note: never bypass `isCardAllowed` in UI.
- [ ] D074 Audit existing UIs that add cards (preset browser, stack add button) for gating compliance.
- [ ] D075 Update any remaining add-card surfaces to use the gating helpers.
- [ ] D076 Add a final integration test: disallowed card hidden; enabling via board switch reveals it.
- [ ] D077 Add a final integration test: phrase drag disabled in browse-only mode.
- [ ] D078 Add a final integration test: phrase drag enabled in drag-drop mode.
- [ ] D079 Re-run `npm test` and ensure gating module coverage is meaningful.
- [ ] D080 Mark Phase D "done" once all gating rules are implemented, integrated, and tested.

---

## Phase E: Deck/Stack/Panel Unification (E001–E090)

**Goal:** Unify the deck concept across the UI, implementing deck instances, factories, drag/drop, and panel hosting. This phase makes boards actually render and work.

### Deck Instance & Container (E001–E010)

- [ ] E001 Create `cardplay/src/boards/decks/` (if not already) for deck instance runtime.
- [ ] E002 Add `cardplay/src/boards/decks/deck-instance.ts` defining `DeckInstance` (id, type, title, render).
- [ ] E003 Add `cardplay/src/boards/decks/deck-container.ts` (UI) rendering a deck header + body + tabs.
- [ ] E004 In `deck-container.ts`, support `cardLayout: tabs` (tab bar + active tab content).
- [ ] E005 In `deck-container.ts`, support `cardLayout: stack` (StackComponent inside).
- [ ] E006 In `deck-container.ts`, support `cardLayout: split` (two child panes).
- [ ] E007 In `deck-container.ts`, support `cardLayout: floating` (draggable/resizable wrapper).
- [ ] E008 In `deck-container.ts`, add a consistent deck header (title, +, overflow, close).
- [ ] E009 In `deck-container.ts`, add deck-level context menu (move to panel, reset state).
- [ ] E010 In `deck-container.ts`, persist deck UI state via `BoardStateStore.perBoardDeckState`.

### Deck Factories & Registration (E011–E020)

- [ ] E011 Create `cardplay/src/boards/decks/deck-factories.ts` registering factories for each `DeckType`.
- [ ] E012 Implement `createDeckInstances(board, activeContext)` using deck factories + gating visibility.
- [ ] E013 Implement `validateBoardFactories(board)` at runtime and surface missing deck types clearly.
- [ ] E014 Decide how `DeckLayoutAdapter` fits: audio/runtime backing for mixer/routing decks.
- [ ] E015 Create `cardplay/src/boards/decks/audio-deck-adapter.ts` wrapping `DeckLayoutAdapter` for board use.
- [ ] E016 Ensure `audio-deck-adapter.ts` exposes `getInputNode()/getOutputNode()` for routing overlay.
- [ ] E017 Create `cardplay/src/ui/components/deck-panel-host.ts` to render panels with multiple decks.
- [ ] E018 In `deck-panel-host.ts`, render decks in a panel based on `BoardLayoutRuntime`.
- [ ] E019 In `deck-panel-host.ts`, support moving a deck between panels (dock left/right/bottom).
- [ ] E020 Wire `BoardHost` → `deck-panel-host.ts` so boards actually show decks on screen.

### Deck Type Implementations: Editors (E021–E034)

- [ ] E021 Implement `DeckType: pattern-editor` deck factory using tracker (panel or card, per A049 decision).
- [ ] E022 In tracker deck, bind to `ActiveContext.activeStreamId` and update on context changes.
- [ ] E023 In tracker deck, provide pattern-length control and ensure it maps to stream tick range.
- [ ] E024 In tracker deck, expose key commands via tooltip/help (note entry, navigation, undo).
- [ ] E025 Implement `DeckType: piano-roll` deck factory using `piano-roll-panel.ts`.
- [ ] E026 In piano-roll deck, bind to `ActiveContext.activeStreamId` and update on context changes.
- [ ] E027 In piano-roll deck, render velocity lane and ensure edits write back to store.
- [ ] E028 Implement `DeckType: notation-score` deck factory using `notation/panel.ts` via `notation-store-adapter.ts`.
- [ ] E029 In notation deck, bind to `ActiveContext.activeStreamId` and update on context changes.
- [ ] E030 In notation deck, ensure engraving settings persist per board (zoom, page config, staff config).
- [ ] E031 Implement `DeckType: timeline` deck factory using `arrangement-panel.ts` (or a wrapper view).
- [ ] E032 In timeline deck, bind to `ClipRegistry` and show clips referencing streams.
- [ ] E033 In timeline deck, bind selection to `SelectionStore` by clip/event IDs.
- [ ] E034 Implement `DeckType: clip-session` deck factory (new UI surface; state exists in `session-view.ts`).

### Session Grid Deck (E035–E038)

- [ ] E035 Create `cardplay/src/ui/components/session-grid-panel.ts` to render an Ableton-like session grid.
- [ ] E036 Wire `session-grid-panel.ts` to `SessionViewStoreBridge` (ClipRegistry-backed).
- [ ] E037 In session grid deck, support clip launch state (playing/queued/stopped) from transport.
- [ ] E038 In session grid deck, support selecting a slot to set `ActiveContext.activeClipId`.

### Deck Type Implementations: Browsers & Tools (E039–E060)

- [ ] E039 Implement `DeckType: instrument-browser` deck factory listing instrument cards available to this board.
- [ ] E040 In instrument browser deck, query allowed cards via Phase D gating helpers.
- [ ] E041 In instrument browser deck, implement drag payload "card template" (type + default params).
- [ ] E042 Implement `DeckType: dsp-chain` deck factory as an effect stack (StackComponent of effect cards).
- [ ] E043 In dsp-chain deck, integrate with routing graph (effect chain connections).
- [ ] E044 Implement `DeckType: mixer` deck factory using `DeckLayoutAdapter` + a UI strip list.
- [ ] E045 Create `cardplay/src/ui/components/mixer-panel.ts` (track strips, meters, mute/solo/arm, volume/pan).
- [ ] E046 In mixer panel, derive strips from streams/clips (or from deck registry) consistently.
- [ ] E047 Implement `DeckType: properties` deck factory as an inspector for selection (event/clip/card).
- [ ] E048 Create `cardplay/src/ui/components/properties-panel.ts` showing editable fields for selected entity.
- [ ] E049 In properties panel, support editing `ClipRecord` (name/color/loop) via ClipRegistry.
- [ ] E050 In properties panel, support editing `Event` payload fields via SharedEventStore (safe typed editing).
- [ ] E051 Implement `DeckType: phrase-library` deck factory using existing phrase UI (`phrase-library-panel.ts` or `phrase-browser-ui.ts`).
- [ ] E052 Decide phrase UI surface (DOM vs canvas); pick one and document why in `docs/boards/decks.md`.
- [ ] E053 In phrase library deck, implement drag payload "phrase" with notes + duration + tags.
- [ ] E054 In phrase library deck, implement preview playback hook (transport + temporary stream).
- [ ] E055 Implement `DeckType: sample-browser` deck factory using `sample-browser.ts` and waveform preview components.
- [ ] E056 Implement `DeckType: generator` deck factory as a stack of generator cards (melody/bass/drums).
- [ ] E057 Implement `DeckType: arranger` deck factory using arranger modules (sections bar + arranger card integration).
- [ ] E058 Implement `DeckType: harmony-display` deck factory using chord track + scale context display.
- [ ] E059 Implement `DeckType: chord-track` deck factory using `chord-track-lane.ts` + renderer.
- [ ] E060 Implement `DeckType: transport` deck factory (transport controls + tempo + loop region).
- [ ] E061 Implement `DeckType: modular` deck factory for routing graph visualization + edit UI.
- [ ] E062 Reconcile connection overlay: reuse `ui/components/connection-router.ts` if applicable.

### Drag/Drop System (E063–E070)

- [ ] E063 Add a shared drag/drop payload model in `cardplay/src/ui/drag-drop-system.ts` for deck-to-deck transfers.
- [ ] E064 Define payload types: `card-template`, `phrase`, `clip`, `events`, `sample`, `host-action` (arrangeable cross-card param/method actions).
- [ ] E065 Implement drop handlers: phrase→pattern-editor (writes events to active stream) and host-action→pattern-editor (inserts arrangeable call events or applies a patch, depending on board policy).
- [ ] E066 Implement drop handlers: clip→timeline (places clip on track lane in arrangement).
- [ ] E067 Implement drop handlers: card-template→deck slot (instantiates card in stack/deck).
- [ ] E068 Implement drop handlers: sample→sampler instrument card (loads sample asset reference).
- [ ] E069 Add visual affordances for drop targets (highlight zones) consistent with theme tokens.
- [ ] E070 Add undo integration for all drops (wrap mutations in `executeWithUndo`).

### Deck Tabs & Multi-Context (E071–E076)

- [ ] E071 Implement per-deck "tab stack" behavior for multiple patterns/clips in one deck.
- [ ] E072 In pattern-editor deck, implement tabs for multiple streams/pattern contexts (optional MVP: two tabs).
- [ ] E073 In notation deck, implement tabs for multiple staves/scores (optional MVP: one tab).
- [ ] E074 In clip-session deck, implement tabs for different session pages/sets (optional).
- [ ] E075 Ensure deck tabs integrate with `Cmd+1..9` shortcut scoping (active deck only).
- [ ] E076 Persist active deck tab per board via `perBoardDeckState`.

### Testing & Documentation (E077–E090)

- [ ] E077 Add unit tests for `deck-container` state persistence and tab switching.
- [ ] E078 Add unit tests for session-grid panel: slot selection sets active clip context.
- [ ] E079 Add unit tests for drag/drop: phrase drop writes events into SharedEventStore.
- [ ] E080 Add unit tests for drag/drop: disallowed drop rejected with reason (Phase D validate-deck-drop).
- [ ] E081 Add an integration test: board layout renders expected panel/deck arrangement from a stub board.
- [ ] E082 Add an integration test: switching boards replaces decks according to board definition.
- [ ] E083 Add an integration test: closing a deck updates persisted deck state.
- [ ] E084 Add docs: `cardplay/docs/boards/decks.md` describing each deck type and backing component.
- [ ] E085 Add docs: `cardplay/docs/boards/panels.md` describing panel roles and layout mapping.
- [ ] E086 Add a performance pass: ensure tracker/piano roll decks use virtualization where needed.
- [ ] E087 Add an accessibility pass: ensure deck headers, tabs, and close buttons are keyboard reachable.
- [ ] E088 Run playground and verify at least 4 decks can mount without errors (tracker, piano roll, notation, properties).
- [ ] E089 Run `npm test` and ensure new deck/container tests pass.
- [ ] E090 Mark Phase E "done" once decks/panels are renderable, switchable, and persist state.

---

## Phase F: Manual Boards (F001–F120)

### Notation Board (Manual) (F001–F030)

- [ ] F001 Create `cardplay/src/boards/builtins/notation-board-manual.ts` board definition.
- [ ] F002 Set id/name/description/icon to match `cardplayui.md` Notation Board (Manual).
- [ ] F003 Set `controlLevel: 'full-manual'` and a “no suggestions” philosophy string.
- [ ] F004 Set `compositionTools` to full-manual: all tools disabled/hidden.
- [ ] F005 Choose `primaryView: 'notation'` for this board.
- [ ] F006 Define layout panels: players (left), score (center), properties (right).
- [ ] F007 Add deck `notation-score` as the primary deck in the center panel.
- [ ] F008 Add deck `instrument-browser` in the left panel (manual instruments only).
- [ ] F009 Add deck `properties` in the right panel (selection inspector).
- [ ] F010 Add deck `dsp-chain` as a secondary panel/tab (manual effect chain).
- [ ] F011 Define default deck layout states (tabs, sizes) via `createDefaultLayoutRuntime`.
- [ ] F012 Ensure deck factories exist for `notation-score/instrument-browser/properties/dsp-chain`.
- [ ] F013 Bind notation deck to `ActiveContext.activeStreamId` (score edits write to shared store).
- [ ] F014 Ensure notation deck uses read/write adapter (`notation-store-adapter.ts`).
- [ ] F015 Ensure instrument browser only lists allowed manual instrument cards (Phase D gating).
- [ ] F016 Ensure dsp-chain deck only accepts effect cards (Phase D drop validation).
- [ ] F017 Ensure properties deck can edit selected notation events without breaking type safety.
- [ ] F018 Add board-specific shortcut map (note entry, selection tools, zoom, print/export).
- [ ] F019 Register board shortcuts on activation; unregister on switch away.
- [ ] F020 Add board theme defaults (manual control color, notation-focused typography).
- [ ] F021 Add board to `registerBuiltinBoards()` and ensure it appears in board browser.
- [ ] F022 Add board to recommendations for “traditional-composer”.
- [ ] F023 Add a smoke test that manual notation board hides phrase/generator/AI decks.
- [ ] F024 Add a smoke test that manual notation board shows exactly the defined deck types.
- [ ] F025 Add a smoke test: switching into this board preserves active stream/clip context.
- [ ] F026 Add docs: `cardplay/docs/boards/notation-board-manual.md` (when to use, shortcuts).
- [ ] F027 Add empty-state UX: “No score yet — add notes or import MIDI” (manual-only messaging).
- [ ] F028 Add import actions: MIDI→notation (manual board allows import but no generation).
- [ ] F029 Run playground: create notes in notation and confirm they appear in piano roll/tracker (shared stream).
- [ ] F030 Lock Notation Manual board once UX, gating, and sync are stable.

### Basic Tracker Board (Manual) (F031–F060)

- [ ] F031 Create `cardplay/src/boards/builtins/basic-tracker-board.ts` board definition.
- [ ] F032 Set id/name/description/icon to match `cardplayui.md` Basic Tracker Board.
- [ ] F033 Set `controlLevel: 'full-manual'` and “pure tracker” philosophy string.
- [ ] F034 Set `compositionTools` to full-manual: all tools disabled/hidden.
- [ ] F035 Choose `primaryView: 'tracker'` for this board.
- [ ] F036 Define layout panels: sidebar (left), pattern editor (center), optional properties (right/bottom).
- [ ] F037 Add deck `pattern-editor` as primary deck in center panel.
- [ ] F038 Add deck `instrument-browser` in sidebar (tracker instruments/samplers).
- [ ] F039 Add deck `dsp-chain` for per-track effects chain (manual only).
- [ ] F040 Add deck `properties` for editing selected events/track settings.
- [ ] F041 Ensure tracker deck uses the canonical tracker UI (panel vs card) chosen in Phase A.
- [ ] F042 Ensure tracker deck binds to `ActiveContext.activeStreamId` and recomputes view from store.
- [ ] F043 Ensure tracker deck uses tracker shortcuts (hex entry, note entry, navigation).
- [ ] F044 Ensure tracker deck renders beat highlights based on transport/PPQ settings.
- [ ] F045 Ensure instrument browser lists only manual instruments (no generators).
- [ ] F046 Ensure dsp-chain drop rules allow only effects; deny generators with clear reason.
- [ ] F047 Add board shortcut overrides (pattern length, octave, follow playback, toggle loop).
- [ ] F048 Add board theme defaults (tracker monospace font, classic column colors).
- [ ] F049 Add board to `registerBuiltinBoards()` and ensure it appears under Manual category.
- [ ] F050 Add board to recommendations for “tracker-purist” and “renoise-user”.
- [ ] F051 Add a smoke test that manual tracker board hides phrase library and all generator decks.
- [ ] F052 Add a smoke test that manual tracker board shows only defined deck types.
- [ ] F053 Add a test: entering a note writes an event to store and is visible in piano roll.
- [ ] F054 Add a test: undo/redo of tracker edits works via UndoStack integration.
- [ ] F055 Add empty-state UX: “No pattern — press + to create stream/pattern” (manual wording).
- [ ] F056 Add docs: `cardplay/docs/boards/basic-tracker-board.md` (mapping from Renoise).
- [ ] F057 Add an optional “hex/decimal” toggle and persist per board.
- [ ] F058 Run playground: rapid note entry + scrolling; confirm performance stays acceptable.
- [ ] F059 Verify board switching away preserves stream data (no local tracker state leak).
- [ ] F060 Lock Basic Tracker board once gating, sync, and shortcuts match the manual spec.

### Basic Sampler Board (Manual) (F061–F090)

- [ ] F061 Create `cardplay/src/boards/builtins/basic-sampler-board.ts` board definition.
- [ ] F062 Set id/name/description/icon to match `cardplayui.md` Basic Sampler Board.
- [ ] F063 Set `controlLevel: 'full-manual'` and “you chop, you arrange” philosophy string.
- [ ] F064 Set `compositionTools` to full-manual: all tools disabled/hidden.
- [ ] F065 Choose `primaryView: 'sampler'` (or `'session'` if sampler is clip-based) and document choice.
- [ ] F066 Define layout panels: sample pool (left), arrangement/timeline (center), waveform editor (bottom).
- [ ] F067 Add deck `sample-browser` in left panel (sample pool).
- [ ] F068 Add deck `timeline` in center panel (manual arrangement of clips/samples).
- [ ] F069 Add deck `dsp-chain` for processing (manual effects).
- [ ] F070 Add deck `properties` for sample/clip/event settings.
- [ ] F071 Ensure sample browser integrates waveform preview (`sample-waveform-preview.ts`).
- [ ] F072 Ensure sample browser supports import and tagging (manual operations only).
- [ ] F073 Ensure timeline deck can host audio clips or sample-trigger clips (define MVP representation).
- [ ] F074 Add chop actions (grid chop, manual slice markers) and ensure undo integration.
- [ ] F075 Add stretch actions (time stretch, pitch shift) and ensure parameters flow through resolver.
- [ ] F076 Ensure dsp-chain is compatible with sampler output routing (audio connections in routing graph).
- [ ] F077 Ensure properties panel can edit `ClipRecord` (duration/loop) and sample metadata.
- [ ] F078 Add board shortcut map (import, chop, zoom waveform, audition sample, toggle snap).
- [ ] F079 Add board theme defaults (sampler colors, waveform contrast, large transport buttons).
- [ ] F080 Add board to `registerBuiltinBoards()` and show it under Manual category.
- [ ] F081 Add board to recommendations for “sample-based” workflows.
- [ ] F082 Add smoke test: sampler manual board hides phrase/generator/AI decks.
- [ ] F083 Add smoke test: sample drop onto sampler deck creates a sampler card/slot with the sample loaded.
- [ ] F084 Add smoke test: placing a clip on timeline writes to ClipRegistry and is reflected in session grid (if open).
- [ ] F085 Add docs: `cardplay/docs/boards/basic-sampler-board.md` (workflow + shortcuts).
- [ ] F086 Add empty-state UX: “No samples — import WAV/AIFF” and “No arrangement — drag clips”.
- [ ] F087 Run playground: import a sample, chop, and confirm edits are undoable and persistent.
- [ ] F088 Ensure board switching away preserves clips and samples (no UI-local storage of assets).
- [ ] F089 Verify audio routing is visible via routing overlay (Phase J) for sampler output.
- [ ] F090 Lock Basic Sampler board once core manual sampling loop is stable.

### Basic Session Board (Manual) (F091–F120)

- [ ] F091 Create `cardplay/src/boards/builtins/basic-session-board.ts` board definition.
- [ ] F092 Set id/name/description/icon to match `cardplayui.md` Basic Session Board.
- [ ] F093 Set `controlLevel: 'full-manual'` and “manual clip launching” philosophy string.
- [ ] F094 Set `compositionTools` to full-manual: all tools disabled/hidden.
- [ ] F095 Choose `primaryView: 'session'` for this board.
- [ ] F096 Define layout panels: clip-session (center), instrument browser (left), mixer (bottom), properties (right).
- [ ] F097 Add deck `clip-session` as primary deck in the center panel.
- [ ] F098 Add deck `instrument-browser` in the left panel (manual instruments only).
- [ ] F099 Add deck `mixer` in the bottom panel (mixing controls + meters).
- [ ] F100 Add deck `properties` in the right panel (clip/event inspector).
- [ ] F101 Ensure session grid panel is fully ClipRegistry-backed (no local clip copies).
- [ ] F102 Ensure selecting a slot sets `ActiveContext.activeClipId` and `activeStreamId`.
- [ ] F103 Ensure clip launch uses transport quantization (bar/beat) and reflects queued/playing state.
- [ ] F104 Ensure session grid supports duplicate/delete/rename actions with undo integration.
- [ ] F105 Ensure instrument browser drag/drop creates instrument card instances on the selected track.
- [ ] F106 Ensure mixer panel reflects track mute/solo/arm and writes changes to shared state.
- [ ] F107 Ensure properties panel edits clip name/color/loop and persists via ClipRegistry.
- [ ] F108 Add board shortcut map (launch clip, launch scene, stop, arm track, duplicate slot).
- [ ] F109 Add board theme defaults (session grid contrast, clip color readability).
- [ ] F110 Add board to `registerBuiltinBoards()` and show it under Manual category.
- [ ] F111 Add board to recommendations for “ableton-user” manual workflows (no generators).
- [ ] F112 Add smoke test: manual session board hides generator/arranger/AI composer decks.
- [ ] F113 Add smoke test: creating a clip in session grid creates a stream + clip record in shared stores.
- [ ] F114 Add smoke test: launching a clip updates play state and playhead UI in transport deck.
- [ ] F115 Add docs: `cardplay/docs/boards/basic-session-board.md` (workflow + shortcuts).
- [ ] F116 Add empty-state UX: “No clips — click an empty slot to create one”.
- [ ] F117 Run playground: create clips, launch them, switch boards, and ensure state persists.
- [ ] F118 Ensure board switching away does not reset session grid assignments (slot mapping persists).
- [ ] F119 Ensure the manual session board can coexist with arrangement timeline (clips share registry).
- [ ] F120 Lock Basic Session board once clip creation/launch + mixer + properties loop is stable.

---


### Tracker + Harmony Board (Assisted Hints) (G001–G030)

- [ ] G001 Create `cardplay/src/boards/builtins/tracker-harmony-board.ts` board definition.
- [ ] G002 Set id/name/description/icon to match `cardplayui.md` Tracker + Harmony Board.
- [ ] G003 Set `controlLevel: 'manual-with-hints'` and “you write, it hints” philosophy string.
- [ ] G004 Enable `harmonyExplorer` tool in `display-only` mode; keep other tools hidden.
- [ ] G005 Choose `primaryView: 'tracker'` and keep tracker as the composition surface.
- [ ] G006 Define layout: harmony helper (left), pattern editor (center), properties (right/bottom).
- [ ] G007 Add deck `harmony-display` in left panel.
- [ ] G008 Add deck `pattern-editor` in center panel.
- [ ] G009 Add deck `instrument-browser` as a tab in left panel (optional).
- [ ] G010 Add deck `properties` in right panel for event/chord settings.
- [ ] G011 Implement `harmony-display` deck UI: key, current chord, chord tones list.
- [ ] G012 Choose chord source for harmony display (ChordTrack stream, or manual chord picker).
- [ ] G013 If chord track exists, bind harmony display to a dedicated chord stream in `SharedEventStore`.
- [ ] G014 Add action “Set Chord” that writes/updates chord events in chord stream.
- [ ] G015 Add action “Set Key” that updates key context in `ActiveContext` (or board-local prefs).
- [ ] G016 Update tracker deck to accept “harmony context” (key + chord) from board context.
- [ ] G017 Add tracker cell color-coding for chord tones vs scale tones vs out-of-key (spec table in §2.3.2).
- [ ] G018 Ensure the coloring is purely view-layer (does not mutate events).
- [ ] G019 Add toggle “show harmony colors” and persist per board.
- [ ] G020 Add toggle “roman numeral view” for harmony display (reuse chord roman numeral helpers).
- [ ] G021 Add shortcuts: “set chord”, “toggle harmony colors”, “toggle roman numerals”.
- [ ] G022 Add board theme defaults (hint color palette distinct from manual).
- [ ] G023 Register board in builtin registry and show it under Assisted category.
- [ ] G024 Add recommendation mapping for “learning harmony” workflows.
- [ ] G025 Add smoke test: harmony deck visible; phrase/generator/AI decks hidden.
- [ ] G026 Add test: changing chord updates tracker coloring deterministically.
- [ ] G027 Add test: chord edits are undoable via UndoStack.
- [ ] G028 Add docs: `cardplay/docs/boards/tracker-harmony-board.md`.
- [ ] G029 Run playground: set chord and verify tracker/piano roll/notation show consistent harmony hints.
- [ ] G030 Lock Tracker + Harmony board once hints are stable and non-invasive.

### Tracker + Phrases Board (Assisted) (G031–G060)

- [ ] G031 Create `cardplay/src/boards/builtins/tracker-phrases-board.ts` board definition.
- [ ] G032 Set id/name/description/icon to match `cardplayui.md` Tracker + Phrases Board.
- [ ] G033 Set `controlLevel: 'assisted'` and “drag phrases, then edit” philosophy string.
- [ ] G034 Enable `phraseDatabase` tool in `drag-drop` mode; keep AI composer hidden.
- [ ] G035 Choose `primaryView: 'tracker'` (pattern editor remains the main surface).
- [ ] G036 Define layout: phrase library (left), pattern editor (center), properties (right).
- [ ] G037 Add deck `phrase-library` in left panel.
- [ ] G038 Add deck `pattern-editor` in center panel.
- [ ] G039 Add deck `instrument-browser` as a tab in left panel (optional).
- [ ] G040 Add deck `properties` in right panel for phrase/event settings.
- [ ] G041 Decide phrase library UI implementation (DOM vs canvas) and commit to one for this board.
- [ ] G042 Ensure phrase library supports search, tags, categories, and favorites (minimum).
- [ ] G043 Implement phrase drag payload with notes + duration + metadata.
- [ ] G044 Implement drop: phrase → tracker at cursor row/track (writes events into active stream).
- [ ] G045 If harmony context exists, adapt phrase using `src/cards/phrase-adapter.ts` before writing.
- [ ] G046 Add phrase adaptation settings (transpose/chord-tone/scale-degree/voice-leading) in properties panel.
- [ ] G047 Persist phrase adaptation settings per board (or per phrase category).
- [ ] G048 Implement phrase preview: temporary stream + transport play + stop on release.
- [ ] G049 Implement “commit phrase to library” from tracker selection (save as new phrase record).
- [ ] G050 Ensure phrase save includes tags (instrument, mood) and optional chord context.
- [ ] G051 Add shortcut: “open phrase search”, “preview phrase”, “commit selection as phrase”.
- [ ] G052 Add board theme defaults (phrase library accent color distinct from harmony hints).
- [ ] G053 Register board in builtin registry and show it under Assisted category.
- [ ] G054 Add recommendation mapping for “fast controlled tracker workflow”.
- [ ] G055 Add smoke test: phrase library visible and drag enabled; generators/AI hidden.
- [ ] G056 Add test: dropping phrase writes correct event timings into `SharedEventStore`.
- [ ] G057 Add test: dropping phrase is undoable and restores previous events.
- [ ] G058 Add docs: `cardplay/docs/boards/tracker-phrases-board.md`.
- [ ] G059 Run playground: drag phrases into tracker, then edit notes; confirm cross-view sync.
- [ ] G060 Lock Tracker + Phrases board once phrase drag/drop and adaptation are stable.

### Session + Generators Board (Assisted) (G061–G090)

- [ ] G061 Create `cardplay/src/boards/builtins/session-generators-board.ts` board definition.
- [ ] G062 Set id/name/description/icon to match `cardplayui.md` Session + Generators Board.
- [ ] G063 Set `controlLevel: 'assisted'` and “trigger generation, then curate” philosophy string.
- [ ] G064 Enable `phraseGenerators` tool in `on-demand` mode; keep AI composer hidden initially.
- [ ] G065 Choose `primaryView: 'session'` (clip grid is the main surface).
- [ ] G066 Define layout: clip-session (center), generator deck (right), mixer (bottom), browser (left).
- [ ] G067 Add deck `clip-session` in center panel.
- [ ] G068 Add deck `generator` in right panel (on-demand generators).
- [ ] G069 Add deck `mixer` in bottom panel.
- [ ] G070 Add deck `instrument-browser` in left panel (manual instruments + assisted helpers).
- [ ] G071 Add deck `properties` as a right/bottom tab for clip/generator settings.
- [ ] G072 Implement generator deck UI: list generators (melody/bass/drums/arp) + “Generate” button.
- [ ] G073 Wire generator execution to write into `SharedEventStore` (via existing generator integration helpers).
- [ ] G074 On generate, create/update a clip’s stream events; keep edits undoable.
- [ ] G075 Add “Generate into new clip” action (creates stream + clip, assigns to selected slot).
- [ ] G076 Add “Regenerate” action that replaces generated events (with undo support).
- [ ] G077 Add “Freeze” action that marks events as user-owned (or sets meta.generated=false).
- [ ] G078 Add “Humanize” and “Quantize” actions as post-process operations.
- [ ] G079 If chord track exists, provide chord-follow generation options (use chord stream as input).
- [ ] G080 Persist generator settings per track/slot (seed, style, density) in per-board deck state.
- [ ] G081 Ensure session grid selection sets active clip/stream context for generator deck.
- [ ] G082 Add shortcuts: generate, regenerate, freeze, next/prev slot, launch clip.
- [ ] G083 Add board theme defaults (generator deck accent + clear “generated” badges).
- [ ] G084 Register board in builtin registry and show it under Assisted category.
- [ ] G085 Add recommendation mapping for “quick sketching with control”.
- [ ] G086 Add smoke test: generator deck visible; phrase library optional; AI composer hidden.
- [ ] G087 Add test: generate action writes events to store and updates session clip length.
- [ ] G088 Add test: freeze action preserves events and disables auto-regeneration.
- [ ] G089 Add docs: `cardplay/docs/boards/session-generators-board.md`.
- [ ] G090 Lock Session + Generators board once generation loop is stable and undoable.

### Notation + Harmony Board (Assisted) (G091–G120)

- [ ] G091 Create `cardplay/src/boards/builtins/notation-harmony-board.ts` board definition.
- [ ] G092 Set id/name/description/icon to match `cardplayui.md` Notation + Harmony Board.
- [ ] G093 Set `controlLevel: 'assisted'` and “write notes, get harmonic guidance” philosophy string.
- [ ] G094 Enable `harmonyExplorer` in `suggest` mode (or `display-only` for MVP) and document choice.
- [ ] G095 Choose `primaryView: 'notation'` (notation is the composition surface).
- [ ] G096 Define layout: harmony helper (left), score (center), properties (right).
- [ ] G097 Add deck `notation-score` in center panel.
- [ ] G098 Add deck `harmony-display` in left panel.
- [ ] G099 Add deck `instrument-browser` as a left tab (optional).
- [ ] G100 Add deck `properties` in right panel (note/chord/voice settings).
- [ ] G101 Implement harmony display: show current chord, scale, suggested next chords.
- [ ] G102 Add clickable chord suggestions that write new chord events to chord stream.
- [ ] G103 Add “apply chord tones highlight” overlay in notation view (non-destructive coloring).
- [ ] G104 Add “snap selection to chord tones” helper action (optional assisted transform with undo).
- [ ] G105 Integrate `phrase-adapter.ts` as a “harmonize selection” tool (voice-leading mode).
- [ ] G106 Add “reharmonize” action that proposes alternate chord symbols without auto-applying.
- [ ] G107 Persist key/chord context settings per board.
- [ ] G108 Add shortcuts: open harmony suggestions, accept suggestion, toggle highlights.
- [ ] G109 Add board theme defaults (assisted color palette + readable highlights on staff).
- [ ] G110 Register board in builtin registry and show it under Assisted category.
- [ ] G111 Add recommendation mapping for “orchestral/education” workflows.
- [ ] G112 Add smoke test: harmony deck visible; phrase/generator/AI decks hidden (unless explicitly enabled).
- [ ] G113 Add test: clicking a chord suggestion updates chord stream and refreshes overlays.
- [ ] G114 Add test: “snap to chord tones” is undoable and preserves rhythm.
- [ ] G115 Add docs: `cardplay/docs/boards/notation-harmony-board.md`.
- [ ] G116 Add empty-state UX: “Set a key/chord to see harmony hints” (no forced generation).
- [ ] G117 Run playground: write melody, set chords, and verify suggested next chords appear.
- [ ] G118 Verify harmony overlays do not break notation selection hit-testing.
- [ ] G119 Verify board switching away preserves chord stream and key context.
- [ ] G120 Lock Notation + Harmony board once suggestions are useful, safe, and undoable.
---

## Phase H: Generative Boards (H001–H075)

### AI Arranger Board (Directed) (H001–H025)

- [ ] H001 Create `cardplay/src/boards/builtins/ai-arranger-board.ts` board definition.
- [ ] H002 Set id/name/description/icon to match `cardplayui.md` AI Arranger Board.
- [ ] H003 Set `controlLevel: 'directed'` and “you set direction, AI fills in” philosophy string.
- [ ] H004 Enable `arrangerCard` tool in `chord-follow` mode (or `manual-trigger` for MVP).
- [ ] H005 Enable `phraseGenerators` tool in `on-demand` mode for fills (optional).
- [ ] H006 Choose `primaryView: 'arranger'` for this board.
- [ ] H007 Define layout: arranger (top/center), clip-session (center), generator (right), mixer (bottom).
- [ ] H008 Add deck `arranger` as primary deck (sections + style/energy controls).
- [ ] H009 Add deck `clip-session` for launching arranged parts as clips.
- [ ] H010 Add deck `generator` for on-demand variations and fills.
- [ ] H011 Add deck `mixer` for balancing generated parts.
- [ ] H012 Add deck `properties` for per-part generation settings (seed, density, swing).
- [ ] H013 Implement arranger deck UI: chord progression input + section blocks + part toggles (drums/bass/pad).
- [ ] H014 Wire arranger to write outputs to per-track streams in `SharedEventStore` (one stream per part).
- [ ] H015 Ensure session grid references those streams via clips (ClipRegistry), not copies.
- [ ] H016 Add “Regenerate section” action that updates only the chosen section’s events.
- [ ] H017 Add “Freeze section” action that marks generated events as user-owned and stops regeneration.
- [ ] H018 Add “Humanize” (timing/velocity) controls per part and persist per board.
- [ ] H019 Add “Style” presets (lofi, house, ambient) mapped to generator params (no network required).
- [ ] H020 Add control-level indicators per track/part (generated vs manual override).
- [ ] H021 Add a “Capture to manual board” CTA that switches to a manual board with same streams active.
- [ ] H022 Add smoke test: arranger generates events; tracker/piano roll can view the same streams.
- [ ] H023 Add test: freeze prevents regeneration and is undoable.
- [ ] H024 Add docs: `cardplay/docs/boards/ai-arranger-board.md`.
- [ ] H025 Lock AI Arranger board once generation/freeze/session integration is stable.

### AI Composition Board (Directed) (H026–H050)

- [ ] H026 Create `cardplay/src/boards/builtins/ai-composition-board.ts` board definition.
- [ ] H027 Set id/name/description/icon to match `cardplayui.md` AI Composition Board.
- [ ] H028 Set `controlLevel: 'directed'` and “describe intent, system drafts” philosophy string.
- [ ] H029 Enable `aiComposer` tool in `command-palette` mode (MVP: local prompt templates).
- [ ] H030 Enable `phraseGenerators` tool in `on-demand` mode for iterative drafts.
- [ ] H031 Choose `primaryView: 'composer'` (AI composer panel) for this board.
- [ ] H032 Define layout: AI composer (left/right), notation (center), tracker (tab), timeline (bottom).
- [ ] H033 Add deck `ai-composer` as the prompt/command surface.
- [ ] H034 Add deck `notation-score` for editing the AI draft in notation.
- [ ] H035 Add deck `pattern-editor` as a tabbed alternative editor for the same stream.
- [ ] H036 Add deck `timeline` to arrange generated clips linearly.
- [ ] H037 Implement AI composer deck UI: prompt box, target scope (clip/section/track), and “Generate” button.
- [ ] H038 Define a local “prompt → generator config” mapping (no external model dependency).
- [ ] H039 Implement “Generate draft” to write events into a new stream + clip (ClipRegistry) for review.
- [ ] H040 Implement “Replace selection” vs “Append” vs “Generate variation” actions.
- [ ] H041 Add “diff preview” UI comparing existing vs proposed events (accept/reject with undo).
- [ ] H042 Add “constraints” UI (key, chord progression, density, register, rhythm feel).
- [ ] H043 If chord stream exists, allow “compose to chords” by passing chord context to generators.
- [ ] H044 Add “commit to library” actions (save generated phrase to phrase database).
- [ ] H045 Add shortcuts: open composer palette (Cmd+K), accept draft, reject draft, regenerate.
- [ ] H046 Add safety rails: never overwrite without an undo group + confirmation.
- [ ] H047 Add smoke test: generate draft creates clip + events, visible in notation and tracker.
- [ ] H048 Add test: reject draft restores original events and selection.
- [ ] H049 Add docs: `cardplay/docs/boards/ai-composition-board.md`.
- [ ] H050 Lock AI Composition board once command palette loop is stable and non-destructive.

### Generative Ambient Board (Generative) (H051–H075)

- [ ] H051 Create `cardplay/src/boards/builtins/generative-ambient-board.ts` board definition.
- [ ] H052 Set id/name/description/icon to match `cardplayui.md` Generative Ambient Board.
- [ ] H053 Set `controlLevel: 'generative'` and “system generates, you curate” philosophy string.
- [ ] H054 Enable `phraseGenerators` in `continuous` mode (background generation stream).
- [ ] H055 Enable `arrangerCard` in `autonomous` mode (optional; MVP can be continuous generators only).
- [ ] H056 Choose `primaryView: 'generator'` for this board.
- [ ] H057 Define layout: generator stream (center), mixer (bottom), timeline (right), properties (left).
- [ ] H058 Add deck `generator` as primary deck with continuous output view.
- [ ] H059 Add deck `mixer` to balance evolving layers.
- [ ] H060 Add deck `timeline` to capture “best moments” as arranged clips.
- [ ] H061 Add deck `properties` for global constraints (tempo range, density, harmony, randomness).
- [ ] H062 Implement continuous generation loop that proposes candidate clips/phrases over time.
- [ ] H063 Implement “accept” action to commit a candidate into `SharedEventStore` + ClipRegistry.
- [ ] H064 Implement “reject” action to discard candidate without mutating shared stores.
- [ ] H065 Implement “capture live” action that records a time window of generated output into a clip.
- [ ] H066 Add “freeze layer” action per generated layer (stop updates, keep events editable).
- [ ] H067 Add “regenerate layer” action with seed control and undo support.
- [ ] H068 Add “mood” presets (drone, shimmer, granular, minimalist) mapped to generator params.
- [ ] H069 Add visual “generated” badges and density meters in generator deck.
- [ ] H070 Add background CPU guardrails (max events/sec, max layers) and surface warnings.
- [ ] H071 Add smoke test: continuous generator produces candidates; accept commits into stores.
- [ ] H072 Add test: freeze prevents further mutation of frozen layers.
- [ ] H073 Add docs: `cardplay/docs/boards/generative-ambient-board.md`.
- [ ] H074 Run playground: let it generate, accept a few clips, then switch to a manual board to edit them.
- [ ] H075 Lock Generative Ambient board once continuous generation + curation loop is stable.

---

## Phase I: Hybrid Boards (I001–I075)

### Composer Board (Hybrid Power User) (I001–I025)

- [ ] I001 Create `cardplay/src/boards/builtins/composer-board.ts` board definition.
- [ ] I002 Set id/name/description/icon to match `cardplayui.md` Composer Board.
- [ ] I003 Set `controlLevel: 'collaborative'` and “mix manual + assisted per track” philosophy string.
- [ ] I004 Enable tools: phrase DB (drag-drop), harmony explorer (suggest), generators (on-demand), arranger (chord-follow).
- [ ] I005 Optionally enable `aiComposer` in `inline-suggest` mode (MVP can keep it hidden).
- [ ] I006 Choose `primaryView: 'composer'` for this board.
- [ ] I007 Base the layout on `src/ui/composer-deck-layout.ts` panel set.
- [ ] I008 Add deck `arranger` (sections bar) as top strip (reuse `arranger-sections-bar.ts` logic).
- [ ] I009 Add deck `chord-track` as top lane (reuse `chord-track-lane.ts` adapter logic).
- [ ] I010 Add deck `clip-session` as main grid (center).
- [ ] I011 Add deck `notation-score` as bottom editor (syncs to selected clip stream).
- [ ] I012 Add deck `pattern-editor` as an alternate bottom editor tab (tracker view of same stream).
- [ ] I013 Add deck `transport` in board chrome (play/stop/loop, tempo, count-in).
- [ ] I014 Add deck `generator` as a side panel for on-demand parts (melody/bass/drums/arp).
- [ ] I015 Add deck `phrase-library` as a side panel for drag/drop phrases (optional in MVP).
- [ ] I016 Add `composer-deck-bar` as a compact generator strip (reuse `composer-deck-bar.ts` state model).
- [ ] I017 Wire deck bar “generate” actions to write proposals into a preview area (accept/reject).
- [ ] I018 On accept, commit generated notes into the active clip’s stream with undo support.
- [ ] I019 Adapt generated phrases to chord track using `src/cards/phrase-adapter.ts` (voice-leading mode).
- [ ] I020 Implement scroll/zoom sync across arranger/chord/session/notation (use `composer-deck-layout.ts` types).
- [ ] I021 Implement per-track control levels (manual vs assisted vs directed) and show indicators on tracks.
- [ ] I022 Persist per-track control levels in board state (so sessions reopen with same autonomy mix).
- [ ] I023 Add docs: `cardplay/docs/boards/composer-board.md` (hybrid workflow + shortcuts).
- [ ] I024 Add integration tests: selecting a session clip updates notation/tracker editor context.
- [ ] I025 Lock Composer board once multi-panel sync + per-track control indicators are stable.

### Producer Board (Hybrid Production) (I026–I050)

- [ ] I026 Create `cardplay/src/boards/builtins/producer-board.ts` board definition.
- [ ] I027 Set id/name/description/icon to match `cardplayui.md` Producer Board.
- [ ] I028 Set `controlLevel: 'collaborative'` and “full production with optional generation” philosophy string.
- [ ] I029 Enable tools: generators (on-demand), arranger (manual-trigger), phrase DB (browse-only or drag-drop).
- [ ] I030 Keep AI composer optional; default hidden for MVP to reduce scope.
- [ ] I031 Choose `primaryView: 'timeline'` for this board.
- [ ] I032 Define layout: timeline (center), mixer (bottom), browser (left), dsp-chain (right), session (tab).
- [ ] I033 Add deck `timeline` as primary deck (arrangement view).
- [ ] I034 Add deck `mixer` as bottom deck (track strips + meters).
- [ ] I035 Add deck `instrument-browser` as left deck (add instruments/effects).
- [ ] I036 Add deck `dsp-chain` as right deck (device chain for selected track).
- [ ] I037 Add deck `clip-session` as a tab (for sketching + launching).
- [ ] I038 Add deck `properties` as a tab (inspect clips, events, devices).
- [ ] I039 Add deck `routing`/`modular` overlay access for complex routing (Phase J).
- [ ] I040 Implement per-track “control level” badges (manual vs generated) on mixer strips.
- [ ] I041 Implement “freeze generated track” action (turn generated streams into static editable events).
- [ ] I042 Implement “render/bounce” action (audio) for performance; keep metadata linking to source.
- [ ] I043 Implement automation lanes integration using `parameter-resolver.ts` (preset + automation + modulation).
- [ ] I044 Ensure timeline editing and session editing share the same clips (ClipRegistry invariants).
- [ ] I045 Add shortcuts: split, duplicate, consolidate, quantize, bounce, toggle mixer.
- [ ] I046 Add docs: `cardplay/docs/boards/producer-board.md` (end-to-end production workflow).
- [ ] I047 Add smoke test: adding a clip in session shows in timeline and vice versa.
- [ ] I048 Add smoke test: dsp-chain changes route through routing graph and are undoable.
- [ ] I049 Add perf pass: timeline virtualization for many clips; mixer meters throttling.
- [ ] I050 Lock Producer board once arrangement/mixer/device chain loop is usable and consistent.

### Live Performance Board (Hybrid Performance) (I051–I075)

- [ ] I051 Create `cardplay/src/boards/builtins/live-performance-board.ts` board definition.
- [ ] I052 Set id/name/description/icon to match `cardplayui.md` Live Performance Board.
- [ ] I053 Set `controlLevel: 'collaborative'` and “performance-first, mix manual + arranger” philosophy string.
- [ ] I054 Enable tools: arranger (chord-follow or autonomous), generators (on-demand), phrase DB (browse-only).
- [ ] I055 Choose `primaryView: 'session'` for this board.
- [ ] I056 Define layout: session grid (center), arranger (top), modular routing (right), mixer (bottom).
- [ ] I057 Add deck `clip-session` as primary deck (scene/clip launch optimized).
- [ ] I058 Add deck `arranger` as top deck (sections + energy controls for live structure).
- [ ] I059 Add deck `modular` as right deck (routing + modulation patching visible live).
- [ ] I060 Add deck `mixer` as bottom deck (quick mute/solo + meters).
- [ ] I061 Add deck `transport` with tempo tap, count-in, and quantized launch settings.
- [ ] I062 Add a “performance macros” strip (8 macro knobs) that drives parameter resolver targets.
- [ ] I063 Integrate `deck-reveal.ts` concepts: reveal a track’s instrument on click for deep tweaks.
- [ ] I064 Add MIDI activity visualization per track (reuse `midi-visualization.ts` where possible).
- [ ] I065 Add “panic” controls (all notes off, stop all clips, reset routing).
- [ ] I066 Add “capture performance” action that records session launch history into arrangement timeline.
- [ ] I067 Implement per-track control levels: some tracks arranged/generative, some manual live input.
- [ ] I068 Show per-track control level colors in session headers and mixer strips (Phase J control colors).
- [ ] I069 Add shortcuts: launch scene, stop, tempo tap, next/prev scene, toggle reveal, panic.
- [ ] I070 Add docs: `cardplay/docs/boards/live-performance-board.md` (setup + performance workflow).
- [ ] I071 Add smoke test: launching clips updates transport and visual play states at 60fps without leaks.
- [ ] I072 Add smoke test: tempo tap changes generator timing and metronome sync.
- [ ] I073 Add perf pass: meter updates throttled; render loop uses requestAnimationFrame.
- [ ] I074 Add resilience pass: disconnect/reconnect MIDI devices without crashing.
- [ ] I075 Lock Live Performance board once live workflow is responsive and reliable.

---

## Phase J: Routing, Theming, Shortcuts (J001–J060)

- [ ] J001 Define `BoardTheme` defaults for each control level (manual/hints/assisted/directed/generative).
- [ ] J002 Implement `applyBoardTheme(boardTheme)` that composes with `src/ui/theme.ts` CSS variables.
- [ ] J003 Add per-board theme variants: dark/light/high-contrast (reuse existing theme presets).
- [ ] J004 Add `boardThemeToCSSProperties()` bridging board theme into CSS custom properties.
- [ ] J005 Ensure board theme changes do not require remounting editors (pure CSS updates).
- [ ] J006 Implement control-level indicator colors per `cardplayui.md` §9.2.
- [ ] J007 Add track header UI affordances showing control level (badge + color strip).
- [ ] J008 Add deck header UI affordances showing deck control level override (if set).
- [ ] J009 Add “generated” vs “manual” styling for events (e.g., lighter alpha for generated).
- [ ] J010 Add a consistent icon set mapping for board icons and deck icons (single source).
- [ ] J011 Decide canonical shortcut system: consolidate `keyboard-shortcuts.ts` and `keyboard-navigation.ts`.
- [ ] J012 If consolidating, create `cardplay/src/ui/shortcuts/index.ts` and migrate registrations.
- [ ] J013 Implement `registerBoardShortcuts(board)` and `unregisterBoardShortcuts(board)` helpers.
- [ ] J014 Add `Cmd+B` board switch shortcut (global) and ensure no conflicts with deck tab switching.
- [ ] J015 Add `Cmd+1..9` deck tab switching scoped to active deck container.
- [ ] J016 Add `Cmd+K` command palette shortcut reserved for AI composer boards (hidden otherwise).
- [ ] J017 Add `Space/Enter/Esc` transport shortcuts consistent across all boards.
- [ ] J018 Add a “Shortcuts” help view listing active board + active deck shortcuts.
- [ ] J019 Ensure shortcut system pauses in text inputs except undo/redo.
- [ ] J020 Ensure shortcut system supports user remapping in the future (design now; implement later).
- [ ] J021 Create `cardplay/src/ui/components/routing-overlay.ts` to visualize routing graph over the board.
- [ ] J022 In routing overlay, render nodes for decks/cards/tracks using `routing-graph.ts`.
- [ ] J023 In routing overlay, render connections by type (audio/midi/mod/trigger) with color coding.
- [ ] J024 In routing overlay, allow click-to-connect (port → port) and validate via Phase D rules.
- [ ] J025 In routing overlay, allow drag-to-rewire connections and persist changes to routing graph store.
- [ ] J026 In routing overlay, integrate undo/redo for connection edits (`executeWithUndo`).
- [ ] J027 Add a “show routing” toggle in board chrome (and persist per board).
- [ ] J028 Add a “routing mini-map” mode for dense graphs (zoomed overview).
- [ ] J029 Integrate `DeckLayoutAdapter` audio nodes as routing endpoints for mixer/chain decks.
- [ ] J030 Ensure routing changes update audio engine graph (if audio engine bridge exists).
- [ ] J031 Add a “connection inspector” panel showing selected connection details (gain, type, ports).
- [ ] J032 Add visual feedback for incompatible connections (shake + tooltip with reason).
- [ ] J033 Ensure routing overlay respects reduced motion and high contrast.
- [ ] J034 Add unit tests for routing validation logic (Phase D already tests pure validation).
- [ ] J035 Add integration test: create a connection in overlay and verify routing graph store updated.
- [ ] J036 Add integration test: undo connection edit restores prior routing graph.
- [ ] J037 Create `cardplay/src/ui/components/board-theme-picker.ts` (optional) to switch theme variants.
- [ ] J038 Persist theme choice per board (or global) with a clear policy setting.
- [ ] J039 Ensure board switching optionally switches theme (configurable).
- [ ] J040 Add “control spectrum” UI element for hybrid boards (per-track sliders, optional MVP).
- [ ] J041 Define per-track control level data model (track id → control level) in board state.
- [ ] J042 Show per-track control level in session headers and mixer strips.
- [ ] J043 Show per-track control level in tracker track headers (color bar).
- [ ] J044 Show per-track control level in arrangement track list (color bar).
- [ ] J045 Add an accessibility announcement when control level changes (“Track Drums set to Directed”).
- [ ] J046 Ensure all new UI components use theme tokens (no hard-coded colors unless in token definitions).
- [ ] J047 Audit existing components for hard-coded colors that conflict with high-contrast theme.
- [ ] J048 Replace hard-coded colors with semantic tokens in key shared components (deck/container headers).
- [ ] J049 Ensure board chrome and deck headers are readable in all theme modes.
- [ ] J050 Add a “focus ring” standard for all interactive elements (reuse `focusRingCSS`).
- [ ] J051 Ensure routing overlay and modals follow the same focus/ARIA conventions.
- [ ] J052 Add “visual density” setting for tracker/session views (compact vs comfortable) per board.
- [ ] J053 Persist visual density setting per board and apply to tracker/session row heights.
- [ ] J054 Add docs: `cardplay/docs/boards/theming.md` describing board theme + control indicators.
- [ ] J055 Add docs: `cardplay/docs/boards/routing.md` describing routing overlay + validation rules.
- [ ] J056 Add docs: `cardplay/docs/boards/shortcuts.md` describing global + per-board shortcuts.
- [ ] J057 Run playground in high-contrast mode and verify board switcher + routing overlay usability.
- [ ] J058 Run an accessibility pass: keyboard-only navigation through board chrome and deck tabs.
- [ ] J059 Add a performance pass: routing overlay render loop throttling and efficient redraw.
- [ ] J060 Lock Phase J once routing/theming/shortcuts are consistent across boards.
---

## Phase K: QA, Performance, Docs, Release (K001–K030)

- [ ] K001 Add a `cardplay/docs/boards/` index page listing all builtin boards and their deck sets.
- [ ] K002 Add a “Board authoring guide” doc explaining how to add a new board end-to-end.
- [ ] K003 Add a “Deck authoring guide” doc explaining how to add a new `DeckType` + factory.
- [ ] K004 Add a “Project compatibility” doc explaining how boards share the same project format.
- [ ] K005 Add a “Board switching semantics” doc: what persists, what resets, what migrates.
- [ ] K006 Add E2E-ish tests (jsdom/puppeteer) that open board switcher and switch boards.
- [ ] K007 Add E2E-ish test: drag a phrase into tracker and assert events appear in store.
- [ ] K008 Add E2E-ish test: generate a clip in Session+Generators board and assert it appears in timeline.
- [ ] K009 Add E2E-ish test: edit same stream in tracker and notation and assert convergence.
- [ ] K010 Add a performance benchmark doc for tracker (rows/second, target FPS, dirty region usage).
- [ ] K011 Add a performance benchmark doc for piano roll (note count, zoom, selection performance).
- [ ] K012 Add a performance benchmark doc for session grid (grid size, clip state updates).
- [ ] K013 Add a performance benchmark doc for routing overlay (node/edge counts, redraw budget).
- [ ] K014 Add a simple benchmark harness in playground to stress-test large streams/clips.
- [ ] K015 Ensure all benchmarks can run without network access and without external services.
- [ ] K016 Add memory leak checks: verify subscriptions are cleaned up on board and deck unmount.
- [ ] K017 Add a test that rapidly switches boards 100 times and asserts no growth in subscriptions.
- [ ] K018 Add an accessibility checklist for each board (keyboard workflow, ARIA roles, contrast).
- [ ] K019 Run a high-contrast audit on board switcher, deck headers, routing overlay, and editors.
- [ ] K020 Add documentation for control spectrum and what each control level means (Part I alignment).
- [ ] K021 Add documentation for the deck/stack system (Part VII alignment) using repo examples.
- [ ] K022 Add documentation for connection routing (Part VIII alignment) using routing overlay screenshots.
- [ ] K023 Add documentation for theming and styling (Part IX alignment) with token tables.
- [ ] K024 Create a “Board v1 release checklist” (which boards ship, known limitations, migration notes).
- [ ] K025 Define “Board MVP” release criteria: at least 2 boards + switcher + persistence + gating + sync.
- [ ] K026 Define “Board v1” release criteria: all manual + assisted boards working; generative boards MVP.
- [ ] K027 Update `cardplay/README` or docs index to point users to the board-first entry points.
- [ ] K028 Run `npm run check` as the final gate and require green before release.
- [ ] K029 Cut a release note doc summarizing what changed and what’s next.
- [ ] K030 Lock Phase K when docs/tests/benchmarks exist and the board system is shippable.
---

## Phase L: Prolog AI Foundation (L001–L400)

**Goal:** Implement a Prolog-based AI reasoning system (NOT neural networks) for intelligent suggestions, deck layout recommendations, and compositional assistance. Uses declarative logic and rule-based inference.

### Prolog Engine Integration (L001–L030)

- [ ] L001 Research Prolog-in-JavaScript implementations (Tau-Prolog, https://github.com/kkty/prolog, SWI-Prolog WASM).
- [ ] L002 Evaluate Tau-Prolog vs kkty/prolog for browser compatibility, feature set, and bundle size.
- [ ] L003 Choose primary Prolog engine and document decision in `docs/ai/prolog-engine-choice.md`.
- [ ] L004 Install chosen Prolog engine via npm (e.g., `npm install tau-prolog`).
- [ ] L005 Create `cardplay/src/ai/` folder for all AI/Prolog-related code.
- [ ] L006 Create `cardplay/src/ai/engine/prolog-adapter.ts` wrapping the Prolog engine API.
- [ ] L007 In `prolog-adapter.ts`, implement `loadProgram(prologCode: string)` to load clauses.
- [ ] L008 In `prolog-adapter.ts`, implement `query(queryString: string)` returning solutions.
- [ ] L009 In `prolog-adapter.ts`, implement `querySingle(queryString: string)` returning first solution.
- [ ] L010 In `prolog-adapter.ts`, implement `queryAll(queryString: string)` returning all solutions.
- [ ] L011 In `prolog-adapter.ts`, implement error handling for malformed queries.
- [ ] L012 In `prolog-adapter.ts`, implement timeout mechanism for infinite loops.
- [ ] L013 Create `cardplay/src/ai/engine/prolog-worker.ts` to run Prolog in a Web Worker (optional perf optimization).
- [ ] L014 Add `cardplay/src/ai/engine/prolog-adapter.test.ts` testing basic query/unify operations.
- [ ] L015 Test: load simple facts (`parent(tom, bob)`) and query (`?- parent(tom, X)`).
- [ ] L016 Test: load rules (`grandparent(X, Z) :- parent(X, Y), parent(Y, Z)`) and query.
- [ ] L017 Test: verify backtracking works correctly (multiple solutions).
- [ ] L018 Test: verify cut operator (`!`) works as expected.
- [ ] L019 Test: verify negation-as-failure (`\+`) works.
- [ ] L020 Create `cardplay/src/ai/knowledge/index.ts` as barrel export for all knowledge bases.
- [ ] L021 Define standard Prolog I/O adapter for JSON term conversion (Prolog terms ↔ JS objects), including a canonical encoding for `HostAction` terms (set any card param / invoke any card method).
- [ ] L022 Implement `termToJS(prologTerm): any` converting Prolog term to JavaScript value.
- [ ] L023 Implement `jsToTerm(jsValue: any): PrologTerm` converting JavaScript value to Prolog term.
- [ ] L024 Add tests for term conversion: lists, atoms, numbers, compound terms, and `HostAction` terms.
- [ ] L025 Document Prolog syntax conventions in `docs/ai/prolog-syntax.md`.
- [ ] L026 Document query patterns in `docs/ai/query-patterns.md`.
- [ ] L027 Add performance benchmark: 10,000 simple queries/sec target.
- [ ] L028 Add memory benchmark: Prolog engine should use <10MB for typical knowledge bases.
- [ ] L029 Create `cardplay/src/ai/engine/prolog-cache.ts` for query result memoization (optional).
- [ ] L030 Lock Prolog engine integration once tests pass and performance is acceptable.

### Music Theory Knowledge Base (L031–L080)

- [ ] L031 Create `cardplay/src/ai/knowledge/music-theory.pl` Prolog file.
- [ ] L032 Define `note/1` facts for all 12 chromatic notes (c, csharp, d, ..., b).
- [ ] L033 Define `interval/3` facts relating two notes and their interval (e.g., `interval(c, e, major_third)`).
- [ ] L034 Define `scale/2` rules defining scales (e.g., `scale(major, [2,2,1,2,2,2,1])`).
- [ ] L035 Define `scale_degrees/3` relating scale type, root, and resulting notes.
- [ ] L036 Define `chord/2` facts for chord types (major, minor, dim, aug, dom7, etc.).
- [ ] L037 Define `chord_tones/3` relating chord root, type, and notes.
- [ ] L038 Define `chord_progression/2` facts for common progressions (I-IV-V, ii-V-I, etc.).
- [ ] L039 Define `voice_leading_rule/3` rules for smooth voice leading.
- [ ] L040 Define `harmonic_function/2` relating chords to tonic/subdominant/dominant function.
- [ ] L041 Define `cadence/2` facts for cadence types (authentic, plagal, deceptive, half).
- [ ] L042 Define `mode/2` facts for modes (ionian, dorian, phrygian, lydian, mixolydian, aeolian, locrian).
- [ ] L043 Define `enharmonic_equivalent/2` relating enharmonic note pairs.
- [ ] L044 Define `note_distance/3` computing semitone distance between two notes.
- [ ] L045 Define `transpose/3` transposing a note by interval.
- [ ] L046 Define `invert_interval/2` inverting an interval (third ↔ sixth, etc.).
- [ ] L047 Define `consonance/2` rating intervals as consonant/dissonant.
- [ ] L048 Define `tension/2` rating chords by harmonic tension level.
- [ ] L049 Add `cardplay/src/ai/knowledge/music-theory-loader.ts` loading the .pl file.
- [ ] L050 In loader, load music theory program into Prolog engine on init.
- [ ] L051 Create `cardplay/src/ai/queries/theory-queries.ts` with helper query functions.
- [ ] L052 Implement `getScaleNotes(root: string, scaleType: string): string[]`.
- [ ] L053 Implement `getChordTones(root: string, chordType: string): string[]`.
- [ ] L054 Implement `suggestNextChord(currentChord: string, key: string): string[]`.
- [ ] L055 Implement `checkVoiceLeading(chord1: Note[], chord2: Note[]): boolean`.
- [ ] L056 Implement `transposeNotes(notes: string[], interval: number): string[]`.
- [ ] L057 Implement `identifyChord(notes: string[]): { root: string, type: string }[]`.
- [ ] L058 Implement `identifyScale(notes: string[]): { root: string, type: string }[]`.
- [ ] L059 Add tests: query `getScaleNotes('c', 'major')` returns `['c', 'd', 'e', 'f', 'g', 'a', 'b']`.
- [ ] L060 Add tests: query `getChordTones('c', 'major')` returns `['c', 'e', 'g']`.
- [ ] L061 Add tests: query `suggestNextChord('cmaj', 'c')` returns valid progressions.
- [ ] L062 Add tests: verify voice leading checks work for common chord pairs.
- [ ] L063 Define `diatonic_chord/3` relating scale degree to chord quality.
- [ ] L064 Define `borrowed_chord/3` for modal mixture chords.
- [ ] L065 Define `secondary_dominant/2` for secondary dominants (V/V, V/IV, etc.).
- [ ] L066 Define `tritone_substitution/2` for jazz substitutions.
- [ ] L067 Define `extended_chord/2` for 9th, 11th, 13th chords.
- [ ] L068 Define `chord_extension_compatibility/3` rules for which extensions work with which chords.
- [ ] L069 Add melodic contour rules (`ascending/1`, `descending/1`, `arch/1`, `valley/1`).
- [ ] L070 Add rhythmic pattern rules (`syncopated/1`, `straight/1`, `triplet/1`).
- [ ] L071 Add metric rules (`strong_beat/2`, `weak_beat/2`, `downbeat/1`).
- [ ] L072 Add phrase structure rules (`antecedent/1`, `consequent/1`, `period/2`).
- [ ] L073 Add orchestration rules (`register_suitable/3` for instrument ranges).
- [ ] L074 Add texture rules (`monophonic/1`, `homophonic/1`, `polyphonic/1`, `heterophonic/1`).
- [ ] L075 Document all music theory predicates in `docs/ai/music-theory-predicates.md`.
- [ ] L076 Add example queries for common use cases in docs.
- [ ] L077 Run comprehensive test suite: 50+ music theory queries.
- [ ] L078 Benchmark music theory queries: should complete in <10ms each.
- [ ] L079 Verify knowledge base loads without errors on engine init.
- [ ] L080 Lock music theory KB once all predicates work and are documented.

### Deck & Board Knowledge Base (L081–L130)

- [ ] L081 Create `cardplay/src/ai/knowledge/board-layout.pl` Prolog file.
- [ ] L082 Define `board/2` facts for each board type (id, control_level).
- [ ] L083 Define `deck_type/1` facts for all deck types (pattern_editor, phrase_library, etc.).
- [ ] L084 Define `board_has_deck/2` relating boards to their decks.
- [ ] L085 Define `deck_compatible_with_control_level/2` rules.
- [ ] L086 Define `tool_required_for_deck/2` relating deck types to required tools.
- [ ] L087 Define `deck_layout_rule/3` rules for optimal deck placement.
- [ ] L088 Define `panel_size_suggestion/3` suggesting panel sizes based on deck type.
- [ ] L089 Define `deck_pairing/2` suggesting which decks work well together.
- [ ] L090 Define `workflow/2` facts for user workflow types (notation-composer, tracker-user, etc.).
- [ ] L091 Define `workflow_requires_deck/2` relating workflows to essential decks.
- [ ] L092 Define `workflow_benefits_from_deck/2` relating workflows to optional helpful decks.
- [ ] L093 Define `recommended_board/2` relating workflows to recommended boards.
- [ ] L094 Define `board_transition/3` rules for smooth board switching.
- [ ] L095 Define `deck_open_order/2` suggesting order to open decks for a workflow.
- [ ] L096 Add `cardplay/src/ai/queries/board-queries.ts` with helper query functions.
- [ ] L097 Implement `recommendBoardForWorkflow(workflow: string): BoardId[]`.
- [ ] L098 Implement `suggestDeckLayout(boardId: string, userPrefs: any): LayoutSuggestion`.
- [ ] L099 Implement `validateDeckCombination(deckTypes: string[]): { valid: boolean, reason?: string }`.
- [ ] L100 Implement `suggestNextDeckToOpen(currentDecks: string[], workflow: string): string[]`.
- [ ] L101 Implement `optimizePanelSizes(decks: DeckInstance[]): Record<string, number>`.
- [ ] L102 Add tests: query `recommendBoardForWorkflow('notation-composer')` returns notation-harmony board.
- [ ] L103 Add tests: validate deck combinations (tracker + phrase library = valid on assisted board).
- [ ] L104 Add tests: suggest next deck to open given current context.
- [ ] L105 Define `keyboard_shortcut_conflict/2` detecting shortcut conflicts.
- [ ] L106 Define `shortcut_suggestion/3` suggesting shortcuts for deck actions.
- [ ] L107 Define `theme_appropriate/2` relating themes to board types.
- [ ] L108 Define `color_coding_rule/3` for control level indicators.
- [ ] L109 Define `deck_visibility_rule/3` based on tool modes and control levels.
- [ ] L110 Define `empty_state_suggestion/2` suggesting what to show in empty decks.
- [ ] L111 Define `tutorial_sequence/2` suggesting tutorial steps for a board.
- [ ] L112 Define `help_topic/2` relating user actions to help documentation.
- [ ] L113 Define `performance_constraint/3` rules for deck count limits.
- [ ] L114 Define `accessibility_rule/3` for keyboard navigation patterns.
- [ ] L115 Define `beginner_safety_rule/2` preventing overwhelming UX for beginners.
- [ ] L116 Add tests: shortcut conflict detection works.
- [ ] L117 Add tests: theme appropriateness suggestions work.
- [ ] L118 Add tests: tutorial sequence generation works for each board.
- [ ] L119 Document all board/deck predicates in `docs/ai/board-predicates.md`.
- [ ] L120 Run comprehensive test suite: 30+ board/deck queries.
- [ ] L121 Benchmark board queries: should complete in <10ms each.
- [ ] L122 Verify board knowledge base loads without errors.
- [ ] L123 Integrate board KB loading with board system initialization.
- [ ] L124 Ensure KB updates when new boards are registered dynamically.
- [ ] L125 Add hot-reload support for KB during development (optional).
- [ ] L126 Add KB validation: ensure all referenced boards/decks exist in registry.
- [ ] L127 Add KB consistency checks: no contradictory rules.
- [ ] L128 Document KB extension points for custom boards.
- [ ] L129 Add example: custom board recommendation rules.
- [ ] L130 Lock board/deck KB once integrated and tested.

### Compositional Pattern Knowledge Base (L131–L180)

- [ ] L131 Create `cardplay/src/ai/knowledge/composition-patterns.pl` Prolog file.
- [ ] L132 Define `genre/1` facts for music genres (lofi, house, ambient, jazz, classical, etc.).
- [ ] L133 Define `genre_characteristic/2` relating genres to musical characteristics.
- [ ] L134 Define `genre_tempo_range/3` (genre, min_bpm, max_bpm).
- [ ] L135 Define `genre_typical_instruments/2` (genre, instrument_list).
- [ ] L136 Define `genre_harmonic_language/2` (genre, harmony_style).
- [ ] L137 Define `genre_rhythmic_feel/2` (genre, rhythm_type).
- [ ] L138 Define `phrase_length/2` typical phrase lengths for genres (2/4/8/16 bars).
- [ ] L139 Define `section_type/1` (intro, verse, chorus, bridge, outro, drop, buildup).
- [ ] L140 Define `section_order/2` typical section orderings for genres.
- [ ] L141 Define `arrangement_template/3` (genre, length, section_list).
- [ ] L142 Define `energy_curve/2` typical energy progression for sections.
- [ ] L143 Define `density_rule/3` rules for instrument density by section.
- [ ] L144 Define `layering_rule/3` rules for when to add/remove layers.
- [ ] L145 Define `contrast_rule/2` ensuring sufficient contrast between sections.
- [ ] L146 Define `repetition_rule/2` rules for acceptable repetition amounts.
- [ ] L147 Define `variation_technique/2` (sequence, inversion, augmentation, diminution, etc.).
- [ ] L148 Define `bass_pattern/2` common bass patterns by genre.
- [ ] L149 Define `drum_pattern/2` common drum patterns by genre.
- [ ] L150 Define `chord_rhythm/2` typical chord change rates.
- [ ] L151 Define `melodic_range/3` appropriate ranges for instruments/voices.
- [ ] L152 Define `counterpoint_rule/2` rules for independent melodic lines.
- [ ] L153 Define `harmony_rhythm/2` harmonic rhythm patterns.
- [ ] L154 Add `cardplay/src/ai/queries/composition-queries.ts` helper functions.
- [ ] L155 Implement `suggestArrangement(genre: string, targetLength: number): Section[]`.
- [ ] L156 Implement `suggestBassLine(chordProgression: Chord[], genre: string): Note[]`.
- [ ] L157 Implement `suggestDrumPattern(genre: string, energy: number): Pattern`.
- [ ] L158 Implement `suggestMelody(chordProgression: Chord[], constraints: any): Note[]`.
- [ ] L159 Implement `validateArrangement(sections: Section[]): ValidationResult`.
- [ ] L160 Implement `suggestVariation(originalPhrase: Note[]): Note[]`.
- [ ] L161 Implement `suggestNextSection(currentSections: Section[], genre: string): SectionType`.
- [ ] L162 Add tests: arrangement suggestions match genre conventions.
- [ ] L163 Add tests: bass line suggestions follow harmonic progression.
- [ ] L164 Add tests: drum pattern suggestions match genre style.
- [ ] L165 Add tests: melody suggestions respect chord tones and scale.
- [ ] L166 Define `motif_development/2` rules for developing musical motifs.
- [ ] L167 Define `texture_transition/3` rules for smooth texture changes.
- [ ] L168 Define `dynamic_contour/2` typical dynamic shapes.
- [ ] L169 Define `articulation_pattern/2` articulation choices by genre.
- [ ] L170 Define `swing_feel/2` swing amount by genre.
- [ ] L171 Define `humanization_rule/3` rules for timing/velocity variation.
- [ ] L172 Define `fill_placement/2` where to place fills in patterns.
- [ ] L173 Define `transition_technique/2` techniques for section transitions.
- [ ] L174 Document all composition predicates in `docs/ai/composition-predicates.md`.
- [ ] L175 Run comprehensive test suite: 40+ composition queries.
- [ ] L176 Benchmark composition queries: most should complete in <50ms.
- [ ] L177 Add example compositions using KB rules in docs.
- [ ] L178 Verify KB produces musically coherent suggestions.
- [ ] L179 Add manual review process for generated patterns (quality check).
- [ ] L180 Lock composition KB once suggestions are musically valid.

### Generator Integration (L181–L220)

- [ ] L181 Create `cardplay/src/ai/generators/` folder for Prolog-driven generators.
- [ ] L182 Create `cardplay/src/ai/generators/bass-generator.ts` using Prolog KB.
- [ ] L183 In bass generator, query composition KB for genre-appropriate patterns.
- [ ] L184 In bass generator, query theory KB for chord-tone based lines.
- [ ] L185 In bass generator, implement `generate(chords, genre, options)` method.
- [ ] L186 In bass generator, convert Prolog suggestions to Event records.
- [ ] L187 Create `cardplay/src/ai/generators/melody-generator.ts` using Prolog KB.
- [ ] L188 In melody generator, query composition KB for melodic contours.
- [ ] L189 In melody generator, query theory KB for scale/chord compatibility.
- [ ] L190 In melody generator, implement `generate(chords, key, options)` method.
- [ ] L191 Create `cardplay/src/ai/generators/drum-generator.ts` using Prolog KB.
- [ ] L192 In drum generator, query composition KB for genre patterns.
- [ ] L193 In drum generator, implement `generate(genre, energy, options)` method.
- [ ] L194 Create `cardplay/src/ai/generators/chord-progression-generator.ts`.
- [ ] L195 In chord generator, query theory KB for progressions.
- [ ] L196 In chord generator, implement `generate(key, length, style)` method.
- [ ] L197 Create `cardplay/src/ai/generators/arpeggio-generator.ts`.
- [ ] L198 In arpeggio generator, query theory KB for chord tones.
- [ ] L199 In arpeggio generator, implement `generate(chord, pattern, options)` method.
- [ ] L200 Integrate generators with existing generator cards in `src/cards/`.
- [ ] L201 Update generator card implementations to use Prolog-based generators.
- [ ] L202 Ensure generator outputs respect phrase adapter for transposition.
- [ ] L203 Add `seed` parameter to all generators for reproducibility.
- [ ] L204 Add `temperature` parameter controlling randomness/variation.
- [ ] L205 Add `constraints` parameter for user-specified rules.
- [ ] L206 Implement constraint validation using Prolog queries.
- [ ] L207 Add `explainGeneration()` method returning Prolog rule trace.
- [ ] L208 Add tests: bass generator produces valid notes for given chords.
- [ ] L209 Add tests: melody generator respects key and scale constraints.
- [ ] L210 Add tests: drum generator output matches genre characteristics.
- [ ] L211 Add tests: chord progression follows harmonic rules.
- [ ] L212 Add tests: generators produce deterministic output with same seed.
- [ ] L213 Add performance test: generators complete in <100ms for 8-bar phrase.
- [ ] L214 Add quality test: generated phrases are musically coherent (manual review).
- [ ] L215 Document generator API in `docs/ai/generators.md`.
- [ ] L216 Document how to add custom generator rules to KB.
- [ ] L217 Add example: custom bass pattern rule for new genre.
- [ ] L218 Integrate generators with deck factories (generator deck uses Prolog generators).
- [ ] L219 Add UI controls for generator parameters (seed, temperature, constraints).
- [ ] L220 Lock generator integration once all generators work and are tested.

### Phrase Adaptation (L221–L250)

- [ ] L221 Enhance `src/cards/phrase-adapter.ts` with Prolog-based adaptation.
- [ ] L222 Add Prolog queries to phrase adapter for voice-leading analysis.
- [ ] L223 Implement `adaptPhraseToChord(phrase, targetChord, adaptMode)` using KB.
- [ ] L224 Implement `transpose` mode using Prolog interval rules.
- [ ] L225 Implement `chord-tone` mode using Prolog chord-tone queries.
- [ ] L226 Implement `scale-degree` mode using Prolog scale queries.
- [ ] L227 Implement `voice-leading` mode using Prolog voice-leading rules.
- [ ] L228 Add `preserveRhythm` option ensuring rhythm unchanged during adaptation.
- [ ] L229 Add `preserveContour` option maintaining melodic shape.
- [ ] L230 Add `allowChromaticism` option for passing tones.
- [ ] L231 Add Prolog rules for phrase similarity measurement.
- [ ] L232 Implement `findSimilarPhrases(phrase, phraseDB)` using similarity rules.
- [ ] L233 Add tests: phrase adaptation maintains rhythmic structure.
- [ ] L234 Add tests: chord-tone adaptation maps to target chord correctly.
- [ ] L235 Add tests: voice-leading mode produces smooth transitions.
- [ ] L236 Add tests: scale-degree mode preserves melodic function.
- [ ] L237 Add performance test: adaptation completes in <20ms.
- [ ] L238 Document phrase adaptation modes in `docs/ai/phrase-adaptation.md`.
- [ ] L239 Add UI for selecting adaptation mode in phrase library deck.
- [ ] L240 Integrate adapted phrases with undo system.
- [ ] L241 Add preview mode showing adaptation before applying.
- [ ] L242 Add "explain adaptation" feature showing Prolog rule trace.
- [ ] L243 Create `cardplay/src/ai/knowledge/phrase-similarity.pl`.
- [ ] L244 Define `phrase_similarity/3` computing similarity score.
- [ ] L245 Define `rhythm_similarity/3` comparing rhythmic patterns.
- [ ] L246 Define `contour_similarity/3` comparing melodic shapes.
- [ ] L247 Define `harmonic_similarity/3` comparing harmonic content.
- [ ] L248 Implement phrase search using similarity queries.
- [ ] L249 Add tests: similar phrases are ranked correctly.
- [ ] L250 Lock phrase adaptation once all modes work and are documented.

### Harmony Explorer (L251–L280)

- [ ] L251 Create `cardplay/src/ai/harmony/harmony-explorer.ts` using Prolog KB.
- [ ] L252 Implement `suggestNextChords(currentChord, key, context)` using KB queries.
- [ ] L253 Implement `analyzeProgression(chords)` returning harmonic analysis.
- [ ] L254 Implement `suggestReharmonization(melody, chords)` using substitution rules.
- [ ] L255 Implement `identifyKey(notes)` using Prolog key detection rules.
- [ ] L256 Implement `suggestModulation(currentKey, targetKey)` using KB.
- [ ] L257 Add Prolog rules for chord function analysis (T, SD, D).
- [ ] L258 Add Prolog rules for non-functional harmony (modal, chromatic).
- [ ] L259 Add Prolog rules for jazz harmony (extensions, alterations, substitutions).
- [ ] L260 Add Prolog rules for voice leading quality scoring.
- [ ] L261 Integrate harmony explorer with harmony-display deck.
- [ ] L262 Add UI showing suggested next chords in harmony deck.
- [ ] L263 Add UI showing harmonic analysis of current progression.
- [ ] L264 Add clickable chord suggestions that write to chord stream.
- [ ] L265 Add "explain suggestion" tooltip showing Prolog reasoning.
- [ ] L266 Add tests: next chord suggestions are harmonically valid.
- [ ] L267 Add tests: reharmonization preserves melodic compatibility.
- [ ] L268 Add tests: key identification works for common keys.
- [ ] L269 Add tests: modulation suggestions are smooth.
- [ ] L270 Add performance test: harmony queries complete in <10ms.
- [ ] L271 Document harmony explorer API in `docs/ai/harmony-explorer.md`.
- [ ] L272 Add example: analyzing a standard jazz progression.
- [ ] L273 Add example: suggesting modal interchange chords.
- [ ] L274 Create `cardplay/src/ai/knowledge/voice-leading.pl`.
- [ ] L275 Define `voice_leading_cost/3` scoring voice leading quality.
- [ ] L276 Define `optimal_voicing/3` finding best voicing for a chord.
- [ ] L277 Define `parallel_motion_check/2` detecting parallel fifths/octaves.
- [ ] L278 Integrate voice leading analysis with notation deck coloring.
- [ ] L279 Add tests: voice leading cost function ranks correctly.
- [ ] L280 Lock harmony explorer once integrated and tested.

### AI Advisor Query Interface (L281–L320)

- [ ] L281 Create `cardplay/src/ai/advisor/advisor-interface.ts` as main AI entry point.
- [ ] L282 Implement `ask(question: string, context: any): Answer` natural language interface (plus optional `HostAction[]` so answers can control other cards via param/method calls).
- [ ] L283 Add simple NL→Prolog query translator for common questions.
- [ ] L284 Support questions like "What chord should I use next?"
- [ ] L285 Support questions like "How do I create a lofi hip hop beat?"
- [ ] L286 Support questions like "Which board should I use for notation?"
- [ ] L287 Support questions like "What's wrong with this chord progression?"
- [ ] L288 Implement context gathering from active board/deck/stream.
- [ ] L289 Implement Prolog query construction from question + context, returning both data answers and optional `HostAction` terms.
- [ ] L290 Implement answer formatting from Prolog results (including decoding `HostAction` terms into capability-checked actions).
- [ ] L291 Add confidence scoring for answers.
- [ ] L292 Add "I don't know" response when KB has no answer.
- [ ] L293 Add follow-up question suggestions.
- [ ] L294 Create `cardplay/src/ui/components/ai-advisor-panel.ts` UI component.
- [ ] L295 In advisor panel, add text input for questions.
- [ ] L296 In advisor panel, show answer with confidence indicator.
- [ ] L297 In advisor panel, show "why" explanation with Prolog trace.
- [ ] L298 In advisor panel, show actionable suggestions (buttons to apply or `host-action` payloads that can be dragged/arranged in editors).
- [ ] L299 Add advisor panel as optional deck type (`DeckType: ai-advisor`).
- [ ] L300 Integrate advisor with Cmd+K command palette on AI boards.
- [ ] L301 Add conversation history in advisor panel (last 10 Q&A pairs).
- [ ] L302 Add bookmark feature for useful answers.
- [ ] L303 Add tests: common questions produce valid answers.
- [ ] L304 Add tests: context from active stream is used correctly.
- [ ] L305 Add tests: confidence scoring reflects KB coverage.
- [ ] L306 Document advisor interface in `docs/ai/advisor.md`.
- [ ] L307 Add example conversations for each persona.
- [ ] L308 Add keyboard shortcut to open advisor (Cmd+/ or Cmd+?).
- [ ] L309 Add "Ask AI" context menu item in various decks; allow it to return `HostAction[]` that can target any card’s params/methods (capability-checked).
- [ ] L310 Implement "explain this" feature (right-click event/chord → ask AI).
- [ ] L311 Add telemetry for question patterns (dev-only, privacy-safe).
- [ ] L312 Use telemetry to improve NL→query translator.
- [ ] L313 Add "report incorrect answer" feedback button.
- [ ] L314 Create feedback log for KB improvement.
- [ ] L315 Add performance test: Q&A cycle completes in <100ms.
- [ ] L316 Add UX test: advisor is discoverable and helpful.
- [ ] L317 Add safety checks: advisor never suggests destructive actions without confirmation.
- [ ] L318 Add "AI Off" mode indicator (advisor hidden when tools disabled).
- [ ] L319 Document how to extend advisor with custom rules.
- [ ] L320 Lock AI advisor interface once integrated and usable.

### Learning & Personalization (L321–L360)

- [ ] L321 Create `cardplay/src/ai/learning/user-preferences.ts` for preference tracking.
- [ ] L322 Track user's preferred boards and deck layouts.
- [ ] L323 Track user's favorite generator settings (seed, style, constraints).
- [ ] L324 Track user's common workflows and patterns.
- [ ] L325 Create `cardplay/src/ai/knowledge/user-prefs.pl` dynamic KB.
- [ ] L326 Define `user_prefers_board/2` dynamic facts.
- [ ] L327 Define `user_workflow/2` learned workflow patterns.
- [ ] L328 Define `user_genre_preference/2` genre usage stats.
- [ ] L329 Define `user_skill_level/2` estimated skill per area.
- [ ] L330 Implement `updateUserPreferences(action, context)` to learn from usage.
- [ ] L331 Implement `getUserPreferences(): UserPrefs` to query learned prefs.
- [ ] L332 Integrate user prefs with board recommendations.
- [ ] L333 Integrate user prefs with generator defaults.
- [ ] L334 Integrate user prefs with advisor suggestions.
- [ ] L335 Add privacy controls: all learning is local-only (no network).
- [ ] L336 Add "reset preferences" action.
- [ ] L337 Add "export preferences" action (JSON format).
- [ ] L338 Add "import preferences" action.
- [ ] L339 Add UI showing what AI has learned about user.
- [ ] L340 Add UI controls to correct AI's assumptions.
- [ ] L341 Add tests: preference tracking works correctly.
- [ ] L342 Add tests: learned prefs improve recommendations.
- [ ] L343 Add tests: privacy controls prevent data leakage.
- [ ] L344 Create `cardplay/src/ai/knowledge/adaptation.pl` for adaptive rules.
- [ ] L345 Define `adapt_suggestion/3` adapting suggestions to user level.
- [ ] L346 Define `beginner_simplification/2` simplifying for beginners.
- [ ] L347 Define `expert_enhancement/2` adding depth for experts.
- [ ] L348 Implement adaptive help text based on skill level.
- [ ] L349 Implement adaptive tutorial sequences.
- [ ] L350 Implement adaptive default values.
- [ ] L351 Add tests: adaptation rules respond to skill level correctly.
- [ ] L352 Add tests: beginners get simpler suggestions than experts.
- [ ] L353 Document learning system in `docs/ai/learning.md`.
- [ ] L354 Document privacy guarantees.
- [ ] L355 Document data retention policy (how long prefs are kept).
- [ ] L356 Add manual override for all learned preferences.
- [ ] L357 Add performance test: preference queries complete in <5ms.
- [ ] L358 Add UX test: learning improves over time without being intrusive.
- [ ] L359 Ensure learning doesn't bias users toward specific workflows.
- [ ] L360 Lock learning system once privacy-safe and helpful.

### Offline & Performance (L361–L400)

- [ ] L361 Ensure all Prolog KB files are bundled with app (no network dependency).
- [ ] L362 Ensure all AI features work 100% offline.
- [ ] L363 Add KB preloading during app startup.
- [ ] L364 Add KB lazy-loading for optional advanced features.
- [ ] L365 Implement KB caching in IndexedDB for fast reload.
- [ ] L366 Add KB version management for updates.
- [ ] L367 Add KB migration system for schema changes.
- [ ] L368 Optimize Prolog query performance with indexing.
- [ ] L369 Add query result caching with LRU eviction.
- [ ] L370 Add query batching for multiple related queries.
- [ ] L371 Profile Prolog queries and identify slow predicates.
- [ ] L372 Optimize slow predicates (rewrite rules, add cuts, etc.).
- [ ] L373 Add performance monitoring for all AI queries.
- [ ] L374 Add performance budget: 95th percentile < 50ms for queries.
- [ ] L375 Add performance test suite covering all query types.
- [ ] L376 Add memory monitoring for Prolog engine.
- [ ] L377 Add memory budget: Prolog engine < 20MB total.
- [ ] L378 Implement KB unloading for unused features.
- [ ] L379 Add developer tools for KB debugging.
- [ ] L380 Add Prolog trace viewer (optional dev tool).
- [ ] L381 Add KB coverage reporting (which rules are used).
- [ ] L382 Add KB consistency checker (detect contradictions).
- [ ] L383 Add tests: all AI features work offline.
- [ ] L384 Add tests: KB loads without errors on cold start.
- [ ] L385 Add tests: KB versioning works correctly.
- [ ] L386 Add tests: performance budgets are met.
- [ ] L387 Add tests: memory budgets are met.
- [ ] L388 Document KB architecture in `docs/ai/architecture.md`.
- [ ] L389 Document KB performance characteristics.
- [ ] L390 Document KB extension guide for contributors.
- [ ] L391 Add example: adding a new genre to composition KB.
- [ ] L392 Add example: adding a new voice-leading rule.
- [ ] L393 Create `cardplay/docs/ai/prolog-reference.md` for all predicates.
- [ ] L394 Create predicate index by category.
- [ ] L395 Add search functionality for predicate docs.
- [ ] L396 Verify all AI features integrate with board system.
- [ ] L397 Run full AI test suite (300+ tests).
- [ ] L398 Run full AI benchmark suite.
- [ ] L399 Verify AI features respect "AI Off" mode on manual boards.
- [ ] L400 Lock Phase L complete once all Prolog AI features are stable and performant.

---

## Phase M: Persona-Specific Enhancements (M001–M400)

**Goal:** Deep workflow enhancements for each user persona, focusing on board configurations, deck arrangements, and persona-specific AI reasoning about parameters and routing.

### Notation Composer Persona (M001–M080)

- [ ] M001 Create `cardplay/src/ai/knowledge/persona-notation-composer.pl`.
- [ ] M002 Define `notation_workflow/2` facts describing common notation tasks.
- [ ] M003 Define `score_preparation_workflow/1` (parts extraction, page layout, printing).
- [ ] M004 Define `engraving_rule/2` for high-quality score formatting.
- [ ] M005 Define `part_layout_rule/3` for individual instrument parts.
- [ ] M006 Define `rehearsal_mark_placement/2` rules.
- [ ] M007 Define `dynamics_placement/2` rules for dynamics positioning.
- [ ] M008 Define `articulation_consistency/2` rules.
- [ ] M009 Add Prolog rules for deck configuration: notation board should have properties + browser + dsp-chain.
- [ ] M010 Add rules for recommended deck sizes: notation deck = 70% width, properties = 30%.
- [ ] M011 Add rules for notation-specific keyboard shortcuts (beam grouping, slur placement, etc.).
- [ ] M012 Implement `suggestScoreLayout(instrumentation): LayoutParams`.
- [ ] M013 Implement `suggestPageBreaks(score, measures): number[]`.
- [ ] M014 Implement `checkEngravingQuality(score): Issue[]`.
- [ ] M015 Implement `suggestArticulations(phrase, style): Articulation[]`.
- [ ] M016 Add tests: score layout suggestions match instrumentation.
- [ ] M017 Add tests: page breaks avoid awkward splits.
- [ ] M018 Create `cardplay/src/boards/personas/notation-composer-enhancements.ts`.
- [ ] M019 Add notation-specific context menu items (add staff, change clef, transpose).
- [ ] M020 Add notation-specific inspector panel showing measure/beat/voice.
- [ ] M021 Add notation-specific empty states suggesting import MIDI or create blank score.
- [ ] M022 Add "Export PDF" workflow with print preview.
- [ ] M023 Add "Export parts" workflow extracting individual instrument parts.
- [ ] M024 Add "Check score" action running engraving quality checks.
- [ ] M025 Integrate engraving suggestions into notation deck as warnings.
- [ ] M026 Add tests: engraving checks detect common issues.
- [ ] M027 Add docs: `docs/personas/notation-composer.md` describing workflow.
- [ ] M028 Define `orchestration_guideline/3` (instrument, range, difficulty).
- [ ] M029 Define `doubling_rule/2` common instrument doubling patterns.
- [ ] M030 Define `spacing_rule/2` for vertical staff spacing.
- [ ] M031 Define `tempo_marking_convention/2` per style period.
- [ ] M032 Implement `suggestOrchestration(melody, instrumentation): Assignment[]`.
- [ ] M033 Implement `checkRange(part, instrument): RangeIssue[]`.
- [ ] M034 Implement `suggestDynamicBalance(score): DynamicSuggestion[]`.
- [ ] M035 Add Prolog rules for multi-movement structure.
- [ ] M036 Add Prolog rules for score metadata (composer, copyright, dedication).
- [ ] M037 Add Prolog rules for rehearsal letter placement.
- [ ] M038 Add Prolog rules for system breaks and page turns.
- [ ] M039 Implement "intelligent page layout" using Prolog rules.
- [ ] M040 Implement "part extraction wizard" with layout presets.
- [ ] M041 Add keyboard shortcut for "check score" (Cmd+Shift+C).
- [ ] M042 Add keyboard shortcut for "export PDF" (Cmd+E).
- [ ] M043 Add notation board preset: "Score Preparation" with print preview deck.
- [ ] M044 Add notation board preset: "Parts Extraction" with part list deck.
- [ ] M045 Add notation board preset: "Composition" with harmony display + theory reference.
- [ ] M046 Implement board-specific AI queries: "How should I lay out this score?"
- [ ] M047 Implement board-specific AI queries: "What are common doublings for this instrumentation?"
- [ ] M048 Implement board-specific AI queries: "Where should I place page breaks?"
- [ ] M049 Add tests: AI suggestions are relevant to notation workflow.
- [ ] M050 Add tests: board presets configure decks correctly.
- [ ] M051 Define `voice_independence_rule/2` for counterpoint.
- [ ] M052 Define `harmonic_rhythm_appropriateness/3` per style.
- [ ] M053 Define `cadence_placement_rule/2` for phrase structure.
- [ ] M054 Define `modulation_appropriateness/3` for key changes.
- [ ] M055 Implement `analyzeCounterpoint(voices): CounterpointIssue[]`.
- [ ] M056 Implement `suggestCadences(phrase, style): CadencePosition[]`.
- [ ] M057 Implement `planModulation(fromKey, toKey, style): ModulationPath`.
- [ ] M058 Add counterpoint analysis to notation deck.
- [ ] M059 Add cadence suggestions to harmony display deck.
- [ ] M060 Add modulation planner to composition AI deck.
- [ ] M061 Add tests: counterpoint analysis detects parallel fifths.
- [ ] M062 Add tests: cadence suggestions match style conventions.
- [ ] M063 Add tests: modulation plans are musically smooth.
- [ ] M064 Create reference library deck for notation board.
- [ ] M065 Populate reference library with common forms (sonata, rondo, fugue).
- [ ] M066 Populate reference library with orchestration guides.
- [ ] M067 Add "Apply form template" action using Prolog structure rules.
- [ ] M068 Add "Check against form" analysis.
- [ ] M069 Define `form_section_rule/3` for classical forms.
- [ ] M070 Define `development_technique/2` for sonata form.
- [ ] M071 Define `fugue_subject_rule/2` for fugue writing.
- [ ] M072 Implement form-aware composition suggestions.
- [ ] M073 Add tests: form templates structure sections correctly.
- [ ] M074 Add tests: form analysis identifies deviations.
- [ ] M075 Document notation composer enhancements in persona docs.
- [ ] M076 Add video tutorial: "Using CardPlay for Score Preparation".
- [ ] M077 Add video tutorial: "AI-Assisted Orchestration".
- [ ] M078 Run full notation composer workflow test.
- [ ] M079 Gather feedback from notation users (if applicable).
- [ ] M080 Lock notation composer enhancements.

### Tracker User Persona (M081–M160)

- [ ] M081 Create `cardplay/src/ai/knowledge/persona-tracker-user.pl`.
- [ ] M082 Define `tracker_workflow/2` facts describing tracker tasks.
- [ ] M083 Define `pattern_length_convention/2` (genre, typical_length).
- [ ] M084 Define `hex_vs_decimal_preference/2` per user background.
- [ ] M085 Define `sample_library_organization/2` rules.
- [ ] M086 Define `effect_chain_preset/3` common tracker effect chains.
- [ ] M087 Add Prolog rules for tracker board deck configuration.
- [ ] M088 Add rules for tracker keyboard shortcuts (pattern navigation, note entry, effects).
- [ ] M089 Add rules for sample browser organization (by type, by genre, by key).
- [ ] M090 Implement `suggestPatternLength(genre, tempo): number`.
- [ ] M091 Implement `suggestSampleForSlot(trackType, genre): SampleId[]`.
- [ ] M092 Implement `suggestEffectChain(trackType, genre): EffectPreset`.
- [ ] M093 Add tests: pattern length suggestions match genre conventions.
- [ ] M094 Add tests: sample suggestions match track roles.
- [ ] M095 Add tests: effect chain presets are appropriate.
- [ ] M096 Create `cardplay/src/boards/personas/tracker-user-enhancements.ts`.
- [ ] M097 Add tracker-specific context menu (clone pattern, double length, halve length).
- [ ] M098 Add tracker-specific inspector showing hex/decimal note values.
- [ ] M099 Add "Pattern Arranger" deck showing pattern sequence.
- [ ] M100 Add "Sample Manager" deck for sample organization.
- [ ] M101 Add "Effect Rack" deck showing all track effects.
- [ ] M102 Implement pattern doubling/halving with intelligent note adjustment.
- [ ] M103 Implement pattern quantization with swing presets.
- [ ] M104 Implement sample auto-slicing from kick/snare detection.
- [ ] M105 Add keyboard shortcut for pattern clone (Cmd+D).
- [ ] M106 Add keyboard shortcut for effect rack (Cmd+Shift+E).
- [ ] M107 Add tracker board preset: "Chip Music" with limited sample palette.
- [ ] M108 Add tracker board preset: "Breakbeat" with sample slicer prominent.
- [ ] M109 Add tracker board preset: "Techno" with step sequencer emphasis.
- [ ] M110 Implement board-specific AI queries: "What pattern length should I use?"
- [ ] M111 Implement board-specific AI queries: "Which samples work for techno kick?"
- [ ] M112 Implement board-specific AI queries: "How do I create swing in tracker?"
- [ ] M113 Add tests: pattern operations preserve musical intent.
- [ ] M114 Add tests: sample suggestions match genre characteristics.
- [ ] M115 Define `tracker_effect_routing/3` standard effect signal flow.
- [ ] M116 Define `send_return_configuration/2` auxiliary routing patterns.
- [ ] M117 Define `sidechain_routing/3` for ducking/compression.
- [ ] M118 Implement `suggestRouting(trackSetup): RoutingGraph`.
- [ ] M119 Implement `detectFeedbackLoop(routing): boolean`.
- [ ] M120 Implement `optimizeRouting(routing): RoutingGraph`.
- [ ] M121 Add routing suggestions to modular deck on tracker boards.
- [ ] M122 Add routing validation preventing feedback loops.
- [ ] M123 Add tests: routing suggestions are valid and optimal.
- [ ] M124 Add tests: feedback detection catches all loops.
- [ ] M125 Define `pattern_variation_technique/2` (shift, invert, reverse, etc.).
- [ ] M126 Define `groove_template/2` timing/velocity templates.
- [ ] M127 Define `humanization_amount/2` per genre.
- [ ] M128 Implement `generateVariation(pattern, technique): Pattern`.
- [ ] M129 Implement `applyGroove(pattern, template): Pattern`.
- [ ] M130 Implement `humanize(pattern, amount): Pattern`.
- [ ] M131 Add "Generate Variation" action to pattern context menu.
- [ ] M132 Add "Apply Groove" action with preset selector.
- [ ] M133 Add "Humanize" action with amount slider.
- [ ] M134 Add tests: variations maintain rhythmic relationship.
- [ ] M135 Add tests: groove templates affect timing appropriately.
- [ ] M136 Add tests: humanization is subtle and musical.
- [ ] M137 Create macro/automation deck for tracker boards.
- [ ] M138 Add macro assignments for common parameters (cutoff, resonance, send levels).
- [ ] M139 Add automation recording from macro tweaks.
- [ ] M140 Implement parameter automation visualization in tracker rows.
- [ ] M141 Add keyboard shortcut for macro mode (Cmd+M).
- [ ] M142 Add keyboard shortcut for automation record (Cmd+Shift+A).
- [ ] M143 Add tests: macro assignments affect target parameters.
- [ ] M144 Add tests: automation recording captures tweaks correctly.
- [ ] M145 Define `performance_mode_layout/2` for live tracker use.
- [ ] M146 Define `pattern_launch_quantization/2` rules.
- [ ] M147 Implement live performance board variant for tracker.
- [ ] M148 Add scene launch controls to performance tracker board.
- [ ] M149 Add pattern preview/audition before launch.
- [ ] M150 Add tests: performance mode layout is accessible during live play.
- [ ] M151 Document tracker user enhancements in persona docs.
- [ ] M152 Add video tutorial: "Advanced Tracker Techniques".
- [ ] M153 Add video tutorial: "Live Performance with Tracker Board".
- [ ] M154 Run full tracker workflow test.
- [ ] M155 Run live performance stress test (rapid pattern switches).
- [ ] M156 Optimize tracker rendering for 60fps with many effects.
- [ ] M157 Optimize sample loading for large libraries.
- [ ] M158 Gather feedback from tracker users (if applicable).
- [ ] M159 Ensure Renoise/OpenMPT users feel at home.
- [ ] M160 Lock tracker user enhancements.

### Sound Designer Persona (M161–M240)

- [ ] M161 Create `cardplay/src/ai/knowledge/persona-sound-designer.pl`.
- [ ] M162 Define `sound_design_workflow/2` facts.
- [ ] M163 Define `synthesis_technique/2` (subtractive, FM, additive, granular, etc.).
- [ ] M164 Define `modulation_routing_pattern/3` common mod matrix setups.
- [ ] M165 Define `effect_chain_for_sound_type/3` (pad, lead, bass, etc.).
- [ ] M166 Define `sample_manipulation_technique/2` (time-stretch, pitch-shift, reverse, etc.).
- [ ] M167 Add Prolog rules for modular board configuration.
- [ ] M168 Add rules for optimal routing overlay visibility.
- [ ] M169 Add rules for parameter inspector showing modulation sources.
- [ ] M170 Implement `suggestModulation(sourceParam, targets): ModulationSetup`.
- [ ] M171 Implement `suggestEffectChain(soundType): Effect[]`.
- [ ] M172 Implement `analyzeSample(sample): SampleCharacteristics`.
- [ ] M173 Add tests: modulation suggestions create interesting movement.
- [ ] M174 Add tests: effect chains match sound design goals.
- [ ] M175 Add tests: sample analysis identifies key/tempo/transients.
- [ ] M176 Create `cardplay/src/boards/personas/sound-designer-enhancements.ts`.
- [ ] M177 Add modular board variant emphasizing routing graph.
- [ ] M178 Add "Modulation Matrix" deck showing all mod connections.
- [ ] M179 Add "Spectrum Analyzer" deck for real-time frequency view.
- [ ] M180 Add "Waveform Editor" deck for sample editing.
- [ ] M181 Implement drag-to-modulate from sources to targets.
- [ ] M182 Implement modulation amount control with visual feedback.
- [ ] M183 Implement preset browser organized by sound category.
- [ ] M184 Add keyboard shortcut for modulation matrix (Cmd+Shift+M).
- [ ] M185 Add keyboard shortcut for spectrum analyzer (Cmd+Shift+S).
- [ ] M186 Add sound designer board preset: "Synthesis Lab".
- [ ] M187 Add sound designer board preset: "Sample Mangling".
- [ ] M188 Add sound designer board preset: "Effect Design".
- [ ] M189 Implement board-specific AI queries: "How do I create a lush pad?"
- [ ] M190 Implement board-specific AI queries: "What modulation creates wobble bass?"
- [ ] M191 Implement board-specific AI queries: "How to layer sounds effectively?"
- [ ] M192 Add tests: modulation matrix UI is responsive.
- [ ] M193 Add tests: spectrum analyzer updates in real-time.
- [ ] M194 Add tests: preset browser categories are logical.
- [ ] M195 Define `layering_rule/3` for combining sounds.
- [ ] M196 Define `frequency_balance_rule/2` for mix clarity.
- [ ] M197 Define `stereo_imaging_technique/2` for width/depth.
- [ ] M198 Implement `suggestLayering(soundType, targetCharacter): Layer[]`.
- [ ] M199 Implement `analyzeFrequencyBalance(mix): BalanceIssue[]`.
- [ ] M200 Implement `suggestStereoPlacement(tracks): StereoMap`.
- [ ] M201 Add layering suggestions to instrument browser.
- [ ] M202 Add frequency balance analyzer to mixer deck.
- [ ] M203 Add stereo imaging visualizer to mixer deck.
- [ ] M204 Add tests: layering suggestions complement each other.
- [ ] M205 Add tests: frequency analysis detects mud/harshness.
- [ ] M206 Add tests: stereo placement avoids phase issues.
- [ ] M207 Define `macro_assignment_pattern/2` common macro setups.
- [ ] M208 Define `performance_control_mapping/3` for expressive control.
- [ ] M209 Implement `suggestMacroAssignments(soundType): MacroMap`.
- [ ] M210 Implement `mapMIDIController(controller, params): Mapping`.
- [ ] M211 Add macro assignment wizard to properties deck.
- [ ] M212 Add MIDI learn mode for controller mapping.
- [ ] M213 Add tests: macro assignments group related parameters.
- [ ] M214 Add tests: MIDI mapping handles all controller types.
- [ ] M215 Define `preset_organization_scheme/2` for sound libraries.
- [ ] M216 Define `preset_metadata_standard/2` for tagging.
- [ ] M217 Implement preset tagging system (genre, mood, type, character).
- [ ] M218 Implement preset search by tags and characteristics.
- [ ] M219 Implement preset favorites and collections.
- [ ] M220 Add tests: preset search finds relevant sounds quickly.
- [ ] M221 Add tests: tagging system is consistent and useful.
- [ ] M222 Create "Sound Design Library" deck for preset management.
- [ ] M223 Add preset rating/review system (local only).
- [ ] M224 Add preset comparison mode (A/B testing).
- [ ] M225 Add "Randomize with constraints" action for sound exploration.
- [ ] M226 Define `randomization_constraint/3` rules.
- [ ] M227 Implement `randomizeParameters(constraints): ParamValues`.
- [ ] M228 Add tests: randomization respects constraints.
- [ ] M229 Add tests: randomized sounds are musically useful (quality check).
- [ ] M230 Document sound designer enhancements in persona docs.
- [ ] M231 Add video tutorial: "Modular Sound Design Workflow".
- [ ] M232 Add video tutorial: "Creating Custom Synth Presets".
- [ ] M233 Run full sound design workflow test.
- [ ] M234 Run audio performance test (CPU usage with many effects).
- [ ] M235 Optimize modulation processing for real-time performance.
- [ ] M236 Optimize routing graph rendering for complex patches.
- [ ] M237 Gather feedback from sound designers (if applicable).
- [ ] M238 Ensure modular synthesis users find system flexible.
- [ ] M239 Ensure patch recall is instant and reliable.
- [ ] M240 Lock sound designer enhancements.

### Producer/Beatmaker Persona (M241–M320)

- [ ] M241 Create `cardplay/src/ai/knowledge/persona-producer.pl`.
- [ ] M242 Define `production_workflow/2` facts (beat making, arranging, mixing, mastering).
- [ ] M243 Define `genre_production_template/3` (genre, bpm_range, typical_instruments).
- [ ] M244 Define `arrangement_structure/2` typical song structures by genre.
- [ ] M245 Define `mixing_checklist/2` per genre/style.
- [ ] M246 Define `mastering_target/3` (genre, target_LUFS, dynamics).
- [ ] M247 Add Prolog rules for producer board configuration (timeline + session + mixer).
- [ ] M248 Add rules for default routing in production context.
- [ ] M249 Add rules for typical track organization.
- [ ] M250 Implement `suggestArrangement(genre, clips): Timeline`.
- [ ] M251 Implement `suggestMixBalance(tracks): MixSettings`.
- [ ] M252 Implement `checkMasteringReadiness(mix): MasteringIssue[]`.
- [ ] M253 Add tests: arrangement suggestions match genre templates.
- [ ] M254 Add tests: mix balance suggestions are genre-appropriate.
- [ ] M255 Add tests: mastering checks detect common issues.
- [ ] M256 Create `cardplay/src/boards/personas/producer-enhancements.ts`.
- [ ] M257 Add producer board emphasizing timeline + mixer.
- [ ] M258 Add "Track Groups" deck for organizing stems.
- [ ] M259 Add "Mix Bus" deck for group processing.
- [ ] M260 Add "Reference Track" deck for A/B comparison.
- [ ] M261 Implement clip consolidation (merge clips to audio).
- [ ] M262 Implement freeze track (render to audio, disable plugins).
- [ ] M263 Implement bounce in place (render selection to clip).
- [ ] M264 Add keyboard shortcut for consolidate (Cmd+J).
- [ ] M265 Add keyboard shortcut for freeze track (Cmd+Shift+F).
- [ ] M266 Add producer board preset: "Beat Making" (session-focused).
- [ ] M267 Add producer board preset: "Mixing" (mixer-focused, meters visible).
- [ ] M268 Add producer board preset: "Mastering" (master chain + analyzer).
- [ ] M269 Implement board-specific AI queries: "How do I structure a house track?"
- [ ] M270 Implement board-specific AI queries: "What's a good lofi hip hop mix balance?"
- [ ] M271 Implement board-specific AI queries: "Is my master too loud?"
- [ ] M272 Add tests: clip consolidation preserves timing.
- [ ] M273 Add tests: freeze track reduces CPU correctly.
- [ ] M274 Add tests: bounce in place matches source audio.
- [ ] M275 Define `track_color_scheme/2` organizing tracks visually.
- [ ] M276 Define `bus_routing_pattern/2` common send/return setups.
- [ ] M277 Define `automation_lane_priority/2` which parameters to automate.
- [ ] M278 Implement `suggestTrackColors(trackTypes): ColorScheme`.
- [ ] M279 Implement `setupBusRouting(trackSetup): BusConfig`.
- [ ] M280 Implement `suggestAutomationLanes(mix): Parameter[]`.
- [ ] M281 Add automatic track coloring by instrument type.
- [ ] M282 Add bus routing wizard for common setups.
- [ ] M283 Add automation lane suggestions in automation deck.
- [ ] M284 Add tests: track coloring is consistent and helpful.
- [ ] M285 Add tests: bus routing wizard creates valid routing.
- [ ] M286 Add tests: automation suggestions target mix-critical params.
- [ ] M287 Define `reference_matching_technique/2` for A/B comparison.
- [ ] M288 Define `loudness_analysis_rule/2` LUFS targets per genre.
- [ ] M289 Define `dynamic_range_target/2` per genre/platform.
- [ ] M290 Implement `compareWithReference(mix, refTrack): Comparison`.
- [ ] M291 Implement `analyzeLoudness(mix): LoudnessMetrics`.
- [ ] M292 Implement `suggestDynamicsProcessing(mix): DynamicsSettings`.
- [ ] M293 Add reference track player to mixer deck.
- [ ] M294 Add loudness meter to master deck (LUFS, peak, true peak).
- [ ] M295 Add dynamics analyzer showing compression/limiting.
- [ ] M296 Add tests: reference comparison identifies frequency differences.
- [ ] M297 Add tests: loudness analysis matches industry tools.
- [ ] M298 Add tests: dynamics suggestions are conservative and safe.
- [ ] M299 Create "Export Stems" workflow.
- [ ] M300 Add stem export configuration (tracks to stems mapping).
- [ ] M301 Add export format options (WAV, AIFF, FLAC).
- [ ] M302 Add export settings (sample rate, bit depth, normalization).
- [ ] M303 Implement parallel stem rendering.
- [ ] M304 Add progress indicator for export.
- [ ] M305 Add tests: stem export preserves track separation.
- [ ] M306 Add tests: export formats encode correctly.
- [ ] M307 Define `collaboration_workflow/2` for multi-user projects.
- [ ] M308 Define `version_naming_convention/2` for project versions.
- [ ] M309 Implement project version save/load with naming.
- [ ] M310 Implement project comparison view (diff between versions).
- [ ] M311 Add tests: version system prevents overwrites.
- [ ] M312 Add tests: version comparison shows meaningful changes.
- [ ] M313 Document producer enhancements in persona docs.
- [ ] M314 Add video tutorial: "Full Production Workflow".
- [ ] M315 Add video tutorial: "Mixing Tips and Techniques".
- [ ] M316 Run full production workflow test (beat → mix → master).
- [ ] M317 Optimize timeline rendering for large projects (100+ clips).
- [ ] M318 Optimize mixer rendering for many tracks (32+ channels).
- [ ] M319 Gather feedback from producers (if applicable).
- [ ] M320 Lock producer enhancements.

### Cross-Persona Features (M321–M400)

- [ ] M321 Create `cardplay/src/ai/knowledge/persona-transitions.pl`.
- [ ] M322 Define `persona_transition_path/3` (fromPersona, toPersona, sharedNeeds).
- [ ] M323 Define `board_compatibility/2` which boards work for multiple personas.
- [ ] M324 Define `workflow_bridge/3` connecting different persona workflows.
- [ ] M325 Implement `suggestBoardForTransition(from, to): BoardId`.
- [ ] M326 Implement `detectWorkflowMix(activeBoards): PersonaSet`.
- [ ] M327 Add tests: transition suggestions are smooth.
- [ ] M328 Add tests: workflow mixing detection is accurate.
- [ ] M329 Create universal "Command Palette" (Cmd+K) for all boards.
- [ ] M330 Add context-aware command suggestions based on active deck.
- [ ] M331 Add recently-used commands in palette.
- [ ] M332 Add command search with fuzzy matching.
- [ ] M333 Implement command execution with undo support.
- [ ] M334 Add keyboard shortcut hints in command palette.
- [ ] M335 Add tests: command palette shows relevant commands.
- [ ] M336 Add tests: fuzzy search finds commands correctly.
- [ ] M337 Create universal "Help Browser" deck.
- [ ] M338 Add context-sensitive help (shows relevant docs for active deck).
- [ ] M339 Add search across all documentation.
- [ ] M340 Add video tutorial links in help browser.
- [ ] M341 Add keyboard shortcut reference per board.
- [ ] M342 Add tests: help browser finds relevant content.
- [ ] M343 Add tests: context-sensitive help matches active context.
- [ ] M344 Implement "Workspace Templates" system.
- [ ] M345 Allow saving current board + deck + routing as template.
- [ ] M346 Allow loading templates with parameter preset option.
- [ ] M347 Ship default templates for common tasks (beat making, mixing, scoring, etc.).
- [ ] M348 Add tests: templates restore workspace correctly.
- [ ] M349 Add tests: default templates cover common use cases.
- [ ] M350 Define `learning_path/3` (persona, skillLevel, nextSteps).
- [ ] M351 Define `tutorial_sequence/2` ordered learning progression.
- [ ] M352 Implement adaptive tutorials based on user skill level.
- [ ] M353 Implement tutorial progress tracking.
- [ ] M354 Implement tutorial hints appearing in context.
- [ ] M355 Add "Tutorial Mode" toggle in settings.
- [ ] M356 Add tests: tutorials progress logically.
- [ ] M357 Add tests: hints appear at appropriate moments.
- [ ] M358 Create "Quick Start" flows for each persona.
- [ ] M359 Add "New Project" wizard with persona selection.
- [ ] M360 Add template selection in new project wizard.
- [ ] M361 Add initial tutorial option in new project wizard.
- [ ] M362 Add tests: quick start flows work for all personas.
- [ ] M363 Add tests: new project wizard creates valid projects.
- [ ] M364 Implement "Performance Mode" for live use.
- [ ] M365 Add performance mode UI (large controls, minimal chrome).
- [ ] M366 Add performance mode shortcut mappings (streamlined).
- [ ] M367 Add performance mode stability (disable non-essential features).
- [ ] M368 Add tests: performance mode UI is touch-friendly.
- [ ] M369 Add tests: performance mode is stable under load.
- [ ] M370 Create unified "Project Browser" across all boards.
- [ ] M371 Add project preview (waveform/notation thumbnail).
- [ ] M372 Add project metadata (genre, tempo, key, tags).
- [ ] M373 Add project search and filtering.
- [ ] M374 Add project favorites and collections.
- [ ] M375 Add tests: project browser shows all projects.
- [ ] M376 Add tests: project search is fast and accurate.
- [ ] M377 Implement "Session Notes" feature (project-scoped notes).
- [ ] M378 Add notes deck showing markdown editor.
- [ ] M379 Add notes persistence per project.
- [ ] M380 Add notes search across projects.
- [ ] M381 Add tests: session notes persist correctly.
- [ ] M382 Add tests: notes search finds content.
- [ ] M383 Implement "Undo History Browser".
- [ ] M384 Show visual timeline of undo/redo actions.
- [ ] M385 Allow branching from undo history (create alternate version).
- [ ] M386 Add tests: undo history displays accurately.
- [ ] M387 Add tests: branching creates independent versions.
- [ ] M388 Document all persona enhancements in comprehensive guide.
- [ ] M389 Create persona-specific getting started docs.
- [ ] M390 Create persona-specific example projects.
- [ ] M391 Add video tutorial series for each persona.
- [ ] M392 Run comprehensive persona workflow tests.
- [ ] M393 Gather multi-persona user feedback (if applicable).
- [ ] M394 Ensure persona features don't conflict with each other.
- [ ] M395 Ensure performance stays good with all features enabled.
- [ ] M396 Benchmark all persona enhancements.
- [ ] M397 Optimize resource usage for persona-specific features.
- [ ] M398 Verify accessibility across all persona UIs.
- [ ] M399 Create final persona feature matrix (what's available where).
- [ ] M400 Lock Phase M complete once all persona enhancements are polished and tested.

---

## Phase N: Advanced AI Features (N001–N200)

**Goal:** Advanced Prolog-based AI features including board-centric workflow planning, parameter optimization across deck configurations, and intelligent project analysis.

### Board-Centric Workflow Planning (N001–N050)

- [ ] N001 Create `cardplay/src/ai/knowledge/workflow-planning.pl`.
- [ ] N002 Define `task_decomposition/3` breaking high-level goals into deck actions.
- [ ] N003 Define `deck_sequencing/2` optimal order to open/configure decks for a task.
- [ ] N004 Define `parameter_dependency/3` parameters that affect other decks.
- [ ] N005 Define `routing_requirement/3` (task, source_deck, target_deck).
- [ ] N006 Define `workflow_checkpoint/2` validation points during workflow.
- [ ] N007 Implement `planWorkflow(goal, context): WorkflowPlan`.
- [ ] N008 Implement `executeWorkflowStep(step, context): Result`.
- [ ] N009 Implement `validateWorkflow(plan): ValidationResult`.
- [ ] N010 Add tests: workflow plans are executable and complete.
- [ ] N011 Add tests: workflow validation catches missing dependencies.
- [ ] N012 Create workflow planning UI in AI advisor deck.
- [ ] N013 Add "Plan My Workflow" action with goal input.
- [ ] N014 Add step-by-step workflow execution with preview.
- [ ] N015 Add workflow template library (common goals).
- [ ] N016 Implement workflow interruption/resume.
- [ ] N017 Add tests: workflow execution handles errors gracefully.
- [ ] N018 Add tests: workflow resume restores state correctly.
- [ ] N019 Define `deck_configuration_pattern/3` optimal deck settings for tasks.
- [ ] N020 Define `parameter_preset_rule/3` (deck, task, recommended_values).
- [ ] N021 Define `cross_deck_sync_rule/3` parameters that should stay in sync.
- [ ] N022 Implement `suggestDeckConfiguration(task, deck): Configuration`.
- [ ] N023 Implement `synchronizeParameters(decks): SyncActions`.
- [ ] N024 Implement `optimizeConfiguration(currentState, goal): Changes[]`.
- [ ] N025 Add configuration suggestions to deck headers.
- [ ] N026 Add parameter sync indicators showing linked params.
- [ ] N027 Add "Optimize for Task" action applying AI suggestions.
- [ ] N028 Add tests: deck configurations match task requirements.
- [ ] N029 Add tests: parameter sync maintains consistency.
- [ ] N030 Add tests: optimization improves workflow efficiency.
- [ ] N031 Define `routing_template/3` (taskType, deckSet, connections).
- [ ] N032 Define `signal_flow_validation/2` checking routing coherence.
- [ ] N033 Define `routing_optimization/2` minimizing latency/complexity.
- [ ] N034 Implement `suggestRouting(taskType, decks): RoutingGraph`.
- [ ] N035 Implement `validateSignalFlow(routing): FlowIssue[]`.
- [ ] N036 Implement `optimizeRouting(routing): RoutingGraph`.
- [ ] N037 Add routing template browser to routing overlay.
- [ ] N038 Add "Apply Routing Template" action.
- [ ] N039 Add routing validation warnings in overlay.
- [ ] N040 Add tests: routing templates create valid graphs.
- [ ] N041 Add tests: signal flow validation detects issues.
- [ ] N042 Add tests: routing optimization reduces complexity.
- [ ] N043 Document workflow planning in AI docs.
- [ ] N044 Add examples: "Plan a lofi beat workflow".
- [ ] N045 Add examples: "Optimize mixing board configuration".
- [ ] N046 Add examples: "Setup routing for live performance".
- [ ] N047 Run workflow planning end-to-end tests.
- [ ] N048 Benchmark workflow planning (should complete in <200ms).
- [ ] N049 Gather feedback on workflow planning utility.
- [ ] N050 Lock workflow planning features.

### Intelligent Project Analysis (N051–N100)

- [ ] N051 Create `cardplay/src/ai/knowledge/project-analysis.pl`.
- [ ] N052 Define `project_health_metric/2` (completeness, balance, coherence).
- [ ] N053 Define `missing_element_detection/2` identifying gaps.
- [ ] N054 Define `overused_element_detection/2` identifying repetition.
- [ ] N055 Define `structural_issue_detection/2` form/arrangement problems.
- [ ] N056 Define `technical_issue_detection/2` (clipping, phase, etc.).
- [ ] N057 Implement `analyzeProject(project): ProjectAnalysis`.
- [ ] N058 Implement `suggestImprovements(analysis): Suggestion[]`.
- [ ] N059 Implement `explainIssue(issue): Explanation`.
- [ ] N060 Add tests: project analysis identifies real issues.
- [ ] N061 Add tests: improvement suggestions are actionable.
- [ ] N062 Add tests: explanations are clear and helpful.
- [ ] N063 Create "Project Health" panel in advisor deck.
- [ ] N064 Add visual health score display (percentage + breakdown).
- [ ] N065 Add issue list with severity indicators.
- [ ] N066 Add one-click fixes for simple issues.
- [ ] N067 Add "Explain" button per issue showing Prolog reasoning.
- [ ] N068 Add tests: health panel updates on project changes.
- [ ] N069 Add tests: one-click fixes work correctly.
- [ ] N070 Define `style_consistency_check/2` checking genre coherence.
- [ ] N071 Define `harmony_coherence_check/2` checking chord relationships.
- [ ] N072 Define `rhythm_consistency_check/2` checking rhythmic patterns.
- [ ] N073 Define `instrumentation_balance_check/2` checking mix balance.
- [ ] N074 Implement `checkStyleConsistency(project): StyleIssue[]`.
- [ ] N075 Implement `checkHarmonyCoherence(chords): HarmonyIssue[]`.
- [ ] N076 Implement `checkRhythmConsistency(tracks): RhythmIssue[]`.
- [ ] N077 Implement `checkInstrumentationBalance(mix): BalanceIssue[]`.
- [ ] N078 Add consistency checks to project health panel.
- [ ] N079 Add tests: style checks identify genre mismatches.
- [ ] N080 Add tests: harmony checks detect non-functional progressions.
- [ ] N081 Add tests: rhythm checks find timing inconsistencies.
- [ ] N082 Add tests: balance checks identify mix problems.
- [ ] N083 Define `project_complexity_metric/2` measuring cognitive load.
- [ ] N084 Define `simplification_suggestion/2` reducing complexity.
- [ ] N085 Define `beginner_safety_check/2` flagging advanced features.
- [ ] N086 Implement `measureComplexity(project): ComplexityMetrics`.
- [ ] N087 Implement `suggestSimplification(project): SimplificationPlan`.
- [ ] N088 Implement `checkBeginnerSafety(project): SafetyWarning[]`.
- [ ] N089 Add complexity meter to project health panel.
- [ ] N090 Add "Simplify Project" wizard for beginners.
- [ ] N091 Add beginner safety warnings when appropriate.
- [ ] N092 Add tests: complexity metrics correlate with actual difficulty.
- [ ] N093 Add tests: simplification reduces complexity measurably.
- [ ] N094 Add tests: safety warnings appear for beginners only.
- [ ] N095 Document project analysis features.
- [ ] N096 Add examples showing typical project health issues.
- [ ] N097 Run project analysis on example projects.
- [ ] N098 Benchmark project analysis (should complete in <1s for typical project).
- [ ] N099 Gather feedback on analysis utility and accuracy.
- [ ] N100 Lock project analysis features.

### Learning & Adaptation (N101–N150)

- [ ] N101 Enhance `cardplay/src/ai/learning/user-preferences.ts` with workflow patterns.
- [ ] N102 Track which decks user opens for specific tasks.
- [ ] N103 Track which parameters user adjusts most often.
- [ ] N104 Track which routing patterns user creates repeatedly.
- [ ] N105 Track which board configurations user prefers.
- [ ] N106 Define `learned_workflow_pattern/3` in dynamic KB.
- [ ] N107 Define `learned_parameter_preference/3` in dynamic KB.
- [ ] N108 Define `learned_routing_pattern/3` in dynamic KB.
- [ ] N109 Implement pattern recognition from user actions.
- [ ] N110 Implement preference extraction from usage stats.
- [ ] N111 Implement workflow suggestion based on learned patterns.
- [ ] N112 Add tests: pattern recognition identifies repeated workflows.
- [ ] N113 Add tests: preference extraction is accurate.
- [ ] N114 Add tests: learned patterns improve suggestions over time.
- [ ] N115 Create "What I've Learned" UI showing AI observations.
- [ ] N116 Add learned workflow display with usage counts.
- [ ] N117 Add learned preference display with confidence scores.
- [ ] N118 Add "Forget This Pattern" action for incorrect learning.
- [ ] N119 Add "Teach AI" action for explicit pattern submission.
- [ ] N120 Add tests: learned patterns UI updates correctly.
- [ ] N121 Add tests: forget action removes patterns.
- [ ] N122 Add tests: teach action adds patterns correctly.
- [ ] N123 Define `adaptive_suggestion_rule/3` adjusting to skill level.
- [ ] N124 Define `progressive_disclosure_rule/2` hiding advanced features initially.
- [ ] N125 Define `skill_estimation/3` (area, actions, estimated_level).
- [ ] N126 Implement `estimateSkillLevel(userHistory): SkillProfile`.
- [ ] N127 Implement `adaptSuggestions(suggestions, skillLevel): AdaptedSuggestions`.
- [ ] N128 Implement `decideFeatureVisibility(feature, skillLevel): boolean`.
- [ ] N129 Add skill-adaptive UI showing/hiding features.
- [ ] N130 Add "Show Advanced Features" override toggle.
- [ ] N131 Add tests: skill estimation improves with usage.
- [ ] N132 Add tests: adapted suggestions match user level.
- [ ] N133 Add tests: feature visibility changes appropriately.
- [ ] N134 Define `error_pattern_detection/2` identifying repeated mistakes.
- [ ] N135 Define `corrective_suggestion/2` helping avoid errors.
- [ ] N136 Implement error pattern tracking.
- [ ] N137 Implement proactive error prevention suggestions.
- [ ] N138 Add "Common Mistakes" help section.
- [ ] N139 Add tests: error patterns are detected correctly.
- [ ] N140 Add tests: corrective suggestions reduce errors.
- [ ] N141 Document learning and adaptation system.
- [ ] N142 Document privacy protections (all local, no tracking).
- [ ] N143 Document learning reset and data export.
- [ ] N144 Add "Reset Learning Data" action in settings.
- [ ] N145 Add "Export Learning Data" for backup.
- [ ] N146 Run learning system over simulated usage.
- [ ] N147 Verify learning improves suggestions measurably.
- [ ] N148 Verify privacy protections work (no network calls).
- [ ] N149 Gather feedback on learning system helpfulness.
- [ ] N150 Lock learning and adaptation features.

### Performance & Optimization (N151–N200)

- [ ] N151 Profile all AI query paths for performance.
- [ ] N152 Identify slow queries (>50ms).
- [ ] N153 Optimize slow Prolog predicates with indexing.
- [ ] N154 Optimize slow predicates with cut placement.
- [ ] N155 Optimize slow predicates with memoization.
- [ ] N156 Add query batching for related queries.
- [ ] N157 Add incremental KB updates (don't reload everything).
- [ ] N158 Add lazy KB loading for optional features.
- [ ] N159 Benchmark all optimizations.
- [ ] N160 Ensure 95th percentile < 50ms for common queries.
- [ ] N161 Add performance monitoring dashboard (dev-only).
- [ ] N162 Add slow query logging (dev-only).
- [ ] N163 Add query profiling tools (dev-only).
- [ ] N164 Add tests: all queries meet performance budgets.
- [ ] N165 Add tests: no performance regressions.
- [ ] N166 Profile KB memory usage.
- [ ] N167 Identify memory-heavy KB sections.
- [ ] N168 Optimize KB representation for memory.
- [ ] N169 Add KB garbage collection for unused rules.
- [ ] N170 Add KB compression for large fact sets.
- [ ] N171 Benchmark memory usage.
- [ ] N172 Ensure KB uses <20MB total.
- [ ] N173 Add memory monitoring dashboard (dev-only).
- [ ] N174 Add memory profiling tools (dev-only).
- [ ] N175 Add tests: memory usage stays within budget.
- [ ] N176 Add tests: no memory leaks in KB.
- [ ] N177 Create comprehensive AI test suite (500+ tests).
- [ ] N178 Add unit tests for all Prolog predicates.
- [ ] N179 Add integration tests for all AI features.
- [ ] N180 Add performance tests for all query types.
- [ ] N181 Add memory tests for KB lifecycle.
- [ ] N182 Add end-to-end tests for AI workflows.
- [ ] N183 Add regression tests for fixed bugs.
- [ ] N184 Run full test suite in CI.
- [ ] N185 Ensure 100% pass rate before release.
- [ ] N186 Create AI feature documentation index.
- [ ] N187 Document all AI capabilities with examples.
- [ ] N188 Document all Prolog predicates with signatures.
- [ ] N189 Document KB architecture and extension points.
- [ ] N190 Document performance characteristics and budgets.
- [ ] N191 Document privacy guarantees and data handling.
- [ ] N192 Add troubleshooting guide for AI features.
- [ ] N193 Add FAQ for common AI questions.
- [ ] N194 Verify all AI features integrate smoothly.
- [ ] N195 Verify AI respects "AI Off" mode completely.
- [ ] N196 Run full AI feature audit.
- [ ] N197 Gather final feedback on AI system.
- [ ] N198 Polish AI UX based on feedback.
- [ ] N199 Benchmark final AI system performance.
- [ ] N200 Lock Phase N complete once all advanced AI features are stable, performant, and well-documented.

---

## Phase O: Community & Ecosystem (O001–O200)

**Goal:** Build community features, template marketplace, sharing capabilities, and ecosystem support for extensibility.

### Project Templates & Starter Content (O001–O050)

- [ ] O001 Create `cardplay/templates/` folder for official project templates.
- [ ] O002 Create template: "Lofi Hip Hop Beat" (session + generators board).
- [ ] O003 Create template: "House Track" (session + arrangement board).
- [ ] O004 Create template: "Ambient Soundscape" (generative ambient board).
- [ ] O005 Create template: "String Quartet" (notation board).
- [ ] O006 Create template: "Tracker Chip Tune" (basic tracker board).
- [ ] O007 Create template: "Jazz Standard" (chord progression + notation).
- [ ] O008 Create template: "Techno Track" (modular + session board).
- [ ] O009 Create template: "Sound Design Patch" (modular board).
- [ ] O010 Create template: "Film Score Sketch" (composer board).
- [ ] O011 Add template metadata (genre, difficulty, estimated_time, description).
- [ ] O012 Add template preview images (generated thumbnails).
- [ ] O013 Add template tags for searchability.
- [ ] O014 Create template browser UI.
- [ ] O015 Add template filtering by genre/difficulty/persona.
- [ ] O016 Add template preview with audio sample (optional).
- [ ] O017 Add "Create from Template" action.
- [ ] O018 Add tests: templates load correctly.
- [ ] O019 Add tests: template metadata is accurate.
- [ ] O020 Add tests: template browser shows all templates.
- [ ] O021 Implement template export from current project.
- [ ] O022 Add template metadata editor.
- [ ] O023 Add template packaging system (project + metadata + assets).
- [ ] O024 Add template validation (ensures all assets present).
- [ ] O025 Add tests: template export creates valid packages.
- [ ] O026 Add tests: template validation catches missing assets.
- [ ] O027 Create "Starter Deck Packs" (pre-configured deck sets).
- [ ] O028 Create deck pack: "Essential Production" (mixer + transport + browser).
- [ ] O029 Create deck pack: "Notation Essentials" (score + properties + instruments).
- [ ] O030 Create deck pack: "Sound Design Lab" (modular + spectrum + waveform).
- [ ] O031 Add deck pack browser.
- [ ] O032 Add "Load Deck Pack" action adding decks to current board.
- [ ] O033 Add tests: deck packs load correctly.
- [ ] O034 Add tests: deck packs don't conflict with existing decks.
- [ ] O035 Create "Sample Pack" system for bundled audio samples.
- [ ] O036 Create sample pack: "Lofi Drums" (kicks, snares, hats, percussion).
- [ ] O037 Create sample pack: "Synth One-Shots" (bass, leads, pads).
- [ ] O038 Create sample pack: "Orchestral Samples" (strings, brass, woodwinds).
- [ ] O039 Add sample pack browser.
- [ ] O040 Add sample pack installation to sample library.
- [ ] O041 Add tests: sample packs install correctly.
- [ ] O042 Add tests: samples are accessible in browser.
- [ ] O043 Document template creation guide.
- [ ] O044 Document deck pack creation guide.
- [ ] O045 Document sample pack creation guide.
- [ ] O046 Add video tutorial: "Creating Templates".
- [ ] O047 Run template system end-to-end test.
- [ ] O048 Optimize template loading performance.
- [ ] O049 Gather feedback on template quality.
- [ ] O050 Lock template and starter content system.

### Sharing & Collaboration (O051–O100)

- [ ] O051 Implement project export to portable format (.cardplay archive).
- [ ] O052 Add export options (include samples, include presets, etc.).
- [ ] O053 Add export compression for smaller file sizes.
- [ ] O054 Implement project import from .cardplay archive.
- [ ] O055 Add import conflict resolution (sample/preset name collisions).
- [ ] O056 Add tests: export creates valid archives.
- [ ] O057 Add tests: import restores projects correctly.
- [ ] O058 Add tests: conflict resolution works correctly.
- [ ] O059 Create "Share Board Configuration" feature.
- [ ] O060 Allow exporting board definition (layout + deck + tool config).
- [ ] O061 Allow importing board definitions into registry.
- [ ] O062 Add board definition versioning.
- [ ] O063 Add board definition compatibility checks.
- [ ] O064 Add tests: board export/import preserves configuration.
- [ ] O065 Add tests: version compatibility prevents breakage.
- [ ] O066 Create "Share Deck Preset" feature.
- [ ] O067 Allow exporting deck state (parameters + routing + clips).
- [ ] O068 Allow importing deck presets into active board.
- [ ] O069 Add deck preset tagging and metadata.
- [ ] O070 Add tests: deck preset export/import works.
- [ ] O071 Implement "Collaboration Metadata" in projects.
- [ ] O072 Add contributor list with roles (composer, mixer, etc.).
- [ ] O073 Add project changelog tracking major edits.
- [ ] O074 Add "Credits" panel showing all contributors.
- [ ] O075 Add tests: collaboration metadata persists correctly.
- [ ] O076 Create "Project Diff" system for version comparison.
- [ ] O077 Implement diff algorithm for projects (streams, clips, routing).
- [ ] O078 Add visual diff UI showing changes.
- [ ] O079 Add merge conflict detection (competing edits).
- [ ] O080 Add tests: diff algorithm identifies changes accurately.
- [ ] O081 Add tests: merge conflicts are detected.
- [ ] O082 Implement "Comments & Annotations" system.
- [ ] O083 Add comments attached to clips/events/decks.
- [ ] O084 Add comment threading for discussions.
- [ ] O085 Add comment resolution tracking.
- [ ] O086 Add tests: comments persist and display correctly.
- [ ] O087 Add tests: comment threading works.
- [ ] O088 Document sharing and collaboration features.
- [ ] O089 Add video tutorial: "Collaborating on Projects".
- [ ] O090 Add security note: all sharing is local/manual (no cloud dependency).
- [ ] O091 Add privacy note: no automatic uploads or tracking.
- [ ] O092 Run collaboration workflow test.
- [ ] O093 Test export/import across different versions.
- [ ] O094 Test import on different platforms (Windows/Mac/Linux).
- [ ] O095 Optimize export/import performance.
- [ ] O096 Ensure export files are cross-platform compatible.
- [ ] O097 Gather feedback on sharing UX.
- [ ] O098 Polish sharing UI based on feedback.
- [ ] O099 Verify sharing works without network.
- [ ] O100 Lock sharing and collaboration features.

### Extension & Plugin System (O101–O150)

- [ ] O101 Design extension API for custom cards.
- [ ] O102 Create `cardplay/src/extensions/api.ts` defining extension interface.
- [ ] O103 Add card extension API (define custom card types).
- [ ] O104 Add deck extension API (define custom deck types).
- [ ] O105 Add generator extension API (define custom generators).
- [ ] O106 Add effect extension API (define custom audio effects).
- [ ] O107 Add board extension API (define custom boards).
- [ ] O108 Add Prolog KB extension API (define custom predicates).
- [ ] O109 Create extension registry and loader.
- [ ] O110 Add extension discovery from `extensions/` folder.
- [ ] O111 Add extension validation and sandboxing.
- [ ] O112 Add extension manifest format (.json spec).
- [ ] O113 Add tests: extension API is well-defined.
- [ ] O114 Add tests: extension loader finds and loads extensions.
- [ ] O115 Add tests: extension validation rejects malformed extensions.
- [ ] O116 Create example extension: "Custom Drum Machine Card".
- [ ] O117 Create example extension: "Custom Scale Deck".
- [ ] O118 Create example extension: "Custom Generator (Euclidean Rhythm)".
- [ ] O119 Create example extension: "Custom Prolog Predicates (Microtonal Scales)".
- [ ] O120 Document extension API comprehensively.
- [ ] O121 Add extension development guide.
- [ ] O122 Add extension best practices.
- [ ] O123 Add extension debugging tools.
- [ ] O124 Add tests: example extensions load and work correctly.
- [ ] O125 Create extension browser UI.
- [ ] O126 Add installed extensions list.
- [ ] O127 Add available extensions list (local discovery).
- [ ] O128 Add "Install Extension" action (from file).
- [ ] O129 Add "Uninstall Extension" action.
- [ ] O130 Add "Enable/Disable Extension" toggle.
- [ ] O131 Add tests: extension browser shows extensions correctly.
- [ ] O132 Add tests: install/uninstall works correctly.
- [ ] O133 Add extension hot-reload for development.
- [ ] O134 Add extension error handling and fallback.
- [ ] O135 Add extension permission system (what extensions can access).
- [ ] O136 Add extension security audit checklist.
- [ ] O137 Add tests: extension permissions are enforced.
- [ ] O138 Add tests: extension errors don't crash app.
- [ ] O139 Document extension security model.
- [ ] O140 Document extension permission system.
- [ ] O141 Add extension marketplace spec (for future implementation).
- [ ] O142 Add extension signing/verification spec (for future).
- [ ] O143 Run extension system end-to-end test.
- [ ] O144 Test extensions on all platforms.
- [ ] O145 Optimize extension loading performance.
- [ ] O146 Gather feedback from potential extension developers.
- [ ] O147 Polish extension API based on feedback.
- [ ] O148 Create extension SDK package.
- [ ] O149 Verify extensions work in production builds.
- [ ] O150 Lock extension and plugin system.

### Community Resources (O151–O200)

- [ ] O151 Create community documentation site structure.
- [ ] O152 Add "Getting Started" guide for new users.
- [ ] O153 Add "Tutorials" section with step-by-step guides.
- [ ] O154 Add "Reference" section with API/KB documentation.
- [ ] O155 Add "Cookbook" section with recipes and patterns.
- [ ] O156 Add "FAQ" section with common questions.
- [ ] O157 Add "Troubleshooting" section with solutions.
- [ ] O158 Add search functionality across all docs.
- [ ] O159 Add code examples with syntax highlighting.
- [ ] O160 Add interactive examples (embedded demos).
- [ ] O161 Set up GitHub repository (if open source).
- [ ] O162 Add README with project overview.
- [ ] O163 Add CONTRIBUTING.md with contribution guidelines.
- [ ] O164 Add CODE_OF_CONDUCT.md for community standards.
- [ ] O165 Add LICENSE file (choose appropriate license).
- [ ] O166 Add CHANGELOG for tracking releases.
- [ ] O167 Add issue templates for bug reports.
- [ ] O168 Add issue templates for feature requests.
- [ ] O169 Add pull request template.
- [ ] O170 Set up GitHub Actions for CI/CD.
- [ ] O171 Create Discord/forum community space (optional).
- [ ] O172 Add community guidelines and moderation policy.
- [ ] O173 Create showcase gallery for user projects.
- [ ] O174 Add submission system for showcase.
- [ ] O175 Create video tutorial series (YouTube/similar).
- [ ] O176 Add beginner tutorial series (5-10 videos).
- [ ] O177 Add intermediate tutorial series (10-15 videos).
- [ ] O178 Add advanced tutorial series (10+ videos).
- [ ] O179 Add persona-specific tutorial series.
- [ ] O180 Add feature deep-dive tutorials.
- [ ] O181 Create sample project library.
- [ ] O182 Add 10+ example projects across all personas.
- [ ] O183 Add project walkthroughs explaining techniques.
- [ ] O184 Create extension example library.
- [ ] O185 Add 5+ example extensions demonstrating API.
- [ ] O186 Add extension tutorial videos.
- [ ] O187 Set up feedback collection system (local-only, privacy-safe).
- [ ] O188 Add in-app feedback form (optional).
- [ ] O189 Add analytics opt-in (privacy-first, local-only).
- [ ] O190 Add crash reporting opt-in (privacy-safe).
- [ ] O191 Document privacy policy for all data collection.
- [ ] O192 Ensure all community features respect privacy.
- [ ] O193 Test all community resources for accessibility.
- [ ] O194 Ensure documentation is searchable and navigable.
- [ ] O195 Gather feedback on documentation quality.
- [ ] O196 Polish documentation based on feedback.
- [ ] O197 Verify all links and examples work.
- [ ] O198 Set up documentation versioning (per release).
- [ ] O199 Create documentation update workflow.
- [ ] O200 Lock Phase O complete once community ecosystem is established.

---

## Phase P: Polish & Launch (P001–P200)

**Goal:** Final polish, performance optimization, accessibility, documentation, release preparation, and launch.

### Final UI/UX Polish (P001–P040)

- [ ] P001 Conduct full UI audit across all boards and decks.
- [ ] P002 Ensure consistent spacing/padding using design tokens.
- [ ] P003 Ensure consistent typography across all components.
- [ ] P004 Ensure consistent color usage (no hard-coded colors).
- [ ] P005 Ensure consistent iconography (single icon set).
- [ ] P006 Ensure consistent interaction patterns (hover/focus/active states).
- [ ] P007 Polish all animations for smoothness (60fps target).
- [ ] P008 Add loading states for all async operations.
- [ ] P009 Add empty states for all containers/decks.
- [ ] P010 Add error states with helpful messages.
- [ ] P011 Polish all modals and overlays (consistent styling).
- [ ] P012 Polish all tooltips (consistent placement/timing).
- [ ] P013 Polish all notifications/toasts (consistent positioning).
- [ ] P014 Add micro-interactions for better feedback.
- [ ] P015 Add haptic feedback for touch devices (where applicable).
- [ ] P016 Ensure all text is readable (contrast ratios meet WCAG AA).
- [ ] P017 Ensure all interactive elements have adequate hit targets (44x44px minimum).
- [ ] P018 Ensure all focus indicators are visible.
- [ ] P019 Ensure all hover states are discoverable.
- [ ] P020 Test UI on different screen sizes (laptop, desktop, ultrawide).
- [ ] P021 Test UI with different OS themes (light/dark).
- [ ] P022 Test UI with different font sizes (zoom levels).
- [ ] P023 Test UI with reduced motion preference.
- [ ] P024 Test UI with high contrast preference.
- [ ] P025 Polish onboarding flow (first-time user experience).
- [ ] P026 Polish empty project state (helpful guidance).
- [ ] P027 Polish error recovery flows.
- [ ] P028 Add progress indicators for long operations.
- [ ] P029 Add cancellation support for long operations.
- [ ] P030 Ensure all user actions have undo support.
- [ ] P031 Ensure all destructive actions have confirmation.
- [ ] P032 Polish keyboard navigation throughout app.
- [ ] P033 Polish screen reader experience throughout app.
- [ ] P034 Conduct user testing sessions (if possible).
- [ ] P035 Gather UX feedback and create fix list.
- [ ] P036 Implement high-priority UX fixes.
- [ ] P037 Re-test after UX fixes.
- [ ] P038 Polish final details (icon alignments, spacing tweaks).
- [ ] P039 Run final UI/UX audit.
- [ ] P040 Lock UI/UX as polished and ready.

### Performance Optimization (P041–P080)

- [ ] P041 Profile app startup time.
- [ ] P042 Optimize critical rendering path.
- [ ] P043 Implement code splitting for faster initial load.
- [ ] P044 Implement lazy loading for optional features.
- [ ] P045 Optimize bundle size (tree shaking, minification).
- [ ] P046 Add bundle size budgets and monitoring.
- [ ] P047 Ensure startup time < 3 seconds on typical hardware.
- [ ] P048 Profile runtime performance (CPU, memory).
- [ ] P049 Optimize hot paths (event handling, rendering).
- [ ] P050 Implement virtualization for large lists (tracker, piano roll).
- [ ] P051 Implement incremental rendering where applicable.
- [ ] P052 Optimize audio engine performance (latency, CPU usage).
- [ ] P053 Implement audio worker thread optimization.
- [ ] P054 Optimize sample loading (streaming, caching).
- [ ] P055 Optimize Prolog query performance (query batching, memoization).
- [ ] P056 Ensure 60fps rendering during typical usage.
- [ ] P057 Ensure audio latency < 10ms (hardware-dependent).
- [ ] P058 Ensure memory usage < 500MB for typical project.
- [ ] P059 Add performance monitoring (dev tools).
- [ ] P060 Add performance budgets for key metrics.
- [ ] P061 Run performance benchmarks on target hardware.
- [ ] P062 Optimize for low-end hardware (disable heavy features gracefully).
- [ ] P063 Test on older machines (5+ years old).
- [ ] P064 Test with large projects (100+ clips, 50+ tracks).
- [ ] P065 Test with complex routing (50+ connections).
- [ ] P066 Test with many decks open (10+ simultaneous).
- [ ] P067 Profile memory leaks (long sessions, board switching).
- [ ] P068 Fix all identified memory leaks.
- [ ] P069 Add memory leak tests (automated).
- [ ] P070 Profile disk I/O (project load/save).
- [ ] P071 Optimize project serialization.
- [ ] P072 Implement incremental project saving.
- [ ] P073 Ensure project save < 1 second for typical project.
- [ ] P074 Ensure project load < 2 seconds for typical project.
- [ ] P075 Run full performance test suite.
- [ ] P076 Ensure all performance budgets are met.
- [ ] P077 Document performance characteristics.
- [ ] P078 Document system requirements (min/recommended).
- [ ] P079 Gather performance feedback from testers.
- [ ] P080 Lock performance as optimized and stable.

### Accessibility (P081–P100)

- [ ] P081 Run automated accessibility audit (axe-core or similar).
- [ ] P082 Fix all critical accessibility issues.
- [ ] P083 Fix all serious accessibility issues.
- [ ] P084 Document remaining minor issues and workarounds.
- [ ] P085 Test with screen reader (NVDA/JAWS/VoiceOver).
- [ ] P086 Test with keyboard-only navigation.
- [ ] P087 Test with magnification/zoom.
- [ ] P088 Test with high contrast mode.
- [ ] P089 Test with reduced motion.
- [ ] P090 Ensure all WCAG 2.1 AA criteria are met.
- [ ] P091 Document accessibility features in docs.
- [ ] P092 Add accessibility statement to website/docs.
- [ ] P093 Add keyboard shortcut reference.
- [ ] P094 Add screen reader usage guide.
- [ ] P095 Gather feedback from users with disabilities (if possible).
- [ ] P096 Implement feedback-driven accessibility improvements.
- [ ] P097 Re-test after accessibility fixes.
- [ ] P098 Add accessibility regression tests.
- [ ] P099 Document ongoing accessibility commitment.
- [ ] P100 Lock accessibility as compliant and tested.

### Documentation & Help (P101–P130)

- [ ] P101 Complete all API documentation.
- [ ] P102 Complete all KB predicate documentation.
- [ ] P103 Complete all board/deck documentation.
- [ ] P104 Complete all persona workflow documentation.
- [ ] P105 Complete all feature documentation.
- [ ] P106 Complete all troubleshooting documentation.
- [ ] P107 Complete all extension development documentation.
- [ ] P108 Add getting started guide for each persona.
- [ ] P109 Add quick reference cards for each board.
- [ ] P110 Add keyboard shortcut cheat sheets.
- [ ] P111 Add video tutorial series (all personas).
- [ ] P112 Add interactive tutorials (in-app).
- [ ] P113 Add context-sensitive help throughout app.
- [ ] P114 Add tooltips for all non-obvious UI elements.
- [ ] P115 Add "What's This?" mode for exploring UI.
- [ ] P116 Test documentation completeness.
- [ ] P117 Test documentation accuracy.
- [ ] P118 Test documentation searchability.
- [ ] P119 Test video tutorials (all working).
- [ ] P120 Test interactive tutorials (no errors).
- [ ] P121 Proofread all documentation.
- [ ] P122 Check all links in documentation.
- [ ] P123 Check all code examples in documentation.
- [ ] P124 Add documentation version selector (per release).
- [ ] P125 Set up documentation hosting (GitHub Pages or similar).
- [ ] P126 Gather feedback on documentation clarity.
- [ ] P127 Polish documentation based on feedback.
- [ ] P128 Create documentation contribution guide.
- [ ] P129 Verify documentation is accessible.
- [ ] P130 Lock documentation as complete and published.

### Testing & Quality Assurance (P131–P160)

- [ ] P131 Run full test suite (unit + integration + E2E).
- [ ] P132 Ensure 100% test pass rate.
- [ ] P133 Review test coverage reports.
- [ ] P134 Add tests for any untested critical paths.
- [ ] P135 Ensure code coverage > 80% for core modules.
- [ ] P136 Run mutation testing (check test quality).
- [ ] P137 Add regression tests for all fixed bugs.
- [ ] P138 Run smoke tests on all platforms (Windows/Mac/Linux).
- [ ] P139 Run smoke tests on all supported browsers (if web).
- [ ] P140 Run load tests (large projects, many users).
- [ ] P141 Run stress tests (edge cases, extreme values).
- [ ] P142 Run security audit (if applicable).
- [ ] P143 Fix all security vulnerabilities.
- [ ] P144 Run dependency audit (vulnerable packages).
- [ ] P145 Update or remove vulnerable dependencies.
- [ ] P146 Run license compliance check.
- [ ] P147 Ensure all dependencies have compatible licenses.
- [ ] P148 Create QA checklist for releases.
- [ ] P149 Execute QA checklist for this release.
- [ ] P150 Document all known issues and limitations.
- [ ] P151 Triage known issues (fix, defer, wontfix).
- [ ] P152 Fix all release-blocking issues.
- [ ] P153 Document deferred issues in backlog.
- [ ] P154 Set up CI/CD pipeline for automated testing.
- [ ] P155 Ensure CI runs on all PRs.
- [ ] P156 Ensure CI blocks merge on test failures.
- [ ] P157 Add automated release process.
- [ ] P158 Test automated release process (dry run).
- [ ] P159 Verify all tests pass in CI.
- [ ] P160 Lock QA as complete and passing.

### Release Preparation (P161–P200)

- [ ] P161 Finalize version number (semantic versioning).
- [ ] P162 Update CHANGELOG with all changes.
- [ ] P163 Update README with current feature set.
- [ ] P164 Update package.json with correct metadata.
- [ ] P165 Update LICENSE file (confirm license choice).
- [ ] P166 Create release notes document.
- [ ] P167 Highlight major features in release notes.
- [ ] P168 Highlight breaking changes in release notes.
- [ ] P169 Highlight migration guide in release notes.
- [ ] P170 Create release announcement blog post.
- [ ] P171 Create release announcement social media posts.
- [ ] P172 Create release demo video (overview).
- [ ] P173 Prepare press kit (if applicable).
- [ ] P174 Set up release download page.
- [ ] P175 Set up release documentation page.
- [ ] P176 Build release artifacts (all platforms).
- [ ] P177 Sign release artifacts (code signing if applicable).
- [ ] P178 Test release artifacts on clean machines.
- [ ] P179 Verify installation process works smoothly.
- [ ] P180 Verify uninstallation process works cleanly.
- [ ] P181 Create backup/rollback plan.
- [ ] P182 Set up support channels (GitHub issues, forum, etc.).
- [ ] P183 Prepare support team (if applicable).
- [ ] P184 Create post-launch monitoring plan.
- [ ] P185 Set up error tracking (opt-in, privacy-safe).
- [ ] P186 Set up usage analytics (opt-in, privacy-safe).
- [ ] P187 Tag release in version control.
- [ ] P188 Create GitHub release with artifacts.
- [ ] P189 Publish documentation website.
- [ ] P190 Publish release announcement.
- [ ] P191 Share on social media (if applicable).
- [ ] P192 Submit to relevant directories (if applicable).
- [ ] P193 Monitor for critical issues post-launch.
- [ ] P194 Prepare hotfix process for critical bugs.
- [ ] P195 Celebrate launch! 🎉
- [ ] P196 Gather post-launch feedback.
- [ ] P197 Create post-launch improvement backlog.
- [ ] P198 Plan next version roadmap.
- [ ] P199 Document lessons learned.
- [ ] P200 Lock Phase P complete - CardPlay v1.0 launched!

---

# Roadmap Complete

**Total Steps: ~2,800**

**Summary:**
- **Phases A-K (1000 steps)**: Board-Centric Architecture from boardcentric-1000-step-plan.md
- **Phase L (400 steps)**: Prolog AI Foundation with music theory, composition, and board reasoning
- **Phase M (400 steps)**: Deep persona-specific enhancements with board-centric workflows
- **Phase N (200 steps)**: Advanced AI features including workflow planning and project analysis
- **Phase O (200 steps)**: Community ecosystem, templates, sharing, and extensions
- **Phase P (200 steps)**: Final polish, performance, accessibility, and launch

This roadmap delivers the vision of a **configurable board for any type of user** with **as much or as little AI as you want**, powered by **Prolog-based declarative reasoning** over deck layouts, music theory, and compositional patterns.
