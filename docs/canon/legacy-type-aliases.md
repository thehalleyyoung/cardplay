# Legacy Type Aliases

**Status:** Maintained (auto-generated)
**Last Updated:** 2026-01-30

This document tracks deprecated type aliases, value aliases, and function aliases in the codebase.
All legacy symbols should be migrated to their canonical equivalents.

---

## Disambiguated Symbol Names

Some symbols are legitimately exported from multiple modules with different meanings.
These are NOT legacy aliases—they represent different concepts that happen to share a name.

| Symbol | Context | Description | Location |
|--------|---------|-------------|----------|
| `CardState` (core) | Core card state | Generic interface for card state management | `src/cards/card.ts` |
| `CardState` (UI enum) | UI render state | Type alias for CardSurfaceStateEnum | `src/ui/cards.ts` |
| `CardState` (UI union) | Component state | Union type for card component states | `src/ui/components/card-component.ts` |
| `PortType` (canon) | Canonical types | Union of builtin port types (audio/midi/etc) | `src/canon/ids.ts` |
| `PortType` (extensible) | Runtime registry | Branded string type for all port types | `src/cards/card.ts` |
| `Track` (freeze) | **DEPRECATED** | Use `FreezeTrackModel` instead | `src/tracks/clip-operations.ts` |
| `Track` (arrangement) | **DEPRECATED** | Use `ArrangementTrack` instead | `src/ui/components/arrangement-panel.ts` |

**Guidance:**
- **CardState:** Import from the appropriate module for your use case. Core cards use the generic version; UI code uses the enum.
- **PortType:** Use `canon/ids.ts` for validation/documentation; use `cards/card.ts` for runtime port operations and registry.
- **Track:** These ARE legacy aliases and should be migrated to their canonical names.

---

## Type Aliases

| Legacy Name | Canonical Name | Location |
|-------------|---------------|----------|
| `CardSize` | `CardSurfaceSize` | `src/ui/cards.ts` |
| `CardState` | `CardSurfaceStateEnum` | `src/ui/cards.ts` |
| `CardStyle` | `CardSurfaceStyle` | `src/ui/cards.ts` |
| `GeneratorConfig` | `Partial` | `src/cards/generator-mixin.ts` |
| `HostAction` | `AdvisorHostAction` | `src/ai/advisor/advisor-interface.ts` |
| `NoteRectangle` | `NoteRect` | `src/ui/components/piano-roll-store-adapter.ts` |
| `ParameterSourceType` | `ParameterSource` | `src/state/parameter-resolver.ts` |
| `RoutingNodeId` | `string` | `src/state/types.ts` |
| `SessionScene` | `SceneHeader` | `src/ui/session-clip-adapter.ts` |
| `StackComponent` | `UIStackComponent` | `src/ui/components/stack-component.ts` |
| `StackMode` | `UILayoutStackMode` | `src/ui/cards.ts` |
| `Track` | `FreezeTrackModel` | `src/tracks/clip-operations.ts` |
| `Track` | `ArrangementTrack` | `src/ui/components/arrangement-panel.ts` |

## Value Aliases

| Legacy Name | Canonical Name | Location |
|-------------|---------------|----------|
| `parseChord` | `parseChordSymbol` | `src/containers/chord-track.ts` |

## Function Aliases

| Legacy Name | Canonical Name | Location |
|-------------|---------------|----------|

---

## Migration Guidelines

1. Replace all uses of legacy names with canonical names
2. Run `npm run typecheck` to verify changes
3. Update tests to use canonical names
4. Once all uses are migrated, the deprecated exports can be removed

To regenerate this document: `npm run docs:sync-aliases`
