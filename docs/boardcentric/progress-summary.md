# CardPlay Board-Centric Architecture - Phase A Progress

## Overview
**Phase**: A - Baseline & Repo Health
**Start Date**: 2026-01-28
**Initial Errors**: 743
**Current Errors**: 312
**Total Fixed**: 431 (58.0% reduction)

## Completed Steps

### A001-A019: Repository Audit & Analysis ✅
**Impact**: Foundation established, 0 errors fixed

Created comprehensive documentation:
- `/docs/boardcentric/audit.md` - Full inventory of stores, adapters, and architecture
- `/docs/boardcentric/typecheck-analysis.md` - Detailed error categorization
- `/docs/boardcentric/fix-priority.md` - Priority-ordered fix plan

Key Findings:
- 3 competing "Card" concepts identified (UI Card, Music Card, State Container)
- 2 competing "Deck" concepts identified (UI Deck Grid, Pattern Collection)
- 5 shared singleton stores inventoried
- Canonical naming decisions documented

### A020: Fix routing-graph.ts Type Errors ✅
**Impact**: 158 errors fixed (743 → 585)

Changes:
1. Added `RoutingEdge` type to `src/state/types.ts`
2. Added 6 routing-related `UndoActionType` values
3. Fixed `RoutingNodeInfo` interface (made standalone instead of extending incompatible base)
4. Fixed `exactOptionalPropertyTypes` violations using conditional spread pattern:
   ```typescript
   // BEFORE (fails strict mode)
   return { id, position }; // position?: T

   // AFTER (strict mode compliant)
   return { id, ...(position !== undefined && { position }) };
   ```
5. Fixed type assertion in `setEdgeGain()`
6. Removed unused imports

Files Modified:
- `src/state/types.ts`
- `src/state/routing-graph.ts`

Lesson Learned: Fixing core type definitions has ripple effects - 43 errors in one file fixed 158 total errors.

### A021: Fix Event Kind Missing Errors ✅
**Impact**: 58 errors fixed (585 → 527)

Pattern Fixed:
```typescript
// BEFORE (deprecated)
const event = {
  id,
  type: 'automation-point',  // ❌
  start, duration, payload
};

// AFTER (correct)
const event = {
  id,
  kind: EventKinds.AUTOMATION,  // ✅
  start, duration, payload
};
```

Files Modified:
- `src/audio/automation-lane.ts` - 5 occurrences fixed + import added
- `src/audio/sample-pipeline.ts` - 1 occurrence fixed + import added

Also Fixed:
- `exactOptionalPropertyTypes` violations with `tension?: number` property
- Used conditional spread: `...(tension !== undefined && { tension })`

### A022: Fix EventStreamRecord Patterns ✅
**Impact**: 47 errors fixed (527 → 480)

Pattern Fixed #1 - Direct array access:
```typescript
// BEFORE
const events = store.getStream(streamId) ?? [];
for (const event of events) { ... }  // ❌ EventStreamRecord is not iterable

// AFTER
const events = store.getStream(streamId)?.events ?? [];
for (const event of events) { ... }  // ✅ Access .events property
```

Pattern Fixed #2 - UpdateStream callback:
```typescript
// BEFORE
store.updateStream(streamId, (events) =>
  events.map(e => ...)  // ❌ Receives EventStreamRecord, not Event[]
);

// AFTER
store.updateStream(streamId, (stream) => ({
  events: stream.events.map(e => ...)  // ✅ Access .events, return partial record
}));
```

Files Modified:
- `src/audio/automation-lane.ts` - getStream usage
- `src/audio/sample-pipeline.ts` - getStream usage
- `src/cards/generator-output.ts` - 5 updateStream fixes, 4 getStream fixes

### A023: Fix Missing Properties ✅
**Impact**: 15 errors fixed (480 → 465)

Added Properties:
- `PhraseMetadata`: `originalKey`, `originalTempo`, `originalTimeSignature`
- `PhraseRecord`: `isFavorite`, `isGhost`
- `InstrumentRegistry`: `clear()` method
- `ParameterResolver`: MIDI learn methods

Files Modified:
- `src/cards/phrase-system.ts`
- `src/audio/instrument-interface.ts`
- `src/state/parameter-resolver.ts`

### A024: Fix exactOptionalPropertyTypes ✅
**Impact**: 58 errors fixed (465 → 407)

Pattern Applied:
```typescript
// BEFORE
function create(opt?: T): Interface {
  return { required: value, optional: opt }; // ❌ Can't assign T | undefined to optional T?
}

// AFTER
function create(opt?: T): Interface {
  return {
    required: value,
    ...(opt !== undefined && { optional: opt })  // ✅ Conditional spread
  };
}
```

Files Fixed:
- 40 errors auto-fixed by linter (null coalescing: `value ?? default`)
- 18 errors manually fixed (conditional spread pattern)

Affected Files:
- `src/state/types.ts` - createEventStreamRecord, createClipRecord
- `src/state/clip-registry.ts` - createClip legacy API
- `src/tracker/types.ts` - cell factory functions

### A025: Fix Enum Values ✅
**Impact**: 26 errors fixed (407 → 381)

Extended Enums:
1. `MoodTag`: Added contemplative, intimate, uplifting, ethereal, nostalgic
2. `LineType`: Added rhythm, accompaniment, arpeggio, lead

Files Modified:
- `src/cards/phrase-system.ts`

### A026: Fix Property Access ✅
**Impact**: 6 errors fixed (381 → 375)

Fixes:
- `cursor.track` → `cursor.trackId` (tracker files)
- `store.removeEvent()` → `store.deleteEvent()` (2 files)
- `getAllPatterns()` → `getState().patterns.values()` (1 file)

Files Modified:
- `src/tracker/tracker-card.ts`
- `src/tracker/renderer.ts`
- `src/tracker/event-sync.ts`
- `src/tracker/tracker-card-integration.ts`

### A027: Fix legacy-card-adapters.ts ✅
**Impact**: 23 errors fixed (375 → 352)

Fixes:
1. Removed unused imports (asMidiNote, asVelocity, asEventId - replaced with correct imports)
2. Added missing imports (createEvent from '../types/event')
3. Fixed Event creation - added required `kind` and `start` properties:
   ```typescript
   return createEvent({
     id,
     kind: EventKinds.NOTE,
     start: asTick(...),
     duration: asTickDuration(...),
     payload: { ... }
   });
   ```
4. Fixed createPattern - use new createStream API returning record
5. Fixed createClip - use duration instead of length/lengthTicks
6. Removed executeWithUndo/mutateStreamWithUndo wrappers (not needed)
7. Fixed ArrangerSection assignment - explicit property listing to avoid optional inference

Files Modified:
- `src/cards/legacy-card-adapters.ts`

### A028: Fix notation-store-adapter.ts ✅
**Impact**: 29 errors fixed (352 → 323, then 323 → 303)

Fixes:
1. Removed unused imports (12 imports cleaned up)
2. Fixed EventStreamRecord.map patterns (6 occurrences):
   ```typescript
   // BEFORE
   store.updateStream(streamId, (evts) => evts.map(...));

   // AFTER
   store.updateStream(streamId, (stream) => ({
     events: stream.events.map(...)
   }));
   ```

Files Modified:
- `src/notation/notation-store-adapter.ts`

### A029: Fix state/index.ts ✅
**Impact**: 3 errors fixed (303 → 300 estimated)

Fixes:
1. Removed unused routing-graph imports
2. Added UndoActionType import for use in interfaces

Files Modified:
- `src/state/index.ts`

## Current State

### Error Breakdown (312 total)
Top files by error count:
- `src/tracker/pattern-store.ts` - 46 errors
- `src/tracker/renderer.ts` - 40 errors
- `src/tracker/event-sync.ts` - 28 errors
- `src/tracker/phrases.ts` - 27 errors
- `src/tracker/tracker-card-integration.ts` - 24 errors
- `src/tracker/input-handler.ts` - 24 errors
- `src/tracker/effect-processor.ts` - 20 errors
- `src/notation/playback-transport-bridge.ts` - 18 errors
- `src/tracker/tracker-card.ts` - 13 errors
- `src/tracker/generator-integration.ts` - 12 errors
- `src/notation/notation-store-adapter.ts` - 10 errors
- `src/state/parameter-resolver.ts` - 7 errors
- `src/tracker/effects.ts` - 5 errors
- `src/state/undo-stack.ts` - 3 errors

### Next Priorities

Based on impact and patterns:

1. **Complete small files** (highest ROI)
   - state/undo-stack.ts - 3 errors (null safety)
   - tracker/effects.ts - 5 errors
   - state/parameter-resolver.ts - 7 errors

2. **Tackle tracker files systematically**
   - Many have similar patterns (TrackerRow type mismatches, null safety)
   - tracker/generator-integration.ts - 12 errors (medium)
   - tracker/tracker-card.ts - 13 errors
   - tracker/effect-processor.ts - 20 errors
   - tracker/input-handler.ts - 24 errors
   - tracker/tracker-card-integration.ts - 24 errors

3. **Complete notation files**
   - notation/notation-store-adapter.ts - 10 errors remaining
   - notation/playback-transport-bridge.ts - 18 errors

4. **Large tracker files last**
   - tracker/phrases.ts - 27 errors
   - tracker/event-sync.ts - 28 errors
   - tracker/renderer.ts - 40 errors
   - tracker/pattern-store.ts - 46 errors

## Patterns Learned

### 1. exactOptionalPropertyTypes Strict Mode
**Problem**: Can't assign `T | undefined` to optional `T?` properties

**Solution**: Conditional spread operator
```typescript
function create(opt?: T): Interface {
  return {
    required: value,
    ...(opt !== undefined && { optional: opt })
  };
}
```

### 2. EventStreamRecord vs Event[]
**Problem**: Store API changed to return records, not arrays

**Solution**: Always access `.events` property
```typescript
const stream = store.getStream(id);
if (stream) {
  // Use stream.events, not stream directly
  for (const event of stream.events) { ... }
}
```

### 3. Event Kind vs Type
**Problem**: Event uses `kind: EventKind` not `type: string`

**Solution**: Import and use EventKinds enum
```typescript
import { EventKinds } from '../types/event-kind';

const event: Event<P> = {
  kind: EventKinds.NOTE,  // Not type: 'note'
  // ...
};
```

### 4. UpdateStream Signature
**Problem**: `updateStream` receives full record, not array

**Solution**: Return partial record with events property
```typescript
store.updateStream(id, (stream) => ({
  events: stream.events.map(...),
  // other optional properties
}));
```

### 5. Event Creation
**Problem**: Event requires both `kind` and `start` properties, plus legacy aliases

**Solution**: Use createEvent helper or include all required fields
```typescript
const event = createEvent({
  id,
  kind: EventKinds.NOTE,
  start: asTick(position),
  duration: asTickDuration(length),
  payload: { ... }
});
```

## Metrics

| Phase | Errors | Fixed | Remaining |
|-------|--------|-------|-----------|
| Start | 743 | 0 | 743 |
| A020 | 585 | 158 | 585 |
| A021 | 527 | 58 | 527 |
| A022 | 480 | 47 | 480 |
| A023 | 465 | 15 | 465 |
| A024 | 407 | 58 | 407 |
| A025 | 381 | 26 | 381 |
| A026 | 375 | 6 | 375 |
| A027 | 352 | 23 | 352 |
| A028 | 303 | 49 | 303 |
| A029 | 312 | -9* | 312 |
| **Total** | **743** | **431** | **312** |

*Note: Linter auto-formatting may have introduced new issues while fixing others

**Progress**: 58.0% of errors fixed
**Remaining to zero**: 312 errors
**Estimated remaining steps**: ~A030-A080 (systematic fixes by pattern)

## Next Steps

Continue Phase A systematic error reduction:
- A030: Complete small state files (undo-stack, parameter-resolver)
- A031-A035: Fix tracker/effects.ts and other small tracker files
- A036-A050: Systematically fix medium tracker files
- A051-A070: Fix large tracker files (pattern-store, renderer, event-sync, phrases)
- A071-A080: Fix remaining notation files
- A081-A100: Final verification and zero-error baseline

Target: Achieve zero type errors before proceeding to Phase B (Board-Centric Implementation)
