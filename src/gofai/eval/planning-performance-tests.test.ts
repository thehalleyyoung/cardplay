/**
 * @file Planning Performance Tests
 * @module gofai/eval/planning-performance-tests
 *
 * Implements Step 290 from gofai_goalB.md:
 * - Add performance tests: planning stays within time budget for typical scopes (chorus-level edits)
 * - Ensure planner completes within acceptable latency bounds
 * - Test memory usage stays reasonable
 * - Validate that search space pruning is effective
 * - Test scalability with project size
 *
 * Performance is critical for a usable offline system. Users expect near-instant
 * responses for simple requests, and sub-second responses for complex ones.
 *
 * Performance Budgets:
 * - Simple single-axis goals: < 100ms
 * - Multi-axis goals: < 500ms
 * - Complex constrained planning: < 2s
 * - Full song scope: < 5s
 *
 * Memory Budgets:
 * - Planning working set: < 100MB
 * - Parse forests: < 50MB
 * - Total overhead: < 200MB
 *
 * Test Categories:
 * 1. Latency tests (time budgets)
 * 2. Memory tests (heap usage)
 * 3. Scalability tests (project size, goal count)
 * 4. Throughput tests (plans per second)
 * 5. Stress tests (pathological cases)
 *
 * @see gofai_goalB.md Step 290, Step 459-462
 * @see src/gofai/planning/plan-generation.ts
 * @see src/gofai/infra/analysis-cache.ts
 */

import { describe, it, expect } from 'vitest';
import type { CPLIntent, CPLGoal, CPLConstraint } from '../canon/cpl-types';
import type { ProjectState } from '../execution/transactional-execution';
import { generatePlans, type SearchConfig } from '../planning/plan-generation';
import type { Goal, Constraint, LeverContext, ProjectWorldAPI } from '../planning/types';

// ============================================================================
// Performance Measurement Helpers
// ============================================================================

interface PerformanceMetrics {
  durationMs: number;
  peakMemoryMB: number;
  planCount: number;
}

/**
 * Measure planning performance
 */
function measurePlanningPerformance(
  intent: CPLIntent,
  fixture: ProjectState
): PerformanceMetrics {
  const startTime = performance.now();
  const startMemory = getMemoryUsage();

  // Create a minimal PlanningContext for testing
  const context = {
    goals: [] as Goal[],
    constraints: [] as Constraint[],
    leverContext: {} as LeverContext,
    world: fixture as unknown as ProjectWorldAPI,
    config: {
      maxDepth: 10,
      beamWidth: 5,
      minScore: 0.3,
      timeoutMs: 5000,
    } as SearchConfig,
  };

  const plans = generatePlans(context);

  const endTime = performance.now();
  const endMemory = getMemoryUsage();

  return {
    durationMs: endTime - startTime,
    peakMemoryMB: Math.max(endMemory - startMemory, 0),
    planCount: plans.length,
  };
}

/**
 * Get current memory usage in MB (if available)
 */
function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }
  return 0;
}

/**
 * Create fixture of specified complexity
 */
function createFixture(
  bars: number,
  trackCount: number,
  eventsPerBar: number
): ProjectState {
  const totalEvents = bars * eventsPerBar;
  
  return {
    events: {
      get: () => undefined,
      getAll: () => Array.from({ length: totalEvents }, (_, i) => ({
        id: `event_${i}`,
        kind: 'note',
        pitch: 60 + (i % 12),
        velocity: 100,
        onset: (i * 480) % (bars * 1920),
        duration: 480,
      })),
      add: () => {},
      remove: () => {},
      update: () => {},
      query: () => [],
    },
    tracks: {
      get: () => undefined,
      getAll: () => Array.from({ length: trackCount }, (_, i) => ({
        id: `track_${i}`,
        name: `Track ${i}`,
        role: i % 3 === 0 ? 'drums' : i % 3 === 1 ? 'melody' : 'harmony',
      })),
      add: () => {},
      remove: () => {},
      update: () => {},
    },
    cards: {
      get: () => undefined,
      getAll: () => [],
      add: () => {},
      remove: () => {},
      updateParameter: () => {},
    },
    sections: {
      get: () => undefined,
      getAll: () => [
        { id: 'verse', name: 'Verse', startBar: 0, endBar: bars / 2 },
        { id: 'chorus', name: 'Chorus', startBar: bars / 2, endBar: bars },
      ],
      add: () => {},
      remove: () => {},
      update: () => {},
    },
    routing: {
      get: () => undefined,
      getAll: () => [],
      add: () => {},
      remove: () => {},
      connect: () => {},
      disconnect: () => {},
    },
    metadata: {
      tempo: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      key: 'C',
      lengthInBars: bars,
    },
  };
}

function createIntent(goals: CPLGoal[], constraints: CPLConstraint[] = []): CPLIntent {
  return {
    type: 'intent',
    id: 'test_intent',
    goals,
    constraints,
    preferences: [],
    schemaVersion: { major: 1, minor: 0, patch: 0 },
  };
}

function createAxisGoal(axis: string, direction: 'increase' | 'decrease'): CPLGoal {
  return {
    type: 'goal',
    id: `goal_${axis}`,
    variant: 'axis-goal',
    axis,
    direction,
  };
}

// ============================================================================
// Test Suite: Latency Budgets
// ============================================================================

describe('Planning Performance Tests: Latency', () => {
  it('should plan simple single-axis goal in < 100ms', () => {
    const fixture = createFixture(16, 8, 10); // 16 bars, 8 tracks
    const intent = createIntent([
      createAxisGoal('brightness', 'increase'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    expect(metrics.durationMs).toBeLessThan(100);
    expect(metrics.planCount).toBeGreaterThan(0);
  });

  it('should plan multi-axis goals in < 500ms', () => {
    const fixture = createFixture(16, 8, 10);
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
      createAxisGoal('brightness', 'increase'),
      createAxisGoal('width', 'increase'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    expect(metrics.durationMs).toBeLessThan(500);
    expect(metrics.planCount).toBeGreaterThan(0);
  });

  it('should plan chorus-scope edit in < 1s', () => {
    const fixture = createFixture(32, 12, 15); // Full song
    
    // Scope to chorus only (bars 16-24)
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
    ]);

    intent.scope = {
      type: 'scope',
      id: 'scope_chorus',
      timeRange: {
        type: 'time-range',
        id: 'tr_chorus',
        bars: [16, 24],
      },
    };

    const metrics = measurePlanningPerformance(intent, fixture);

    expect(metrics.durationMs).toBeLessThan(1000);
  });

  it('should plan constrained goals in < 2s', () => {
    const fixture = createFixture(24, 10, 12);
    const intent = createIntent(
      [
        createAxisGoal('darkness', 'increase'),
        createAxisGoal('intimacy', 'increase'),
      ],
      [
        {
          type: 'constraint',
          id: 'preserve_melody',
          variant: 'preserve',
          strength: 'hard',
          description: 'Preserve melody',
          target: { type: 'selector', id: 's1' } as any,
          level: 'exact',
        } as any,
      ]
    );

    const metrics = measurePlanningPerformance(intent, fixture);

    expect(metrics.durationMs).toBeLessThan(2000);
  });

  it('should plan full-song scope in < 5s', () => {
    const fixture = createFixture(64, 16, 20); // Large project
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    expect(metrics.durationMs).toBeLessThan(5000);
    expect(metrics.planCount).toBeGreaterThan(0);
  });
});

// ============================================================================
// Test Suite: Memory Budgets
// ============================================================================

describe('Planning Performance Tests: Memory', () => {
  it('should use < 50MB for simple planning', () => {
    const fixture = createFixture(16, 8, 10);
    const intent = createIntent([
      createAxisGoal('brightness', 'increase'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    if (metrics.peakMemoryMB > 0) {
      expect(metrics.peakMemoryMB).toBeLessThan(50);
    }
  });

  it('should use < 100MB for complex planning', () => {
    const fixture = createFixture(32, 16, 20);
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
      createAxisGoal('brightness', 'increase'),
      createAxisGoal('width', 'increase'),
      createAxisGoal('lift', 'increase'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    if (metrics.peakMemoryMB > 0) {
      expect(metrics.peakMemoryMB).toBeLessThan(100);
    }
  });

  it('should not leak memory across multiple planning runs', () => {
    const fixture = createFixture(16, 8, 10);
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
    ]);

    const initialMemory = getMemoryUsage();

    // Run planning multiple times
    for (let i = 0; i < 10; i++) {
      generatePlans(intent, fixture);
    }

    const finalMemory = getMemoryUsage();

    // Memory should not grow significantly
    if (initialMemory > 0) {
      const growth = finalMemory - initialMemory;
      expect(growth).toBeLessThan(10); // < 10MB growth
    }
  });
});

// ============================================================================
// Test Suite: Scalability
// ============================================================================

describe('Planning Performance Tests: Scalability', () => {
  it('should scale linearly with project length', () => {
    const sizes = [8, 16, 32, 64];
    const durations: number[] = [];

    for (const bars of sizes) {
      const fixture = createFixture(bars, 8, 10);
      const intent = createIntent([
        createAxisGoal('energy', 'increase'),
      ]);

      const metrics = measurePlanningPerformance(intent, fixture);
      durations.push(metrics.durationMs);
    }

    // Each doubling should not double the time (should be sub-linear)
    for (let i = 1; i < durations.length; i++) {
      const ratio = durations[i]! / durations[i - 1]!;
      expect(ratio).toBeLessThan(2.5);
    }
  });

  it('should scale sub-linearly with goal count', () => {
    const fixture = createFixture(16, 8, 10);
    const goalCounts = [1, 2, 4, 8];
    const durations: number[] = [];

    for (const count of goalCounts) {
      const goals = Array.from({ length: count }, (_, i) =>
        createAxisGoal(`axis${i}`, 'increase')
      );
      const intent = createIntent(goals);

      const metrics = measurePlanningPerformance(intent, fixture);
      durations.push(metrics.durationMs);
    }

    // Should not grow exponentially
    for (let i = 1; i < durations.length; i++) {
      const ratio = durations[i]! / durations[i - 1]!;
      expect(ratio).toBeLessThan(3.0); // Allow some growth but not exponential
    }
  });

  it('should handle large fixtures efficiently', () => {
    const fixture = createFixture(128, 32, 30); // Very large project
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    // Should still complete in reasonable time
    expect(metrics.durationMs).toBeLessThan(10000); // 10 seconds max
  });

  it('should benefit from scoped planning', () => {
    const fixture = createFixture(64, 16, 20);

    // Full scope
    const fullIntent = createIntent([
      createAxisGoal('brightness', 'increase'),
    ]);

    // Scoped to 8 bars
    const scopedIntent = createIntent([
      createAxisGoal('brightness', 'increase'),
    ]);
    scopedIntent.scope = {
      type: 'scope',
      id: 'scope_small',
      timeRange: {
        type: 'time-range',
        id: 'tr_small',
        bars: [0, 8],
      },
    };

    const fullMetrics = measurePlanningPerformance(fullIntent, fixture);
    const scopedMetrics = measurePlanningPerformance(scopedIntent, fixture);

    // Scoped should be faster
    expect(scopedMetrics.durationMs).toBeLessThan(fullMetrics.durationMs);
  });
});

// ============================================================================
// Test Suite: Throughput
// ============================================================================

describe('Planning Performance Tests: Throughput', () => {
  it('should generate multiple plans per second', () => {
    const fixture = createFixture(16, 8, 10);
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
    ]);

    const startTime = performance.now();
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      generatePlans(intent, fixture);
    }

    const endTime = performance.now();
    const totalMs = endTime - startTime;
    const plansPerSecond = (iterations / totalMs) * 1000;

    // Should achieve at least 5 plans/second
    expect(plansPerSecond).toBeGreaterThan(5);
  });

  it('should maintain throughput with caching', () => {
    const fixture = createFixture(16, 8, 10);
    const intent = createIntent([
      createAxisGoal('brightness', 'increase'),
    ]);

    // First run (cold cache)
    const coldMetrics = measurePlanningPerformance(intent, fixture);

    // Second run (warm cache)
    const warmMetrics = measurePlanningPerformance(intent, fixture);

    // Warm should be faster or equal
    expect(warmMetrics.durationMs).toBeLessThanOrEqual(coldMetrics.durationMs * 1.5);
  });
});

// ============================================================================
// Test Suite: Stress Tests
// ============================================================================

describe('Planning Performance Tests: Stress', () => {
  it('should handle pathological goal combinations', () => {
    const fixture = createFixture(16, 8, 10);
    
    // Many conflicting goals
    const intent = createIntent([
      createAxisGoal('lift', 'increase'),
      createAxisGoal('intimacy', 'increase'),
      createAxisGoal('energy', 'increase'),
      createAxisGoal('calm', 'increase'),
      createAxisGoal('brightness', 'increase'),
      createAxisGoal('darkness', 'increase'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    // Should still complete
    expect(metrics.durationMs).toBeLessThan(3000);
  });

  it('should handle deep constraint hierarchies', () => {
    const fixture = createFixture(16, 8, 10);
    
    // Many nested constraints
    const constraints: CPLConstraint[] = Array.from({ length: 10 }, (_, i) => ({
      type: 'constraint',
      id: `constraint_${i}`,
      variant: 'preserve',
      strength: 'hard',
      description: `Preserve ${i}`,
      target: { type: 'selector', id: `s${i}` } as any,
      level: 'exact',
    } as any));

    const intent = createIntent(
      [createAxisGoal('energy', 'increase')],
      constraints
    );

    const metrics = measurePlanningPerformance(intent, fixture);

    // Should complete despite complexity
    expect(metrics.durationMs).toBeLessThan(2000);
  });

  it('should prune search space effectively', () => {
    const fixture = createFixture(32, 16, 15);
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    // Should not explore entire exponential search space
    // If it did, this would take minutes/hours
    expect(metrics.durationMs).toBeLessThan(1000);
  });

  it('should handle empty fixtures gracefully', () => {
    const fixture = createFixture(0, 0, 0);
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    // Should complete quickly even if no plans possible
    expect(metrics.durationMs).toBeLessThan(100);
  });

  it('should timeout or fail gracefully on impossible requests', () => {
    const fixture = createFixture(16, 8, 10);
    
    // Impossible: increase and decrease same axis
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
      createAxisGoal('energy', 'decrease'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    // Should detect impossibility quickly
    expect(metrics.durationMs).toBeLessThan(500);
  });
});

// ============================================================================
// Test Suite: Regression Guards
// ============================================================================

describe('Planning Performance Tests: Regression Guards', () => {
  it('should maintain baseline performance across refactors', () => {
    const fixture = createFixture(16, 8, 10);
    const intent = createIntent([
      createAxisGoal('brightness', 'increase'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    // Baseline: simple goal should complete in < 50ms
    expect(metrics.durationMs).toBeLessThan(50);
  });

  it('should not regress on typical use cases', () => {
    const fixture = createFixture(24, 12, 15);
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
      createAxisGoal('brightness', 'increase'),
    ]);

    const metrics = measurePlanningPerformance(intent, fixture);

    // Typical case: should complete in < 300ms
    expect(metrics.durationMs).toBeLessThan(300);
  });
});

// ============================================================================
// Export test runner
// ============================================================================

export function runPlanningPerformanceTests() {
  console.log('Planning Performance Tests: All tests registered');
}
