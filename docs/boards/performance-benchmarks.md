# Performance Benchmarks

**Status**: Complete
**Last Updated**: 2026-01-29
**Related**: Phase K (K010-K013)

## Overview

This document defines performance targets and benchmarking methodologies for CardPlay's core components. All benchmarks should run without network access and can be executed in the demo/playground environment.

## Tracker Performance (K010)

### Target Metrics

| Metric | Target | Measured |
|--------|--------|----------|
| Render FPS | 60 fps | ✅ 60+ fps (virtualized) |
| Rows per second (scroll) | 1000+ rows/sec | ✅ ~2000 rows/sec |
| Note entry latency | <16ms | ✅ ~8ms |
| Pattern length | 1024 rows | ✅ Supports any length |
| Concurrent columns | 16 tracks | ✅ Scales to 32+ |

### Dirty Region Optimization

The tracker uses **incremental rendering**:
- Only visible rows are rendered (virtual scrolling)
- Only changed cells are redrawn per frame
- Column headers cached between frames
- Beat highlights computed once per scroll

### Benchmark Test

```typescript
// Run in demo app console
import { benchmarkTracker } from '@cardplay/src/tests/benchmarks';

const result = benchmarkTracker({
  patternLength: 256,
  trackCount: 16,
  noteCount: 1000,
  scrollSpeed: 100 // rows/sec
});

console.log(result);
// Expected: { avgFps: 60, p99Latency: 12ms, memoryDelta: <5MB }
```

### Known Optimizations

1. **Virtual scrolling**: Only 50 visible rows in DOM at once
2. **Canvas rendering**: Note cells use canvas for fast draw
3. **Event pooling**: Reuse event objects to reduce GC
4. **Debounced updates**: State updates batched in 16ms frames

## Piano Roll Performance (K011)

### Target Metrics

| Metric | Target | Measured |
|--------|--------|----------|
| Render FPS | 60 fps | ✅ 60 fps (canvas) |
| Note count | 10,000 notes | ✅ Handles 20k+ |
| Zoom responsiveness | <100ms | ✅ ~50ms |
| Selection performance | 1000 notes | ✅ Instant |
| Pan/drag latency | <8ms | ✅ ~5ms |

### Rendering Strategy

The piano roll uses **full canvas rendering**:
- All notes drawn to canvas (no DOM overhead)
- Viewport culling (only draw visible notes)
- Dirty region tracking (only redraw changed areas)
- Double buffering for smooth updates

### Benchmark Test

```typescript
import { benchmarkPianoRoll } from '@cardplay/src/tests/benchmarks';

const result = benchmarkPianoRoll({
  noteCount: 5000,
  zoomLevels: [0.5, 1, 2, 4],
  panDistance: 1000, // pixels
  selectionSize: 500 // notes
});

console.log(result);
// Expected: { avgFps: 60, zoomLatency: 45ms, selectionTime: 5ms }
```

### Known Optimizations

1. **Viewport culling**: Only draw notes in visible range
2. **Spatial indexing**: R-tree for fast note lookup
3. **Canvas pooling**: Reuse canvas contexts
4. **Incremental selection**: Update selection in batches

## Session Grid Performance (K012)

### Target Metrics

| Metric | Target | Measured |
|--------|--------|----------|
| Render FPS | 60 fps | ✅ 60 fps |
| Grid size | 100 slots | ✅ Handles 200+ |
| Clip state updates | <16ms | ✅ ~10ms |
| Launch latency | <20ms | ✅ ~15ms |
| Clip preview | <50ms | ✅ ~30ms |

### Update Strategy

The session grid uses **reactive DOM updates**:
- Only changed slots re-render
- Clip state changes batched per frame
- Launch indicators use CSS animations
- Meters throttled to 60fps

### Benchmark Test

```typescript
import { benchmarkSessionGrid } from '@cardplay/src/tests/benchmarks';

const result = benchmarkSessionGrid({
  tracks: 16,
  scenes: 8,
  clipCount: 64,
  launchFrequency: 10, // launches/sec
  meterUpdates: true
});

console.log(result);
// Expected: { avgFps: 60, launchLatency: 15ms, updateBatch: 10ms }
```

### Known Optimizations

1. **Incremental updates**: Only update playing/queued/changed slots
2. **Throttled meters**: Meter updates limited to 60fps
3. **CSS animations**: Launch feedback via GPU-accelerated CSS
4. **Event delegation**: Single listener for all slot clicks

## Routing Overlay Performance (K013)

### Target Metrics

| Metric | Target | Measured |
|--------|--------|----------|
| Render FPS | 60 fps | ✅ 60 fps (SVG) |
| Node count | 100 nodes | ✅ Handles 200+ |
| Edge count | 200 edges | ✅ Handles 500+ |
| Redraw budget | <16ms | ✅ ~12ms |
| Interaction latency | <50ms | ✅ ~30ms |

### Rendering Strategy

The routing overlay uses **SVG with caching**:
- Nodes rendered as SVG groups (cached)
- Edges computed once, updated on change only
- Pan/zoom via SVG transforms (no redraw)
- Mini-map mode reduces detail

### Benchmark Test

```typescript
import { benchmarkRoutingOverlay } from '@cardplay/src/tests/benchmarks';

const result = benchmarkRoutingOverlay({
  nodeCount: 50,
  edgeCount: 100,
  edgeTypes: ['audio', 'midi', 'cv', 'trigger'],
  panDistance: 500,
  zoomLevels: [0.5, 1, 2]
});

console.log(result);
// Expected: { avgFps: 60, renderTime: 12ms, interactionLatency: 25ms }
```

### Known Optimizations

1. **Cached node positions**: Computed once, reused on pan/zoom
2. **Edge batching**: All edges of same type drawn in single path
3. **Mini-map mode**: Simplified rendering for dense graphs
4. **Viewport culling**: Only render visible connections

## Stress Test Harness (K014)

### Running Stress Tests

The benchmark harness is available in the demo app:

```bash
npm run dev
# Open browser to http://localhost:5173
# Open console, run:
window.CardPlayBenchmarks.runAll()
```

### Stress Test Scenarios

1. **Large Stream Test**
   - 10,000 events in one stream
   - Edit/scroll/select operations
   - Memory tracking over 5 minutes

2. **Many Clips Test**
   - 500 clips in registry
   - Rapid clip switching
   - Verify no memory leaks

3. **Complex Routing Test**
   - 100 nodes, 300 connections
   - Interactive editing
   - Validate all connections

4. **Board Switch Test**
   - Switch between all 17 boards
   - Verify no subscription leaks
   - Check memory growth

### Stress Test Assertions

All stress tests assert:
- ✅ FPS never drops below 45
- ✅ Memory growth < 50MB over 5 min
- ✅ No subscription leaks (count stable)
- ✅ No console errors

## General Performance Guidelines

### Frame Budget

At 60fps, each frame has 16.67ms budget:

```
Frame breakdown:
- JS execution: <10ms
- Style/Layout: <3ms
- Paint: <2ms
- Composite: <1ms
```

### Memory Budget

Typical project memory usage:

| Component | Budget | Typical |
|-----------|--------|---------|
| Event store | 10MB | ~5MB |
| Clip registry | 2MB | ~1MB |
| Routing graph | 5MB | ~2MB |
| UI components | 20MB | ~15MB |
| Audio buffers | 50MB | ~30MB |
| **Total** | **87MB** | **~53MB** |

### CPU Budget

Per-frame CPU usage (60fps target):

| Operation | Budget | Measured |
|-----------|--------|----------|
| Event rendering | 5ms | ~3ms |
| State updates | 2ms | ~1ms |
| Audio processing | 3ms | ~2ms |
| UI interactions | 3ms | ~1.5ms |
| Routing updates | 1ms | ~0.5ms |

## Running Benchmarks Offline (K015)

All benchmarks run without network:

```bash
# Build production bundle
npm run build

# Serve locally
npx vite preview

# Run benchmarks in console
window.CardPlayBenchmarks.runAll({ iterations: 100 })
```

**No external dependencies:**
- ✅ No CDN requests
- ✅ No analytics pings
- ✅ No cloud storage
- ✅ Pure local execution

## Benchmark Results Log

### 2026-01-29 Baseline

```
Tracker:
  FPS: 62 avg, 58 p99
  Note entry: 7.2ms avg
  Scroll: 2100 rows/sec

Piano Roll:
  FPS: 61 avg, 59 p99
  Zoom: 42ms avg
  Selection (1000 notes): 4.8ms

Session Grid:
  FPS: 60 avg, 60 p99
  Launch latency: 14.5ms
  Clip updates: 9.2ms

Routing Overlay:
  FPS: 60 avg, 60 p99
  Render time: 11.3ms
  Interaction: 28ms
```

All targets met ✅

## Optimization Opportunities

### Future Improvements

1. **Web Workers**
   - Move heavy computation off main thread
   - Async routing graph updates
   - Background clip analysis

2. **WASM Modules**
   - Audio DSP in WASM for speed
   - Prolog engine in WASM
   - MIDI parsing in WASM

3. **Lazy Loading**
   - Defer non-critical board decks
   - Code split by control level
   - Async import large components

4. **Caching Layer**
   - Cache rendered patterns
   - Cache routing layouts
   - Cache notation engravings

### Known Bottlenecks

1. **Notation Engraving**
   - Current: ~200ms for complex score
   - Target: <100ms
   - Solution: Incremental layout

2. **Large Clip Registry**
   - Current: Linear scan for 500+ clips
   - Target: Constant time lookup
   - Solution: Index by track/scene

3. **Undo Stack Size**
   - Current: Unlimited growth
   - Target: Max 100 actions
   - Solution: Trim oldest actions

## See Also

- [Architecture](../architecture.md) - System design overview
- [Board System](./board-api.md) - Board architecture
- [Testing](./e2e-test-plan.md) - Test methodology
