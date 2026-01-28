# TypeScript Type Error Analysis

**Date:** 2026-01-28
**Total Errors:** 743
**Total Files Affected:** ~90+ files

---

## Error Breakdown by Category

| Error Code | Count | Description | Severity |
|------------|-------|-------------|----------|
| TS6133 | 153 | Variable declared but never used | Low (cleanup) |
| TS2339 | 127 | Property does not exist on type | High (API drift) |
| TS2322 | 83 | Type is not assignable to type | High (type mismatch) |
| TS2532 | 69 | Object is possibly 'undefined' | Medium (null safety) |
| TS7006 | 44 | Parameter implicitly has 'any' type | Medium (missing types) |
| TS2345 | 44 | Argument of type not assignable | High (API mismatch) |
| TS18048 | 41 | Possibly 'undefined' | Medium (null safety) |
| TS6196 | 23 | Import declared but never used | Low (cleanup) |
| TS2375 | 21 | exactOptionalPropertyTypes issue | High (strict mode) |
| Other | ~138 | Various type errors | Mixed |

---

## Files with Most Errors (Top 20)

| File | Errors | Primary Issues |
|------|--------|----------------|
| tracker/pattern-store.ts | 46 | API drift, undefined checks |
| state/routing-graph.ts | 43 | New API conflicts |
| ui/chord-track-lane.ts | 41 | Property access errors |
| tracker/renderer.ts | 40 | Undefined checks, type mismatches |
| audio/sample-pipeline.ts | 36 | Null safety, undefined checks |
| cards/arranger-phrase-adapter.ts | 35 | API drift (phrase system) |
| notation/notation-store-adapter.ts | 33 | Event API changes |
| cards/generator-output.ts | 32 | EventStreamRecord vs Event[] |
| ui/reveal-panel-audio.ts | 30 | Unknown API issues |
| tracker/event-sync.ts | 30 | Event sync API drift |
| ui/components/tracker-store-adapter.ts | 29 | Store API drift |
| tracker/phrases.ts | 27 | Phrase API changes |
| tracker/tracker-card-integration.ts | 26 | Integration API drift |
| tracker/input-handler.ts | 24 | Input handling types |
| cards/legacy-card-adapters.ts | 24 | Legacy adapter issues |
| tracker/effect-processor.ts | 20 | Effect type mismatches |
| notation/playback-transport-bridge.ts | 18 | Transport API changes |
| audio/automation-lane.ts | 18 | Event kind missing |
| ui/deck-layout.ts | 17 | Deck API conflicts |
| midi/midi-input.ts | 16 | MIDI type issues |

---

## Critical Patterns Identified

### 1. EventStreamRecord vs Event[] Confusion (High Priority)

**Issue:** Many files expect `Event[]` but receive `EventStreamRecord<unknown>`.

**Root Cause:** Store API changed from returning arrays to returning stream records.

**Example:**
```typescript
// OLD (expected)
const events: Event[] = stream;

// NEW (actual)
const stream: EventStreamRecord = getStream(id);
const events: Event[] = stream.events;  // Need .events property
```

**Affected Files:**
- audio/automation-lane.ts (line 117, 462)
- cards/generator-output.ts (line 127, 187, 235, 250, 300)
- audio/sample-pipeline.ts (line 851)

**Fix:** Access `.events` property from EventStreamRecord.

---

### 2. Missing Event 'kind' Property (High Priority)

**Issue:** Many event creation calls missing required `kind` property.

**Root Cause:** Event type system evolved to require EventKind.

**Example:**
```typescript
// BROKEN
createEvent({
  id: eventId,
  type: 'note',  // ❌ Should be 'kind'
  start: tick,
  duration: duration,
  payload: {...}
});

// FIXED
createEvent({
  id: eventId,
  kind: EventKinds.NOTE,  // ✅ Use EventKind enum
  start: tick,
  duration: duration,
  payload: {...}
});
```

**Affected Files:**
- audio/automation-lane.ts (6+ instances)
- audio/sample-pipeline.ts (1 instance)
- Multiple card files

---

### 3. Deprecated Store Methods (High Priority)

**Issue:** Bridges use deprecated store subscription methods.

**Root Cause:** Store API evolution marked old methods as @deprecated.

**Example:**
```typescript
// DEPRECATED
store.subscribeToStream(streamId, (events) => {...});
store.unsubscribeFromStream(streamId, subId);
store.listStreamIds();

// CANONICAL
store.subscribe(streamId, (stream, changeType) => {
  const events = stream.events;
  ...
});
store.unsubscribe(subId);
store.getAllStreams().map(s => s.id);
```

**Affected Files:**
- audio/audio-engine-store-bridge.ts (mentioned in roadmap A021-A029)
- ui/session-view-store-bridge.ts (mentioned in roadmap A031-A041)

---

### 4. exactOptionalPropertyTypes Violations (Medium Priority)

**Issue:** Optional properties assigned `T | undefined` instead of `T`.

**Root Cause:** TypeScript strict mode `exactOptionalPropertyTypes` enabled.

**Example:**
```typescript
// BROKEN
interface AutomationPoint {
  tension?: number;
}

const point: AutomationPoint = {
  tension: someValue ?? undefined  // ❌ undefined not allowed
};

// FIXED
const point: AutomationPoint = {
  ...(someValue !== undefined && { tension: someValue })  // ✅ Only set if defined
};

// OR
interface AutomationPoint {
  tension?: number | undefined;  // ✅ Explicitly allow undefined
}
```

**Affected Files:**
- audio/automation-lane.ts (lines 295, 434)
- audio/wavetable-instrument-adapter.ts (line 379, 440)
- audio/instrument-interface.ts (line 456)

---

### 5. TransportState vs TransportSnapshot Confusion (High Priority)

**Issue:** TransportSnapshot object used where TransportState (string union) expected.

**Root Cause:** Transport API refactored to separate state enum from snapshot object.

**Example:**
```typescript
// BROKEN
function foo(state: TransportState) {
  if (state.isPlaying) { ... }  // ❌ TransportState is string, not object
}

// FIXED
function foo(snapshot: TransportSnapshot) {
  if (snapshot.state === 'playing') { ... }  // ✅ Use snapshot.state
}
```

**Affected Files:**
- audio/deck-routing-store-bridge.ts (line 177, 678)

---

### 6. Null Safety Issues (Medium Priority)

**Issue:** 69 instances of "possibly undefined" + 41 instances of TS18048.

**Root Cause:** Strict null checks + missing guards.

**Common Patterns:**
```typescript
// Need null guards
if (value === undefined) throw new Error('Value required');
if (!object) return;

// Use optional chaining
object?.property
array?.[index]

// Use nullish coalescing
value ?? defaultValue
```

**Affected Files:** Nearly all files with 10+ errors.

---

### 7. Unused Imports/Variables (Low Priority)

**Issue:** 153 instances of TS6133 + 23 instances of TS6196.

**Impact:** Code bloat, indicates dead code or incomplete refactoring.

**Solution:** Run automated cleanup with ESLint autofixpattern.

---

## Recommended Fix Order

### Phase 1: API Drift (High Impact, Medium Effort)
1. Fix EventStreamRecord vs Event[] confusion (~50 errors)
2. Add missing Event `kind` properties (~30 errors)
3. Update deprecated store method calls (A021-A043 in roadmap)
4. Fix TransportState vs TransportSnapshot (~5 errors)

### Phase 2: Type Safety (Medium Impact, High Effort)
5. Fix exactOptionalPropertyTypes violations (~21 errors)
6. Add null guards for "possibly undefined" (~110 errors)
7. Add explicit types for implicit 'any' parameters (~44 errors)

### Phase 3: Cleanup (Low Impact, Low Effort)
8. Remove unused imports (~23 errors)
9. Remove unused variables (~153 errors)
10. Remove dead code

---

## Automated Fix Potential

**High Automation:**
- Unused imports/variables: ESLint autofix
- Missing Event kinds: Codemod script
- EventStreamRecord.events access: Find/replace pattern

**Medium Automation:**
- Deprecated method updates: Semi-automated with type-aware refactoring
- Null guards: Can generate, but needs human review

**Low Automation:**
- exactOptionalPropertyTypes: Case-by-case analysis needed
- API mismatches: Manual fixes required

---

## Blockers for Phase B

**Must Fix Before Phase B:**
1. ✅ Baseline typecheck must pass (zero errors)
2. ✅ All deprecated store methods updated
3. ✅ All store adapters type-safe

**Can Defer:**
- Unused variable cleanup (doesn't block new work)
- Some null safety improvements (can add incrementally)

---

## Next Steps (Roadmap A018-A029)

1. **A018**: Categorize typecheck failures by file and dependency fan-out ✅ (DONE)
2. **A019**: Prioritize fixes: pick the 5 files blocking the most imports
3. **A020-A029**: Fix audio-engine-store-bridge.ts (29 steps in roadmap)
4. **A030-A043**: Fix session-view-store-bridge.ts and clip adapter
5. **A044-A050**: Fix tracker integration
6. **A051-A060**: Verify cross-view sync
