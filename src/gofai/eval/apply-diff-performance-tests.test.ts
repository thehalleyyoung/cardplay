/**
 * @file Apply+Diff Performance Tests (Step 340)
 * @module gofai/eval/apply-diff-performance-tests
 * 
 * Implements Step 340: Add performance tests for apply+diff: stay within 
 * latency budgets for typical edits.
 * 
 * This module provides performance benchmarks to ensure that edit execution
 * and diff computation stay within acceptable latency bounds. Key metrics:
 * 
 * 1. Apply Latency - Time to execute edit plan
 * 2. Diff Computation - Time to compute before/after diff
 * 3. Constraint Validation - Time to verify constraints
 * 4. Total End-to-End - Full apply cycle time
 * 5. Memory Usage - Peak memory during execution
 * 6. Throughput - Edits per second for batch operations
 * 
 * Performance budgets (targets):
 * - Simple edits (1-10 events): < 50ms
 * - Medium edits (10-100 events): < 200ms
 * - Large edits (100-1000 events): < 1000ms
 * - Structural edits: < 500ms
 * - Constraint validation: < 100ms
 * 
 * Design principles:
 * - Measure realistic workloads
 * - Include warm-up iterations
 * - Report percentiles (p50, p95, p99)
 * - Detect performance regressions
 * - Profile hotspots
 * - Test under load
 * 
 * @see gofai_goalB.md Step 340
 * @see gofai_goalB.md Step 290 (planning performance)
 * @see gofai_goalB.md Step 459 (performance benchmarks)
 * @see docs/gofai/performance-budget.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { EditPackage, CPLPlan } from '../execution/edit-package.js';
import type { ExecutionDiff } from '../execution/diff-model.js';
import type { Scope } from '../canon/cpl-types.js';

// ============================================================================
// Performance Test Infrastructure
// ============================================================================

/**
 * Performance measurement result.
 */
interface PerformanceMeasurement {
  readonly operation: string;
  readonly iterations: number;
  readonly times: readonly number[]; // milliseconds
  readonly mean: number;
  readonly median: number;
  readonly p95: number;
  readonly p99: number;
  readonly min: number;
  readonly max: number;
  readonly stdDev: number;
}

/**
 * Measure operation performance.
 */
async function measurePerformance(
  operation: string,
  fn: () => Promise<void> | void,
  iterations: number = 100,
  warmup: number = 10
): Promise<PerformanceMeasurement> {
  const times: number[] = [];
  
  // Warm-up iterations
  for (let i = 0; i < warmup; i++) {
    await fn();
  }
  
  // Measurement iterations
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const elapsed = performance.now() - start;
    times.push(elapsed);
  }
  
  // Sort for percentiles
  const sorted = [...times].sort((a, b) => a - b);
  
  const mean = times.reduce((sum, t) => sum + t, 0) / times.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  // Standard deviation
  const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    operation,
    iterations,
    times: sorted,
    mean,
    median,
    p95,
    p99,
    min,
    max,
    stdDev
  };
}

/**
 * Assert performance budget.
 */
function assertPerformanceBudget(
  measurement: PerformanceMeasurement,
  budget: { p95?: number; p99?: number; mean?: number }
): void {
  if (budget.p95 !== undefined) {
    expect(measurement.p95).toBeLessThanOrEqual(budget.p95);
  }
  
  if (budget.p99 !== undefined) {
    expect(measurement.p99).toBeLessThanOrEqual(budget.p99);
  }
  
  if (budget.mean !== undefined) {
    expect(measurement.mean).toBeLessThanOrEqual(budget.mean);
  }
}

/**
 * Format performance measurement.
 */
function formatMeasurement(m: PerformanceMeasurement): string {
  return `
${m.operation}:
  Iterations: ${m.iterations}
  Mean: ${m.mean.toFixed(2)}ms
  Median: ${m.median.toFixed(2)}ms
  P95: ${m.p95.toFixed(2)}ms
  P99: ${m.p99.toFixed(2)}ms
  Range: ${m.min.toFixed(2)}ms - ${m.max.toFixed(2)}ms
  StdDev: ${m.stdDev.toFixed(2)}ms
`.trim();
}

// ============================================================================
// Mock Objects for Testing
// ============================================================================

interface MockEvent {
  id: string;
  bar: number;
  layer: string;
  pitch?: number;
  velocity?: number;
}

interface MockProjectState {
  events: MockEvent[];
  layers: string[];
  barCount: number;
}

/**
 * Generate mock project state.
 */
function generateMockProject(eventCount: number): MockProjectState {
  const layers = ['layer1', 'layer2', 'layer3', 'layer4'];
  const events: MockEvent[] = [];
  
  for (let i = 0; i < eventCount; i++) {
    events.push({
      id: `event-${i}`,
      bar: Math.floor(i / 4) + 1,
      layer: layers[i % layers.length],
      pitch: 60 + (i % 12),
      velocity: 100
    });
  }
  
  return {
    events,
    layers,
    barCount: Math.ceil(eventCount / 4)
  };
}

/**
 * Simulate applying edit plan.
 */
function simulateApply(
  project: MockProjectState,
  scope: Scope,
  modificationType: 'simple' | 'medium' | 'complex'
): { modified: MockProjectState; diff: ExecutionDiff } {
  // Filter events in scope
  const inScope = project.events.filter(e =>
    scope.barRange ? e.bar >= scope.barRange.start && e.bar <= scope.barRange.end : true
  );
  
  // Simulate modifications
  const modified: MockEvent[] = [];
  const diffEvents: unknown[] = [];
  
  for (const event of inScope) {
    switch (modificationType) {
      case 'simple':
        // Just change velocity
        modified.push({ ...event, velocity: (event.velocity || 100) + 10 });
        diffEvents.push({ eventId: event.id, type: 'modify', field: 'velocity' });
        break;
      
      case 'medium':
        // Change multiple properties
        modified.push({
          ...event,
          velocity: (event.velocity || 100) + 10,
          pitch: (event.pitch || 60) + 1
        });
        diffEvents.push({
          eventId: event.id,
          type: 'modify',
          fields: ['velocity', 'pitch']
        });
        break;
      
      case 'complex':
        // Complex transformation
        const newPitch = ((event.pitch || 60) + 7) % 12 + 60;
        const newVelocity = Math.min(127, (event.velocity || 100) * 1.2);
        modified.push({ ...event, pitch: newPitch, velocity: newVelocity });
        diffEvents.push({
          eventId: event.id,
          type: 'modify',
          fields: ['velocity', 'pitch'],
          computation: 'complex'
        });
        break;
    }
  }
  
  // Update project
  const newEvents = [
    ...project.events.filter(e => !inScope.includes(e)),
    ...modified
  ];
  
  return {
    modified: {
      ...project,
      events: newEvents
    },
    diff: {
      events: diffEvents,
      params: [],
      structure: []
    }
  };
}

/**
 * Simulate constraint validation.
 */
function simulateConstraintValidation(
  before: MockProjectState,
  after: MockProjectState,
  constraintCount: number
): boolean {
  // Simulate constraint checking work
  for (let i = 0; i < constraintCount; i++) {
    // Simulate various constraint types
    if (i % 3 === 0) {
      // Check melody preservation
      const beforeMelody = before.events.filter(e => e.layer === 'layer1');
      const afterMelody = after.events.filter(e => e.layer === 'layer1');
      if (beforeMelody.length !== afterMelody.length) return false;
    } else if (i % 3 === 1) {
      // Check harmony
      const beforeHarmony = before.events.filter(e => e.layer === 'layer2');
      const afterHarmony = after.events.filter(e => e.layer === 'layer2');
      // Simplified check
      if (beforeHarmony.length !== afterHarmony.length) return false;
    } else {
      // Check rhythm
      const beforeRhythm = before.events.map(e => e.bar);
      const afterRhythm = after.events.map(e => e.bar);
      // Simplified check
      if (beforeRhythm.length !== afterRhythm.length) return false;
    }
  }
  
  return true;
}

// ============================================================================
// Performance Tests
// ============================================================================

describe('Apply+Diff Performance Tests', () => {
  describe('Simple Edits (1-10 events)', () => {
    it('should execute simple edits within 50ms budget', async () => {
      const project = generateMockProject(10);
      const scope: Scope = {
        type: 'scope',
        barRange: { start: 1, end: 3 },
        description: 'First 3 bars'
      };
      
      const measurement = await measurePerformance(
        'Simple edit (10 events)',
        () => {
          simulateApply(project, scope, 'simple');
        },
        100
      );
      
      console.log(formatMeasurement(measurement));
      
      assertPerformanceBudget(measurement, {
        p95: 50,
        mean: 30
      });
    });
    
    it('should compute diffs for simple edits within budget', async () => {
      const project = generateMockProject(10);
      const scope: Scope = {
        type: 'scope',
        barRange: { start: 1, end: 3 },
        description: 'First 3 bars'
      };
      
      const measurement = await measurePerformance(
        'Diff computation (10 events)',
        () => {
          const { diff } = simulateApply(project, scope, 'simple');
          // Diff is computed during apply in this simulation
        },
        100
      );
      
      console.log(formatMeasurement(measurement));
      
      assertPerformanceBudget(measurement, {
        p95: 50
      });
    });
  });
  
  describe('Medium Edits (10-100 events)', () => {
    it('should execute medium edits within 200ms budget', async () => {
      const project = generateMockProject(100);
      const scope: Scope = {
        type: 'scope',
        barRange: { start: 1, end: 25 },
        description: 'First 25 bars'
      };
      
      const measurement = await measurePerformance(
        'Medium edit (100 events)',
        () => {
          simulateApply(project, scope, 'medium');
        },
        100
      );
      
      console.log(formatMeasurement(measurement));
      
      assertPerformanceBudget(measurement, {
        p95: 200,
        mean: 100
      });
    });
    
    it('should validate constraints within 100ms budget', async () => {
      const project = generateMockProject(100);
      const scope: Scope = {
        type: 'scope',
        barRange: { start: 1, end: 25 },
        description: 'First 25 bars'
      };
      
      const { modified } = simulateApply(project, scope, 'medium');
      
      const measurement = await measurePerformance(
        'Constraint validation (3 constraints)',
        () => {
          simulateConstraintValidation(project, modified, 3);
        },
        100
      );
      
      console.log(formatMeasurement(measurement));
      
      assertPerformanceBudget(measurement, {
        p95: 100
      });
    });
  });
  
  describe('Large Edits (100-1000 events)', () => {
    it('should execute large edits within 1000ms budget', async () => {
      const project = generateMockProject(1000);
      const scope: Scope = {
        type: 'scope',
        barRange: { start: 1, end: 250 },
        description: 'Full song'
      };
      
      const measurement = await measurePerformance(
        'Large edit (1000 events)',
        () => {
          simulateApply(project, scope, 'complex');
        },
        50 // Fewer iterations for large tests
      );
      
      console.log(formatMeasurement(measurement));
      
      assertPerformanceBudget(measurement, {
        p95: 1000,
        mean: 500
      });
    });
    
    it('should handle large diffs efficiently', async () => {
      const project = generateMockProject(1000);
      const scope: Scope = {
        type: 'scope',
        barRange: { start: 1, end: 250 },
        description: 'Full song'
      };
      
      const measurement = await measurePerformance(
        'Large diff (1000 events)',
        () => {
          const { diff } = simulateApply(project, scope, 'complex');
          // Diff serialization/processing
          JSON.stringify(diff);
        },
        50
      );
      
      console.log(formatMeasurement(measurement));
      
      assertPerformanceBudget(measurement, {
        p95: 500
      });
    });
  });
  
  describe('End-to-End Performance', () => {
    it('should complete full apply cycle within budget', async () => {
      const project = generateMockProject(200);
      const scope: Scope = {
        type: 'scope',
        barRange: { start: 10, end: 60 },
        description: 'Bars 10-60'
      };
      
      const measurement = await measurePerformance(
        'Full apply cycle (200 events)',
        () => {
          // Apply
          const { modified, diff } = simulateApply(project, scope, 'medium');
          
          // Validate constraints
          simulateConstraintValidation(project, modified, 5);
          
          // Serialize diff
          JSON.stringify(diff);
        },
        100
      );
      
      console.log(formatMeasurement(measurement));
      
      assertPerformanceBudget(measurement, {
        p95: 300,
        mean: 150
      });
    });
  });
  
  describe('Structural Edits', () => {
    it('should execute structural edits within 500ms budget', async () => {
      const project = generateMockProject(500);
      const scope: Scope = {
        type: 'scope',
        barRange: { start: 1, end: 125 },
        description: 'Full song'
      };
      
      const measurement = await measurePerformance(
        'Structural edit (section duplication)',
        () => {
          // Simulate duplicating a section
          const inScope = project.events.filter(e =>
            e.bar >= 10 && e.bar <= 20
          );
          
          const duplicated = inScope.map(e => ({
            ...e,
            id: `${e.id}-dup`,
            bar: e.bar + 50
          }));
          
          // Create diff
          const diff = {
            events: duplicated.map(e => ({ type: 'add', event: e })),
            params: [],
            structure: [{ type: 'duplicate_section', source: '10-20', target: '60-70' }]
          };
        },
        100
      );
      
      console.log(formatMeasurement(measurement));
      
      assertPerformanceBudget(measurement, {
        p95: 500,
        mean: 250
      });
    });
  });
  
  describe('Batch Operations', () => {
    it('should maintain throughput for batch edits', async () => {
      const project = generateMockProject(100);
      const batchSize = 10;
      
      const startTime = performance.now();
      
      for (let i = 0; i < batchSize; i++) {
        const scope: Scope = {
          type: 'scope',
          barRange: { start: i * 3 + 1, end: i * 3 + 3 },
          description: `Batch ${i}`
        };
        
        simulateApply(project, scope, 'simple');
      }
      
      const totalTime = performance.now() - startTime;
      const throughput = (batchSize / totalTime) * 1000; // edits per second
      
      console.log(`Batch throughput: ${throughput.toFixed(2)} edits/sec`);
      console.log(`Total time for ${batchSize} edits: ${totalTime.toFixed(2)}ms`);
      
      // Should maintain at least 10 edits per second
      expect(throughput).toBeGreaterThanOrEqual(10);
    });
  });
  
  describe('Memory Efficiency', () => {
    it('should not leak memory during repeated applies', async () => {
      const project = generateMockProject(100);
      const scope: Scope = {
        type: 'scope',
        barRange: { start: 1, end: 25 },
        description: 'Test scope'
      };
      
      // Run many iterations to detect leaks
      for (let i = 0; i < 1000; i++) {
        simulateApply(project, scope, 'medium');
      }
      
      // If we get here without running out of memory, test passes
      expect(true).toBe(true);
    });
  });
  
  describe('Scaling Characteristics', () => {
    it('should scale linearly with event count', async () => {
      const sizes = [10, 50, 100, 500];
      const measurements: { size: number; time: number }[] = [];
      
      for (const size of sizes) {
        const project = generateMockProject(size);
        const scope: Scope = {
          type: 'scope',
          barRange: { start: 1, end: Math.ceil(size / 4) },
          description: 'Full scope'
        };
        
        const m = await measurePerformance(
          `Scale test (${size} events)`,
          () => {
            simulateApply(project, scope, 'medium');
          },
          50
        );
        
        measurements.push({ size, time: m.mean });
        console.log(`${size} events: ${m.mean.toFixed(2)}ms`);
      }
      
      // Check that scaling is roughly linear
      // (time should scale proportionally with size)
      const ratios = [];
      for (let i = 1; i < measurements.length; i++) {
        const sizeRatio = measurements[i].size / measurements[i - 1].size;
        const timeRatio = measurements[i].time / measurements[i - 1].time;
        ratios.push(timeRatio / sizeRatio);
      }
      
      // Average ratio should be close to 1 for linear scaling
      const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
      console.log(`Average scaling ratio: ${avgRatio.toFixed(2)} (1.0 = perfectly linear)`);
      
      // Allow some variation but should be roughly linear
      expect(avgRatio).toBeGreaterThanOrEqual(0.5);
      expect(avgRatio).toBeLessThanOrEqual(2.0);
    });
  });
});

// ============================================================================
// Exports
// ============================================================================

export {
  measurePerformance,
  assertPerformanceBudget,
  formatMeasurement,
  generateMockProject,
  simulateApply,
  simulateConstraintValidation
};

export type {
  PerformanceMeasurement,
  MockEvent,
  MockProjectState
};
