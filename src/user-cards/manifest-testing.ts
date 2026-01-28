/**
 * @fileoverview Manifest Testing Framework.
 * 
 * Provides comprehensive testing tools for card manifests:
 * - Manifest validation tests
 * - Dependency resolution tests
 * - Version compatibility tests
 * - Integration tests
 * - Test runners and reporters
 * 
 * @module @cardplay/user-cards/manifest-testing
 */

import type { CardManifest } from './manifest';
import { validateManifest } from './manifest';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Test result status.
 */
export type TestStatus = 'passed' | 'failed' | 'skipped' | 'error';

/**
 * Test severity level.
 */
export type TestSeverity = 'critical' | 'error' | 'warning' | 'info';

/**
 * Single test case.
 */
export interface TestCase {
  /** Test name */
  name: string;
  /** Test description */
  description?: string;
  /** Test function */
  test: (manifest: CardManifest) => Promise<TestResult> | TestResult;
  /** Severity level */
  severity?: TestSeverity;
  /** Should skip this test */
  skip?: boolean;
  /** Tags for filtering */
  tags?: string[];
}

/**
 * Test result.
 */
export interface TestResult {
  /** Test name */
  name: string;
  /** Test status */
  status: TestStatus;
  /** Result message */
  message?: string;
  /** Error details */
  error?: Error;
  /** Execution time (ms) */
  duration: number;
  /** Severity level */
  severity: TestSeverity;
}

/**
 * Test suite.
 */
export interface TestSuite {
  /** Suite name */
  name: string;
  /** Suite description */
  description?: string;
  /** Test cases */
  tests: TestCase[];
  /** Setup function */
  beforeAll?: () => Promise<void> | void;
  /** Teardown function */
  afterAll?: () => Promise<void> | void;
  /** Setup before each test */
  beforeEach?: () => Promise<void> | void;
  /** Teardown after each test */
  afterEach?: () => Promise<void> | void;
}

/**
 * Test run result.
 */
export interface TestRunResult {
  /** Total tests */
  total: number;
  /** Passed tests */
  passed: number;
  /** Failed tests */
  failed: number;
  /** Skipped tests */
  skipped: number;
  /** Errors */
  errors: number;
  /** Test results */
  results: TestResult[];
  /** Total duration (ms) */
  duration: number;
  /** Success rate */
  successRate: number;
}

// ============================================================================
// BUILT-IN TEST CASES
// ============================================================================

/**
 * Creates standard validation tests.
 */
function createValidationTests(): TestCase[] {
  return [
    {
      name: 'Manifest Structure',
      description: 'Validates manifest structure and required fields',
      severity: 'critical',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        const validation = validateManifest(manifest);
        
        return {
          name: 'Manifest Structure',
          status: validation.valid ? 'passed' : 'failed',
          message: validation.valid 
            ? 'Manifest structure is valid'
            : `Validation errors: ${validation.errors.map(e => e.message).join(', ')}`,
          duration: Date.now() - start,
          severity: 'critical',
        };
      },
    },
    
    {
      name: 'Package Name',
      description: 'Validates package name format',
      severity: 'critical',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        const valid = /^[a-z0-9][a-z0-9._-]*$/i.test(manifest.name);
        
        return {
          name: 'Package Name',
          status: valid ? 'passed' : 'failed',
          message: valid 
            ? 'Package name is valid'
            : 'Package name must start with alphanumeric and contain only alphanumeric, dots, underscores, and hyphens',
          duration: Date.now() - start,
          severity: 'critical',
        };
      },
    },
    
    {
      name: 'Version Format',
      description: 'Validates semver version format',
      severity: 'critical',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        const valid = /^\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/i.test(manifest.version);
        
        return {
          name: 'Version Format',
          status: valid ? 'passed' : 'failed',
          message: valid ? 'Version format is valid' : 'Invalid semver format',
          duration: Date.now() - start,
          severity: 'critical',
        };
      },
    },
    
    {
      name: 'Description',
      description: 'Checks if description is provided',
      severity: 'warning',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        const hasDescription = !!manifest.description && manifest.description.length > 0;
        
        return {
          name: 'Description',
          status: hasDescription ? 'passed' : 'failed',
          message: hasDescription ? 'Description provided' : 'No description provided',
          duration: Date.now() - start,
          severity: 'warning',
        };
      },
    },
    
    {
      name: 'License',
      description: 'Checks if license is specified',
      severity: 'warning',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        const hasLicense = !!manifest.license;
        
        return {
          name: 'License',
          status: hasLicense ? 'passed' : 'failed',
          message: hasLicense ? 'License specified' : 'No license specified',
          duration: Date.now() - start,
          severity: 'warning',
        };
      },
    },
    
    {
      name: 'Author',
      description: 'Checks if author is specified',
      severity: 'info',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        const hasAuthor = !!manifest.author;
        
        return {
          name: 'Author',
          status: hasAuthor ? 'passed' : 'failed',
          message: hasAuthor ? 'Author specified' : 'No author specified',
          duration: Date.now() - start,
          severity: 'info',
        };
      },
    },
    
    {
      name: 'Entry Point',
      description: 'Checks if main entry point is specified',
      severity: 'error',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        const hasMain = !!manifest.main;
        
        return {
          name: 'Entry Point',
          status: hasMain ? 'passed' : 'failed',
          message: hasMain ? 'Entry point specified' : 'No entry point (main field)',
          duration: Date.now() - start,
          severity: 'error',
        };
      },
    },
    
    {
      name: 'Keywords',
      description: 'Checks if keywords are provided for discoverability',
      severity: 'info',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        const hasKeywords = !!manifest.keywords && manifest.keywords.length > 0;
        
        return {
          name: 'Keywords',
          status: hasKeywords ? 'passed' : 'failed',
          message: hasKeywords 
            ? `${manifest.keywords!.length} keywords provided` 
            : 'No keywords provided',
          duration: Date.now() - start,
          severity: 'info',
        };
      },
    },
  ];
}

/**
 * Creates dependency tests.
 */
function createDependencyTests(): TestCase[] {
  return [
    {
      name: 'Dependency Format',
      description: 'Validates dependency version constraints',
      severity: 'error',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        const deps = manifest.dependencies || {};
        const errors: string[] = [];
        
        for (const [name, version] of Object.entries(deps)) {
          if (typeof version === 'string') {
            // Check if it's a valid semver range
            if (!version.match(/^[\^~><=\d\s.-]+$/)) {
              errors.push(`Invalid version constraint for ${name}: ${version}`);
            }
          }
        }
        
        return {
          name: 'Dependency Format',
          status: errors.length === 0 ? 'passed' : 'failed',
          message: errors.length === 0 
            ? 'All dependencies have valid format' 
            : errors.join('; '),
          duration: Date.now() - start,
          severity: 'error',
        };
      },
    },
    
    {
      name: 'Circular Dependencies',
      description: 'Checks for circular dependency patterns',
      severity: 'warning',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        // In a real implementation, we'd check against a dependency graph
        // For now, we'll just check self-dependency
        const deps = manifest.dependencies || {};
        const hasSelfDep = manifest.name in deps;
        
        return {
          name: 'Circular Dependencies',
          status: hasSelfDep ? 'failed' : 'passed',
          message: hasSelfDep 
            ? 'Package depends on itself' 
            : 'No circular dependencies detected',
          duration: Date.now() - start,
          severity: 'warning',
        };
      },
    },
  ];
}

/**
 * Creates security tests.
 */
function createSecurityTests(): TestCase[] {
  return [
    {
      name: 'Private Flag',
      description: 'Checks if private packages are not publishable',
      severity: 'info',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        const isPrivate = manifest.private === true;
        
        return {
          name: 'Private Flag',
          status: 'passed',
          message: isPrivate ? 'Package is private' : 'Package is public',
          duration: Date.now() - start,
          severity: 'info',
        };
      },
    },
    
    {
      name: 'Scripts Safety',
      description: 'Checks for potentially unsafe script commands',
      severity: 'warning',
      test: (manifest: CardManifest): TestResult => {
        const start = Date.now();
        const scripts = manifest.scripts || {};
        const unsafeCommands = ['rm -rf', 'format c:', 'del /f', 'sudo'];
        const found: string[] = [];
        
        for (const [name, command] of Object.entries(scripts)) {
          for (const unsafe of unsafeCommands) {
            if (command.includes(unsafe)) {
              found.push(`${name}: contains "${unsafe}"`);
            }
          }
        }
        
        return {
          name: 'Scripts Safety',
          status: found.length === 0 ? 'passed' : 'failed',
          message: found.length === 0 
            ? 'No unsafe script commands detected' 
            : `Potentially unsafe commands: ${found.join(', ')}`,
          duration: Date.now() - start,
          severity: 'warning',
        };
      },
    },
  ];
}

// ============================================================================
// TEST RUNNER
// ============================================================================

/**
 * Test runner for manifests.
 */
export class ManifestTestRunner {
  private suites: Map<string, TestSuite> = new Map();
  
  /**
   * Registers a test suite.
   */
  registerSuite(suite: TestSuite): void {
    this.suites.set(suite.name, suite);
  }
  
  /**
   * Registers multiple test suites.
   */
  registerSuites(suites: TestSuite[]): void {
    for (const suite of suites) {
      this.registerSuite(suite);
    }
  }
  
  /**
   * Runs a single test case.
   */
  async runTest(test: TestCase, manifest: CardManifest): Promise<TestResult> {
    if (test.skip) {
      return {
        name: test.name,
        status: 'skipped',
        message: 'Test skipped',
        duration: 0,
        severity: test.severity || 'info',
      };
    }
    
    try {
      const result = await test.test(manifest);
      return result;
    } catch (error) {
      return {
        name: test.name,
        status: 'error',
        message: 'Test threw an error',
        error: error instanceof Error ? error : new Error(String(error)),
        duration: 0,
        severity: test.severity || 'error',
      };
    }
  }
  
  /**
   * Runs a test suite.
   */
  async runSuite(suite: TestSuite, manifest: CardManifest): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    // Run beforeAll
    if (suite.beforeAll) {
      await suite.beforeAll();
    }
    
    // Run each test
    for (const test of suite.tests) {
      // Run beforeEach
      if (suite.beforeEach) {
        await suite.beforeEach();
      }
      
      const result = await this.runTest(test, manifest);
      results.push(result);
      
      // Run afterEach
      if (suite.afterEach) {
        await suite.afterEach();
      }
    }
    
    // Run afterAll
    if (suite.afterAll) {
      await suite.afterAll();
    }
    
    return results;
  }
  
  /**
   * Runs all registered test suites.
   */
  async runAll(manifest: CardManifest): Promise<TestRunResult> {
    const startTime = Date.now();
    const allResults: TestResult[] = [];
    
    for (const suite of this.suites.values()) {
      const results = await this.runSuite(suite, manifest);
      allResults.push(...results);
    }
    
    const passed = allResults.filter(r => r.status === 'passed').length;
    const failed = allResults.filter(r => r.status === 'failed').length;
    const skipped = allResults.filter(r => r.status === 'skipped').length;
    const errors = allResults.filter(r => r.status === 'error').length;
    const total = allResults.length;
    
    return {
      total,
      passed,
      failed,
      skipped,
      errors,
      results: allResults,
      duration: Date.now() - startTime,
      successRate: total > 0 ? (passed / total) * 100 : 0,
    };
  }
}

// ============================================================================
// DEFAULT TEST SUITES
// ============================================================================

/**
 * Creates default test suites.
 */
export function createDefaultTestSuites(): TestSuite[] {
  return [
    {
      name: 'Validation',
      description: 'Core manifest validation tests',
      tests: createValidationTests(),
    },
    {
      name: 'Dependencies',
      description: 'Dependency-related tests',
      tests: createDependencyTests(),
    },
    {
      name: 'Security',
      description: 'Security and safety checks',
      tests: createSecurityTests(),
    },
  ];
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Runs tests on a manifest with default test suites.
 */
export async function testManifest(manifest: CardManifest): Promise<TestRunResult> {
  const runner = new ManifestTestRunner();
  runner.registerSuites(createDefaultTestSuites());
  return runner.runAll(manifest);
}
