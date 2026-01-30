/**
 * @file Evaluation Harness
 * @gofai_goalB Step 047 [Eval]
 * 
 * This module defines an evaluation harness that can replay conversations against
 * fixed fixtures and assert deterministic outputs. The harness supports:
 * 
 * - Multi-turn dialogue replay
 * - Deterministic output verification
 * - Golden test creation and validation
 * - Paraphrase invariance testing
 * - Constraint correctness testing
 * - Performance benchmarking
 * 
 * **Purpose:**
 * - Regression testing (ensure changes don't break existing behavior)
 * - Quality assurance (validate new features)
 * - Performance tracking (prevent slowdowns)
 * - Reproducible debugging (replay failures)
 * - Golden test suite maintenance
 * 
 * **Design principle:** Tests must be deterministic and reproducible.
 * If a test fails, it should fail consistently.
 */

import type { CPLIntent, CPLPlan } from '../canon/cpl-public-interface';
import type { SongFixture } from '../testing/song-fixture-format';
import type { CompilerEnvironment } from '../infra/compiler-determinism';

/**
 * =============================================================================
 * TEST CASE TYPES
 * =============================================================================
 */

/**
 * Single-turn test case (utterance → CPL).
 */
export interface SingleTurnTestCase {
  /** Test case ID */
  readonly id: string;
  /** Test description */
  readonly description: string;
  /** Input utterance */
  readonly utterance: string;
  /** Song fixture (context) */
  readonly fixture: SongFixture;
  /** Expected CPL output */
  readonly expectedCPL: CPLIntent;
  /** Timeout (milliseconds) */
  readonly timeoutMs?: number;
}

/**
 * Multi-turn test case (dialogue → CPL sequence).
 */
export interface MultiTurnTestCase {
  /** Test case ID */
  readonly id: string;
  /** Test description */
  readonly description: string;
  /** Initial fixture */
  readonly initialFixture: SongFixture;
  /** Sequence of turns */
  readonly turns: readonly DialogueTurn[];
  /** Timeout per turn (milliseconds) */
  readonly timeoutMs?: number;
}

/**
 * Single turn in a multi-turn dialogue.
 */
export interface DialogueTurn {
  /** Utterance */
  readonly utterance: string;
  /** Expected CPL */
  readonly expectedCPL: CPLIntent;
  /** Whether to apply this turn (mutates fixture) */
  readonly apply?: boolean;
}

/**
 * Paraphrase invariance test (multiple utterances → same CPL).
 */
export interface ParaphraseTestCase {
  /** Test case ID */
  readonly id: string;
  /** Test description */
  readonly description: string;
  /** Song fixture (context) */
  readonly fixture: SongFixture;
  /** Paraphrases (should produce equivalent CPL) */
  readonly paraphrases: readonly string[];
  /** Expected CPL (canonical) */
  readonly expectedCPL: CPLIntent;
}

/**
 * Constraint correctness test (plan must satisfy constraints).
 */
export interface ConstraintTestCase {
  /** Test case ID */
  readonly id: string;
  /** Test description */
  readonly description: string;
  /** Song fixture (before state) */
  readonly fixture: SongFixture;
  /** CPL intent with constraints */
  readonly intent: CPLIntent;
  /** Expected plan (optional, for golden testing) */
  readonly expectedPlan?: CPLPlan;
  /** Constraint validation rules */
  readonly validations: readonly ConstraintValidation[];
}

/**
 * Constraint validation rule.
 */
export interface ConstraintValidation {
  /** Validation description */
  readonly description: string;
  /** Validation function */
  readonly validate: (before: SongFixture, after: SongFixture) => boolean;
}

/**
 * Performance benchmark test.
 */
export interface PerformanceBenchmark {
  /** Benchmark ID */
  readonly id: string;
  /** Benchmark description */
  readonly description: string;
  /** Utterance to benchmark */
  readonly utterance: string;
  /** Song fixture */
  readonly fixture: SongFixture;
  /** Expected max time (milliseconds) */
  readonly maxTimeMs: number;
  /** Number of iterations (for averaging) */
  readonly iterations?: number;
}

/**
 * =============================================================================
 * TEST RESULT TYPES
 * =============================================================================
 */

/**
 * Result of a single test case.
 */
export interface TestResult {
  /** Test case ID */
  readonly testId: string;
  /** Whether test passed */
  readonly passed: boolean;
  /** Failure reason (if failed) */
  readonly failureReason?: string;
  /** Actual output (for comparison) */
  readonly actualOutput?: unknown;
  /** Expected output (for comparison) */
  readonly expectedOutput?: unknown;
  /** Execution time (milliseconds) */
  readonly executionTimeMs: number;
}

/**
 * Result of a test suite run.
 */
export interface TestSuiteResult {
  /** Suite name */
  readonly suiteName: string;
  /** Total tests */
  readonly totalTests: number;
  /** Passed tests */
  readonly passedTests: number;
  /** Failed tests */
  readonly failedTests: number;
  /** Individual test results */
  readonly results: readonly TestResult[];
  /** Total execution time (milliseconds) */
  readonly totalTimeMs: number;
}

/**
 * =============================================================================
 * COMPILER INTERFACE (FOR TESTING)
 * =============================================================================
 */

/**
 * Compiler interface for evaluation harness.
 * 
 * This is the contract that the evaluation harness expects from the compiler.
 * Real compiler implementation should conform to this interface.
 */
export interface CompilerInterface {
  /**
   * Compile an utterance to CPL-Intent.
   */
  compileToIntent(utterance: string, fixture: SongFixture): Promise<CPLIntent>;

  /**
   * Generate a plan from CPL-Intent.
   */
  generatePlan(intent: CPLIntent, fixture: SongFixture): Promise<CPLPlan>;

  /**
   * Apply a plan to a fixture (returns modified fixture).
   */
  applyPlan(plan: CPLPlan, fixture: SongFixture): Promise<SongFixture>;

  /**
   * Get compiler environment fingerprint.
   */
  getEnvironment(): CompilerEnvironment;
}

/**
 * =============================================================================
 * EVALUATION HARNESS
 * =============================================================================
 */

/**
 * Evaluation harness configuration.
 */
export interface HarnessConfig {
  /** Whether to print verbose output */
  readonly verbose: boolean;
  /** Whether to stop on first failure */
  readonly stopOnFailure: boolean;
  /** Default timeout (milliseconds) */
  readonly defaultTimeoutMs: number;
  /** Whether to save failures for debugging */
  readonly saveFailures: boolean;
}

/**
 * Default harness configuration.
 */
export const DEFAULT_HARNESS_CONFIG: HarnessConfig = {
  verbose: false,
  stopOnFailure: false,
  defaultTimeoutMs: 5000,
  saveFailures: true,
};

/**
 * Evaluation harness for GOFAI compiler.
 */
export class EvaluationHarness {
  constructor(
    private compiler: CompilerInterface,
    private config: HarnessConfig = DEFAULT_HARNESS_CONFIG
  ) {}

  /**
   * Run a single-turn test case.
   */
  public async runSingleTurn(testCase: SingleTurnTestCase): Promise<TestResult> {
    const start = performance.now();

    try {
      const timeoutMs = testCase.timeoutMs ?? this.config.defaultTimeoutMs;
      const actualCPL = await this.withTimeout(
        this.compiler.compileToIntent(testCase.utterance, testCase.fixture),
        timeoutMs
      );

      const passed = this.compareCPL(testCase.expectedCPL, actualCPL);

      return {
        testId: testCase.id,
        passed,
        failureReason: passed ? undefined : 'CPL mismatch',
        actualOutput: actualCPL,
        expectedOutput: testCase.expectedCPL,
        executionTimeMs: performance.now() - start,
      };
    } catch (error) {
      return {
        testId: testCase.id,
        passed: false,
        failureReason: error instanceof Error ? error.message : String(error),
        executionTimeMs: performance.now() - start,
      };
    }
  }

  /**
   * Run a multi-turn test case.
   */
  public async runMultiTurn(testCase: MultiTurnTestCase): Promise<TestResult> {
    const start = performance.now();

    try {
      let currentFixture = testCase.initialFixture;

      for (let i = 0; i < testCase.turns.length; i++) {
        const turn = testCase.turns[i];
        const timeoutMs = testCase.timeoutMs ?? this.config.defaultTimeoutMs;

        // Compile utterance
        const actualCPL = await this.withTimeout(
          this.compiler.compileToIntent(turn.utterance, currentFixture),
          timeoutMs
        );

        // Compare CPL
        if (!this.compareCPL(turn.expectedCPL, actualCPL)) {
          return {
            testId: testCase.id,
            passed: false,
            failureReason: `Turn ${i + 1}: CPL mismatch`,
            actualOutput: actualCPL,
            expectedOutput: turn.expectedCPL,
            executionTimeMs: performance.now() - start,
          };
        }

        // Apply if requested
        if (turn.apply) {
          const plan = await this.compiler.generatePlan(actualCPL, currentFixture);
          currentFixture = await this.compiler.applyPlan(plan, currentFixture);
        }
      }

      return {
        testId: testCase.id,
        passed: true,
        executionTimeMs: performance.now() - start,
      };
    } catch (error) {
      return {
        testId: testCase.id,
        passed: false,
        failureReason: error instanceof Error ? error.message : String(error),
        executionTimeMs: performance.now() - start,
      };
    }
  }

  /**
   * Run a paraphrase invariance test.
   */
  public async runParaphrase(testCase: ParaphraseTestCase): Promise<TestResult> {
    const start = performance.now();

    try {
      const cpls: CPLIntent[] = [];

      for (const paraphrase of testCase.paraphrases) {
        const cpl = await this.compiler.compileToIntent(paraphrase, testCase.fixture);
        cpls.push(cpl);
      }

      // All CPLs should be equivalent to expected
      for (let i = 0; i < cpls.length; i++) {
        if (!this.compareCPL(testCase.expectedCPL, cpls[i])) {
          return {
            testId: testCase.id,
            passed: false,
            failureReason: `Paraphrase ${i + 1} ("${testCase.paraphrases[i]}") produced different CPL`,
            actualOutput: cpls[i],
            expectedOutput: testCase.expectedCPL,
            executionTimeMs: performance.now() - start,
          };
        }
      }

      // All CPLs should be equivalent to each other
      for (let i = 1; i < cpls.length; i++) {
        if (!this.compareCPL(cpls[0], cpls[i])) {
          return {
            testId: testCase.id,
            passed: false,
            failureReason: `Paraphrases 1 and ${i + 1} produced different CPLs`,
            actualOutput: cpls[i],
            expectedOutput: cpls[0],
            executionTimeMs: performance.now() - start,
          };
        }
      }

      return {
        testId: testCase.id,
        passed: true,
        executionTimeMs: performance.now() - start,
      };
    } catch (error) {
      return {
        testId: testCase.id,
        passed: false,
        failureReason: error instanceof Error ? error.message : String(error),
        executionTimeMs: performance.now() - start,
      };
    }
  }

  /**
   * Run a constraint correctness test.
   */
  public async runConstraint(testCase: ConstraintTestCase): Promise<TestResult> {
    const start = performance.now();

    try {
      // Generate plan
      const plan = await this.compiler.generatePlan(testCase.intent, testCase.fixture);

      // Check expected plan (if provided)
      if (testCase.expectedPlan && !this.comparePlan(testCase.expectedPlan, plan)) {
        return {
          testId: testCase.id,
          passed: false,
          failureReason: 'Generated plan does not match expected plan',
          actualOutput: plan,
          expectedOutput: testCase.expectedPlan,
          executionTimeMs: performance.now() - start,
        };
      }

      // Apply plan
      const afterFixture = await this.compiler.applyPlan(plan, testCase.fixture);

      // Validate constraints
      for (const validation of testCase.validations) {
        if (!validation.validate(testCase.fixture, afterFixture)) {
          return {
            testId: testCase.id,
            passed: false,
            failureReason: `Constraint validation failed: ${validation.description}`,
            executionTimeMs: performance.now() - start,
          };
        }
      }

      return {
        testId: testCase.id,
        passed: true,
        executionTimeMs: performance.now() - start,
      };
    } catch (error) {
      return {
        testId: testCase.id,
        passed: false,
        failureReason: error instanceof Error ? error.message : String(error),
        executionTimeMs: performance.now() - start,
      };
    }
  }

  /**
   * Run a performance benchmark.
   */
  public async runBenchmark(benchmark: PerformanceBenchmark): Promise<TestResult> {
    const iterations = benchmark.iterations ?? 10;
    const times: number[] = [];

    try {
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await this.compiler.compileToIntent(benchmark.utterance, benchmark.fixture);
        const time = performance.now() - start;
        times.push(time);
      }

      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const passed = avgTime <= benchmark.maxTimeMs;

      return {
        testId: benchmark.id,
        passed,
        failureReason: passed
          ? undefined
          : `Average time ${avgTime.toFixed(2)}ms exceeds max ${benchmark.maxTimeMs}ms`,
        actualOutput: { avgTimeMs: avgTime, times },
        expectedOutput: { maxTimeMs: benchmark.maxTimeMs },
        executionTimeMs: times.reduce((sum, t) => sum + t, 0),
      };
    } catch (error) {
      return {
        testId: benchmark.id,
        passed: false,
        failureReason: error instanceof Error ? error.message : String(error),
        executionTimeMs: times.reduce((sum, t) => sum + t, 0),
      };
    }
  }

  /**
   * Run a test suite.
   */
  public async runSuite(
    suiteName: string,
    tests: readonly (
      | SingleTurnTestCase
      | MultiTurnTestCase
      | ParaphraseTestCase
      | ConstraintTestCase
      | PerformanceBenchmark
    )[]
  ): Promise<TestSuiteResult> {
    const start = performance.now();
    const results: TestResult[] = [];

    for (const test of tests) {
      if (this.config.verbose) {
        console.log(`Running test: ${test.id}`);
      }

      let result: TestResult;

      if ('turns' in test) {
        result = await this.runMultiTurn(test);
      } else if ('paraphrases' in test) {
        result = await this.runParaphrase(test);
      } else if ('validations' in test) {
        result = await this.runConstraint(test);
      } else if ('maxTimeMs' in test) {
        result = await this.runBenchmark(test);
      } else {
        result = await this.runSingleTurn(test);
      }

      results.push(result);

      if (!result.passed && this.config.verbose) {
        console.error(`Test failed: ${test.id} - ${result.failureReason}`);
      }

      if (!result.passed && this.config.stopOnFailure) {
        break;
      }
    }

    const passedTests = results.filter((r) => r.passed).length;
    const failedTests = results.filter((r) => !r.passed).length;

    return {
      suiteName,
      totalTests: tests.length,
      passedTests,
      failedTests,
      results,
      totalTimeMs: performance.now() - start,
    };
  }

  /**
   * Compare two CPL-Intents for equality (ignoring timestamps/provenance).
   */
  private compareCPL(expected: CPLIntent, actual: CPLIntent): boolean {
    // Deep equality check (excluding provenance and timestamps)
    return this.deepEqual(
      this.stripMetadata(expected),
      this.stripMetadata(actual)
    );
  }

  /**
   * Compare two CPL-Plans for equality (ignoring timestamps/provenance).
   */
  private comparePlan(expected: CPLPlan, actual: CPLPlan): boolean {
    return this.deepEqual(
      this.stripMetadata(expected),
      this.stripMetadata(actual)
    );
  }

  /**
   * Strip metadata (provenance, timestamps) for comparison.
   */
  private stripMetadata(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.stripMetadata(item));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'provenance' || key === 'timestamp' || key === 'id') {
        continue;
      }
      result[key] = this.stripMetadata(value);
    }
    return result;
  }

  /**
   * Deep equality check.
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a === undefined || b === undefined) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a !== 'object') return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const aKeys = Object.keys(a as object).sort();
    const bKeys = Object.keys(b as object).sort();

    if (aKeys.length !== bKeys.length) return false;

    for (let i = 0; i < aKeys.length; i++) {
      if (aKeys[i] !== bKeys[i]) return false;
      const aVal = (a as Record<string, unknown>)[aKeys[i]];
      const bVal = (b as Record<string, unknown>)[bKeys[i]];
      if (!this.deepEqual(aVal, bVal)) return false;
    }

    return true;
  }

  /**
   * Run a promise with timeout.
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }
}

/**
 * =============================================================================
 * TEST SUITE BUILDERS
 * =============================================================================
 */

/**
 * Builder for creating test suites.
 */
export class TestSuiteBuilder {
  private tests: (
    | SingleTurnTestCase
    | MultiTurnTestCase
    | ParaphraseTestCase
    | ConstraintTestCase
    | PerformanceBenchmark
  )[] = [];

  constructor(private suiteName: string) {}

  /**
   * Add a single-turn test.
   */
  public addSingleTurn(testCase: SingleTurnTestCase): this {
    this.tests.push(testCase);
    return this;
  }

  /**
   * Add a multi-turn test.
   */
  public addMultiTurn(testCase: MultiTurnTestCase): this {
    this.tests.push(testCase);
    return this;
  }

  /**
   * Add a paraphrase test.
   */
  public addParaphrase(testCase: ParaphraseTestCase): this {
    this.tests.push(testCase);
    return this;
  }

  /**
   * Add a constraint test.
   */
  public addConstraint(testCase: ConstraintTestCase): this {
    this.tests.push(testCase);
    return this;
  }

  /**
   * Add a benchmark.
   */
  public addBenchmark(benchmark: PerformanceBenchmark): this {
    this.tests.push(benchmark);
    return this;
  }

  /**
   * Build the test suite.
   */
  public build(): {
    suiteName: string;
    tests: readonly (
      | SingleTurnTestCase
      | MultiTurnTestCase
      | ParaphraseTestCase
      | ConstraintTestCase
      | PerformanceBenchmark
    )[];
  } {
    return {
      suiteName: this.suiteName,
      tests: [...this.tests],
    };
  }
}

/**
 * =============================================================================
 * SUMMARY
 * =============================================================================
 * 
 * This module defines a comprehensive evaluation harness for GOFAI:
 * 
 * **Test types:**
 * - Single-turn (utterance → CPL)
 * - Multi-turn (dialogue with state)
 * - Paraphrase invariance (multiple utterances → same CPL)
 * - Constraint correctness (plan satisfies constraints)
 * - Performance benchmarks (timing)
 * 
 * **Features:**
 * - Deterministic replay
 * - Golden test support
 * - Timeout handling
 * - Detailed failure reporting
 * - Performance tracking
 * - Test suite composition
 * 
 * **Usage:**
 * 1. Create test cases (single/multi-turn/paraphrase/constraint/benchmark)
 * 2. Build test suite with TestSuiteBuilder
 * 3. Create EvaluationHarness with compiler
 * 4. Run suite and inspect results
 * 
 * **Benefits:**
 * - Regression testing (catch breaks)
 * - Quality assurance (validate features)
 * - Performance monitoring (prevent slowdowns)
 * - Reproducible debugging (replay failures)
 * - CI/CD integration (automated testing)
 * 
 * **Cross-references:**
 * - Step 027: Song fixture format (test fixtures)
 * - Step 033: Compiler determinism (replay guarantees)
 * - Step 046: Telemetry plan (event capture)
 * - Step 286: Planning golden suite (test corpus)
 * - Step 336: Execution golden tests (validation)
 * - Step 465: Replay determinism CI test (CI integration)
 */
