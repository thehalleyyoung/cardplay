# Deck Systems

**Status:** Maintained (auto-generated)
**Last Updated:** 2026-01-30

This document tracks Deck-related types, factories, and DeckType values.

---

## DeckType Values

The canonical `DeckType` union defines all builtin deck types:

| Value | Factory | Status |
|-------|---------|--------|
| `ai-advisor-deck       // AI Advisor panel (L299)` | `N/A` | ⚠ Missing Factory |
| `arrangement-deck      // Timeline arrangement` | `N/A` | ⚠ Missing Factory |
| `arranger-deck         // Arranger sections (E057)` | `N/A` | ⚠ Missing Factory |
| `automation-deck       // Automation lanes` | `N/A` | ⚠ Missing Factory |
| `dsp-chain             // DSP effect chain (E042)` | `N/A` | ⚠ Missing Factory |
| `effects-deck          // Effect rack` | `N/A` | ⚠ Missing Factory |
| `generators-deck       // Generator cards` | `N/A` | ⚠ Missing Factory |
| `harmony-deck          // Harmony explorer` | `N/A` | ⚠ Missing Factory |
| `instruments-deck      // Instrument rack` | `N/A` | ⚠ Missing Factory |
| `mix-bus-deck          // Mix bus for group processing (M259)` | `N/A` | ⚠ Missing Factory |
| `mixer-deck            // Mixer channels` | `N/A` | ⚠ Missing Factory |
| `modulation-matrix-deck // Modulation matrix (M178)` | `N/A` | ⚠ Missing Factory |
| `notation-deck         // Notation editor` | `N/A` | ⚠ Missing Factory |
| `pattern-deck          // Tracker pattern editor` | `N/A` | ⚠ Missing Factory |
| `phrases-deck          // Phrase library` | `N/A` | ⚠ Missing Factory |
| `piano-roll-deck       // Piano roll editor` | `N/A` | ⚠ Missing Factory |
| `properties-deck       // Properties inspector` | `N/A` | ⚠ Missing Factory |
| `reference-track-deck  // Reference track A/B comparison (M260)` | `N/A` | ⚠ Missing Factory |
| `registry-devtool-deck` | `N/A` | ⚠ Missing Factory |
| `routing-deck          // Routing graph` | `N/A` | ⚠ Missing Factory |
| `sample-manager-deck   // Sample manager / organizer (M100)` | `N/A` | ⚠ Missing Factory |
| `samples-deck          // Sample browser` | `N/A` | ⚠ Missing Factory |
| `session-deck          // Session view clips` | `N/A` | ⚠ Missing Factory |
| `spectrum-analyzer-deck // Spectrum analyzer (M179)` | `N/A` | ⚠ Missing Factory |
| `track-groups-deck     // Track groups for organizing stems (M258)` | `N/A` | ⚠ Missing Factory |
| `transport-deck        // Transport controls (E060)` | `N/A` | ⚠ Missing Factory |
| `waveform-editor-deck  // Waveform editor (M180)` | `N/A` | ⚠ Missing Factory |

## Deck Type Exports

| Name | Type | Location | Description |
|------|------|----------|-------------|
| `BoardDeck` | interface | `src/boards/types.ts` | N/A |
| `BoardDeckStates` | interface | `src/boards/decks/runtime-types.ts` | N/A |
| `DeckCapabilities` | interface | `src/boards/decks/deck-capabilities.ts` | N/A |
| `DeckCardLayout` | type | `src/boards/types.ts` | N/A |
| `DeckContainerOptions` | interface | `src/boards/decks/deck-container.ts` | N/A |
| `DeckDropValidation` | interface | `src/boards/gating/validate-deck-drop.ts` | N/A |
| `DeckFactory` | interface | `src/boards/decks/factory-types.ts` | N/A |
| `DeckFactoryContext` | interface | `src/boards/decks/factory-types.ts` | N/A |
| `DeckId` | type | `src/boards/types.ts` | N/A |
| `DeckInstance` | interface | `src/boards/decks/factory-types.ts` | N/A |
| `DeckPack` | interface | `src/boards/deck-packs/types.ts` | N/A |
| `DeckPackAddOptions` | interface | `src/boards/deck-packs/types.ts` | N/A |
| `DeckPackAddResult` | interface | `src/boards/deck-packs/types.ts` | N/A |
| `DeckPackInstallation` | interface | `src/boards/deck-packs/types.ts` | N/A |
| `DeckPackSearchOptions` | interface | `src/boards/deck-packs/types.ts` | N/A |
| `DeckPanelAssignment` | interface | `src/boards/layout/assign-decks-to-panels.ts` | N/A |
| `DeckRuntimeState` | interface | `src/boards/decks/runtime-types.ts` | N/A |
| `DeckSettings` | interface | `src/boards/store/types.ts` | N/A |
| `DeckState` | interface | `src/boards/store/types.ts` | N/A |
| `DeckTab` | interface | `src/boards/decks/tab-manager.ts` | N/A |
| `DeckTabState` | interface | `src/boards/decks/tab-manager.ts` | N/A |
| `DeckType` | type | `src/boards/types.ts` | N/A |
| `MixerDeckSettings` | interface | `src/boards/store/types.ts` | N/A |
| `NotationDeckSettings` | interface | `src/boards/store/types.ts` | N/A |
| `PanelDeckAssignment` | interface | `src/boards/layout/assign-decks-to-panels.ts` | N/A |
| `RevealedDeck` | interface | `src/boards/builtins/live-performance-actions.ts` | N/A |

## Deck Factories

| Name | Location | Implements |
|------|----------|-----------|
| `advisor` | `src/boards/decks/factories/ai-advisor-factory.ts` | `advisor-deck` |
| `analyzer` | `src/boards/decks/factories/spectrum-analyzer-factory.ts` | `analyzer-deck` |
| `bus` | `src/boards/decks/factories/mix-bus-factory.ts` | `bus-deck` |
| `chain` | `src/boards/decks/factories/dsp-chain-factory.ts` | `chain-deck` |
| `deck` | `src/boards/decks/factories/arrangement-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/arranger-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/automation-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/effects-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/harmony-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/instruments-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/mixer-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/modulation-matrix-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/notation-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/pattern-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/phrases-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/piano-roll-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/properties-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/routing-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/sample-manager-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/samples-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/session-deck-factory.ts` | `deck-deck` |
| `deck` | `src/boards/decks/factories/transport-deck-factory.ts` | `deck-deck` |
| `devtool` | `src/boards/decks/factories/registry-devtool-factory.ts` | `devtool-deck` |
| `editor` | `src/boards/decks/factories/waveform-editor-factory.ts` | `editor-deck` |
| `generator` | `src/boards/decks/factories/generator-factory.ts` | `generator-deck` |
| `groups` | `src/boards/decks/factories/track-groups-factory.ts` | `groups-deck` |
| `track` | `src/boards/decks/factories/reference-track-factory.ts` | `track-deck` |

---

## Guidelines

1. **DeckType** is a closed union of builtin deck types (not extensible)
2. **DeckId** is a branded instance identifier (distinct from DeckType)
3. **BoardDeck** combines DeckType, DeckId, and panelId
4. Each DeckType must have a corresponding factory registered

To regenerate this document: `npm run docs:sync-deck-systems`
