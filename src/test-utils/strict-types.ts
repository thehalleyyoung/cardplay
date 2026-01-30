/**
 * @fileoverview Strict Type Utilities
 * 
 * Provides type utilities for improved type safety:
 * - assertNever for exhaustive discriminated union checks
 * - Branded type helpers
 * - Type guards
 * 
 * @module @cardplay/test-utils/strict-types
 * @see to_fix_repo_plan_500.md Change 032
 */

// ============================================================================
// EXHAUSTIVENESS CHECKING
// ============================================================================

/**
 * Assert that a value is of type never.
 * 
 * Use at the end of switch statements on discriminated unions
 * to ensure all cases are handled. Will cause a compile error
 * if a case is added without handling.
 * 
 * @example
 * ```ts
 * type Action = { type: 'A' } | { type: 'B' };
 * function handle(action: Action) {
 *   switch (action.type) {
 *     case 'A': return handleA();
 *     case 'B': return handleB();
 *     default: return assertNever(action);
 *   }
 * }
 * ```
 * 
 * @param value - The value that should be never
 * @param message - Optional error message
 * @returns Never returns (always throws)
 * @throws Error if called at runtime
 */
export function assertNever(value: never, message?: string): never {
  const msg = message ?? `Unexpected value: ${JSON.stringify(value)}`;
  throw new Error(msg);
}

/**
 * Exhaustive check that returns a default value instead of throwing.
 * Use when you want to handle unknown cases gracefully.
 * 
 * @param value - The value that should be never
 * @param defaultValue - Default value to return
 * @returns The default value
 */
export function exhaustiveDefault<T>(value: never, defaultValue: T): T {
  console.warn(`Unhandled value: ${JSON.stringify(value)}, using default`);
  return defaultValue;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a value is defined (not null or undefined).
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a finite number.
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Check if a value is a non-negative number.
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

/**
 * Check if a value is a positive integer.
 */
export function isPositiveInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value > 0;
}

/**
 * Check if a value is an array.
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Check if a value is a non-empty array.
 */
export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Check if a value is a plain object.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert a condition, throwing if false.
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Assert a value is defined.
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Expected defined value');
  }
}

/**
 * Assert a value matches a type guard.
 */
export function assertType<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  message?: string
): asserts value is T {
  if (!guard(value)) {
    throw new Error(message ?? `Type assertion failed`);
  }
}

// ============================================================================
// BRANDED TYPE UTILITIES
// ============================================================================

/** Symbol for branding */
declare const __brand: unique symbol;

/**
 * Create a branded type.
 */
export type Branded<T, Brand extends string> = T & { readonly [__brand]: Brand };

/**
 * Create a brand function for a type.
 * 
 * @example
 * ```ts
 * type UserId = Branded<string, 'UserId'>;
 * const asUserId = createBrand<UserId>('UserId');
 * const id = asUserId('abc123');
 * ```
 */
export function createBrand<B extends Branded<unknown, string>>(
  _brandName: string
): (value: B extends Branded<infer T, string> ? T : never) => B {
  return (value) => value as B;
}

// ============================================================================
// DISCRIMINATED UNION HELPERS
// ============================================================================

/**
 * Extract the discriminant field type from a discriminated union.
 */
export type DiscriminantField<T, K extends keyof T> = T extends { [P in K]: infer U } ? U : never;

/**
 * Narrow a discriminated union by discriminant value.
 */
export type NarrowByDiscriminant<T, K extends keyof T, V extends T[K]> = T extends { [P in K]: V }
  ? T
  : never;

/**
 * Create a type-safe handler map for a discriminated union.
 */
export type DiscriminatedHandlers<T, K extends keyof T, R> = {
  [V in T[K] & string]: (value: NarrowByDiscriminant<T, K, V>) => R;
};

/**
 * Handle a discriminated union with a handler map.
 */
export function handleDiscriminated<T, K extends keyof T, R>(
  value: T,
  key: K,
  handlers: DiscriminatedHandlers<T, K, R>
): R {
  const discriminant = value[key] as T[K] & string;
  const handler = handlers[discriminant];
  if (!handler) {
    throw new Error(`No handler for discriminant: ${String(discriminant)}`);
  }
  return handler(value as any);
}
