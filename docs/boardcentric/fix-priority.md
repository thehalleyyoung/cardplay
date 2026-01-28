# Type Error Fix Priority Analysis (A019)

**Date:** 2026-01-28
**Goal:** Identify the 5 files whose fixes will unblock the most downstream errors

---

## Analysis Methodology

1. **Import Dependency Analysis**: Files that are imported by many others
2. **Error Severity**: Number and criticality of errors
3. **Blocking Impact**: Fixes that unblock other files

---

## Top 5 Blocking Files (Priority Order)

### 1. src/state/routing-graph.ts (43 errors) - CRITICAL BLOCKER

**Why Critical:**
- Core state infrastructure (imported by routing/audio systems)
- Type definition errors block downstream usage
- Affects: RoutingGraphStore, deck-routing-bridge, audio-engine

**Primary Issues:**
- `RoutingEdge` not exported from types.ts (TS2724)
- Property naming mismatch: uses `from`/`to` but type may expect different names
- Missing UndoActionType variants: `'routing:add-node'`, `'routing:remove-node'`, `'routing:connect'`, `'routing:disconnect'`
- `RoutingNodeInfo` incorrectly extends `RoutingNode`

**Fix Strategy:**
1. Add missing `RoutingEdge` type to src/state/types.ts
2. Fix property names (from/to vs source/target)
3. Add routing-related UndoActionTypes
4. Fix RoutingNodeInfo interface extension

**Impact**: Fixes will unblock audio/deck-routing-store-bridge.ts and other routing consumers

---

### 2. src/types/event.ts (0 direct errors, but foundation for ~200 errors) - FOUNDATION

**Why Critical:**
- Imported by 66+ files
- Core Event<P> type used everywhere
- Many files create events without required `kind` property

**Primary Issues:**
- Downstream files not using `kind` property (using deprecated `type`)
- EventStreamRecord vs Event[] confusion in consumers
- Event creation missing `kind: EventKinds.XXX`

**Fix Strategy:**
1. Event type itself is correct (has `kind` + legacy aliases)
2. Create migration guide for Event creation
3. Create codemod pattern to add missing `kind` fields

**Files to Fix (examples):**
- audio/automation-lane.ts (6 instances)
- audio/sample-pipeline.ts (1 instance)
- Cards generators/effects (multiple)

**Impact**: Fixing event creation patterns will resolve ~30-40 errors across codebase

---

### 3. src/tracker/pattern-store.ts (46 errors) - ISOLATED HIGH-ERROR

**Why Lower Priority:**
- 0 other files import it (isolated module)
- High error count but doesn't block others
- Likely experimental/unused code

**Primary Issues:**
- EventStreamRecord vs Event[] confusion
- Deprecated API usage
- Undefined checks

**Fix Strategy:**
- Defer until after fixing blocking files
- May be deletable if unused

---

### 4. src/audio/sample-pipeline.ts (36 errors) - AUDIO SUBSYSTEM

**Why Medium Priority:**
- Part of audio playback chain
- EventStreamRecord vs Event[] confusion
- Null safety issues

**Primary Issues:**
- Lines 851, 462: `EventStreamRecord` assigned where `Event[]` expected
- Need `.events` property access
- Missing undefined checks (18+ instances)

**Fix Strategy:**
1. Fix EventStreamRecord.events access pattern
2. Add null guards with optional chaining
3. Fix TS2322 type mismatches

**Impact**: Enables audio playback functionality

---

### 5. src/cards/generator-output.ts (32 errors) - GENERATOR SUBSYSTEM

**Why Medium Priority:**
- Used by generative cards
- EventStreamRecord API drift
- Blocks generator functionality

**Primary Issues:**
- Lines 127, 187, 235, 250, 300: `EventStreamRecord` vs `Event[]`
- Implicit `any` types (parameter typing)
- Array method access on EventStreamRecord

**Fix Strategy:**
1. Access `.events` from EventStreamRecord
2. Add explicit parameter types
3. Fix array operations

**Impact**: Enables AI/generator cards

---

## Summary: Fix Order

**Phase 1 (High Impact):**
1. ✅ **routing-graph.ts** - Add RoutingEdge type, fix property names (unblocks routing system)
2. ✅ **Event creation pattern** - Add missing `kind` fields across ~10-15 files (unblocks event consumers)

**Phase 2 (Medium Impact):**
3. ✅ **sample-pipeline.ts** - Fix EventStreamRecord.events access (enables audio)
4. ✅ **generator-output.ts** - Fix EventStreamRecord.events access (enables generators)

**Phase 3 (Low Impact):**
5. ⏸️ **pattern-store.ts** - Defer or delete (isolated, unused)

---

## Expected Error Reduction

**After Phase 1:**
- routing-graph: -43 errors
- Event kind fixes: -30 errors  
- **Total: -73 errors (10% reduction)**

**After Phase 2:**
- sample-pipeline: -36 errors
- generator-output: -32 errors
- **Total: -141 errors (19% reduction)**

**Remaining:**
- ~600 errors to address in later phases
- Many are null safety (can batch fix)
- Unused variable cleanup (automated)

---

## Next Steps

**A020**: Begin fixing routing-graph.ts (add RoutingEdge type)
**A021**: Fix routing property names (from/to)
**A022**: Add routing UndoActionTypes
**A023**: Fix sample-pipeline EventStreamRecord access
**A024**: Begin Event kind migration across affected files

