/**
 * GOFAI Semantic Safety Invariants — Runtime Verification System
 *
 * This module implements the semantic safety invariants defined in
 * docs/gofai/semantic-safety-invariants.md. Every invariant is an
 * executable check, not just documentation.
 *
 * @module gofai/invariants
 */

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Unique identifier for an invariant.
 */
export type InvariantId = string & { readonly __invariantId: unique symbol };

/**
 * Create an invariant ID.
 */
export function invariantId(id: string): InvariantId {
  return id as InvariantId;
}

/**
 * Severity levels for invariant violations.
 */
export type InvariantSeverity = 'critical' | 'error' | 'warning';

/**
 * Categories of invariants.
 */
export type InvariantCategory =
  | 'constraint-executability'
  | 'ambiguity-prohibition'
  | 'preservation'
  | 'referent-resolution'
  | 'effect-typing'
  | 'determinism'
  | 'undoability'
  | 'scope-visibility'
  | 'explainability'
  | 'constraint-compatibility'
  | 'presupposition'
  | 'extension-isolation';

/**
 * Evidence collected when an invariant is violated.
 */
export interface ViolationEvidence {
  /** Description of what was expected */
  readonly expected: string;

  /** Description of what was found */
  readonly actual: string;

  /** Location in the code/data where violation occurred */
  readonly location?: string;

  /** Additional context data */
  readonly context?: Record<string, unknown>;
}

/**
 * Result of checking a single invariant.
 */
export type InvariantCheckResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly invariantId: InvariantId;
      readonly severity: InvariantSeverity;
      readonly message: string;
      readonly evidence: ViolationEvidence;
    };

/**
 * An invariant definition.
 */
export interface InvariantDefinition<TState, TOperation> {
  /** Unique identifier */
  readonly id: InvariantId;

  /** Human-readable name */
  readonly name: string;

  /** Category for grouping */
  readonly category: InvariantCategory;

  /** Detailed description */
  readonly description: string;

  /** Severity if violated */
  readonly severity: InvariantSeverity;

  /** The predicate that checks the invariant */
  readonly check: (state: TState, operation: TOperation) => InvariantCheckResult;

  /** Whether this invariant is enabled */
  readonly enabled: boolean;
}

/**
 * Registry of all invariants.
 */
export interface InvariantRegistry<TState, TOperation> {
  /** All registered invariants */
  readonly invariants: readonly InvariantDefinition<TState, TOperation>[];

  /** Get invariant by ID */
  get(id: InvariantId): InvariantDefinition<TState, TOperation> | undefined;

  /** Get invariants by category */
  byCategory(category: InvariantCategory): readonly InvariantDefinition<TState, TOperation>[];

  /** Check all invariants */
  checkAll(state: TState, operation: TOperation): InvariantCheckResult[];

  /** Check only critical invariants */
  checkCritical(state: TState, operation: TOperation): InvariantCheckResult[];
}

// =============================================================================
// Invariant Builder
// =============================================================================

/**
 * Builder for creating invariant definitions fluently.
 */
export class InvariantBuilder<TState, TOperation> {
  private readonly definitions: InvariantDefinition<TState, TOperation>[] = [];

  /**
   * Define a new invariant.
   */
  define(config: {
    id: string;
    name: string;
    category: InvariantCategory;
    description: string;
    severity?: InvariantSeverity;
    enabled?: boolean;
    check: (state: TState, operation: TOperation) => InvariantCheckResult;
  }): this {
    this.definitions.push({
      id: invariantId(config.id),
      name: config.name,
      category: config.category,
      description: config.description,
      severity: config.severity ?? 'error',
      enabled: config.enabled ?? true,
      check: config.check,
    });
    return this;
  }

  /**
   * Build the registry.
   */
  build(): InvariantRegistry<TState, TOperation> {
    const invariants = [...this.definitions];
    const byId = new Map(invariants.map((inv) => [inv.id, inv]));
    const byCategory = new Map<InvariantCategory, InvariantDefinition<TState, TOperation>[]>();

    for (const inv of invariants) {
      const list = byCategory.get(inv.category) ?? [];
      list.push(inv);
      byCategory.set(inv.category, list);
    }

    return {
      invariants,
      get: (id) => byId.get(id),
      byCategory: (cat) => byCategory.get(cat) ?? [],
      checkAll: (state, op) => checkInvariants(invariants, state, op),
      checkCritical: (state, op) =>
        checkInvariants(
          invariants.filter((i) => i.severity === 'critical'),
          state,
          op
        ),
    };
  }
}

/**
 * Check a list of invariants against state and operation.
 */
function checkInvariants<TState, TOperation>(
  invariants: readonly InvariantDefinition<TState, TOperation>[],
  state: TState,
  operation: TOperation
): InvariantCheckResult[] {
  const results: InvariantCheckResult[] = [];

  for (const inv of invariants) {
    if (!inv.enabled) continue;

    try {
      const result = inv.check(state, operation);
      results.push(result);
    } catch (error) {
      // Invariant check itself threw - treat as violation
      results.push({
        ok: false,
        invariantId: inv.id,
        severity: inv.severity,
        message: `Invariant check threw: ${error}`,
        evidence: {
          expected: 'Check to complete without error',
          actual: String(error),
          context: { error },
        },
      });
    }
  }

  return results;
}

// =============================================================================
// Result Helpers
// =============================================================================

/**
 * Create a passing invariant check result.
 */
export function ok(): InvariantCheckResult {
  return { ok: true };
}

/**
 * Create a failing invariant check result.
 */
export function violation(
  id: InvariantId,
  severity: InvariantSeverity,
  message: string,
  evidence: ViolationEvidence
): InvariantCheckResult {
  return { ok: false, invariantId: id, severity, message, evidence };
}

/**
 * Check if any results contain violations.
 */
export function hasViolations(results: readonly InvariantCheckResult[]): boolean {
  return results.some((r) => !r.ok);
}

/**
 * Get only the violations from results.
 */
export function getViolations(
  results: readonly InvariantCheckResult[]
): Array<Extract<InvariantCheckResult, { ok: false }>> {
  return results.filter((r): r is Extract<InvariantCheckResult, { ok: false }> => !r.ok);
}

/**
 * Get violations by severity.
 */
export function getViolationsBySeverity(
  results: readonly InvariantCheckResult[],
  severity: InvariantSeverity
): Array<Extract<InvariantCheckResult, { ok: false }>> {
  return getViolations(results).filter((v) => v.severity === severity);
}

/**
 * Throw if any critical violations exist.
 */
export function assertNoCriticalViolations(results: readonly InvariantCheckResult[]): void {
  const critical = getViolationsBySeverity(results, 'critical');
  if (critical.length > 0) {
    const messages = critical.map((v) => `[${v.invariantId}] ${v.message}`).join('\n');
    throw new InvariantViolationError(
      `Critical invariant violations:\n${messages}`,
      critical
    );
  }
}

/**
 * Throw if any violations exist.
 */
export function assertNoViolations(results: readonly InvariantCheckResult[]): void {
  const violations = getViolations(results);
  if (violations.length > 0) {
    const messages = violations
      .map((v) => `[${v.severity}] [${v.invariantId}] ${v.message}`)
      .join('\n');
    throw new InvariantViolationError(`Invariant violations:\n${messages}`, violations);
  }
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Error thrown when invariants are violated.
 */
export class InvariantViolationError extends Error {
  readonly violations: readonly Extract<InvariantCheckResult, { ok: false }>[];

  constructor(
    message: string,
    violations: readonly Extract<InvariantCheckResult, { ok: false }>[]
  ) {
    super(message);
    this.name = 'InvariantViolationError';
    this.violations = violations;
  }
}

// =============================================================================
// Constraint Verification Types
// =============================================================================

/**
 * A constraint that can be verified.
 */
export interface VerifiableConstraint<TState> {
  /** Constraint type ID */
  readonly typeId: string;

  /** Human-readable description */
  readonly description: string;

  /** The verification function */
  readonly verify: (stateBefore: TState, stateAfter: TState) => ConstraintVerificationResult;
}

/**
 * Result of constraint verification.
 */
export type ConstraintVerificationResult =
  | { readonly satisfied: true }
  | {
      readonly satisfied: false;
      readonly reason: string;
      readonly details?: Record<string, unknown>;
    };

/**
 * Create a satisfied constraint result.
 */
export function constraintSatisfied(): ConstraintVerificationResult {
  return { satisfied: true };
}

/**
 * Create a violated constraint result.
 */
export function constraintViolated(
  reason: string,
  details?: Record<string, unknown>
): ConstraintVerificationResult {
  return details !== undefined 
    ? { satisfied: false, reason, details }
    : { satisfied: false, reason };
}

// =============================================================================
// Effect Type Definitions
// =============================================================================

/**
 * Effect types for operations.
 */
export type EffectType = 'inspect' | 'propose' | 'mutate';

/**
 * Effect metadata for an operation.
 */
export interface EffectMetadata {
  /** The effect type */
  readonly type: EffectType;

  /** Whether this effect is idempotent */
  readonly idempotent: boolean;

  /** Required capabilities */
  readonly requiredCapabilities: readonly string[];

  /** Human-readable description of effects */
  readonly description: string;
}

/**
 * Check if an effect type requires user approval.
 */
export function requiresApproval(effect: EffectType): boolean {
  return effect === 'mutate';
}

/**
 * Check if an effect type is read-only.
 */
export function isReadOnly(effect: EffectType): boolean {
  return effect === 'inspect';
}

// =============================================================================
// Undo Token Types
// =============================================================================

/**
 * An undo token representing a reversible operation.
 */
export interface UndoToken<TState> {
  /** Unique identifier for this token */
  readonly id: string;

  /** Timestamp when the operation was applied */
  readonly appliedAt: number;

  /** Description of what was done */
  readonly description: string;

  /** Whether this token has been consumed */
  readonly consumed: boolean;

  /** The reverse operation */
  readonly undo: () => TState;
}

/**
 * Undo token factory.
 */
export interface UndoTokenFactory<TState> {
  /**
   * Create an undo token for an operation.
   */
  create(description: string, undoFn: () => TState): UndoToken<TState>;

  /**
   * Mark a token as consumed.
   */
  consume(token: UndoToken<TState>): TState;
}

/**
 * Create an undo token factory.
 */
export function createUndoTokenFactory<TState>(): UndoTokenFactory<TState> {
  const consumed = new Set<string>();
  let counter = 0;

  return {
    create(description, undoFn) {
      const id = `undo-${++counter}-${Date.now()}`;
      return {
        id,
        appliedAt: Date.now(),
        description,
        consumed: false,
        undo: undoFn,
      };
    },

    consume(token) {
      if (consumed.has(token.id)) {
        throw new Error(`Undo token ${token.id} has already been consumed`);
      }
      consumed.add(token.id);
      return token.undo();
    },
  };
}

// =============================================================================
// Scope Visibility Types
// =============================================================================

/**
 * Represents the scope of an operation.
 */
export interface OperationScope {
  /** Affected section IDs */
  readonly sections: readonly string[];

  /** Affected layer/track IDs */
  readonly layers: readonly string[];

  /** Affected time range (start, end) in ticks */
  readonly timeRange?: readonly [number, number];

  /** Affected parameters */
  readonly parameters: readonly string[];

  /** Human-readable summary */
  readonly summary: string;
}

/**
 * Calculate the scope of an operation.
 */
export type ScopeCalculator<TOperation> = (operation: TOperation) => OperationScope;

// =============================================================================
// Presupposition Types
// =============================================================================

/**
 * A presupposition that must hold for an expression.
 */
export interface Presupposition<TState> {
  /** What is presupposed */
  readonly description: string;

  /** The trigger expression */
  readonly trigger: string;

  /** Verification function */
  readonly verify: (state: TState) => PresuppositionResult;
}

/**
 * Result of presupposition verification.
 */
export type PresuppositionResult =
  | { readonly holds: true }
  | { readonly holds: false; readonly failureReason: string };

/**
 * Create a holding presupposition result.
 */
export function presuppositionHolds(): PresuppositionResult {
  return { holds: true };
}

/**
 * Create a failed presupposition result.
 */
export function presuppositionFailed(reason: string): PresuppositionResult {
  return { holds: false, failureReason: reason };
}

// =============================================================================
// Ambiguity Detection Types
// =============================================================================

/**
 * Types of ambiguity that can occur.
 */
export type AmbiguityType =
  | 'referential'
  | 'scope'
  | 'degree'
  | 'temporal'
  | 'comparison-class'
  | 'lexical'
  | 'structural';

/**
 * Detected ambiguity in an expression.
 */
export interface DetectedAmbiguity {
  /** Type of ambiguity */
  readonly type: AmbiguityType;

  /** The ambiguous expression */
  readonly expression: string;

  /** Possible interpretations */
  readonly interpretations: readonly string[];

  /** Default interpretation if any */
  readonly defaultInterpretation?: string;

  /** Clarification question to ask */
  readonly clarificationQuestion: string;
}

/**
 * Result of ambiguity detection.
 */
export interface AmbiguityDetectionResult {
  /** Whether any ambiguities were detected */
  readonly hasAmbiguity: boolean;

  /** List of detected ambiguities */
  readonly ambiguities: readonly DetectedAmbiguity[];
}

/**
 * Create a result with no ambiguities.
 */
export function noAmbiguity(): AmbiguityDetectionResult {
  return { hasAmbiguity: false, ambiguities: [] };
}

/**
 * Create a result with ambiguities.
 */
export function hasAmbiguity(
  ambiguities: readonly DetectedAmbiguity[]
): AmbiguityDetectionResult {
  return { hasAmbiguity: ambiguities.length > 0, ambiguities };
}

// =============================================================================
// Determinism Verification
// =============================================================================

/**
 * Verify that a function produces deterministic output.
 */
export function verifyDeterminism<TInput, TOutput>(
  fn: (input: TInput) => TOutput,
  input: TInput,
  iterations = 10
): { deterministic: boolean; outputs: TOutput[] } {
  const outputs: TOutput[] = [];

  for (let i = 0; i < iterations; i++) {
    outputs.push(fn(input));
  }

  // Check all outputs are equal
  const first = JSON.stringify(outputs[0]);
  const deterministic = outputs.every((o) => JSON.stringify(o) === first);

  return { deterministic, outputs };
}

/**
 * Create a determinism assertion wrapper.
 */
export function assertDeterministic<TInput, TOutput>(
  fn: (input: TInput) => TOutput,
  name: string
): (input: TInput) => TOutput {
  return (input: TInput): TOutput => {
    const result1 = fn(input);
    const result2 = fn(input);

    const s1 = JSON.stringify(result1);
    const s2 = JSON.stringify(result2);

    if (s1 !== s2) {
      throw new Error(
        `Non-determinism detected in ${name}:\n` +
          `First call: ${s1}\n` +
          `Second call: ${s2}`
      );
    }

    return result1;
  };
}

// =============================================================================
// Extension Sandbox Types
// =============================================================================

/**
 * Sandbox configuration for extensions.
 */
export interface ExtensionSandboxConfig {
  /** Maximum execution time in ms */
  readonly timeoutMs: number;

  /** Maximum memory usage in bytes */
  readonly memoryLimitBytes: number;

  /** Allowed capabilities */
  readonly allowedCapabilities: readonly string[];

  /** Whether network access is allowed */
  readonly allowNetwork: boolean;

  /** Whether file system access is allowed */
  readonly allowFileSystem: boolean;
}

/**
 * Default sandbox configuration.
 */
export const DEFAULT_SANDBOX_CONFIG: ExtensionSandboxConfig = {
  timeoutMs: 5000,
  memoryLimitBytes: 50 * 1024 * 1024, // 50MB
  allowedCapabilities: [],
  allowNetwork: false,
  allowFileSystem: false,
};

/**
 * Result of running code in sandbox.
 */
export type SandboxResult<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: SandboxError };

/**
 * Sandbox execution error.
 */
export interface SandboxError {
  readonly type: 'timeout' | 'memory' | 'permission' | 'runtime';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

// =============================================================================
// Invariant Report Generation
// =============================================================================

/**
 * Generate a human-readable report of invariant check results.
 */
export function generateInvariantReport(
  results: readonly InvariantCheckResult[]
): string {
  const violations = getViolations(results);
  const passes = results.filter((r) => r.ok).length;

  const lines: string[] = [
    '═'.repeat(60),
    'Invariant Check Report',
    '═'.repeat(60),
    '',
    `Total Checks: ${results.length}`,
    `Passed: ${passes}`,
    `Violations: ${violations.length}`,
    '',
  ];

  if (violations.length === 0) {
    lines.push('✓ All invariants satisfied');
  } else {
    lines.push('Violations:');
    lines.push('');

    for (const v of violations) {
      const icon = v.severity === 'critical' ? '✗✗' : v.severity === 'error' ? '✗' : '⚠';
      lines.push(`${icon} [${v.severity.toUpperCase()}] ${v.invariantId}`);
      lines.push(`   ${v.message}`);
      lines.push(`   Expected: ${v.evidence.expected}`);
      lines.push(`   Actual: ${v.evidence.actual}`);
      if (v.evidence.location) {
        lines.push(`   Location: ${v.evidence.location}`);
      }
      lines.push('');
    }
  }

  lines.push('═'.repeat(60));

  return lines.join('\n');
}
