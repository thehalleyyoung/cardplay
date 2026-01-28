/**
 * Fuzz Testing Utilities for Cardplay
 * 
 * Implements randomized testing with deterministic seeds for reproducibility.
 * Generates diverse test inputs to find edge cases and unexpected behaviors.
 */

export type SeededRNG = {
  nextFloat(): number;
  nextInt(min: number, max: number): number;
  nextBoolean(): boolean;
  nextElement<T>(array: readonly T[]): T;
  reset(): void;
  getSeed(): number;
};

/**
 * Creates a seeded pseudo-random number generator for deterministic testing.
 */
export function createSeededRNG(seed: number): SeededRNG {
  let state = seed;
  
  const next = (): number => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  
  return {
    nextFloat() {
      return next();
    },
    
    nextInt(min: number, max: number) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    
    nextBoolean() {
      return next() < 0.5;
    },
    
    nextElement<T>(array: readonly T[]): T {
      if (array.length === 0) throw new Error('Cannot pick from empty array');
      const idx = this.nextInt(0, array.length - 1);
      return array[idx]!;
    },
    
    reset() {
      state = seed;
    },
    
    getSeed() {
      return seed;
    }
  };
}

export type FuzzTestCase<T> = {
  input: T;
  seed: number;
  iteration: number;
};

export type FuzzTestResult = {
  passed: boolean;
  failedCase?: FuzzTestCase<any>;
  error?: Error;
  iterations: number;
  duration: number;
};

export type FuzzGenerator<T> = (rng: SeededRNG) => T;

export type FuzzTestOptions = {
  iterations?: number;
  seed?: number;
  timeout?: number;
  shrinkAttempts?: number;
};

/**
 * Runs a fuzz test with a generator and property checker.
 */
export function fuzzTest<T>(
  _name: string,
  generator: FuzzGenerator<T>,
  property: (input: T) => boolean | void,
  options: FuzzTestOptions = {}
): FuzzTestResult {
  const iterations = options.iterations ?? 100;
  const baseSeed = options.seed ?? Date.now();
  const timeout = options.timeout ?? 5000;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Fuzz test timeout after ${i} iterations`);
    }
    
    const seed = baseSeed + i;
    const rng = createSeededRNG(seed);
    const input = generator(rng);
    
    try {
      const result = property(input);
      if (result === false) {
        return {
          passed: false,
          failedCase: { input, seed, iteration: i },
          iterations: i + 1,
          duration: Date.now() - startTime
        };
      }
    } catch (error) {
      return {
        passed: false,
        failedCase: { input, seed, iteration: i },
        error: error as Error,
        iterations: i + 1,
        duration: Date.now() - startTime
      };
    }
  }
  
  return {
    passed: true,
    iterations,
    duration: Date.now() - startTime
  };
}

/**
 * Common generators for fuzz testing.
 */
export const generators = {
  int: (min: number, max: number): FuzzGenerator<number> => {
    return (rng) => rng.nextInt(min, max);
  },
  
  float: (min: number, max: number): FuzzGenerator<number> => {
    return (rng) => min + rng.nextFloat() * (max - min);
  },
  
  boolean: (): FuzzGenerator<boolean> => {
    return (rng) => rng.nextBoolean();
  },
  
  string: (minLength: number, maxLength: number, charset = 'abcdefghijklmnopqrstuvwxyz0123456789'): FuzzGenerator<string> => {
    return (rng) => {
      const length = rng.nextInt(minLength, maxLength);
      let result = '';
      for (let i = 0; i < length; i++) {
        result += charset[rng.nextInt(0, charset.length - 1)];
      }
      return result;
    };
  },
  
  array: <T>(itemGen: FuzzGenerator<T>, minLength: number, maxLength: number): FuzzGenerator<T[]> => {
    return (rng) => {
      const length = rng.nextInt(minLength, maxLength);
      const result: T[] = [];
      for (let i = 0; i < length; i++) {
        result.push(itemGen(rng));
      }
      return result;
    };
  },
  
  oneOf: <T>(...gens: FuzzGenerator<T>[]): FuzzGenerator<T> => {
    return (rng) => {
      const gen = rng.nextElement(gens);
      return gen(rng);
    };
  },
  
  constant: <T>(value: T): FuzzGenerator<T> => {
    return () => value;
  },
  
  tuple: <T extends any[]>(...gens: { [K in keyof T]: FuzzGenerator<T[K]> }): FuzzGenerator<T> => {
    return (rng) => {
      return gens.map(gen => gen(rng)) as T;
    };
  },
  
  record: <T extends Record<string, any>>(
    schema: { [K in keyof T]: FuzzGenerator<T[K]> }
  ): FuzzGenerator<T> => {
    return (rng) => {
      const result = {} as T;
      for (const key in schema) {
        result[key] = schema[key](rng);
      }
      return result;
    };
  }
};

/**
 * Shrinking utilities for minimizing failing test cases.
 */
export function shrinkInt(value: number, min: number): number[] {
  const shrinks: number[] = [];
  if (value > min) {
    shrinks.push(min);
    const half = Math.floor((value + min) / 2);
    if (half > min && half < value) {
      shrinks.push(half);
    }
    if (value - 1 > min) {
      shrinks.push(value - 1);
    }
  }
  return shrinks;
}

export function shrinkArray<T>(array: T[]): T[][] {
  const shrinks: T[][] = [];
  if (array.length > 0) {
    shrinks.push([]);
    if (array.length > 1) {
      shrinks.push(array.slice(0, Math.floor(array.length / 2)));
      shrinks.push(array.slice(0, array.length - 1));
    }
  }
  return shrinks;
}
