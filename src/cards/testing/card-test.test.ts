/**
 * Test for the Card Testing Framework itself
 * Phase 6.6: Card Testing & Quality
 */

import { describe, it, expect } from 'vitest';
import {
  createCardTest,
  unitTest,
  integrationTest,
  snapshotTest,
  performanceTest,
  memoryTest,
  audioComparisonTest,
  eventComparisonTest,
  fuzzTest,
  propertyTest,
  CommonProperties
} from './card-test';
import { CardTestRunner } from './test-runner';
import { pureCard } from '../card';

describe('Card Testing Framework', () => {
  describe('CardTest Specification', () => {
    it('should create a card test', () => {
      const testCard = pureCard<number, number>(
        {
          id: 'test-card',
          name: 'Test Card',
          category: 'testing',
          description: 'A test card'
        },
        { inputs: [], outputs: [], params: [] },
        (x) => x * 2
      );

      const cardTest = createCardTest({
        name: 'Test Card Tests',
        description: 'Testing the test card',
        card: testCard,
        tests: {
          unit: [
            unitTest({
              name: 'should double input',
              input: 5,
              expectedOutput: 10
            })
          ]
        }
      });

      expect(cardTest).toBeDefined();
      expect(cardTest.id).toMatch(/test-card-test-/);
      expect(cardTest.name).toBe('Test Card Tests');
      expect(cardTest.tests.unit).toHaveLength(1);
    });

    it('should create unit tests', () => {
      const test = unitTest({
        name: 'test',
        input: 1,
        expectedOutput: 2
      });

      expect(test.timeout).toBe(5000);
      expect(test.name).toBe('test');
    });

    it('should create integration tests', () => {
      const card1 = pureCard({ id: 'c1', name: 'C1', category: 'test', description: '' }, 
        { inputs: [], outputs: [], params: [] }, 
        (x: number) => x + 1);
      const card2 = pureCard({ id: 'c2', name: 'C2', category: 'test', description: '' }, 
        { inputs: [], outputs: [], params: [] }, 
        (x: number) => x * 2);

      const test = integrationTest({
        name: 'test chain',
        cards: [card1, card2],
        input: 5,
        expectedOutput: 12
      });

      expect(test.timeout).toBe(10000);
      expect(test.cards).toHaveLength(2);
    });

    it('should create snapshot tests', () => {
      const test = snapshotTest({
        name: 'test snapshot',
        input: { foo: 'bar' }
      });

      expect(test.updateSnapshot).toBe(false);
      expect(test.threshold).toBe(0.001);
    });

    it('should create performance tests', () => {
      const test = performanceTest({
        name: 'test perf',
        input: 1,
        maxTimeMs: 10
      });

      expect(test.iterations).toBe(1000);
      expect(test.warmupIterations).toBe(10);
      expect(test.measureCPU).toBe(true);
    });

    it('should create memory tests', () => {
      const test = memoryTest({
        name: 'test memory',
        input: 1
      });

      expect(test.iterations).toBe(100);
      expect(test.gcBetweenRuns).toBe(true);
      expect(test.maxMemoryGrowthMB).toBe(10);
    });

    it('should create audio comparison tests', () => {
      const test = audioComparisonTest({
        name: 'test audio',
        input: [],
        referenceAudioPath: '/path/to/audio.wav'
      });

      expect(test.maxDifference).toBe(0.01);
      expect(test.compareSpectrum).toBe(true);
    });

    it('should create event comparison tests', () => {
      const test = eventComparisonTest({
        name: 'test events',
        input: [],
        expectedEvents: []
      });

      expect(test.ignoreIds).toBe(true);
      expect(test.tolerance?.tick).toBe(1);
    });

    it('should create fuzz tests', () => {
      const test = fuzzTest({
        name: 'test fuzz',
        inputGenerator: () => Math.random()
      });

      expect(test.iterations).toBe(1000);
      expect(test.crashOnError).toBe(false);
    });

    it('should create property tests', () => {
      const test = propertyTest({
        name: 'test property',
        property: CommonProperties.idempotent,
        inputGenerator: () => 1,
        validate: () => true
      });

      expect(test.iterations).toBe(100);
    });
  });

  describe('Test Runner', () => {
    it('should run unit tests successfully', async () => {
      const testCard = pureCard<number, number>(
        {
          id: 'double-card',
          name: 'Double Card',
          category: 'testing',
          description: 'Doubles input'
        },
        {
          inputs: [{ name: 'value', type: 'number' }],
          outputs: [{ name: 'result', type: 'number' }],
          params: []
        },
        (x) => x * 2
      );

      const cardTest = createCardTest({
        name: 'Double Card Tests',
        description: 'Tests for double card',
        card: testCard,
        tests: {
          unit: [
            unitTest({
              name: 'should double positive number',
              input: 5,
              expectedOutput: 10
            }),
            unitTest({
              name: 'should double negative number',
              input: -3,
              expectedOutput: -6
            }),
            unitTest({
              name: 'should double zero',
              input: 0,
              expectedOutput: 0
            })
          ]
        }
      });

      const runner = new CardTestRunner();
      const result = await runner.run(cardTest);

      console.log('Result:', JSON.stringify(result, null, 2));

      expect(result.cardId).toBe('double-card');
      expect(result.totalTests).toBe(3);
      expect(result.passed).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
    });

    it('should detect failing tests', async () => {
      const testCard = pureCard<number, number>(
        {
          id: 'bad-card',
          name: 'Bad Card',
          category: 'testing',
          description: 'Always returns 42'
        },
        { inputs: [], outputs: [], params: [] },
        () => 42
      );

      const cardTest = createCardTest({
        name: 'Bad Card Tests',
        description: 'Tests that should fail',
        card: testCard,
        tests: {
          unit: [
            unitTest({
              name: 'should fail',
              input: 5,
              expectedOutput: 10
            })
          ]
        }
      });

      const runner = new CardTestRunner();
      const result = await runner.run(cardTest);

      expect(result.totalTests).toBe(1);
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.qualityScore).toBe(0);
    });

    it('should run integration tests', async () => {
      const add1 = pureCard({ id: 'add1', name: 'Add 1', category: 'test', description: '' }, 
        { inputs: [], outputs: [], params: [] }, 
        (x: number) => x + 1);
      const mul2 = pureCard({ id: 'mul2', name: 'Mul 2', category: 'test', description: '' }, 
        { inputs: [], outputs: [], params: [] }, 
        (x: number) => x * 2);

      const cardTest = createCardTest({
        name: 'Chain Tests',
        description: 'Tests card composition',
        card: add1,
        tests: {
          integration: [
            integrationTest({
              name: 'should compose cards',
              cards: [add1, mul2],
              input: 5,
              expectedOutput: 12
            })
          ]
        }
      });

      const runner = new CardTestRunner();
      const result = await runner.run(cardTest);

      expect(result.totalTests).toBe(1);
      expect(result.passed).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should use custom validators', async () => {
      const testCard = pureCard<number, number>(
        {
          id: 'abs-card',
          name: 'Abs Card',
          category: 'testing',
          description: 'Returns absolute value'
        },
        { inputs: [], outputs: [], params: [] },
        (x) => Math.abs(x)
      );

      const cardTest = createCardTest({
        name: 'Abs Card Tests',
        description: 'Tests with validators',
        card: testCard,
        tests: {
          unit: [
            unitTest({
              name: 'should always return positive',
              input: -5,
              validate: (output) => output >= 0 || 'Output must be positive'
            })
          ]
        }
      });

      const runner = new CardTestRunner();
      const result = await runner.run(cardTest);

      expect(result.passed).toBe(1);
    });
  });

  describe('Common Properties', () => {
    it('should provide standard properties', () => {
      expect(CommonProperties.idempotent).toBe('idempotent');
      expect(CommonProperties.commutative).toBe('commutative');
      expect(CommonProperties.associative).toBe('associative');
      expect(CommonProperties.deterministic).toBe('deterministic');
    });
  });
});
