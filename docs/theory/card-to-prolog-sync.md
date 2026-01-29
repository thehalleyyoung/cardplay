# How Card Parameters Become Prolog Facts

> **Roadmap Item**: C022 Add docs: "How card params become Prolog facts" (sync lifecycle).

## Overview

This document describes the lifecycle of musical specifications from UI card parameters to Prolog knowledge base facts, and how they stay synchronized.

## Sync Lifecycle

```
┌───────────────────────────────────────────────────────────────────────────┐
│  1. USER ACTION                                                           │
│     User changes a card parameter (e.g., selects "Prinner" schema)        │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  2. CARD STATE UPDATE                                                     │
│     Svelte store updates: cardParams.schema = 'prinner'                   │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  3. SPEC CONSTRUCTION                                                     │
│     MusicSpec object created from all relevant card params                │
│     TypeScript validation runs (invariant checks)                         │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  4. PROLOG ASSERTION                                                      │
│     music_spec/7 fact asserted into Prolog KB                             │
│     Previous spec for this context retracted                              │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  5. INFERENCE TRIGGER                                                     │
│     Prolog rules evaluate new spec                                        │
│     Recommendations generated based on current state                      │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  6. HOST ACTIONS RETURNED                                                 │
│     Prolog returns HostActions (see C023)                                 │
│     UI updates to reflect recommendations                                 │
└───────────────────────────────────────────────────────────────────────────┘
```

## MusicSpec to Prolog Mapping

### TypeScript MusicSpec Structure

```typescript
interface MusicSpec {
  tempo: number;
  meter: [number, number];
  key: { root: RootName; mode: ModeName };
  culture: CultureTag;
  style: StyleTag;
  constraints: SpecConstraint[];
  context: SpecContext;
}
```

### Prolog music_spec/7 Predicate

```prolog
% music_spec(ContextId, Tempo, Meter, Key, Culture, Style, Constraints)
music_spec(
    tracker_main,           % Context identifier
    120,                    % Tempo in BPM
    meter(4, 4),           % Meter as compound term
    key(c, major),         % Key as compound term
    western,               % Culture atom
    galant,                % Style atom
    [schema(prinner),      % List of constraints
     density(medium),
     tension_max(0.7)]
).
```

## Conversion Rules

### Simple Values

| TypeScript | Prolog |
|------------|--------|
| `tempo: 120` | `120` (integer) |
| `culture: 'western'` | `western` (atom) |
| `style: 'galant'` | `galant` (atom) |

### Compound Values

| TypeScript | Prolog |
|------------|--------|
| `meter: [4, 4]` | `meter(4, 4)` |
| `key: { root: 'c', mode: 'major' }` | `key(c, major)` |
| `chordQuality: 'dominant7'` | `chord_quality(dominant7)` |

### Constraint Lists

```typescript
// TypeScript
constraints: [
  { type: 'schema', value: 'prinner' },
  { type: 'density', value: 'medium' },
  { type: 'tension_max', value: 0.7 }
]
```

```prolog
% Prolog
[schema(prinner), density(medium), tension_max(0.7)]
```

## Context Identifiers

Each card/tool combination gets a unique context ID:

| Tool | Context ID Pattern |
|------|-------------------|
| Tracker (main) | `tracker_main` |
| Tracker (track N) | `tracker_track_N` |
| Arranger | `arranger_main` |
| Phrase Tool | `phrase_tool` |
| Melody Generator | `melody_gen` |

## Sync Triggers

### Immediate Sync (Debounced)

- Key/mode changes
- Tempo changes
- Schema selection
- Culture/style changes

### Deferred Sync (On Demand)

- Constraint slider changes (batched)
- Fine-tuning parameters

### No Sync Needed

- Visual-only settings (colors, zoom)
- Playback position (handled in TS)

## Retraction Strategy

When a spec updates, the previous fact must be retracted:

```prolog
% Update spec for context
update_spec(Context, NewSpec) :-
    retractall(music_spec(Context, _, _, _, _, _, _)),
    assertz(NewSpec).
```

## Validation Before Sync

Before asserting to Prolog, TypeScript validates:

1. **Invariant check**: `validateSpecInvariants(spec)`
2. **Type check**: All values are valid enum members
3. **Range check**: Numeric values within bounds
4. **Consistency check**: Constraints don't contradict each other

## Error Handling

If validation fails:
- Spec is not synced to Prolog
- UI shows validation error
- Previous valid spec remains active

## See Also

- [C021: KB Layering](./kb-layering.md)
- [C023: How Prolog returns HostActions](./prolog-to-host-actions.md)
