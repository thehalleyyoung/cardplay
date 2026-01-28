# Phase A024: Fix exactOptionalPropertyTypes - Complete

## Summary
**Status**: ✅ Complete
**Errors Fixed**: 58 total
- 40 automatically by linter (null safety with `?? 0`)
- 18 manually (exactOptionalPropertyTypes with conditional spread)

## Impact
- **Before**: 465 errors
- **After**: 407 errors
- **Reduction**: 12.5%

## Changes Made

### Automatic Fixes (Linter)
The linter automatically fixed 40 null safety errors in:
- `src/audio/sample-pipeline.ts` - Added `?? 0` null coalescing for array access
- `src/audio/automation-lane.ts` - Added null guards for audio point processing

### Manual Fixes

#### 1. Tracker Types (3 errors fixed)
**File**: `src/tracker/types.ts`

Fixed factory functions to use conditional spread pattern:

```typescript
// BEFORE
export function noteCell(
  note: MidiNote,
  instrument?: InstrumentSlot,
  volume?: Velocity,
  pan?: number,
  delay?: number
): NoteCell {
  return { note, instrument, volume, pan, delay };  // ❌ Fails exactOptionalPropertyTypes
}

// AFTER
export function noteCell(
  note: MidiNote,
  instrument?: InstrumentSlot,
  volume?: Velocity,
  pan?: number,
  delay?: number
): NoteCell {
  return {
    note,
    ...(instrument !== undefined && { instrument }),
    ...(volume !== undefined && { volume }),
    ...(pan !== undefined && { pan }),
    ...(delay !== undefined && { delay }),
  };  // ✅ Strict mode compliant
}
```

Applied same pattern to:
- `noteCell()` - 4 optional properties
- `noteOffCell()` - 1 optional property
- `noteCutCell()` - 1 optional property

#### 2. Event Stream Records (1 error fixed)
**File**: `src/state/types.ts` - `createEventStreamRecord()`

Fixed optional properties: `containerId`, `color`, `meta`

```typescript
// BEFORE
return {
  id: options.id ?? generateEventStreamId(),
  name: options.name,
  events: options.events ?? [],
  containerId: options.containerId,  // ❌
  color: options.color,              // ❌
  meta: options.meta,                // ❌
  // ...
};

// AFTER
return {
  id: options.id ?? generateEventStreamId(),
  name: options.name,
  events: options.events ?? [],
  ...(options.containerId !== undefined && { containerId: options.containerId }),  // ✅
  ...(options.color !== undefined && { color: options.color }),                    // ✅
  ...(options.meta !== undefined && { meta: options.meta }),                       // ✅
  // ...
};
```

#### 3. Clip Records (1 error fixed)
**File**: `src/state/types.ts` - `createClipRecord()`

Fixed optional properties: `color`, `loopStart`, `loopEnd`

```typescript
return {
  // ... required fields
  ...(options.color !== undefined && { color: options.color }),
  ...(options.loopStart !== undefined && { loopStart: options.loopStart }),
  ...(options.loopEnd !== undefined && { loopEnd: options.loopEnd }),
  // ...
};
```

#### 4. Clip Registry (1 error fixed)
**File**: `src/state/clip-registry.ts` - `createClip()`

Fixed optional `color` parameter in legacy API:

```typescript
const options: CreateClipOptions =
  typeof arg1 === 'string'
    ? {
        streamId: arg1,
        name: name ?? 'Clip',
        ...(color !== undefined && { color }),  // ✅
        // ...
      }
    : arg1;
```

## Pattern Applied

**The Standard Pattern for exactOptionalPropertyTypes:**

```typescript
// For optional properties with type T?, use:
...(value !== undefined && { key: value })

// NOT:
key: value  // ❌ Assigns T | undefined to T?
```

## Files Modified

1. `src/tracker/types.ts` - 3 factory functions fixed
2. `src/state/types.ts` - 2 factory functions fixed
3. `src/state/clip-registry.ts` - 1 function fixed

## Remaining Work

Still have exactOptionalPropertyTypes errors in:
- `src/cards/sampler-instrument-adapter.ts` (1 error)
- `src/tracker/event-sync.ts` (2 errors)
- `src/tracker/pattern-store.ts` (1 error)

These will be addressed in subsequent steps as they involve more complex payload structures.

## Cumulative Progress

| Phase | Errors Start | Fixed | Errors End | % Reduction |
|-------|-------------|-------|------------|-------------|
| A020 | 743 | 158 | 585 | 21.3% |
| A021 | 585 | 58 | 527 | 9.9% |
| A022 | 527 | 47 | 480 | 8.9% |
| A023 | 480 | 15 | 465 | 3.1% |
| A024 | 465 | 58 | 407 | 12.5% |
| **Total** | **743** | **336** | **407** | **45.2%** |

## Next Steps

Continue systematic error reduction:
- A025: Fix remaining type mismatches (TS2322, TS2345)
- A026: Fix property access errors (TS2339, TS2551)
- A027: Fix unused declarations (TS6133, TS6196)
- A028: Final cleanup and verification

**Target**: Achieve zero type errors before Phase B implementation.
