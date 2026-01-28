/**
 * Example tests demonstrating fuzz testing and property-based testing utilities.
 */

import { describe, it, expect } from 'vitest';
import { fuzzTest, generators, createSeededRNG } from './fuzz-testing';
import { property, arbitrary, properties, expectProperty } from './property-testing';

describe('Fuzz Testing Utilities', () => {
  describe('SeededRNG', () => {
    it('should generate deterministic sequences', () => {
      const rng1 = createSeededRNG(42);
      const rng2 = createSeededRNG(42);
      
      expect(rng1.nextFloat()).toBe(rng2.nextFloat());
      expect(rng1.nextInt(0, 100)).toBe(rng2.nextInt(0, 100));
      expect(rng1.nextBoolean()).toBe(rng2.nextBoolean());
    });
    
    it('should reset to initial state', () => {
      const rng = createSeededRNG(42);
      const first = rng.nextFloat();
      rng.nextFloat();
      rng.nextFloat();
      rng.reset();
      expect(rng.nextFloat()).toBe(first);
    });
  });
  
  describe('fuzzTest', () => {
    it('should find counterexamples', () => {
      const result = fuzzTest(
        'always positive',
        generators.int(-100, 100),
        (x) => x > 0,
        { iterations: 100, seed: 42 }
      );
      
      expect(result.passed).toBe(false);
      expect(result.failedCase).toBeDefined();
    });
    
    it('should pass for valid properties', () => {
      const result = fuzzTest(
        'non-negative absolute value',
        generators.int(-1000, 1000),
        (x) => Math.abs(x) >= 0,
        { iterations: 100, seed: 42 }
      );
      
      expect(result.passed).toBe(true);
    });
  });
  
  describe('generators', () => {
    it('should generate values in range', () => {
      const rng = createSeededRNG(42);
      const gen = generators.int(10, 20);
      
      for (let i = 0; i < 100; i++) {
        const value = gen(rng);
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThanOrEqual(20);
      }
    });
    
    it('should generate arrays of specified length', () => {
      const rng = createSeededRNG(42);
      const gen = generators.array(generators.int(0, 10), 5, 10);
      
      for (let i = 0; i < 10; i++) {
        const arr = gen(rng);
        expect(arr.length).toBeGreaterThanOrEqual(5);
        expect(arr.length).toBeLessThanOrEqual(10);
      }
    });
  });
});

describe('Property-Based Testing Utilities', () => {
  describe('property', () => {
    it('should test universal properties', () => {
      const result = property(
        arbitrary.int(),
        properties.idempotent((x: number) => Math.abs(x)),
        { numRuns: 100, seed: 42 }
      );
      
      expect(result.success).toBe(true);
    });
    
    it('should find counterexamples for false properties', () => {
      const result = property(
        arbitrary.int(),
        (x) => x * 2 === x + x + 1,
        { numRuns: 100, seed: 42 }
      );
      
      expect(result.success).toBe(false);
      expect(result.counterexample).toBeDefined();
    });
  });
  
  describe('properties', () => {
    it('should test commutativity', () => {
      const result = property(
        generators.tuple(arbitrary.int(), arbitrary.int()),
        properties.commutative((a: number, b: number) => a + b),
        { numRuns: 50, seed: 42 }
      );
      
      expect(result.success).toBe(true);
    });
    
    it('should test associativity', () => {
      const result = property(
        generators.tuple(arbitrary.int(), arbitrary.int(), arbitrary.int()),
        properties.associative((a: number, b: number) => a + b),
        { numRuns: 50, seed: 42 }
      );
      
      expect(result.success).toBe(true);
    });
    
    it('should test monotonicity', () => {
      const result = property(
        generators.tuple(arbitrary.nat(100), arbitrary.nat(100)),
        properties.monotonic((x: number) => x * 2),
        { numRuns: 50, seed: 42 }
      );
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('arbitrary', () => {
    it('should generate MIDI notes', () => {
      const result = property(
        arbitrary.midiNote(),
        properties.bounded((x: number) => x, 0, 127),
        { numRuns: 100, seed: 42 }
      );
      
      expect(result.success).toBe(true);
    });
    
    it('should generate normalized values', () => {
      const result = property(
        arbitrary.normalized(),
        properties.bounded((x: number) => x, 0, 1),
        { numRuns: 100, seed: 42 }
      );
      
      expect(result.success).toBe(true);
    });
    
    it('should generate positive durations', () => {
      const result = property(
        arbitrary.duration(),
        properties.nonNegative((x: number) => x),
        { numRuns: 100, seed: 42 }
      );
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('expectProperty', () => {
    it('should work with assertions', () => {
      expect(() => {
        expectProperty(
          arbitrary.int(),
          (x) => {
            expect(Math.abs(x)).toBeGreaterThanOrEqual(0);
          },
          { numRuns: 100, seed: 42 }
        );
      }).not.toThrow();
    });
  });
});

describe('Real-World Property Tests', () => {
  it('sorting should be idempotent', () => {
    const gen = generators.array(arbitrary.int(), 0, 20);
    
    const result = property(
      gen,
      properties.idempotent((arr: number[]) => [...arr].sort((a, b) => a - b)),
      { numRuns: 100, seed: 42 }
    );
    
    expect(result.success).toBe(true);
  });
  
  it('reversing twice should be identity', () => {
    const gen = generators.array(arbitrary.int(), 0, 20);
    
    const result = property(
      gen,
      properties.inverse(
        (arr: number[]) => [...arr].reverse(),
        (arr: number[]) => [...arr].reverse()
      ),
      { numRuns: 100, seed: 42 }
    );
    
    expect(result.success).toBe(true);
  });
  
  it('addition and subtraction should be inverse', () => {
    const gen = generators.tuple(arbitrary.int(-1000, 1000), arbitrary.int(-1000, 1000));
    
    const result = property(
      gen,
      ([x, y]: [number, number]) => {
        const sum = x + y;
        const diff = sum - y;
        return diff === x;
      },
      { numRuns: 100, seed: 42 }
    );
    
    expect(result.success).toBe(true);
  });
});
