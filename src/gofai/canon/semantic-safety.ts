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
// Determinism Invariant (Step 002)
// =============================================================================

/**
 * Context for determinism checks.
 */
export interface DeterminismContext {
  /** The operation being checked */
  readonly operationId: string;

  /** Input to the operation */
  readonly input: unknown;

  /** First execution result fingerprint */
  readonly result1Fingerprint: string;

  /** Second execution result fingerprint */
  readonly result2Fingerprint: string;

  /** Whether the operation uses Date.now() or Math.random() */
  readonly usesNondeterministicApis: boolean;

  /** Nondeterministic API calls detected */
  readonly detectedApis?: readonly string[];
}

/**
 * Evidence of a determinism violation.
 */
export interface DeterminismViolationEvidence {
  /** The operation that is nondeterministic */
  readonly operationId: string;

  /** The two different result fingerprints */
  readonly fingerprints: readonly [string, string];

  /** Which nondeterministic APIs were used */
  readonly nondeterministicApis: readonly string[];
}

/**
 * Invariant: Same input + same state = same output, always.
 *
 * ∀ operation O, input I, state S:
 *   O(I, S) === O(I, S)
 *   AND O uses no nondeterministic APIs (Date.now, Math.random, network)
 */
export const DETERMINISM_INVARIANT: SemanticInvariant<
  DeterminismContext,
  DeterminismViolationEvidence
> = {
  id: 'determinism',
  name: 'Determinism',
  statement:
    'Every operation must produce identical output given identical input and state. ' +
    'No operation may use Date.now(), Math.random(), or network calls in the semantics/planning path.',
  priority: 'P0',
  requiredTests: ['unit', 'property', 'golden'],

  check: (context) => {
    // Check for nondeterministic API usage
    if (context.usesNondeterministicApis) {
      return {
        ok: false,
        violation: {
          invariantId: 'determinism',
          evidence: {
            operationId: context.operationId,
            fingerprints: [context.result1Fingerprint, context.result2Fingerprint],
            nondeterministicApis: context.detectedApis ?? [],
          },
          message: `Operation '${context.operationId}' uses nondeterministic APIs: ${(context.detectedApis ?? []).join(', ')}`,
          suggestions: [
            'Replace Date.now() with timestamps passed via execution metadata',
            'Replace Math.random() with deterministic seed-based alternatives',
            'Remove network calls from the semantics/planning path',
            'Isolate timestamps to execution metadata only',
          ],
          severity: 'error',
        },
      };
    }

    // Check that repeated execution produces identical results
    if (context.result1Fingerprint !== context.result2Fingerprint) {
      return {
        ok: false,
        violation: {
          invariantId: 'determinism',
          evidence: {
            operationId: context.operationId,
            fingerprints: [context.result1Fingerprint, context.result2Fingerprint],
            nondeterministicApis: [],
          },
          message: `Operation '${context.operationId}' produced different results on repeated execution`,
          suggestions: [
            'Check for hidden mutable state affecting output',
            'Ensure Map/Set iteration order is stable',
            'Use deterministic sorting for all collections',
            'Check for closure-captured mutable variables',
          ],
          severity: 'error',
        },
      };
    }

    return { ok: true };
  },

  docLink: 'docs/gofai/semantic-safety-invariants.md#determinism',
};

// =============================================================================
// Undoability Invariant (Step 002)
// =============================================================================

/**
 * Context for undoability checks.
 */
export interface UndoabilityContext {
  /** The operation being checked */
  readonly operationId: string;

  /** Whether the operation produces an undo token */
  readonly producesUndoToken: boolean;

  /** Whether the undo token is valid (can actually reverse the operation) */
  readonly undoTokenValid: boolean;

  /** State fingerprint before the operation */
  readonly stateBefore: string;

  /** State fingerprint after the operation */
  readonly stateAfter: string;

  /** State fingerprint after undo */
  readonly stateAfterUndo?: string;

  /** Whether undo restores original state exactly */
  readonly undoRestoresState: boolean;
}

/**
 * Evidence of an undoability violation.
 */
export interface UndoabilityViolationEvidence {
  /** The operation that cannot be undone */
  readonly operationId: string;

  /** Whether undo token was missing or invalid */
  readonly tokenIssue: 'missing' | 'invalid' | 'incomplete_restore';

  /** State fingerprints for diagnosis */
  readonly stateFingerprints: {
    readonly before: string;
    readonly after: string;
    readonly afterUndo: string | undefined;
  };
}

/**
 * Invariant: Every mutation is reversible via undo token.
 *
 * ∀ mutation M:
 *   ∃ undo token T such that:
 *     apply(M) produces T
 *     AND apply(T) restores state exactly
 */
export const UNDOABILITY_INVARIANT: SemanticInvariant<
  UndoabilityContext,
  UndoabilityViolationEvidence
> = {
  id: 'undoability',
  name: 'Undoability',
  statement:
    'Every mutation must produce a valid undo token. Applying the undo token must restore ' +
    'the project state to its exact pre-mutation fingerprint.',
  priority: 'P0',
  requiredTests: ['unit', 'property', 'golden', 'fuzzing'],

  check: (context) => {
    if (!context.producesUndoToken) {
      return {
        ok: false,
        violation: {
          invariantId: 'undoability',
          evidence: {
            operationId: context.operationId,
            tokenIssue: 'missing',
            stateFingerprints: {
              before: context.stateBefore,
              after: context.stateAfter,
              afterUndo: undefined,
            },
          },
          message: `Operation '${context.operationId}' does not produce an undo token`,
          suggestions: [
            'Return an UndoToken from the apply function',
            'Capture before-state snapshot for undo',
            'Use transactional execution to enable automatic undo',
          ],
          severity: 'error',
        },
      };
    }

    if (!context.undoTokenValid) {
      return {
        ok: false,
        violation: {
          invariantId: 'undoability',
          evidence: {
            operationId: context.operationId,
            tokenIssue: 'invalid',
            stateFingerprints: {
              before: context.stateBefore,
              after: context.stateAfter,
              afterUndo: undefined,
            },
          },
          message: `Operation '${context.operationId}' produces an invalid undo token`,
          suggestions: [
            'Verify the undo token captures all changed state',
            'Ensure the undo operation is the exact inverse',
            'Test with property-based roundtrip checks',
          ],
          severity: 'error',
        },
      };
    }

    if (!context.undoRestoresState) {
      return {
        ok: false,
        violation: {
          invariantId: 'undoability',
          evidence: {
            operationId: context.operationId,
            tokenIssue: 'incomplete_restore',
            stateFingerprints: {
              before: context.stateBefore,
              after: context.stateAfter,
              afterUndo: context.stateAfterUndo,
            },
          },
          message: `Operation '${context.operationId}' undo does not restore original state`,
          suggestions: [
            'Compare state fingerprints before and after undo',
            'Check for state leaked outside the undo scope',
            'Ensure all side effects are captured in the undo token',
          ],
          severity: 'error',
        },
      };
    }

    return { ok: true };
  },

  docLink: 'docs/gofai/semantic-safety-invariants.md#undoability',
};

// =============================================================================
// Scope Visibility Invariant (Step 002)
// =============================================================================

/**
 * Context for scope visibility checks.
 */
export interface ScopeVisibilityContext {
  /** The operation being checked */
  readonly operationId: string;

  /** The declared scope of the operation */
  readonly declaredScope: ScopeDescriptor;

  /** Entities actually affected by the operation */
  readonly affectedEntities: readonly string[];

  /** Entities that should have been in scope but weren't */
  readonly outOfScopeEffects: readonly string[];

  /** Whether the scope was communicated to the user */
  readonly scopeDisplayed: boolean;
}

/**
 * Descriptor for an operation's scope.
 */
export interface ScopeDescriptor {
  /** Scope type */
  readonly type: 'section' | 'layer' | 'global' | 'selection' | 'card';

  /** Human-readable description */
  readonly description: string;

  /** Entity IDs included in scope */
  readonly includedEntities: readonly string[];
}

/**
 * Evidence of scope visibility violation.
 */
export interface ScopeVisibilityEvidence {
  /** The operation with scope issues */
  readonly operationId: string;

  /** Entities affected outside declared scope */
  readonly outOfScopeEntities: readonly string[];

  /** Whether scope was hidden from user */
  readonly scopeHidden: boolean;
}

/**
 * Invariant: Operations must not affect entities outside their declared scope,
 * and scope must always be visible to the user.
 *
 * ∀ operation O with scope S:
 *   affected(O) ⊆ entities(S)
 *   AND S is displayed to user
 */
export const SCOPE_VISIBILITY_INVARIANT: SemanticInvariant<
  ScopeVisibilityContext,
  ScopeVisibilityEvidence
> = {
  id: 'scope-visibility',
  name: 'Scope Visibility',
  statement:
    'Every operation must declare its scope, the scope must be visible to the user, ' +
    'and no operation may affect entities outside its declared scope.',
  priority: 'P1',
  requiredTests: ['unit', 'property', 'golden'],

  check: (context) => {
    if (context.outOfScopeEffects.length > 0) {
      return {
        ok: false,
        violation: {
          invariantId: 'scope-visibility',
          evidence: {
            operationId: context.operationId,
            outOfScopeEntities: context.outOfScopeEffects,
            scopeHidden: !context.scopeDisplayed,
          },
          message: `Operation '${context.operationId}' affected ${context.outOfScopeEffects.length} entities outside its declared scope`,
          suggestions: [
            'Widen the declared scope to include all affected entities',
            'Add scope constraints to prevent out-of-scope effects',
            'Split the operation into per-scope sub-operations',
          ],
          severity: 'error',
        },
      };
    }

    if (!context.scopeDisplayed) {
      return {
        ok: false,
        violation: {
          invariantId: 'scope-visibility',
          evidence: {
            operationId: context.operationId,
            outOfScopeEntities: [],
            scopeHidden: true,
          },
          message: `Operation '${context.operationId}' does not display its scope to the user`,
          suggestions: [
            'Add scope highlighting in the UI',
            'Include scope description in the plan preview',
            'Show affected bar ranges and layers',
          ],
          severity: 'warning',
        },
      };
    }

    return { ok: true };
  },

  docLink: 'docs/gofai/semantic-safety-invariants.md#scope-visibility',
};

// =============================================================================
// Plan Explainability Invariant (Step 002)
// =============================================================================

/**
 * Context for plan explainability checks.
 */
export interface PlanExplainabilityContext {
  /** The plan being checked */
  readonly planId: string;

  /** Goals in the request */
  readonly goals: readonly string[];

  /** Plan steps */
  readonly planSteps: readonly PlanStepExplanation[];

  /** Whether every goal is linked to at least one step */
  readonly allGoalsCovered: boolean;

  /** Whether every step has a reason */
  readonly allStepsExplained: boolean;
}

/**
 * A plan step with its explanation link.
 */
export interface PlanStepExplanation {
  /** Step identifier */
  readonly stepId: string;

  /** Which goal(s) this step serves */
  readonly servesGoals: readonly string[];

  /** Human-readable reason */
  readonly reason: string;

  /** Whether the step has a clear reason */
  readonly hasReason: boolean;
}

/**
 * Evidence of plan explainability violation.
 */
export interface PlanExplainabilityEvidence {
  /** Plan with explainability issues */
  readonly planId: string;

  /** Goals not covered by any step */
  readonly uncoveredGoals: readonly string[];

  /** Steps without reasons */
  readonly unexplainedSteps: readonly string[];
}

/**
 * Invariant: Every plan must be explainable — each step linked to a goal
 * with a human-readable reason.
 *
 * ∀ plan P:
 *   ∀ goal G in P: ∃ step S such that S.servesGoals includes G
 *   AND ∀ step S in P: S.reason is non-empty
 */
export const PLAN_EXPLAINABILITY_INVARIANT: SemanticInvariant<
  PlanExplainabilityContext,
  PlanExplainabilityEvidence
> = {
  id: 'plan-explainability',
  name: 'Plan Explainability',
  statement:
    'Every plan step must link to at least one goal it serves, and every goal ' +
    'must be addressed by at least one plan step. Each step must carry a human-readable reason.',
  priority: 'P1',
  requiredTests: ['unit', 'golden'],

  check: (context) => {
    const coveredGoals = new Set<string>();
    const unexplainedSteps: string[] = [];

    for (const step of context.planSteps) {
      for (const goalId of step.servesGoals) {
        coveredGoals.add(goalId);
      }
      if (!step.hasReason || step.reason.trim() === '') {
        unexplainedSteps.push(step.stepId);
      }
    }

    const uncoveredGoals = context.goals.filter(g => !coveredGoals.has(g));

    if (uncoveredGoals.length > 0 || unexplainedSteps.length > 0) {
      return {
        ok: false,
        violation: {
          invariantId: 'plan-explainability',
          evidence: {
            planId: context.planId,
            uncoveredGoals,
            unexplainedSteps,
          },
          message: uncoveredGoals.length > 0
            ? `Plan has ${uncoveredGoals.length} goal(s) not addressed by any step`
            : `Plan has ${unexplainedSteps.length} step(s) without reasons`,
          suggestions: [
            ...(uncoveredGoals.length > 0
              ? ['Add plan steps to address uncovered goals', 'Report uncovered goals as unsatisfiable']
              : []),
            ...(unexplainedSteps.length > 0
              ? ['Add reason strings to all plan steps', 'Link steps to the goals they serve']
              : []),
          ],
          severity: uncoveredGoals.length > 0 ? 'error' : 'warning',
        },
      };
    }

    return { ok: true };
  },

  docLink: 'docs/gofai/semantic-safety-invariants.md#plan-explainability',
};

// =============================================================================
// Constraint Compatibility Invariant (Step 002)
// =============================================================================

/**
 * Context for constraint compatibility checks.
 */
export interface ConstraintCompatibilityContext {
  /** All constraints in the request */
  readonly constraints: readonly ConstraintPair[];

  /** Whether any pair is incompatible */
  readonly hasIncompatiblePair: boolean;

  /** The incompatible pairs (if any) */
  readonly incompatiblePairs: readonly ConstraintConflict[];
}

/**
 * A pair of constraints for compatibility checking.
 */
export interface ConstraintPair {
  /** Constraint identifier */
  readonly id: string;

  /** Constraint type */
  readonly type: string;

  /** Human-readable description */
  readonly description: string;
}

/**
 * A conflict between two constraints.
 */
export interface ConstraintConflict {
  /** First constraint */
  readonly constraint1: string;

  /** Second constraint */
  readonly constraint2: string;

  /** Why they conflict */
  readonly reason: string;

  /** Suggested resolution */
  readonly resolution: string;
}

/**
 * Evidence of constraint compatibility violation.
 */
export interface ConstraintCompatibilityEvidence {
  /** Number of conflicts */
  readonly conflictCount: number;

  /** The conflicts */
  readonly conflicts: readonly ConstraintConflict[];
}

/**
 * Invariant: All constraints in a request must be mutually compatible.
 * Incompatible constraints must be reported before planning.
 *
 * ∀ constraint set C:
 *   ∀ c1, c2 ∈ C: compatible(c1, c2)
 *   OR report conflict with suggested resolution
 */
export const CONSTRAINT_COMPATIBILITY_INVARIANT: SemanticInvariant<
  ConstraintCompatibilityContext,
  ConstraintCompatibilityEvidence
> = {
  id: 'constraint-compatibility',
  name: 'Constraint Compatibility',
  statement:
    'All constraints in a request must be mutually satisfiable. Incompatible constraints ' +
    'must be detected and reported before planning begins, with suggested resolutions.',
  priority: 'P1',
  requiredTests: ['unit', 'property'],

  check: (context) => {
    if (context.hasIncompatiblePair && context.incompatiblePairs.length > 0) {
      return {
        ok: false,
        violation: {
          invariantId: 'constraint-compatibility',
          evidence: {
            conflictCount: context.incompatiblePairs.length,
            conflicts: context.incompatiblePairs,
          },
          message: `${context.incompatiblePairs.length} constraint conflict(s) detected`,
          suggestions: context.incompatiblePairs.map(p => p.resolution),
          severity: 'error',
        },
      };
    }

    return { ok: true };
  },

  docLink: 'docs/gofai/semantic-safety-invariants.md#constraint-compatibility',
};

// =============================================================================
// Presupposition Verification Invariant (Step 002)
// =============================================================================

/**
 * Context for presupposition verification checks.
 */
export interface PresuppositionVerificationContext {
  /** The utterance being checked */
  readonly utterance: string;

  /** Presuppositions detected */
  readonly presuppositions: readonly PresuppositionCheck[];

  /** Whether all presuppositions are satisfied */
  readonly allSatisfied: boolean;
}

/**
 * A presupposition and its verification status.
 */
export interface PresuppositionCheck {
  /** What is presupposed */
  readonly description: string;

  /** The triggering expression */
  readonly trigger: string;

  /** Whether the presupposition holds in the current project state */
  readonly satisfied: boolean;

  /** Why it fails (if unsatisfied) */
  readonly failureReason?: string;

  /** Type of presupposition */
  readonly type: PresuppositionType;
}

/**
 * Types of presupposition.
 */
export type PresuppositionType =
  | 'existential'    // "the chorus" presupposes a chorus exists
  | 'factive'        // "I like how the melody goes" presupposes a melody exists
  | 'aspectual'      // "stop the drums" presupposes drums are playing
  | 'iterative'      // "do it again" presupposes a previous action
  | 'change_of_state' // "make it brighter" presupposes it has brightness
  | 'temporal';      // "before the drop" presupposes a drop exists

/**
 * Evidence of presupposition verification violation.
 */
export interface PresuppositionViolationEvidence {
  /** The utterance */
  readonly utterance: string;

  /** Failed presuppositions */
  readonly failedPresuppositions: readonly PresuppositionCheck[];
}

/**
 * Invariant: All presuppositions in an utterance must be verified against
 * the current project state before proceeding.
 *
 * ∀ utterance U with presuppositions P1..Pn:
 *   ∀ Pi: verify(Pi, projectState) OR fail with explanation
 */
export const PRESUPPOSITION_VERIFICATION_INVARIANT: SemanticInvariant<
  PresuppositionVerificationContext,
  PresuppositionViolationEvidence
> = {
  id: 'presupposition-verification',
  name: 'Presupposition Verification',
  statement:
    'All presuppositions in an utterance must be verified against the project state. ' +
    'Failed presuppositions must produce clear error messages explaining what is missing.',
  priority: 'P1',
  requiredTests: ['unit', 'golden'],

  check: (context) => {
    const failed = context.presuppositions.filter(p => !p.satisfied);

    if (failed.length > 0) {
      return {
        ok: false,
        violation: {
          invariantId: 'presupposition-verification',
          evidence: {
            utterance: context.utterance,
            failedPresuppositions: failed,
          },
          message: `${failed.length} presupposition(s) failed: ${failed.map(p => p.description).join('; ')}`,
          suggestions: failed.map(p =>
            p.failureReason ?? `Verify that ${p.description}`
          ),
          severity: 'error',
        },
      };
    }

    return { ok: true };
  },

  docLink: 'docs/gofai/semantic-safety-invariants.md#presupposition-verification',
};

// =============================================================================
// Extension Isolation Invariant (Step 002)
// =============================================================================

/**
 * Context for extension isolation checks.
 */
export interface ExtensionIsolationContext {
  /** The extension being checked */
  readonly extensionId: string;

  /** Extension namespace */
  readonly namespace: string;

  /** Whether the extension attempts to mutate core state directly */
  readonly attemptsCoreStateMutation: boolean;

  /** Whether the extension uses namespaced IDs */
  readonly usesNamespacedIds: boolean;

  /** IDs contributed by the extension */
  readonly contributedIds: readonly string[];

  /** IDs that conflict with core or other extensions */
  readonly conflictingIds: readonly string[];

  /** Whether the extension's Prolog module uses namespaced predicates */
  readonly prologNamespaced: boolean;

  /** Whether execution hooks are gated by trust level */
  readonly executionGated: boolean;
}

/**
 * Evidence of extension isolation violation.
 */
export interface ExtensionIsolationEvidence {
  /** The offending extension */
  readonly extensionId: string;

  /** The namespace */
  readonly namespace: string;

  /** Specific violations */
  readonly violations: readonly ExtensionIsolationViolationType[];
}

/**
 * Types of extension isolation violation.
 */
export type ExtensionIsolationViolationType =
  | { readonly type: 'core_mutation'; readonly description: string }
  | { readonly type: 'non_namespaced_id'; readonly ids: readonly string[] }
  | { readonly type: 'id_conflict'; readonly conflictingIds: readonly string[] }
  | { readonly type: 'prolog_not_namespaced'; readonly predicates: readonly string[] }
  | { readonly type: 'ungated_execution'; readonly operations: readonly string[] };

/**
 * Invariant: Extensions must be fully isolated from core and from each other.
 * All extension contributions must be namespaced, execution must be gated,
 * and extensions must never directly mutate core state.
 *
 * ∀ extension E:
 *   E cannot mutate core state directly
 *   AND all E's IDs are namespaced
 *   AND E's Prolog predicates are namespaced
 *   AND E's execution hooks are gated by trust level
 */
export const EXTENSION_ISOLATION_INVARIANT: SemanticInvariant<
  ExtensionIsolationContext,
  ExtensionIsolationEvidence
> = {
  id: 'extension-isolation',
  name: 'Extension Isolation',
  statement:
    'Extensions must be fully isolated: namespaced IDs, no direct core state mutation, ' +
    'namespaced Prolog predicates, and execution gated by trust level.',
  priority: 'P0',
  requiredTests: ['unit', 'property', 'integration'],

  check: (context) => {
    const violations: ExtensionIsolationViolationType[] = [];

    if (context.attemptsCoreStateMutation) {
      violations.push({
        type: 'core_mutation',
        description: `Extension '${context.extensionId}' attempts to mutate core state directly`,
      });
    }

    if (!context.usesNamespacedIds) {
      const nonNamespaced = context.contributedIds.filter(
        id => !id.startsWith(`${context.namespace}:`)
      );
      if (nonNamespaced.length > 0) {
        violations.push({
          type: 'non_namespaced_id',
          ids: nonNamespaced,
        });
      }
    }

    if (context.conflictingIds.length > 0) {
      violations.push({
        type: 'id_conflict',
        conflictingIds: context.conflictingIds,
      });
    }

    if (!context.prologNamespaced) {
      violations.push({
        type: 'prolog_not_namespaced',
        predicates: [],
      });
    }

    if (!context.executionGated) {
      violations.push({
        type: 'ungated_execution',
        operations: [],
      });
    }

    if (violations.length > 0) {
      return {
        ok: false,
        violation: {
          invariantId: 'extension-isolation',
          evidence: {
            extensionId: context.extensionId,
            namespace: context.namespace,
            violations,
          },
          message: `Extension '${context.extensionId}' has ${violations.length} isolation violation(s)`,
          suggestions: [
            ...(context.attemptsCoreStateMutation
              ? ['Return pure patch proposals instead of mutating core state directly']
              : []),
            ...(!context.usesNamespacedIds
              ? [`Prefix all IDs with '${context.namespace}:'`]
              : []),
            ...(context.conflictingIds.length > 0
              ? ['Rename conflicting IDs to avoid collisions']
              : []),
            ...(!context.prologNamespaced
              ? ['Use namespaced module names for Prolog predicates']
              : []),
            ...(!context.executionGated
              ? ['Gate execution hooks behind trust-level checks']
              : []),
          ],
          severity: 'error',
        },
      };
    }

    return { ok: true };
  },

  docLink: 'docs/gofai/semantic-safety-invariants.md#extension-isolation',
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
  DETERMINISM_INVARIANT as SemanticInvariant<unknown, unknown>,
  UNDOABILITY_INVARIANT as SemanticInvariant<unknown, unknown>,
  SCOPE_VISIBILITY_INVARIANT as SemanticInvariant<unknown, unknown>,
  PLAN_EXPLAINABILITY_INVARIANT as SemanticInvariant<unknown, unknown>,
  CONSTRAINT_COMPATIBILITY_INVARIANT as SemanticInvariant<unknown, unknown>,
  PRESUPPOSITION_VERIFICATION_INVARIANT as SemanticInvariant<unknown, unknown>,
  EXTENSION_ISOLATION_INVARIANT as SemanticInvariant<unknown, unknown>,
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
