# Progress Report: A020 - Routing Graph Type Fixes

**Date:** 2026-01-28
**File:** src/state/routing-graph.ts
**Status:** ✅ COMPLETE (0 errors remaining)

---

## Initial State

- **Errors:** 43 type errors
- **Impact:** Blocking routing system, audio bridges, deck integration

---

## Changes Made

### 1. Added Missing `RoutingEdge` Type (src/state/types.ts)

```typescript
/**
 * Edge in the routing graph (alias with from/to naming).
 * Used by routing-graph.ts for backwards compatibility.
 */
export interface RoutingEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
}
```

**Why:** routing-graph.ts expected `RoutingEdge` but only `RoutingConnection` existed.

---

### 2. Added Routing UndoActionTypes (src/state/types.ts)

```typescript
export type UndoActionType =
  | 'stream-create'
  | 'stream-delete'
  // ... existing types
  | 'routing:add-node'
  | 'routing:remove-node'
  | 'routing:update-node'
  | 'routing:connect'
  | 'routing:disconnect'
  | 'routing:disconnect-node'
  | 'batch';
```

**Why:** Undo system didn't recognize routing operations.

---

### 3. Fixed `RoutingNodeInfo` Interface

**Before:**
```typescript
export interface RoutingNodeInfo extends RoutingNode {
  readonly type: NodeType;
  // ... properties that conflicted with RoutingNode
}
```

**After:**
```typescript
export interface RoutingNodeInfo {
  readonly id: string;
  readonly cardId?: string;  // Optional (was missing)
  readonly type: NodeType;
  readonly name: string;
  readonly position?: { x: number; y: number };
  readonly inputs: readonly PortInfo[];
  readonly outputs: readonly PortInfo[];
  readonly enabled?: boolean;  // Optional (was missing)
  readonly bypassed: boolean;
  readonly metadata?: Record<string, unknown>;
}
```

**Why:** `RoutingNode` from types.ts had incompatible structure. Made it standalone.

---

### 4. Fixed `exactOptionalPropertyTypes` Issues

**Problem:** Can't assign `T | undefined` to optional property of type `T`.

**Before:**
```typescript
return {
  id,
  type: 'deck',
  name,
  position,  // ❌ position might be undefined
  bypassed: false,
};
```

**After:**
```typescript
return {
  id,
  type: 'deck',
  name,
  ...(position !== undefined && { position }),  // ✅ Only set if defined
  bypassed: false,
};
```

**Applied to:**
- `createDeckNode()`
- `createInstrumentNode()`
- `createEffectNode()`
- `createMixerNode()`

---

### 5. Removed Unused Import

**Before:**
```typescript
import type {
  RoutingNode,  // ❌ Unused
  RoutingEdge,
  RoutingGraph,  // ❌ Unused
  SubscriptionId,
} from './types';
```

**After:**
```typescript
import type {
  RoutingEdge,
  SubscriptionId,
} from './types';
```

---

### 6. Fixed Type Assertion in `setEdgeGain()`

**Before:**
```typescript
edges = [
  ...edges.slice(0, edgeIndex),
  { ...edge, gain },  // ❌ Type inference fails
  ...edges.slice(edgeIndex + 1),
];
```

**After:**
```typescript
const edge = edges[edgeIndex]!;
edges = [
  ...edges.slice(0, edgeIndex),
  { ...edge, gain } as RoutingEdgeInfo,  // ✅ Explicit type
  ...edges.slice(edgeIndex + 1),
];
```

---

## Impact

### Error Reduction

- **Before:** 743 total errors
- **After:** 585 total errors
- **Reduction:** 158 errors (21% reduction)

**Better than expected!** (Projected 43 errors, actually fixed 158)

**Why more than 43?**
- Fixed type definitions used by many downstream files
- Adding `RoutingEdge` unblocked imports
- Adding UndoActionTypes unblocked undo operations across multiple files

---

## Files Unblocked

Fixing routing-graph.ts unblocked these files:
- audio/deck-routing-store-bridge.ts
- audio/deck-audio-bridge.ts
- Any files using routing graph for deck connections

---

## Remaining Work

**Next Priority (A021):**
- Fix missing Event `kind` properties (~30-40 errors across multiple files)
- Fix EventStreamRecord vs Event[] confusion (~50-80 errors)

**Total Remaining:** 585 errors (down from 743)

---

## Lessons Learned

1. **Type definitions have ripple effects** - Fixing core types (RoutingEdge, UndoActionType) unblocked many downstream files
2. **exactOptionalPropertyTypes is strict** - Use spread operators conditionally: `...(value !== undefined && { key: value })`
3. **Type assertions sometimes needed** - When spread operators confuse inference, use `as Type`
4. **Interface extension can be problematic** - Better to define standalone interface when base type is incompatible

---

**Next:** Begin A021 - Fix Event creation patterns
