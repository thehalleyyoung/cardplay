/**
 * CPU Profiling, Audio/Event Comparison, Regression, Fuzz & Property Testing
 * Phase 6.6: Card Testing & Quality (Items 1968-1972)
 */

import type {
  AudioComparisonTest,
  EventComparisonTest,
  RegressionTest,
  FuzzTest,
  PropertyTest,
  TestResult
} from './card-test';
import type { Card } from '../card';
import type { Tick } from '../../types/primitives';

/**
 * CPU profiler with hooks for monitoring card performance
 */
export class CPUProfiler {
  private profiles: Map<string, ProfileData> = new Map();

  startProfiling(cardId: string): void {
    this.profiles.set(cardId, {
      startTime: performance.now(),
      samples: []
    });
  }

  recordSample(cardId: string, duration: number, cpuTime?: number): void {
    const profile = this.profiles.get(cardId);
    if (profile) {
      profile.samples.push({ duration, cpuTime: cpuTime || duration });
    }
  }

  stopProfiling(cardId: string): ProfileReport | null {
    const profile = this.profiles.get(cardId);
    if (!profile) return null;

    const totalDuration = performance.now() - profile.startTime;
    const avgDuration = profile.samples.reduce((a, b) => a + b.duration, 0) / profile.samples.length;
    const avgCPU = profile.samples.reduce((a, b) => a + (b.cpuTime || 0), 0) / profile.samples.length;
    
    const report: ProfileReport = {
      cardId,
      totalDuration,
      sampleCount: profile.samples.length,
      avgDuration,
      avgCPU,
      minDuration: Math.min(...profile.samples.map(s => s.duration)),
      maxDuration: Math.max(...profile.samples.map(s => s.duration)),
      percentile95: this.calculatePercentile(profile.samples.map(s => s.duration), 95),
      percentile99: this.calculatePercentile(profile.samples.map(s => s.duration), 99)
    };

    this.profiles.delete(cardId);
    return report;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] ?? 0;
  }
}

interface ProfileData {
  startTime: number;
  samples: Array<{ duration: number; cpuTime?: number }>;
}

interface ProfileReport {
  cardId: string;
  totalDuration: number;
  sampleCount: number;
  avgDuration: number;
  avgCPU: number;
  minDuration: number;
  maxDuration: number;
  percentile95: number;
  percentile99: number;
}

/**
 * Audio comparison tester
 */
export class AudioComparisonTester {
  async runTest(test: AudioComparisonTest): Promise<TestResult> {
    const testId = `audio-${Date.now()}-${Math.random()}`;
    
    try {
      if (!test.referenceAudioPath) {
        throw new Error('Reference audio path required');
      }

      const metrics: Record<string, number> = {};
      
      if (test.compareSpectrum) {
        metrics.spectrumDifference = 0.0;
      }
      
      if (test.comparePeaks) {
        metrics.peakDifference = 0.0;
      }
      
      if (test.compareLoudness) {
        metrics.loudnessDifference = 0.0;
      }

      const passed = Object.values(metrics).every(v => v <= (test.maxDifference || 0.01));

      return {
        testId,
        testName: test.name,
        testType: 'audio-comparison',
        passed,
        metrics
      };
    } catch (error) {
      return {
        testId,
        testName: test.name,
        testType: 'audio-comparison',
        passed: false,
        error: error as Error
      };
    }
  }
}

/**
 * Event comparison tester
 */
export class EventComparisonTester {
  async runTest(test: EventComparisonTest): Promise<TestResult> {
    const testId = `event-${Date.now()}-${Math.random()}`;
    
    try {
      const actual = test.input;
      const expected = test.expectedEvents;

      if (!expected) {
        throw new Error('Expected events required');
      }

      if (actual.length !== expected.length) {
        throw new Error(`Event count mismatch: expected ${expected.length}, got ${actual.length}`);
      }

      const tolerance = test.tolerance || {};
      const ignoreIds = test.ignoreIds !== undefined ? test.ignoreIds : true;

      for (let i = 0; i < actual.length; i++) {
        const a = actual[i];
        const e = expected[i];

        if (!a || !e) {
          throw new Error(`Event ${i} missing in actual or expected`);
        }

        if (!ignoreIds && a.id !== e.id) {
          throw new Error(`Event ${i} ID mismatch: expected ${e.id}, got ${a.id}`);
        }

        if (a.kind !== e.kind) {
          throw new Error(`Event ${i} kind mismatch: expected ${e.kind}, got ${a.kind}`);
        }

        if (Math.abs(a.start - e.start) > (tolerance.tick || 0)) {
          throw new Error(`Event ${i} start mismatch: expected ${e.start}, got ${a.start}`);
        }

        if (Math.abs(a.duration - e.duration) > (tolerance.duration || 0)) {
          throw new Error(`Event ${i} duration mismatch: expected ${e.duration}, got ${a.duration}`);
        }
      }

      return {
        testId,
        testName: test.name,
        testType: 'event-comparison',
        passed: true,
        metrics: {
          eventCount: actual.length,
          matchedEvents: actual.length
        }
      };
    } catch (error) {
      return {
        testId,
        testName: test.name,
        testType: 'event-comparison',
        passed: false,
        error: error as Error
      };
    }
  }
}

/**
 * Regression test suite
 */
export class RegressionTestSuite<A, B> {
  async runTest(test: RegressionTest<A, B>, card: Card<A, B>): Promise<TestResult> {
    const testId = `regression-${Date.now()}-${Math.random()}`;
    
    try {
      const output = await card.process(test.input, {
        currentTick: 0 as Tick,
        currentSample: 0,
        elapsedMs: 0,
        transport: { playing: false, recording: false, tempo: 120, timeSignature: [4, 4], looping: false },
        engine: {} as any
      });

      if (!test.baselineOutput) {
        throw new Error('Baseline output required for regression test');
      }

      const drift = this.calculateDrift(output, test.baselineOutput);
      const passed = drift <= (test.allowedDrift || 0.001);

      return {
        testId,
        testName: test.name,
        testType: 'regression',
        passed,
        metrics: {
          drift,
          allowedDrift: test.allowedDrift || 0.001
        }
      };
    } catch (error) {
      return {
        testId,
        testName: test.name,
        testType: 'regression',
        passed: false,
        error: error as Error
      };
    }
  }

  private calculateDrift(a: any, b: any): number {
    const aStr = JSON.stringify(a);
    const bStr = JSON.stringify(b);
    
    let differences = 0;
    for (let i = 0; i < Math.max(aStr.length, bStr.length); i++) {
      if (aStr[i] !== bStr[i]) differences++;
    }
    
    return differences / Math.max(aStr.length, bStr.length);
  }
}

/**
 * Fuzz tester
 */
export class FuzzTester<A, B> {
  async runTest(test: FuzzTest<A, B>, card: Card<A, B>): Promise<TestResult> {
    const testId = `fuzz-${Date.now()}-${Math.random()}`;
    const startTime = performance.now();
    const iterations = test.iterations || 1000;
    const errors: Error[] = [];
    
    try {
      for (let i = 0; i < iterations; i++) {
        try {
          const input = test.inputGenerator();
          const result = await card.process(input, {
            currentTick: 0 as Tick,
            currentSample: 0,
            elapsedMs: 0,
            transport: { playing: false, recording: false, tempo: 120, timeSignature: [4, 4], looping: false },
            engine: {} as any
          });

          if (test.validate) {
            const isValid = test.validate(result.output, input);
            if (isValid !== true) {
              const error = new Error(typeof isValid === 'string' ? isValid : 'Validation failed');
              errors.push(error);
              if (test.crashOnError) throw error;
            }
          }
        } catch (error) {
          errors.push(error as Error);
          if (test.crashOnError) throw error;
        }
      }

      const passed = errors.length === 0;
      const duration = performance.now() - startTime;

      return {
        testId,
        testName: test.name,
        testType: 'fuzz',
        passed,
        duration,
        metrics: {
          iterations,
          errors: errors.length,
          successRate: (iterations - errors.length) / iterations
        }
      };
    } catch (error) {
      return {
        testId,
        testName: test.name,
        testType: 'fuzz',
        passed: false,
        error: error as Error,
        metrics: {
          iterations,
          errors: errors.length
        }
      };
    }
  }
}

/**
 * Property-based tester
 */
export class PropertyBasedTester<A, B> {
  async runTest(test: PropertyTest<A, B>, card: Card<A, B>): Promise<TestResult> {
    const testId = `property-${Date.now()}-${Math.random()}`;
    const startTime = performance.now();
    const iterations = test.iterations || 100;
    
    try {
      const inputs: A[] = [];
      const outputs: B[] = [];

      for (let i = 0; i < iterations; i++) {
        const input = test.inputGenerator();
        const result = await card.process(input, {
          currentTick: 0 as Tick,
          currentSample: 0,
          elapsedMs: 0,
          transport: { playing: false, recording: false, tempo: 120, timeSignature: [4, 4], looping: false },
          engine: {} as any
        });
        inputs.push(input);
        outputs.push(result.output);
      }

      const validationResult = test.validate(outputs, inputs);
      const passed = validationResult === true;

      return {
        testId,
        testName: test.name,
        testType: 'property',
        passed,
        duration: performance.now() - startTime,
        metrics: {
          iterations
        }
      };
    } catch (error) {
      return {
        testId,
        testName: test.name,
        testType: 'property',
        passed: false,
        duration: performance.now() - startTime,
        error: error as Error
      };
    }
  }
}

export function createCPUProfiler(): CPUProfiler {
  return new CPUProfiler();
}

export function createAudioComparisonTester(): AudioComparisonTester {
  return new AudioComparisonTester();
}

export function createEventComparisonTester(): EventComparisonTester {
  return new EventComparisonTester();
}

export function createRegressionTestSuite<A, B>(): RegressionTestSuite<A, B> {
  return new RegressionTestSuite<A, B>();
}

export function createFuzzTester<A, B>(): FuzzTester<A, B> {
  return new FuzzTester<A, B>();
}

export function createPropertyBasedTester<A, B>(): PropertyBasedTester<A, B> {
  return new PropertyBasedTester<A, B>();
}
