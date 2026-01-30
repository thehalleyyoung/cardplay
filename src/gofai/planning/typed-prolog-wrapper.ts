/**
 * @fileoverview Typed Prolog Query Wrapper for GOFAI Planning
 * 
 * Step 267 [Sem] — Define a typed Prolog query layer for GOFAI planning
 * (wrap raw predicates; validate results).
 * 
 * This module provides strongly-typed wrappers around raw Prolog predicates,
 * with comprehensive validation and error handling. It ensures that:
 * 
 * 1. All Prolog queries have TypeScript interfaces
 * 2. Results are validated against schemas
 * 3. Errors are handled gracefully with fallbacks
 * 4. Provenance is tracked through the query chain
 * 5. Query composition is type-safe
 * 
 * @module @cardplay/gofai/planning/typed-prolog-wrapper
 */

import type { PrologAdapter, QueryResult, PrologTerm } from '../../ai/engine/prolog-adapter';
import type { Provenance } from '../pipeline/types';

// ============================================================================
// TYPED PROLOG TERM BUILDERS
// ============================================================================

/**
 * Type-safe Prolog term construction
 */
export class PrologTermBuilder {
  /**
   * Build an atom term
   */
  static atom(value: string): string {
    return `'${value.replace(/'/g, "\\'")}'`;
  }

  /**
   * Build a number term
   */
  static number(value: number): string {
    return value.toString();
  }

  /**
   * Build a list term
   */
  static list(elements: readonly string[]): string {
    return `[${elements.join(', ')}]`;
  }

  /**
   * Build a compound term
   */
  static compound(functor: string, args: readonly string[]): string {
    if (args.length === 0) {
      return functor;
    }
    return `${functor}(${args.join(', ')})`;
  }

  /**
   * Build a variable term
   */
  static variable(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Build an underscore (anonymous variable)
   */
  static anonymous(): string {
    return '_';
  }
}

// ============================================================================
// RESULT VALIDATION
// ============================================================================

/**
 * Validation schema for Prolog results
 */
export interface ValidationSchema {
  readonly type: 'atom' | 'number' | 'list' | 'compound' | 'variable' | 'any';
  readonly required?: boolean;
  readonly pattern?: RegExp;
  readonly min?: number;
  readonly max?: number;
  readonly functor?: string;
  readonly arity?: number;
  readonly elementSchema?: ValidationSchema;
}

/**
 * Validation result
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Result validator
 */
export class PrologResultValidator {
  /**
   * Validate a solution against a schema
   */
  static validate(
    solution: Record<string, unknown>,
    schema: Record<string, ValidationSchema>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [key, fieldSchema] of Object.entries(schema)) {
      const value = solution[key];

      if (value === undefined || value === null) {
        if (fieldSchema.required) {
          errors.push(`Missing required field: ${key}`);
        } else {
          warnings.push(`Optional field missing: ${key}`);
        }
        continue;
      }

      const fieldResult = this.validateField(key, value, fieldSchema);
      errors.push(...fieldResult.errors);
      warnings.push(...fieldResult.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a single field
   */
  private static validateField(
    key: string,
    value: unknown,
    schema: ValidationSchema
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type validation
    const actualType = this.inferType(value);
    if (schema.type !== 'any' && actualType !== schema.type) {
      errors.push(`Field ${key}: expected ${schema.type}, got ${actualType}`);
      return { valid: false, errors, warnings };
    }

    // Pattern validation for atoms
    if (schema.type === 'atom' && schema.pattern) {
      const strValue = this.extractString(value);
      if (strValue && !schema.pattern.test(strValue)) {
        errors.push(`Field ${key}: value does not match pattern ${schema.pattern}`);
      }
    }

    // Range validation for numbers
    if (schema.type === 'number') {
      const numValue = this.extractNumber(value);
      if (numValue !== undefined) {
        if (schema.min !== undefined && numValue < schema.min) {
          errors.push(`Field ${key}: value ${numValue} below minimum ${schema.min}`);
        }
        if (schema.max !== undefined && numValue > schema.max) {
          errors.push(`Field ${key}: value ${numValue} above maximum ${schema.max}`);
        }
      }
    }

    // Compound validation
    if (schema.type === 'compound') {
      const compound = value as { functor?: string; args?: unknown[] };
      if (schema.functor && compound.functor !== schema.functor) {
        errors.push(`Field ${key}: expected functor ${schema.functor}, got ${compound.functor}`);
      }
      if (schema.arity !== undefined && compound.args) {
        if (compound.args.length !== schema.arity) {
          errors.push(`Field ${key}: expected arity ${schema.arity}, got ${compound.args.length}`);
        }
      }
    }

    // List validation
    if (schema.type === 'list' && schema.elementSchema) {
      const list = this.extractList(value);
      for (let i = 0; i < list.length; i++) {
        const elemResult = this.validateField(`${key}[${i}]`, list[i], schema.elementSchema);
        errors.push(...elemResult.errors);
        warnings.push(...elemResult.warnings);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static inferType(value: unknown): string {
    if (typeof value === 'string') return 'atom';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) return 'list';
    
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if ('type' in obj) {
        return obj.type as string;
      }
      if ('functor' in obj && 'args' in obj) {
        return 'compound';
      }
      if ('elements' in obj) {
        return 'list';
      }
      if ('name' in obj) {
        return 'variable';
      }
    }

    return 'any';
  }

  private static extractString(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'value' in value) {
      return String((value as { value: unknown }).value);
    }
    return undefined;
  }

  private static extractNumber(value: unknown): number | undefined {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'value' in value) {
      const num = Number((value as { value: unknown }).value);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }

  private static extractList(value: unknown): readonly unknown[] {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object' && 'elements' in value) {
      return (value as { elements: unknown[] }).elements;
    }
    return [];
  }
}

// ============================================================================
// TYPED QUERY WRAPPER
// ============================================================================

/**
 * Configuration for a typed Prolog predicate
 */
export interface PredicateConfig<TInput, TOutput> {
  readonly name: string;
  readonly arity: number;
  readonly inputSchema?: Record<string, ValidationSchema>;
  readonly outputSchema: Record<string, ValidationSchema>;
  readonly buildQuery: (input: TInput) => string;
  readonly parseResult: (solution: Record<string, unknown>) => TOutput;
  readonly timeout?: number;
  readonly maxSolutions?: number;
  readonly defaultValue?: TOutput;
}

/**
 * Typed wrapper around a Prolog predicate
 */
export class TypedPrologPredicate<TInput, TOutput> {
  private adapter: PrologAdapter;
  private config: PredicateConfig<TInput, TOutput>;

  constructor(adapter: PrologAdapter, config: PredicateConfig<TInput, TOutput>) {
    this.adapter = adapter;
    this.config = config;
  }

  /**
   * Query for a single solution
   */
  async querySingle(input: TInput): Promise<TOutput | undefined> {
    try {
      const query = this.config.buildQuery(input);
      const result = await this.adapter.querySingle(query, this.config.timeout);

      if (!result.success || !result.solution) {
        return this.config.defaultValue;
      }

      // Validate result
      const validation = PrologResultValidator.validate(result.solution, this.config.outputSchema);
      if (!validation.valid) {
        console.warn(`Query validation failed for ${this.config.name}:`, validation.errors);
        return this.config.defaultValue;
      }

      return this.config.parseResult(result.solution);
    } catch (error) {
      console.error(`Query failed for ${this.config.name}:`, error);
      return this.config.defaultValue;
    }
  }

  /**
   * Query for all solutions
   */
  async queryAll(input: TInput): Promise<readonly TOutput[]> {
    try {
      const query = this.config.buildQuery(input);
      const result = await this.adapter.queryAll(query, this.config.maxSolutions, this.config.timeout);

      if (!result.success || !result.solutions) {
        return [];
      }

      const validated: TOutput[] = [];
      for (const solution of result.solutions) {
        const validation = PrologResultValidator.validate(solution, this.config.outputSchema);
        if (validation.valid) {
          validated.push(this.config.parseResult(solution));
        } else {
          console.warn(`Solution validation failed for ${this.config.name}:`, validation.errors);
        }
      }

      return validated;
    } catch (error) {
      console.error(`Query failed for ${this.config.name}:`, error);
      return [];
    }
  }

  /**
   * Query with custom limit
   */
  async queryN(input: TInput, limit: number): Promise<readonly TOutput[]> {
    const originalMax = this.config.maxSolutions;
    const result = await this.queryAll(input);
    return result.slice(0, limit);
  }
}

// ============================================================================
// PREDICATE REGISTRY
// ============================================================================

/**
 * Registry for typed Prolog predicates
 */
export class PrologPredicateRegistry {
  private predicates = new Map<string, TypedPrologPredicate<unknown, unknown>>();
  private adapter: PrologAdapter;

  constructor(adapter: PrologAdapter) {
    this.adapter = adapter;
  }

  /**
   * Register a typed predicate
   */
  register<TInput, TOutput>(
    id: string,
    config: PredicateConfig<TInput, TOutput>
  ): TypedPrologPredicate<TInput, TOutput> {
    const predicate = new TypedPrologPredicate(this.adapter, config);
    this.predicates.set(id, predicate as TypedPrologPredicate<unknown, unknown>);
    return predicate;
  }

  /**
   * Get a registered predicate
   */
  get<TInput, TOutput>(id: string): TypedPrologPredicate<TInput, TOutput> | undefined {
    return this.predicates.get(id) as TypedPrologPredicate<TInput, TOutput> | undefined;
  }

  /**
   * Check if a predicate is registered
   */
  has(id: string): boolean {
    return this.predicates.has(id);
  }

  /**
   * List all registered predicates
   */
  list(): readonly string[] {
    return Array.from(this.predicates.keys());
  }
}

// ============================================================================
// QUERY COMPOSITION
// ============================================================================

/**
 * Composable Prolog query builder
 */
export class PrologQueryComposer {
  private parts: string[] = [];

  /**
   * Add a query part
   */
  add(part: string): this {
    this.parts.push(part);
    return this;
  }

  /**
   * Add a conjunction (AND)
   */
  and(part: string): this {
    if (this.parts.length > 0) {
      this.parts.push(', ');
    }
    this.parts.push(part);
    return this;
  }

  /**
   * Add a disjunction (OR)
   */
  or(part: string): this {
    if (this.parts.length > 0) {
      this.parts.push('; ');
    }
    this.parts.push(part);
    return this;
  }

  /**
   * Add a negation
   */
  not(part: string): this {
    this.parts.push(`\\+ ${part}`);
    return this;
  }

  /**
   * Add a cut
   */
  cut(): this {
    this.parts.push('!');
    return this;
  }

  /**
   * Build the final query string
   */
  build(): string {
    return this.parts.join('');
  }

  /**
   * Create a new composer
   */
  static create(): PrologQueryComposer {
    return new PrologQueryComposer();
  }
}

// ============================================================================
// COMMON PREDICATE DEFINITIONS
// ============================================================================

/**
 * Standard output schemas for common predicate patterns
 */
export const STANDARD_SCHEMAS = {
  /**
   * Schema for a yes/no predicate
   */
  boolean: {
    Result: {
      type: 'atom' as const,
      required: true,
      pattern: /^(true|false|yes|no)$/
    }
  },

  /**
   * Schema for a numeric result
   */
  number: {
    Value: {
      type: 'number' as const,
      required: true
    }
  },

  /**
   * Schema for a confidence-weighted result
   */
  confidenceWeighted: {
    Value: {
      type: 'any' as const,
      required: true
    },
    Confidence: {
      type: 'number' as const,
      required: true,
      min: 0,
      max: 1
    }
  },

  /**
   * Schema for a list result
   */
  list: {
    Items: {
      type: 'list' as const,
      required: true
    }
  },

  /**
   * Schema for a compound result with reason
   */
  reasoned: {
    Value: {
      type: 'any' as const,
      required: true
    },
    Reason: {
      type: 'atom' as const,
      required: true
    }
  }
};

// ============================================================================
// PREDICATE BUILDERS
// ============================================================================

/**
 * Helper to create common predicate patterns
 */
export class PredicateBuilder {
  /**
   * Create a boolean predicate (yes/no test)
   */
  static boolean<TInput>(
    adapter: PrologAdapter,
    name: string,
    buildQuery: (input: TInput) => string
  ): TypedPrologPredicate<TInput, boolean> {
    return new TypedPrologPredicate(adapter, {
      name,
      arity: 1,
      outputSchema: STANDARD_SCHEMAS.boolean,
      buildQuery,
      parseResult: (solution) => {
        const result = solution.Result;
        if (typeof result === 'string') {
          return result === 'true' || result === 'yes';
        }
        if (result && typeof result === 'object' && 'value' in result) {
          const value = (result as { value: unknown }).value;
          return value === 'true' || value === 'yes' || value === true;
        }
        return false;
      },
      defaultValue: false
    });
  }

  /**
   * Create a numeric predicate
   */
  static number<TInput>(
    adapter: PrologAdapter,
    name: string,
    buildQuery: (input: TInput) => string,
    defaultValue: number = 0
  ): TypedPrologPredicate<TInput, number> {
    return new TypedPrologPredicate(adapter, {
      name,
      arity: 1,
      outputSchema: STANDARD_SCHEMAS.number,
      buildQuery,
      parseResult: (solution) => {
        const value = solution.Value;
        if (typeof value === 'number') return value;
        if (value && typeof value === 'object' && 'value' in value) {
          const num = Number((value as { value: unknown }).value);
          return isNaN(num) ? defaultValue : num;
        }
        return defaultValue;
      },
      defaultValue
    });
  }

  /**
   * Create a list predicate
   */
  static list<TInput, TElement>(
    adapter: PrologAdapter,
    name: string,
    buildQuery: (input: TInput) => string,
    parseElement: (element: unknown) => TElement
  ): TypedPrologPredicate<TInput, readonly TElement[]> {
    return new TypedPrologPredicate(adapter, {
      name,
      arity: 1,
      outputSchema: STANDARD_SCHEMAS.list,
      buildQuery,
      parseResult: (solution) => {
        const items = solution.Items;
        if (Array.isArray(items)) {
          return items.map(parseElement);
        }
        if (items && typeof items === 'object' && 'elements' in items) {
          return (items as { elements: unknown[] }).elements.map(parseElement);
        }
        return [];
      },
      defaultValue: []
    });
  }

  /**
   * Create a confidence-weighted predicate
   */
  static confidenceWeighted<TInput, TValue>(
    adapter: PrologAdapter,
    name: string,
    buildQuery: (input: TInput) => string,
    parseValue: (value: unknown) => TValue
  ): TypedPrologPredicate<TInput, { value: TValue; confidence: number } | undefined> {
    return new TypedPrologPredicate(adapter, {
      name,
      arity: 2,
      outputSchema: STANDARD_SCHEMAS.confidenceWeighted,
      buildQuery,
      parseResult: (solution) => {
        const value = parseValue(solution.Value);
        const confidence = typeof solution.Confidence === 'number'
          ? solution.Confidence
          : 0.5;
        return { value, confidence };
      },
      defaultValue: undefined
    });
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Typed error for Prolog query failures
 */
export class PrologQueryError extends Error {
  constructor(
    message: string,
    public readonly predicate: string,
    public readonly query: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'PrologQueryError';
  }
}

/**
 * Error handler for Prolog queries
 */
export class PrologErrorHandler {
  /**
   * Handle a query error with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 100
  ): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          await this.sleep(delay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Handle a query error with fallback
   */
  static async withFallback<T>(
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.warn('Query failed, using fallback:', error);
      return fallback;
    }
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a typed predicate registry
 */
export function createPredicateRegistry(adapter: PrologAdapter): PrologPredicateRegistry {
  return new PrologPredicateRegistry(adapter);
}

/**
 * Create a query composer
 */
export function createQueryComposer(): PrologQueryComposer {
  return PrologQueryComposer.create();
}

/**
 * Validate a Prolog solution
 */
export function validateSolution(
  solution: Record<string, unknown>,
  schema: Record<string, ValidationSchema>
): ValidationResult {
  return PrologResultValidator.validate(solution, schema);
}

// ============================================================================
// EXAMPLES
// ============================================================================

/**
 * Example: Create a typed predicate for checking if a chord is a dominant
 */
export function exampleDominantPredicate(adapter: PrologAdapter) {
  return PredicateBuilder.boolean<{ chord: string }>(
    adapter,
    'is_dominant',
    (input) => `is_dominant(${PrologTermBuilder.atom(input.chord)}, Result)`
  );
}

/**
 * Example: Create a typed predicate for computing harmonic tension
 */
export function exampleTensionPredicate(adapter: PrologAdapter) {
  return PredicateBuilder.number<{ chord: string; key: string }>(
    adapter,
    'harmonic_tension',
    (input) => {
      const chordTerm = PrologTermBuilder.atom(input.chord);
      const keyTerm = PrologTermBuilder.atom(input.key);
      return `harmonic_tension(${chordTerm}, ${keyTerm}, Value)`;
    },
    0.5
  );
}

/**
 * Example: Create a typed predicate for chord substitutions
 */
export function exampleSubstitutionPredicate(adapter: PrologAdapter) {
  return PredicateBuilder.list<{ chord: string }, string>(
    adapter,
    'chord_substitution',
    (input) => `chord_substitution(${PrologTermBuilder.atom(input.chord)}, Items)`,
    (element) => {
      if (typeof element === 'string') return element;
      if (element && typeof element === 'object' && 'value' in element) {
        return String((element as { value: unknown }).value);
      }
      return '';
    }
  );
}

/**
 * Example: Compose a complex query
 */
export function exampleComposedQuery() {
  return createQueryComposer()
    .add('chord(C, major, [])')
    .and('scale_degree(C, Key, 1)')
    .and('harmonic_function(C, Key, tonic)')
    .build();
}
