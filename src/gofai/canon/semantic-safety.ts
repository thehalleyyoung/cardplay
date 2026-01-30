/**
 * GOFAI Canon — Semantic Safety Invariants
 *
 * This module defines semantic safety invariants as first-class testable requirements.
 * Each invariant is an executable check that can be verified at runtime and in tests.
 *
 * Following Step 002 from gofai_goalB.md:
 * "Define 'semantic safety invariants' (e.g., preserve constraints are executable checks;
 * no silent ambiguity resolution) and treat them as first-class testable requirements."
 *
 * @module gofai/canon/semantic-safety
 */

import type { ConstraintTypeId, OpcodeId } from './types';

// =============================================================================
// Invariant Type System
// =============================================================================

/**
 * A semantic safety invariant definition.
 *
 * Each invariant:
 * - Has a stable ID
 * - Has a clear statement
 * - Has executable checks
 * - Has test requirements
 * - Can be violated with clear evidence
 */
export interface SemanticInvariant<TContext = unknown, TEvidence = unknown> {
  /** Stable invariant ID */
  readonly id: InvariantId;

  /** Human-readable name */
  readonly name: string;

  /** Formal statement of the invariant */
  readonly statement: string;

  /** Priority level (P0 = must never be violated) */
  readonly priority: 'P0' | 'P1' | 'P2';

  /** Test categories required */
  readonly requiredTests: readonly TestCategory[];

  /** The actual check function */
  readonly check: InvariantCheck<TContext, TEvidence>;

  /** Documentation link */
  readonly docLink?: string;
}

/**
 * Stable invariant identifiers.
 */
export type InvariantId =
  | 'constraint-executability'
  | 'silent-ambiguity-prohibition'
  | 'constraint-preservation'
  | 'referent-resolution-completeness'
  | 'effect-typing'
  | 'determinism'
  | 'undoability'
  | 'scope-visibility'
  | 'plan-explainability'
  | 'constraint-compatibility'
  | 'presupposition-verification'
  | 'extension-isolation';

/**
 * Test categories for invariant validation.
 */
export type TestCategory =
  | 'unit' // Individual component tests
  | 'property' // Property-based tests (fast-check)
  | 'golden' // Golden corpus tests
  | 'fuzzing' // Fuzz testing
  | 'integration'; // Multi-component tests

/**
 * An invariant check function.
 */
export type InvariantCheck<TContext, TEvidence> = (
  context: TContext
) => InvariantResult<TEvidence>;

/**
 * Result of an invariant check.
 */
export type InvariantResult<TEvidence> =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly violation: InvariantViolation<TEvidence>;
    };

/**
 * Evidence of an invariant violation.
 */
export interface InvariantViolation<TEvidence = unknown> {
  /** The invariant that was violated */
  readonly invariantId: InvariantId;

  /** Structured evidence */
  readonly evidence: TEvidence;

  /** Human-readable message */
  readonly message: string;

  /** Source location (if applicable) */
  readonly location?: SourceLocation;

  /** Suggested fixes */
  readonly suggestions?: readonly string[];

  /** Severity */
  readonly severity: 'error' | 'warning';
}

/**
 * Source location for violations.
 */
export interface SourceLocation {
  /** Source file or context */
  readonly source: string;

  /** Span in source */
  readonly span?: { readonly start: number; readonly end: number };

  /** Line/column (if available) */
  readonly position?: { readonly line: number; readonly column: number };
}

// =============================================================================
// Constraint Executability Invariant (Step 002)
// =============================================================================

/**
 * Context for constraint executability checks.
 */
export interface ConstraintExecutabilityContext {
  /** The constraint type being checked */
  readonly constraintType: ConstraintTypeId;

  /** Whether a verifier exists */
  readonly hasVerifier: boolean;

  /** Verifier function name (if exists) */
  readonly verifierName?: string;
}

/**
 * Evidence of constraint executability violation.
 */
export interface ConstraintExecutabilityEvidence {
  /** The constraint type with no verifier */
  readonly constraintType: ConstraintTypeId;

  /** Available verifiers (for suggestions) */
  readonly availableVerifiers: readonly string[];
}

/**
 * Invariant: Every constraint must be an executable check.
 *
 * ∀ constraint C in CPL-Intent:
 *   ∃ verifier V: (ProjectState, EditPlan) → boolean
 */
export const CONSTRAINT_EXECUTABILITY_INVARIANT: SemanticInvariant<
  ConstraintExecutabilityContext,
  ConstraintExecutabilityEvidence
> = {
  id: 'constraint-executability',
  name: 'Constraint Executability',
  statement:
    'Every constraint type must have an executable verifier function. No constraint may exist without a corresponding runtime check.',
  priority: 'P0',
  requiredTests: ['unit', 'property', 'golden'],

  check: (context) => {
    if (!context.hasVerifier) {
      return {
        ok: false,
        violation: {
          invariantId: 'constraint-executability',
          evidence: {
            constraintType: context.constraintType,
            availableVerifiers: [], // Populated by registry
          },
          message: `Constraint type '${context.constraintType}' has no executable verifier`,
          suggestions: [
            'Implement a verifier function in gofai/execution/verifiers',
            'Register the verifier in the constraint type definition',
            'Remove this constraint type if not needed',
          ],
          severity: 'error',
        },
      };
    }
    return { ok: true };
  },

  docLink: 'docs/gofai/semantic-safety-invariants.md#constraint-executability',
};

// =============================================================================
// Silent Ambiguity Prohibition (Step 002)
// =============================================================================

/**
 * Types of ambiguity that must not be resolved silently.
 */
export type AmbiguityType =
  | 'referential' // "the verse" when multiple exist
  | 'scope' // "add reverb to drums and bass"
  | 'degree' // "make it brighter" without amount
  | 'temporal' // "after the drop"
  | 'comparison-class' // "darker" without baseline
  | 'modifier-attachment' // "loud drums and bass"
  | 'quantifier-scope'; // "every track with reverb"

/**
 * Context for ambiguity checks.
 */
export interface AmbiguityContext {
  /** Detected ambiguity type */
  readonly ambiguityType: AmbiguityType;

  /** Possible interpretations */
  readonly interpretations: readonly AmbiguousInterpretation[];

  /** Whether user was prompted */
  readonly userPrompted: boolean;

  /** Default used (if any) */
  readonly defaultUsed?: number;
}

/**
 * An ambiguous interpretation.
 */
export interface AmbiguousInterpretation {
  /** Interpretation description */
  readonly description: string;

  /** Would affect different entities */
  readonly affects: readonly string[];

  /** Confidence score (0-1) */
  readonly confidence: number;
}

/**
 * Evidence of silent ambiguity violation.
 */
export interface SilentAmbiguityEvidence {
  /** Type of ambiguity */
  readonly ambiguityType: AmbiguityType;

  /** How many interpretations */
  readonly interpretationCount: number;

  /** Which interpretation was silently chosen */
  readonly chosenIndex: number;
}

/**
 * Invariant: No ambiguity may be resolved silently.
 *
 * ∀ parse tree T with ambiguity A:
 *   IF A is semantic THEN prompt user OR fail
 */
export const SILENT_AMBIGUITY_PROHIBITION: SemanticInvariant<
  AmbiguityContext,
  SilentAmbiguityEvidence
> = {
  id: 'silent-ambiguity-prohibition',
  name: 'Silent Ambiguity Prohibition',
  statement:
    'No semantic ambiguity may be resolved without explicit user clarification. All default choices must be presented to the user.',
  priority: 'P0',
  requiredTests: ['unit', 'golden'],

  check: (context) => {
    const hasAmbiguity = context.interpretations.length > 1;
    const wasSilentlyResolved =
      hasAmbiguity &&
      !context.userPrompted &&
      context.defaultUsed !== undefined;

    if (wasSilentlyResolved) {
      return {
        ok: false,
        violation: {
          invariantId: 'silent-ambiguity-prohibition',
          evidence: {
            ambiguityType: context.ambiguityType,
            interpretationCount: context.interpretations.length,
            chosenIndex: context.defaultUsed!,
          },
          message: `Ambiguity of type '${context.ambiguityType}' was resolved silently without user clarification`,
          suggestions: [
            'Add a clarification question to the ClarificationQuestion list',
            'Present all interpretations to the user',
            'Require explicit user choice before proceeding',
          ],
          severity: 'error',
        },
      };
    }
    return { ok: true };
  },

  docLink:
    'docs/gofai/semantic-safety-invariants.md#silent-ambiguity-prohibition',
};

// =============================================================================
// Constraint Preservation Invariant (Step 002)
// =============================================================================

/**
 * Aspects that can be preserved.
 */
export type PreservableAspect =
  | 'melody' // Pitch sequence, rhythm, durations
  | 'harmony' // Chord progression, voicings
  | 'rhythm' // Onset patterns, groove
  | 'structure' // Section boundaries, form
  | 'timbre' // Sound design, processing
  | 'dynamics' // Velocity patterns, automation
  | 'register' // Pitch range
  | 'density' // Note count, texture thickness
  | 'width' // Stereo positioning
  | 'tempo'; // Timing, BPM

/**
 * Context for preservation checks.
 */
export interface PreservationContext {
  /** What is being preserved */
  readonly aspect: PreservableAspect;

  /** Target entity reference */
  readonly target: string;

  /** Snapshot before edit */
  readonly before: PreservationSnapshot;

  /** Snapshot after edit */
  readonly after: PreservationSnapshot;
}

/**
 * A snapshot of preservable state.
 */
export interface PreservationSnapshot {
  /** Aspect-specific data */
  readonly data: unknown;

  /** Fingerprint for equality check */
  readonly fingerprint: string;

  /** Timestamp */
  readonly timestamp: number;
}

/**
 * Evidence of preservation violation.
 */
export interface PreservationViolationEvidence {
  /** What aspect was supposed to be preserved */
  readonly aspect: PreservableAspect;

  /** What entity was targeted */
  readonly target: string;

  /** What changed (human-readable) */
  readonly changes: readonly string[];

  /** Before/after fingerprints */
  readonly fingerprints: readonly [string, string];
}

/**
 * Invariant: Preserve constraints are inviolable.
 *
 * ∀ plan P and preserve constraint PRESERVE(target, aspects):
 *   snapshot(target, aspects) before == snapshot(target, aspects) after
 */
export const CONSTRAINT_PRESERVATION_INVARIANT: SemanticInvariant<
  PreservationContext,
  PreservationViolationEvidence
> = {
  id: 'constraint-preservation',
  name: 'Constraint Preservation',
  statement:
    'When a preserve constraint is specified, the preserved aspects must remain byte-for-byte identical after execution.',
  priority: 'P0',
  requiredTests: ['unit', 'property', 'golden', 'fuzzing'],

  check: (context) => {
    const preserved = context.before.fingerprint === context.after.fingerprint;

    if (!preserved) {
      return {
        ok: false,
        violation: {
          invariantId: 'constraint-preservation',
          evidence: {
            aspect: context.aspect,
            target: context.target,
            changes: ['Fingerprint mismatch'], // Detailed diff computed elsewhere
            fingerprints: [
              context.before.fingerprint,
              context.after.fingerprint,
            ],
          },
          message: `Preservation constraint violated: ${context.aspect} of ${context.target} changed`,
          suggestions: [
            'Review the plan to ensure no operations affect the preserved aspect',
            'Add the preserved aspect to operation preconditions',
            'Use a more specific scope to avoid the preserved entity',
          ],
          severity: 'error',
        },
      };
    }
    return { ok: true };
  },

  docLink:
    'docs/gofai/semantic-safety-invariants.md#constraint-preservation',
};

// =============================================================================
// Referent Resolution Completeness (Step 002)
// =============================================================================

/**
 * Context for referent resolution checks.
 */
export interface ReferentResolutionContext {
  /** The referential expression */
  readonly expression: string;

  /** Type of reference */
  readonly referenceType:
    | 'definite'
    | 'demonstrative'
    | 'anaphoric'
    | 'bound'
    | 'name';

  /** Candidate referents */
  readonly candidates: readonly ReferentCandidate[];

  /** Whether resolution succeeded */
  readonly resolved: boolean;

  /** Chosen referent (if resolved) */
  readonly chosen?: ReferentCandidate;
}

/**
 * A candidate referent.
 */
export interface ReferentCandidate {
  /** Entity ID */
  readonly entityId: string;

  /** Entity type */
  readonly entityType: string;

  /** Display name */
  readonly displayName: string;

  /** Match score (0-1) */
  readonly score: number;

  /** Why this is a candidate */
  readonly reason: string;
}

/**
 * Evidence of referent resolution failure.
 */
export interface ReferentResolutionEvidence {
  /** Expression that failed to resolve */
  readonly expression: string;

  /** How many candidates were found */
  readonly candidateCount: number;

  /** Candidates (for clarification) */
  readonly candidates: readonly ReferentCandidate[];
}

/**
 * Invariant: All referential expressions must resolve or fail explicitly.
 *
 * ∀ referential expression R in CPL:
 *   ∃ entities E OR compilation fails with "unresolved reference"
 */
export const REFERENT_RESOLUTION_COMPLETENESS: SemanticInvariant<
  ReferentResolutionContext,
  ReferentResolutionEvidence
> = {
  id: 'referent-resolution-completeness',
  name: 'Referent Resolution Completeness',
  statement:
    'Every referential expression must resolve to exactly one entity, or fail with an explicit unresolved reference error.',
  priority: 'P0',
  requiredTests: ['unit', 'golden'],

  check: (context) => {
    const ambiguous = context.candidates.length > 1 && !context.resolved;
    const unresolved = context.candidates.length === 0;

    if (ambiguous || unresolved) {
      return {
        ok: false,
        violation: {
          invariantId: 'referent-resolution-completeness',
          evidence: {
            expression: context.expression,
            candidateCount: context.candidates.length,
            candidates: context.candidates,
          },
          message: unresolved
            ? `Referential expression '${context.expression}' has no matching entities`
            : `Referential expression '${context.expression}' is ambiguous (${context.candidates.length} candidates)`,
          suggestions: unresolved
            ? [
                'Check if the referenced entity exists in the project',
                'Use a more specific reference',
                'Create the missing entity first',
              ]
            : [
                'Use a more specific reference (e.g., "verse 1" not "the verse")',
                'Prompt user to choose among candidates',
                'Use UI selection to disambiguate',
              ],
          severity: 'error',
        },
      };
    }
    return { ok: true };
  },

  docLink:
    'docs/gofai/semantic-safety-invariants.md#referent-resolution-completeness',
};

// =============================================================================
// Effect Typing Invariant (Step 008)
// =============================================================================

/**
 * Operation effect types.
 */
export type EffectType =
  | 'inspect' // Read-only, never changes state
  | 'propose' // Generates plan but doesn't apply
  | 'mutate'; // Actually modifies project state

/**
 * Context for effect typing checks.
 */
export interface EffectTypingContext {
  /** The operation being checked */
  readonly operationId: OpcodeId;

  /** Declared effect type */
  readonly declaredEffect?: EffectType;

  /** Observed side effects (if any) */
  readonly observedEffects: readonly EffectType[];

  /** Required permission level */
  readonly requiredPermission?: 'none' | 'preview' | 'execute';
}

/**
 * Evidence of effect typing violation.
 */
export interface EffectTypingEvidence {
  /** Operation with type violation */
  readonly operationId: OpcodeId;

  /** What was declared */
  readonly declaredEffect: EffectType | undefined;

  /** What was observed */
  readonly observedEffects: readonly EffectType[];
}

/**
 * Invariant: Every operation has a declared effect type.
 *
 * ∀ operation O in CPL-Plan:
 *   O ∈ {inspect, propose, mutate}
 *   AND effect(O) is declared
 */
export const EFFECT_TYPING_INVARIANT: SemanticInvariant<
  EffectTypingContext,
  EffectTypingEvidence
> = {
  id: 'effect-typing',
  name: 'Effect Typing',
  statement:
    'Every operation must declare its effect type, and observed effects must match the declaration.',
  priority: 'P0',
  requiredTests: ['unit', 'property'],

  check: (context) => {
    if (!context.declaredEffect) {
      return {
        ok: false,
        violation: {
          invariantId: 'effect-typing',
          evidence: {
            operationId: context.operationId,
            declaredEffect: undefined,
            observedEffects: context.observedEffects,
          },
          message: `Operation '${context.operationId}' has no declared effect type`,
          suggestions: [
            'Add effectType field to opcode definition',
            'Choose from: inspect, propose, or mutate',
            'Document the side effects in the opcode description',
          ],
          severity: 'error',
        },
      };
    }

    // Check for effect escalation
    const effectHierarchy: Record<EffectType, number> = {
      inspect: 0,
      propose: 1,
      mutate: 2,
    };

    const declaredLevel = effectHierarchy[context.declaredEffect];
    const maxObserved = Math.max(
      ...context.observedEffects.map((e) => effectHierarchy[e])
    );

    if (maxObserved > declaredLevel) {
      const observedType = context.observedEffects.find(
        (e) => effectHierarchy[e] === maxObserved
      )!;
      return {
        ok: false,
        violation: {
          invariantId: 'effect-typing',
          evidence: {
            operationId: context.operationId,
            declaredEffect: context.declaredEffect,
            observedEffects: context.observedEffects,
          },
          message: `Operation '${context.operationId}' declared as '${context.declaredEffect}' but observed '${observedType}' effects`,
          suggestions: [
            `Update effectType to '${observedType}' to match observed behavior`,
            'Remove the side-effecting code to match declaration',
            'Split into separate operations if mixing effect types',
          ],
          severity: 'error',
        },
      };
    }

    return { ok: true };
  },

  docLink: 'docs/gofai/semantic-safety-invariants.md#effect-typing',
};

// =============================================================================
// Invariant Registry
// =============================================================================

/**
 * All core semantic invariants.
 */
export const CORE_SEMANTIC_INVARIANTS: readonly SemanticInvariant<unknown, unknown>[] = [
  CONSTRAINT_EXECUTABILITY_INVARIANT as SemanticInvariant<unknown, unknown>,
  SILENT_AMBIGUITY_PROHIBITION as SemanticInvariant<unknown, unknown>,
  CONSTRAINT_PRESERVATION_INVARIANT as SemanticInvariant<unknown, unknown>,
  REFERENT_RESOLUTION_COMPLETENESS as SemanticInvariant<unknown, unknown>,
  EFFECT_TYPING_INVARIANT as SemanticInvariant<unknown, unknown>,
  // More invariants will be added in subsequent steps
];

/**
 * Get an invariant by ID.
 */
export function getInvariant(id: InvariantId): SemanticInvariant | undefined {
  return CORE_SEMANTIC_INVARIANTS.find((inv) => inv.id === id);
}

/**
 * Check all invariants for a given context type.
 */
export function checkInvariants<T>(
  contexts: ReadonlyMap<InvariantId, T>
): ReadonlyMap<InvariantId, InvariantResult<unknown>> {
  const results = new Map<InvariantId, InvariantResult<unknown>>();

  for (const invariant of CORE_SEMANTIC_INVARIANTS) {
    const context = contexts.get(invariant.id);
    if (context !== undefined) {
      const result = invariant.check(context);
      results.set(invariant.id, result);
    }
  }

  return results;
}

/**
 * Check if all invariants passed.
 */
export function allInvariantsOk(
  results: ReadonlyMap<InvariantId, InvariantResult<unknown>>
): boolean {
  return Array.from(results.values()).every((r) => r.ok);
}

/**
 * Get all violations from check results.
 */
export function getViolations(
  results: ReadonlyMap<InvariantId, InvariantResult<unknown>>
): readonly InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  for (const result of results.values()) {
    if (!result.ok) {
      violations.push(result.violation);
    }
  }
  return violations;
}

/**
 * Format violations for display.
 */
export function formatViolations(
  violations: readonly InvariantViolation[]
): string {
  if (violations.length === 0) {
    return 'All semantic invariants satisfied.';
  }

  const lines: string[] = [
    `${violations.length} semantic invariant violation(s):`,
    '',
  ];

  for (const v of violations) {
    lines.push(`[${v.severity.toUpperCase()}] ${v.invariantId}`);
    lines.push(`  ${v.message}`);
    if (v.location) {
      lines.push(`  at ${v.location.source}`);
    }
    if (v.suggestions && v.suggestions.length > 0) {
      lines.push(`  Suggestions:`);
      for (const suggestion of v.suggestions) {
        lines.push(`    - ${suggestion}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
