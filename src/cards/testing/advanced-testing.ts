/**
 * Snapshot Testing, Performance Benchmarks, Memory Leak Detection
 * Phase 6.6: Card Testing & Quality (Items 1965-1967)
 */

import type {
  SnapshotTest,
  PerformanceTest,
  MemoryTest,
  TestResult
} from './card-test';
import type { Card } from '../card';
import type { Tick } from '../../types/primitives';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Snapshot tester - compare outputs against saved snapshots
 */
export class SnapshotTester<A, B> {
  private snapshotDir: string;

  constructor(snapshotDir = './snapshots') {
    this.snapshotDir = snapshotDir;
    if (typeof window === 'undefined' && !fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }
  }

  async runTest(test: SnapshotTest<A, B>, card: Card<A, B>): Promise<TestResult> {
    const startTime = performance.now();
    const testId = `snapshot-${Date.now()}-${Math.random()}`;

    try {
      const output = await card.process(test.input, {
        currentTick: 0 as Tick, currentSample: 0, elapsedMs: 0,
        transport: { playing: false, recording: false, tempo: 120, timeSignature: [4, 4], looping: false },
        engine: {} as any
      });

      const snapshotPath = test.snapshotPath || 
        path.join(this.snapshotDir, `${card.meta.id}-${test.name.replace(/\s+/g, '-')}.json`);

      const outputStr = JSON.stringify(output, null, 2);

      if (typeof window === 'undefined') {
        if (test.updateSnapshot || !fs.existsSync(snapshotPath)) {
          fs.writeFileSync(snapshotPath, outputStr);
          return {
            testId,
            testName: test.name,
            testType: 'snapshot',
            passed: true,
            duration: performance.now() - startTime,
            output
          };
        }

        const snapshotStr = fs.readFileSync(snapshotPath, 'utf-8');
        const snapshot = JSON.parse(snapshotStr);
        
        const matches = this.compareWithThreshold(output, snapshot, test.threshold || 0.001);
        
        if (!matches) {
          throw new Error(`Snapshot mismatch:\nExpected: ${snapshotStr}\nActual: ${outputStr}`);
        }
      }

      return {
        testId,
        testName: test.name,
        testType: 'snapshot',
        passed: true,
        duration: performance.now() - startTime,
        output
      };
    } catch (error) {
      return {
        testId,
        testName: test.name,
        testType: 'snapshot',
        passed: false,
        duration: performance.now() - startTime,
        error: error as Error
      };
    }
  }

  private compareWithThreshold(a: any, b: any, threshold: number): boolean {
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) <= threshold;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => this.compareWithThreshold(item, b[i], threshold));
    }
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.compareWithThreshold(a[key], b[key], threshold));
    }
    return a === b;
  }

  async runAll(tests: SnapshotTest<A, B>[], card: Card<A, B>): Promise<TestResult[]> {
    const results: TestResult[] = [];
    for (const test of tests) {
      const result = await this.runTest(test, card);
      results.push(result);
    }
    return results;
  }
}

/**
 * Performance benchmark runner
 */
export class PerformanceBenchmark<A, B> {
  async runTest(test: PerformanceTest<A, B>, card: Card<A, B>): Promise<TestResult> {
    const testId = `perf-${Date.now()}-${Math.random()}`;
    
    try {
      const warmupIterations = test.warmupIterations || 10;
      for (let i = 0; i < warmupIterations; i++) {
        await card.process(test.input, {
          currentTick: 0 as Tick, currentSample: 0, elapsedMs: 0,
          transport: { playing: false, recording: false, tempo: 120, timeSignature: [4, 4], looping: false },
          engine: {} as any
        });
      }

      const iterations = test.iterations || 1000;
      const times: number[] = [];
      const memoryBefore = typeof performance !== 'undefined' && (performance as any).memory 
        ? (performance as any).memory.usedJSHeapSize / 1024 / 1024
        : 0;

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await card.process(test.input, {
          currentTick: 0 as Tick, currentSample: 0, elapsedMs: 0,
          transport: { playing: false, recording: false, tempo: 120, timeSignature: [4, 4], looping: false },
          engine: {} as any
        });
        const end = performance.now();
        times.push(end - start);
      }

      const memoryAfter = typeof performance !== 'undefined' && (performance as any).memory
        ? (performance as any).memory.usedJSHeapSize / 1024 / 1024
        : 0;

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const memoryUsed = memoryAfter - memoryBefore;

      const passed = 
        (!test.maxTimeMs || avgTime <= test.maxTimeMs) &&
        (!test.maxMemoryMB || memoryUsed <= test.maxMemoryMB);

      return {
        testId,
        testName: test.name,
        testType: 'performance',
        passed,
        duration: avgTime,
        memoryUsed,
        metrics: {
          avgTimeMs: avgTime,
          minTimeMs: minTime,
          maxTimeMs: maxTime,
          memoryMB: memoryUsed,
          iterationsPerSecond: 1000 / avgTime
        }
      };
    } catch (error) {
      return {
        testId,
        testName: test.name,
        testType: 'performance',
        passed: false,
        error: error as Error
      };
    }
  }

  async runAll(tests: PerformanceTest<A, B>[], card: Card<A, B>): Promise<TestResult[]> {
    const results: TestResult[] = [];
    for (const test of tests) {
      const result = await this.runTest(test, card);
      results.push(result);
    }
    return results;
  }
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector<A, B> {
  async runTest(test: MemoryTest<A, B>, card: Card<A, B>): Promise<TestResult> {
    const testId = `memory-${Date.now()}-${Math.random()}`;
    
    try {
      const iterations = test.iterations || 100;
      const memorySnapshots: number[] = [];

      for (let i = 0; i < iterations; i++) {
        await card.process(test.input, {
          currentTick: 0 as Tick, currentSample: 0, elapsedMs: 0,
          transport: { playing: false, recording: false, tempo: 120, timeSignature: [4, 4], looping: false },
          engine: {} as any
        });

        if (test.gcBetweenRuns && typeof gc !== 'undefined') {
          gc();
        }

        if (typeof performance !== 'undefined' && (performance as any).memory) {
          memorySnapshots.push((performance as any).memory.usedJSHeapSize / 1024 / 1024);
        }
      }

      if (memorySnapshots.length < 2) {
        throw new Error('Not enough memory snapshots to detect leaks');
      }

      const memoryGrowth = (memorySnapshots[memorySnapshots.length - 1] ?? 0) - (memorySnapshots[0] ?? 0);
      const avgGrowthPerIteration = memoryGrowth / iterations;

      const passed = memoryGrowth <= (test.maxMemoryGrowthMB || 10);

      return {
        testId,
        testName: test.name,
        testType: 'memory',
        passed,
        memoryUsed: memoryGrowth,
        metrics: {
          totalGrowthMB: memoryGrowth,
          growthPerIterationKB: avgGrowthPerIteration * 1024,
          iterations,
          startMemoryMB: memorySnapshots[0] ?? 0,
          endMemoryMB: memorySnapshots[memorySnapshots.length - 1] ?? 0
        }
      };
    } catch (error) {
      return {
        testId,
        testName: test.name,
        testType: 'memory',
        passed: false,
        error: error as Error
      };
    }
  }

  async runAll(tests: MemoryTest<A, B>[], card: Card<A, B>): Promise<TestResult[]> {
    const results: TestResult[] = [];
    for (const test of tests) {
      const result = await this.runTest(test, card);
      results.push(result);
    }
    return results;
  }
}

export function createSnapshotTester<A, B>(snapshotDir?: string): SnapshotTester<A, B> {
  return new SnapshotTester<A, B>(snapshotDir);
}

export function createPerformanceBenchmark<A, B>(): PerformanceBenchmark<A, B> {
  return new PerformanceBenchmark<A, B>();
}

export function createMemoryLeakDetector<A, B>(): MemoryLeakDetector<A, B> {
  return new MemoryLeakDetector<A, B>();
}
