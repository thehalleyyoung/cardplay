# Card Systems

**Status:** Maintained (auto-generated)
**Last Updated:** 2026-01-30

This document tracks Card-related type exports across different subsystems.
CardPlay has multiple "Card" concepts that serve different purposes.

---

## Overview

The term "Card" appears in five distinct subsystems:

1. **Core Cards** (`src/cards/`): Composable card computation system
2. **Audio Module Cards** (`src/audio/`): Audio processing modules
3. **UI Card Surfaces** (`src/ui/`): Visual card rendering components
4. **Editor Card Definitions** (`src/user-cards/`): User-editable card metadata
5. **Theory Cards** (`src/ai/theory/`): Music theory constraint generators

---

## Audio Module Cards

| Name | Type | Location | Description |
|------|------|----------|-------------|
| `AudioModuleCard` | interface | `src/audio/instrument-cards.ts` | N/A |
| `HybridCard` | class | `src/audio/instrument-cards.ts` | N/A |
| `SamplerCard` | class | `src/audio/instrument-cards.ts` | N/A |
| `WavetableCard` | class | `src/audio/instrument-cards.ts` | N/A |

## UI Card Surfaces

| Name | Type | Location | Description |
|------|------|----------|-------------|
| `CardAnimation` | type | `src/ui/components/card-component.ts` | N/A |
| `CardBadge` | interface | `src/ui/components/card-component.ts` | N/A |
| `CardBadgeConfig` | interface | `src/ui/cards.ts` | N/A |
| `CardCategory` | interface | `src/ui/cards.ts` | N/A |
| `CardContentConfig` | interface | `src/ui/cards.ts` | N/A |
| `CardFocusState` | interface | `src/ui/cards.ts` | N/A |
| `CardHeaderButton` | interface | `src/ui/cards.ts` | N/A |
| `CardHeaderConfig` | interface | `src/ui/cards.ts` | N/A |
| `CardHeaderState` | interface | `src/ui/cards.ts` | N/A |
| `CardLifecycle` | interface | `src/ui/components/card-component.ts` | N/A |
| `CardMenuItem` | interface | `src/ui/cards.ts` | N/A |
| `CardMenuItemType` | type | `src/ui/cards.ts` | N/A |
| `CardMenuState` | interface | `src/ui/cards.ts` | N/A |
| `CardNavigationDirection` | type | `src/ui/cards.ts` | N/A |
| `CardOptions` | interface | `src/ui/components/card-component.ts` | N/A |
| `CardPortConfig` | interface | `src/ui/cards.ts` | N/A |
| `CardPortState` | interface | `src/ui/cards.ts` | N/A |
| `CardPreviewConfig` | interface | `src/ui/cards.ts` | N/A |
| `CardSearchConfig` | interface | `src/ui/cards.ts` | N/A |
| `CardSearchState` | interface | `src/ui/cards.ts` | N/A |
| `CardSize` | type | `src/ui/components/card-component.ts` | N/A |
| `CardSize` | type | `src/ui/cards.ts` | N/A |
| `CardStackConfig` | interface | `src/ui/cards.ts` | N/A |
| `CardStackState` | interface | `src/ui/cards.ts` | N/A |
| `CardState` | type | `src/ui/components/card-component.ts` | N/A |
| `CardState` | type | `src/ui/cards.ts` | N/A |
| `CardStyle` | type | `src/ui/cards.ts` | N/A |
| `CardSurfaceConfig` | interface | `src/ui/cards.ts` | N/A |
| `CardSurfaceSize` | type | `src/ui/cards.ts` | N/A |
| `CardSurfaceState` | type | `src/ui/cards.ts` | N/A |
| `CardSurfaceState` | interface | `src/ui/cards.ts` | N/A |
| `CardSurfaceStyle` | type | `src/ui/cards.ts` | N/A |
| `CardToolbarConfig` | interface | `src/ui/cards.ts` | N/A |
| `UICardComponent` | class | `src/ui/components/card-component.ts` | N/A |

## Editor Card Definitions

| Name | Type | Location | Description |
|------|------|----------|-------------|
| `CardEditorHistoryEntry` | interface | `src/user-cards/card-editor-panel.ts` | N/A |
| `CardEditorState` | interface | `src/user-cards/card-editor-panel.ts` | N/A |
| `CardTemplate` | interface | `src/user-cards/card-editor-panel.ts` | N/A |
| `EditorCardDefinition` | interface | `src/user-cards/card-editor-panel.ts` | N/A |

## Theory Cards

| Name | Type | Location | Description |
|------|------|----------|-------------|
| `CardConflictBadge` | interface | `src/ai/theory/theory-cards.ts` | N/A |
| `TheoryCardDef` | interface | `src/ai/theory/theory-cards.ts` | N/A |
| `TheoryCardParamDef` | interface | `src/ai/theory/theory-cards.ts` | N/A |
| `TheoryCardParamState` | interface | `src/ai/theory/theory-cards.ts` | N/A |
| `TheoryCardState` | type | `src/ai/theory/theory-cards.ts` | N/A |

---

## Disambiguation Rules

1. Use `CoreCard<A,B>` or `Card<A,B>` for composition system
2. Use `AudioModuleCard` for audio processing
3. Use `UICardComponent` for rendering components
4. Use `EditorCardDefinition` for user-editable metadata
5. Use `TheoryCard` for music constraint generation

Avoid exporting bare `Card` from barrel files to prevent ambiguity.

To regenerate this document: `npm run docs:sync-card-systems`
