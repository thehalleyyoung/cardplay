/**
 * Unit Test Runner & Integration Test Framework
 * Phase 6.6: Card Testing & Quality (Items 1963, 1964)
 */

import type {
  CardTest,
  TestResult,
  TestSuiteResult,
  TestRunnerOptions,
  UnitTest,
  IntegrationTest
} from './card-test';
import type { Card, CardContext } from '../card';
import { cardCompose } from '../card';

/**
 * Unit test runner - executes individual card unit tests
 */
export class UnitTestRunner<A, B> {
  private results: TestResult[] = [];

  async runTest(test: UnitTest<A, B>, card: Card<A, B>): Promise<TestResult> {
    const startTime = performance.now();
    const testId = `unit-${Date.now()}-${Math.random()}`;
    
    try {
      if (test.skip) {
        return {
          testId,
          testName: test.name,
          testType: 'unit',
          passed: true,
          duration: 0
        };
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), test.timeout || 5000);
      });

      const testPromise = (async () => {
        try {
          const context: CardContext = {
            currentTick: 0 as any,
            currentSample: 0,
            transport: { 
              playing: false, 
              recording: false,
              tempo: 120, 
              timeSignature: [4, 4] as const,
              looping: false 
            },
            engine: {} as any,
            elapsedMs: 0
          };
          const result = await card.process(test.input, context);
          const output = result.output;

          if (test.expectedError) {
            throw new Error(`Expected error but got output: ${JSON.stringify(output)}`);
          }

          if (test.expectedOutput !== undefined) {
            const outputStr = JSON.stringify(output);
            const expectedStr = JSON.stringify(test.expectedOutput);
            if (outputStr !== expectedStr) {
              throw new Error(`Output mismatch:\nExpected: ${expectedStr}\nActual: ${outputStr}`);
            }
          }

          if (test.validate) {
            const result = test.validate(output, test.input);
            if (result !== true) {
              throw new Error(typeof result === 'string' ? result : 'Validation failed');
            }
          }

          return output;
        } catch (error) {
          if (test.expectedError && error instanceof Error) {
            if (!error.message.includes(test.expectedError)) {
              throw new Error(
                `Error message mismatch:\nExpected: ${test.expectedError}\nActual: ${error.message}`
              );
            }
            return null;
          }
          throw error;
        }
      })();

      const output = await Promise.race([testPromise, timeoutPromise]);
      const duration = performance.now() - startTime;

      return {
        testId,
        testName: test.name,
        testType: 'unit',
        passed: true,
        duration,
        output
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testId,
        testName: test.name,
        testType: 'unit',
        passed: false,
        duration,
        error: error as Error
      };
    }
  }

  async runAll(tests: UnitTest<A, B>[], card: Card<A, B>): Promise<TestResult[]> {
    this.results = [];
    for (const test of tests) {
      if (test.only) {
        const result = await this.runTest(test, card);
        this.results.push(result);
        break;
      }
    }
    if (this.results.length === 0) {
      for (const test of tests) {
        const result = await this.runTest(test, card);
        this.results.push(result);
      }
    }
    return this.results;
  }
}

/**
 * Integration test framework - tests card chains and graphs
 */
export class IntegrationTestFramework {
  private results: TestResult[] = [];

  async runTest(test: IntegrationTest): Promise<TestResult> {
    const startTime = performance.now();
    const testId = `integration-${Date.now()}-${Math.random()}`;
    
    try {
      if (test.skip) {
        return {
          testId,
          testName: test.name,
          testType: 'integration',
          passed: true,
          duration: 0
        };
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), test.timeout || 10000);
      });

      const testPromise = (async () => {
        if (test.cards.length === 0) {
          throw new Error('No cards in integration test');
        }

        let composed: Card<any, any> = test.cards[0]!;
        for (let i = 1; i < test.cards.length; i++) {
          composed = cardCompose(composed, test.cards[i]!);
        }

        const context: CardContext = {
          currentTick: 0 as any,
          currentSample: 0,
          transport: { 
            playing: false, 
            recording: false,
            tempo: 120, 
            timeSignature: [4, 4] as const,
            looping: false 
          },
          engine: {} as any,
          elapsedMs: 0
        };
        const result = await composed.process(test.input, context);
        const output = result.output;

        if (test.expectedOutput !== undefined) {
          const outputStr = JSON.stringify(output);
          const expectedStr = JSON.stringify(test.expectedOutput);
          if (outputStr !== expectedStr) {
            throw new Error(`Output mismatch:\nExpected: ${expectedStr}\nActual: ${outputStr}`);
          }
        }

        if (test.validate) {
          const result = test.validate(output, test.input);
          if (result !== true) {
            throw new Error(typeof result === 'string' ? result : 'Validation failed');
          }
        }

        return output;
      })();

      const output = await Promise.race([testPromise, timeoutPromise]);
      const duration = performance.now() - startTime;

      return {
        testId,
        testName: test.name,
        testType: 'integration',
        passed: true,
        duration,
        output
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testId,
        testName: test.name,
        testType: 'integration',
        passed: false,
        duration,
        error: error as Error
      };
    }
  }

  async runAll(tests: IntegrationTest[]): Promise<TestResult[]> {
    this.results = [];
    for (const test of tests) {
      const result = await this.runTest(test);
      this.results.push(result);
    }
    return this.results;
  }
}

/**
 * Main test runner - coordinates all test types
 */
export class CardTestRunner {
  async run<A, B>(cardTest: CardTest<A, B>, options: TestRunnerOptions = {}): Promise<TestSuiteResult> {
    const startTime = performance.now();
    const allResults: TestResult[] = [];

    if (cardTest.setup) {
      await cardTest.setup();
    }

    try {
      if (cardTest.tests.unit) {
        const unitRunner = new UnitTestRunner<A, B>();
        const unitResults = await unitRunner.runAll(cardTest.tests.unit, cardTest.card);
        allResults.push(...unitResults);
        if (options.bail && unitResults.some(r => !r.passed)) {
          throw new Error('Test failed, bailing');
        }
      }

      if (cardTest.tests.integration) {
        const integrationRunner = new IntegrationTestFramework();
        const integrationResults = await integrationRunner.runAll(cardTest.tests.integration);
        allResults.push(...integrationResults);
        if (options.bail && integrationResults.some(r => !r.passed)) {
          throw new Error('Test failed, bailing');
        }
      }

      const duration = performance.now() - startTime;
      const passed = allResults.filter(r => r.passed).length;
      const failed = allResults.filter(r => !r.passed).length;

      return {
        cardId: cardTest.card.meta.id,
        cardName: cardTest.card.meta.name,
        totalTests: allResults.length,
        passed,
        failed,
        skipped: 0,
        duration,
        results: allResults,
        qualityScore: allResults.length > 0 ? (passed / allResults.length) * 100 : 0
      };
    } finally {
      if (cardTest.teardown) {
        await cardTest.teardown();
      }
    }
  }

  async runMultiple(cardTests: CardTest<any, any>[], options: TestRunnerOptions = {}): Promise<TestSuiteResult[]> {
    const results: TestSuiteResult[] = [];
    
    if (options.parallel && options.maxWorkers && options.maxWorkers > 1) {
      const chunks: CardTest<any, any>[][] = [];
      const chunkSize = Math.ceil(cardTests.length / options.maxWorkers);
      
      for (let i = 0; i < cardTests.length; i += chunkSize) {
        chunks.push(cardTests.slice(i, i + chunkSize));
      }

      const chunkResults = await Promise.all(
        chunks.map(chunk => Promise.all(chunk.map(test => this.run(test, options))))
      );

      results.push(...chunkResults.flat());
    } else {
      for (const test of cardTests) {
        const result = await this.run(test, options);
        results.push(result);
      }
    }

    return results;
  }
}

export function createTestRunner(): CardTestRunner {
  return new CardTestRunner();
}
