# Migration Guide

**Change 498** from `to_fix_repo_plan_500.md`

This document describes the migration order for bringing the codebase into alignment with canon documentation.

## Migration Phases

### Phase 1: DeckType Migration

**Goal**: Ensure all code uses canonical DeckType values.

| Legacy Value | Canonical Value | Status |
|--------------|-----------------|--------|
| `'pattern-editor'` | `'pattern-deck'` | ✅ Done |
| `'piano-roll'` | `'piano-roll-deck'` | ✅ Done |
| `'notation-score'` | `'notation-deck'` | ✅ Done |
| `'session'` | `'session-deck'` | ✅ Done |
| `'arrangement'` | `'arrangement-deck'` | ✅ Done |
| `'mixer'` | `'mixer-deck'` | ✅ Done |

**Migration utility**: `normalizeDeckType()` in `src/canon/legacy-aliases.ts`

### Phase 2: PortType Migration

**Goal**: Separate direction from port type, use canonical port types.

| Legacy Format | New Model |
|---------------|-----------|
| `'audio_in'` | `{ direction: 'in', type: 'audio' }` |
| `'midi_out'` | `{ direction: 'out', type: 'midi' }` |
| `'mod_in'` | `{ direction: 'in', type: 'control' }` |

**Canonical port types**: `audio`, `midi`, `notes`, `control`, `trigger`, `gate`, `clock`, `transport`

**Migration utilities**:
- `normalizePortType()` in `src/canon/port-types.ts`
- `parseUIPortType()` in `src/ui/components/card-component.ts`
- `portSpecToCanonical()` in `src/ui/ports/port-mapping.ts`

### Phase 3: HostAction Migration

**Goal**: Reconcile `{ action: ... }` vs `{ type: ... }` discriminant.

**Decision**: Use `action` as the canonical discriminant.

**Wire envelope format**:
```typescript
interface HostActionEnvelope {
  action: HostAction;
  confidence: number; // 0..1
  reasons: string[];
}
```

**Migration utility**: `normalizeHostAction()` (to be implemented in Phase 7)

### Phase 4: EventKind Migration

**Goal**: Normalize event kind naming to camelCase.

| Legacy | Canonical |
|--------|-----------|
| `'pitch_bend'` | `'pitchBend'` |
| `'midi_clip'` | `'midiClip'` |
| `'pattern_ref'` | `'patternRef'` |

**Migration utility**: `normalizeEventKind()` in `src/types/event-kind.ts`

### Phase 5: PPQ Migration

**Goal**: Ensure all code uses canonical PPQ=960.

- Import PPQ from `src/types/primitives.ts`
- Use `ticksToSeconds()` and `secondsToTicks()` from `src/types/time-conversion.ts`
- Remove any local PPQ constant definitions

**Canonical source**: `src/types/primitives.ts` exports `PPQ = 960`

## Migration Steps

### Step 1: Run Migration Scripts

```bash
# Check for legacy usage
npm run canon:check

# Run specific lints
npm run lint:deck-types
npm run lint:port-types
npm run lint:ppq
```

### Step 2: Update Code

1. Replace legacy DeckType strings with canonical values
2. Replace `audio_in`-style port types with PortSpec model
3. Import PPQ from primitives.ts instead of defining locally
4. Use event factories (createEvent, createNoteEvent) for event creation

### Step 3: Run Tests

```bash
# Run canon tests
npm run test:canon

# Run full test suite
npm run test
```

### Step 4: Verify Documentation

```bash
# Lint documentation
npm run docs:lint
```

## Backward Compatibility

### Normalization Functions

The following functions normalize legacy values at runtime:

- `normalizeDeckType(deckType)` - Maps legacy deck type strings
- `normalizePortType(portType)` - Maps legacy port type strings  
- `normalizeEventKind(kind)` - Maps legacy event kind names
- `normalizeEvent(event)` - Normalizes full event objects

### Deprecation Warnings

Legacy values emit console warnings during migration period.
Warnings include actionable suggestions for updating code.

## Timeline

1. **Phase 0**: Enforcement scripts and CI (Changes 001-050) ✅
2. **Phase 1**: Canonical IDs and naming (Changes 051-100) ✅
3. **Phase 2**: Board model alignment (Changes 101-150) ✅
4. **Phase 3**: Deck factories (Changes 151-200) 🔄 In progress
5. **Phase 4**: Port vocabulary (Changes 201-250) 🔄 In progress
6. **Phase 5**: Card systems (Changes 251-300) 🔄 In progress
7. **Phase 6**: Events/Clips/Tracks (Changes 301-350) 🔄 In progress
8. **Phase 7**: AI/Theory/Prolog (Changes 351-400) ⏳ Pending
9. **Phase 8**: Extensions/Packs (Changes 401-450) ⏳ Pending
10. **Phase 9**: Cleanup/Tests (Changes 451-500) 🔄 In progress

## References

- [Canon Documentation](docs/canon/README.md)
- [Legacy Type Aliases](docs/canon/legacy-type-aliases.md)
- [ID Standards](docs/canon/ids.md)
- [Port Vocabulary](docs/canon/port-vocabulary.md)
- [SSOT Stores](docs/canon/ssot-stores.md)
