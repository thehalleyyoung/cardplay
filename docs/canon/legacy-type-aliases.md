# Legacy Type Aliases

**Status:** implemented  
**SSOT:** This document maps duplicate type names to canonical names.

---

## Purpose

The codebase has evolved and contains duplicate or conflicting type names. This document maps them to canonical versions.

---

## Type Alias Mappings

### Card-Related

| Legacy/Duplicate | Canonical | Location |
|---|---|---|
| `Card` (audio) | `AudioModuleCard` | `cardplay/src/audio/instrument-cards.ts` |
| `CardCategory` (audio) | `AudioModuleCategory` | `cardplay/src/audio/instrument-cards.ts` |
| `CardState` (audio) | `AudioModuleState` | `cardplay/src/audio/instrument-cards.ts` |
| `CardSnapshot` (audio) | `AudioModuleSnapshot` | `cardplay/src/audio/instrument-cards.ts` |
| `Card` (generic) | `Card<A,B>` | `cardplay/src/cards/card.ts` |
| `CardDefinition` (editor) | `EditorCardDefinition` | `cardplay/src/user-cards/card-editor-panel.ts` |
| `CardDefinition` (visuals) | `CardDefinition` | `cardplay/src/cards/card-visuals.ts` |

### HostAction-Related

| Legacy/Duplicate | Canonical | Location |
|---|---|---|
| `HostAction` (adapter) | Use for parsing only | `cardplay/src/ai/engine/prolog-adapter.ts` |
| `HostAction` (advisor) | Use for UI | `cardplay/src/ai/advisor/advisor-interface.ts` |
| **`HostAction`** | **Canonical** | `cardplay/src/ai/theory/host-actions.ts` |

### PortType-Related

| Legacy/Duplicate | Canonical | Location |
|---|---|---|
| `PortType` (UI) | `UIPortType` | `cardplay/src/ui/components/card-component.ts` |
| `PortType` (ui/cards) | `UISurfacePortType` | `cardplay/src/ui/cards.ts` |
| `PortType` (visuals) | `VisualPortType` | `cardplay/src/cards/card-visuals.ts` |
| **`PortType`** | **Canonical** | `cardplay/src/cards/card.ts` |

### CadenceType-Related

| Legacy/Duplicate | Canonical | Notes |
|---|---|---|
| `CadenceType` (harmony) | Legacy, maps to canonical | `cardplay/src/ai/theory/harmony-cadence-integration.ts` |
| **`CadenceType`** | **Canonical** | `cardplay/src/ai/theory/music-spec.ts` |

### Track-Related

| Legacy/Duplicate | Canonical | Notes |
|---|---|---|
| `Track` (arrangement) | `ArrangementTrack` | `cardplay/src/ui/components/arrangement-panel.ts` |
| `Track` (freeze) | `FreezeTrackModel` | `cardplay/src/tracks/clip-operations.ts` |
| `Track` (lens concept) | Aspirational | Not yet implemented |

---

## Usage in Docs

When referencing these types:
1. Use the canonical version
2. If referencing a legacy version, add `(legacy)` qualifier
3. Link to this doc when converting old content
