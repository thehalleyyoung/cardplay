# Legacy Type Aliases

**Status:** Maintained (auto-generated)
**Last Updated:** 2026-01-30

This document tracks deprecated type aliases, value aliases, and function aliases in the codebase.
All legacy symbols should be migrated to their canonical equivalents.

---

## Type Aliases

### Multiple Meanings (Ambiguous Symbols)

These symbols are exported from multiple locations with different meanings:

| Symbol | Context | Canonical Name | Location | Notes |
|--------|---------|----------------|----------|-------|
| `CardState` (UI surface) | UI card surface state | `CardSurfaceState` | `src/ui/cards.ts` | Deprecated alias |
| `CardState` (core) | Core card state (generic) | `CardState<A,B>` | `src/cards/card.ts` | Generic card state |
| `CardState` (component) | Component state | `CardState` | `src/ui/components/card-component.ts` | Component-specific |
| `PortType` (canonical) | Canonical port type enum | `CanonicalPortType` | `src/canon/ids.ts` | Enum of port types |
| `PortType` (registry) | Core port type registry string | `PortType` | `src/cards/card.ts` | Runtime registry string |
| `Track` (freeze) | Freeze/bounce track model | `FreezeTrackModel` | `src/tracks/clip-operations.ts` | Audio freeze operations |
| `Track` (arrangement) | Arrangement UI track | `ArrangementTrack` | `src/ui/components/arrangement-panel.ts` | UI arrangement track |
| `Track` (project) | GOFAI project API track | `Track` | `gofai/infra/project-world-api.ts` | Project world API |

### Single Meaning (Deprecated Aliases)

| Legacy Name | Canonical Name | Location |
|-------------|---------------|----------|
| `CardSize` | `CardSurfaceSize` | `src/ui/cards.ts` |
| `CardStyle` | `CardSurfaceStyle` | `src/ui/cards.ts` |
| `GeneratorConfig` | `Partial` | `src/cards/generator-mixin.ts` |
| `HostAction` | `AdvisorHostAction` | `src/ai/advisor/advisor-interface.ts` |
| `NoteRectangle` | `NoteRect` | `src/ui/components/piano-roll-store-adapter.ts` |
| `ParameterSourceType` | `ParameterSource` | `src/state/parameter-resolver.ts` |
| `RoutingNodeId` | `string` | `src/state/types.ts` |
| `SessionScene` | `SceneHeader` | `src/ui/session-clip-adapter.ts` |
| `StackComponent` | `UIStackComponent` | `src/ui/components/stack-component.ts` |
| `StackMode` | `UILayoutStackMode` | `src/ui/cards.ts` |

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
