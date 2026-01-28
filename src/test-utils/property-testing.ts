/**
 * Property-Based Testing Utilities for Cardplay
 * 
 * Implements property-based testing inspired by QuickCheck/fast-check.
 * Tests universal properties that should hold for all valid inputs.
 */

import type { FuzzGenerator } from './fuzz-testing';
import { createSeededRNG, generators } from './fuzz-testing';

export type Property<T> = (input: T) => boolean | void;

export type PropertyTestOptions = {
  numRuns?: number;
  seed?: number;
  verbose?: boolean;
  timeout?: number;
};

export type PropertyTestResult = {
  success: boolean;
  numTests: number;
  counterexample?: any;
  seed?: number;
  error?: Error;
};

/**
 * Tests a property with generated inputs.
 */
export function property<T>(
  generator: FuzzGenerator<T>,
  prop: Property<T>,
  options: PropertyTestOptions = {}
): PropertyTestResult {
  const numRuns = options.numRuns ?? 100;
  const baseSeed = options.seed ?? Date.now();
  const verbose = options.verbose ?? false;
  const timeout = options.timeout ?? 5000;
  const startTime = Date.now();
  
  for (let i = 0; i < numRuns; i++) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Property test timeout after ${i} runs`);
    }
    
    const seed = baseSeed + i;
    const rng = createSeededRNG(seed);
    const input = generator(rng);
    
    if (verbose) {
      console.log(`Test ${i + 1}/${numRuns}:`, input);
    }
    
    try {
      const result = prop(input);
      if (result === false) {
        return {
          success: false,
          numTests: i + 1,
          counterexample: input,
          seed
        };
      }
    } catch (error) {
      return {
        success: false,
        numTests: i + 1,
        counterexample: input,
        seed,
        error: error as Error
      };
    }
  }
  
  return {
    success: true,
    numTests: numRuns
  };
}

/**
 * Common properties for testing.
 */
export const properties = {
  /**
   * Identity: f(x) = x
   */
  identity: <T>(f: (x: T) => T) => (x: T): boolean => {
    const result = f(x);
    return JSON.stringify(result) === JSON.stringify(x);
  },
  
  /**
   * Idempotence: f(f(x)) = f(x)
   */
  idempotent: <T>(f: (x: T) => T) => (x: T): boolean => {
    const once = f(x);
    const twice = f(once);
    return JSON.stringify(once) === JSON.stringify(twice);
  },
  
  /**
   * Commutativity: f(x, y) = f(y, x)
   */
  commutative: <T, R>(f: (a: T, b: T) => R) => ([a, b]: [T, T]): boolean => {
    const result1 = f(a, b);
    const result2 = f(b, a);
    return JSON.stringify(result1) === JSON.stringify(result2);
  },
  
  /**
   * Associativity: f(f(x, y), z) = f(x, f(y, z))
   */
  associative: <T>(f: (a: T, b: T) => T) => ([a, b, c]: [T, T, T]): boolean => {
    const left = f(f(a, b), c);
    const right = f(a, f(b, c));
    return JSON.stringify(left) === JSON.stringify(right);
  },
  
  /**
   * Inverse: g(f(x)) = x
   */
  inverse: <T, U>(f: (x: T) => U, g: (y: U) => T) => (x: T): boolean => {
    const result = g(f(x));
    return JSON.stringify(result) === JSON.stringify(x);
  },
  
  /**
   * Monotonicity: x <= y => f(x) <= f(y)
   */
  monotonic: (f: (x: number) => number) => ([x, y]: [number, number]): boolean => {
    if (x > y) [x, y] = [y, x];
    return f(x) <= f(y);
  },
  
  /**
   * Non-negativity: f(x) >= 0
   */
  nonNegative: (f: (x: any) => number) => (x: any): boolean => {
    return f(x) >= 0;
  },
  
  /**
   * Bounds: min <= f(x) <= max
   */
  bounded: (f: (x: any) => number, min: number, max: number) => (x: any): boolean => {
    const result = f(x);
    return result >= min && result <= max;
  },
  
  /**
   * Preservation: predicate(x) => predicate(f(x))
   */
  preserves: <T>(predicate: (x: T) => boolean, f: (x: T) => T) => (x: T): boolean => {
    if (!predicate(x)) return true;
    return predicate(f(x));
  }
};

/**
 * Arbitrary generators for common types (QuickCheck-style).
 */
export const arbitrary = {
  int: (min = -1000, max = 1000) => generators.int(min, max),
  nat: (max = 1000) => generators.int(0, max),
  float: (min = -1000, max = 1000) => generators.float(min, max),
  boolean: generators.boolean,
  string: (maxLength = 20) => generators.string(0, maxLength),
  array: <T>(gen: FuzzGenerator<T>, maxLength = 20) => generators.array(gen, 0, maxLength),
  
  /**
   * Generate valid ticks (non-negative integers).
   */
  tick: () => generators.int(0, 100000),
  
  /**
   * Generate valid durations (positive integers).
   */
  duration: () => generators.int(1, 10000),
  
  /**
   * Generate valid MIDI note numbers.
   */
  midiNote: () => generators.int(0, 127),
  
  /**
   * Generate valid velocity values.
   */
  velocity: () => generators.int(1, 127),
  
  /**
   * Generate valid normalized values (0-1).
   */
  normalized: () => generators.float(0, 1),
  
  /**
   * Generate valid frequency values (Hz).
   */
  frequency: () => generators.float(20, 20000),
  
  /**
   * Generate valid tempo values (BPM).
   */
  tempo: () => generators.float(20, 300)
};

/**
 * Helper to test a property with a simple assertion.
 */
export function expectProperty<T>(
  generator: FuzzGenerator<T>,
  assertion: (input: T) => void,
  options?: PropertyTestOptions
): void {
  const result = property(generator, (input) => {
    try {
      assertion(input);
      return true;
    } catch {
      return false;
    }
  }, options);
  
  if (!result.success) {
    const message = result.error
      ? `Property failed: ${result.error.message}\nCounterexample: ${JSON.stringify(result.counterexample, null, 2)}`
      : `Property failed with counterexample: ${JSON.stringify(result.counterexample, null, 2)}`;
    throw new Error(message);
  }
}
