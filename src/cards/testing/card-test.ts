/**
 * Card Testing Framework
 * Comprehensive testing specification format for cards
 * Phase 6.6: Card Testing & Quality (Item 1962)
 */

import type { Card } from '../card';
import type { Event } from '../../types/event';

export interface CardTest<A = any, B = any> {
  id: string;
  name: string;
  description: string;
  card: Card<A, B>;
  tests: {
    unit?: UnitTest<A, B>[];
    integration?: IntegrationTest[];
    snapshot?: SnapshotTest<A, B>[];
    performance?: PerformanceTest<A, B>[];
    memory?: MemoryTest<A, B>[];
    audio?: AudioComparisonTest[];
    event?: EventComparisonTest[];
    regression?: RegressionTest<A, B>[];
    fuzz?: FuzzTest<A, B>;
    property?: PropertyTest<A, B>[];
  };
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
}

export interface UnitTest<A, B> {
  name: string;
  description?: string;
  input: A;
  expectedOutput?: B;
  expectedError?: string;
  validate?: (output: B, input: A) => boolean | string;
  timeout?: number;
  skip?: boolean;
  only?: boolean;
}

export interface IntegrationTest {
  name: string;
  description?: string;
  cards: Card<any, any>[];
  input: any;
  expectedOutput?: any;
  validate?: (output: any, input: any) => boolean | string;
  timeout?: number;
  skip?: boolean;
}

export interface SnapshotTest<A, _B = unknown> {
  name: string;
  description?: string;
  input: A;
  snapshotPath?: string;
  updateSnapshot?: boolean;
  threshold?: number;
}

export interface PerformanceTest<A, _B = unknown> {
  name: string;
  description?: string;
  input: A;
  iterations?: number;
  maxTimeMs?: number;
  maxMemoryMB?: number;
  warmupIterations?: number;
  measureCPU?: boolean;
  measureMemory?: boolean;
  measureLatency?: boolean;
}

export interface MemoryTest<A, _B = unknown> {
  name: string;
  description?: string;
  input: A;
  iterations?: number;
  maxMemoryGrowthMB?: number;
  gcBetweenRuns?: boolean;
  trackInstances?: boolean;
}

export interface AudioComparisonTest {
  name: string;
  description?: string;
  input: Event<any>[];
  referenceAudioPath?: string;
  maxDifference?: number;
  compareSpectrum?: boolean;
  comparePeaks?: boolean;
  compareLoudness?: boolean;
}

export interface EventComparisonTest {
  name: string;
  description?: string;
  input: Event<any>[];
  expectedEvents?: Event<any>[];
  referencePath?: string;
  tolerance?: {
    tick?: number;
    duration?: number;
    velocity?: number;
    pitch?: number;
  };
  ignoreIds?: boolean;
}

export interface RegressionTest<A, B> {
  name: string;
  description?: string;
  input: A;
  baselineVersion: string;
  baselineOutput?: B;
  allowedDrift?: number;
}

export interface FuzzTest<A, B> {
  name: string;
  description?: string;
  inputGenerator: () => A;
  iterations?: number;
  seed?: number;
  validate?: (output: B, input: A) => boolean | string;
  crashOnError?: boolean;
}

export interface PropertyTest<A, B> {
  name: string;
  description?: string;
  property: string;
  inputGenerator: () => A;
  validate: (outputs: B[], inputs: A[]) => boolean | string;
  iterations?: number;
}

export interface TestResult {
  testId: string;
  testName: string;
  testType: string;
  passed: boolean;
  error?: Error;
  duration?: number;
  memoryUsed?: number;
  cpuUsed?: number;
  output?: any;
  metrics?: Record<string, number>;
}

export interface TestSuiteResult {
  cardId: string;
  cardName: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  coverage?: { lines: number; functions: number; branches: number };
  qualityScore?: number;
}

export interface TestRunnerOptions {
  verbose?: boolean;
  parallel?: boolean;
  maxWorkers?: number;
  timeout?: number;
  bail?: boolean;
  updateSnapshots?: boolean;
  coverage?: boolean;
  profile?: boolean;
  filter?: string;
  only?: boolean;
}

export function createCardTest<A, B>(spec: Omit<CardTest<A, B>, 'id'>): CardTest<A, B> {
  return { id: `${spec.card.meta.id}-test-${Date.now()}`, ...spec };
}

export function unitTest<A, B>(spec: Omit<UnitTest<A, B>, 'timeout'>): UnitTest<A, B> {
  return { timeout: 5000, ...spec };
}

export function integrationTest(spec: Omit<IntegrationTest, 'timeout'>): IntegrationTest {
  return { timeout: 10000, ...spec };
}

export function snapshotTest<A, B>(spec: SnapshotTest<A, B>): SnapshotTest<A, B> {
  return { updateSnapshot: false, threshold: 0.001, ...spec };
}

export function performanceTest<A, B>(
  spec: Omit<PerformanceTest<A, B>, 'iterations' | 'warmupIterations'>
): PerformanceTest<A, B> {
  return {
    iterations: 1000,
    warmupIterations: 10,
    measureCPU: true,
    measureMemory: true,
    measureLatency: true,
    ...spec
  };
}

export function memoryTest<A, B>(
  spec: Omit<MemoryTest<A, B>, 'iterations' | 'gcBetweenRuns'>
): MemoryTest<A, B> {
  return { iterations: 100, gcBetweenRuns: true, trackInstances: true, maxMemoryGrowthMB: 10, ...spec };
}

export function audioComparisonTest(spec: Omit<AudioComparisonTest, 'maxDifference'>): AudioComparisonTest {
  return { maxDifference: 0.01, compareSpectrum: true, comparePeaks: true, compareLoudness: true, ...spec };
}

export function eventComparisonTest(spec: Omit<EventComparisonTest, 'ignoreIds'>): EventComparisonTest {
  return { tolerance: { tick: 1, duration: 1, velocity: 2, pitch: 0 }, ignoreIds: true, ...spec };
}

export function fuzzTest<A, B>(spec: Omit<FuzzTest<A, B>, 'iterations' | 'crashOnError'>): FuzzTest<A, B> {
  return { iterations: 1000, crashOnError: false, ...spec };
}

export function propertyTest<A, B>(spec: Omit<PropertyTest<A, B>, 'iterations'>): PropertyTest<A, B> {
  return { iterations: 100, ...spec };
}

export const CommonProperties = {
  idempotent: 'idempotent',
  commutative: 'commutative',
  associative: 'associative',
  identity: 'identity',
  inverse: 'inverse',
  deterministic: 'deterministic',
  preservesLength: 'preserves-length',
  monotonic: 'monotonic'
};
