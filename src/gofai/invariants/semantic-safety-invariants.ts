/**
 * GOFAI Semantic Safety Invariants — Comprehensive Definition
 *
 * Step 002: Define "semantic safety invariants" as executable checks.
 *
 * This module defines the complete set of semantic safety invariants that
 * must hold throughout the GOFAI compilation and execution pipeline.
 * Each invariant is:
 *   1. Testable (executable predicate)
 *   2. Versioned (stable across CPL schema updates)
 *   3. Documented with rationale and failure modes
 *   4. Mapped to mitigation strategies
 *
 * Philosophy: Invariants are NOT aspirational documentation. They are
 * runtime checks that can block execution or trigger clarification.
 *
 * @module gofai/invariants/semantic-safety-invariants
 */

import type {
  InvariantId,
  InvariantDefinition,
  InvariantCategory,
  ViolationEvidence,
} from './types.js';
import { invariantId } from './types.js';

// =============================================================================
// Invariant Categories and Registry
// =============================================================================

/**
 * Categories of semantic safety invariants organized by compilation stage.
 */
export const INVARIANT_CATEGORIES = {
  // Parsing stage
  AMBIGUITY_PROHIBITION: 'ambiguity-prohibition' as InvariantCategory,
  REFERENT_RESOLUTION: 'referent-resolution' as InvariantCategory,
  PRESUPPOSITION: 'presupposition' as InvariantCategory,

  // Semantic/pragmatic stage
  CONSTRAINT_EXECUTABILITY: 'constraint-executability' as InvariantCategory,
  CONSTRAINT_COMPATIBILITY: 'constraint-compatibility' as InvariantCategory,
  SCOPE_VISIBILITY: 'scope-visibility' as InvariantCategory,

  // Planning stage
  EFFECT_TYPING: 'effect-typing' as InvariantCategory,
  PRESERVATION: 'preservation' as InvariantCategory,
  DETERMINISM: 'determinism' as InvariantCategory,

  // Execution stage
  UNDOABILITY: 'undoability' as InvariantCategory,
  EXPLAINABILITY: 'explainability' as InvariantCategory,

  // Extension stage
  EXTENSION_ISOLATION: 'extension-isolation' as InvariantCategory,
} as const;

// =============================================================================
// Core Invariant Definitions
// =============================================================================

/**
 * INV-001: No Silent Ambiguity Resolution
 *
 * Rationale: Users must never be surprised by which interpretation was chosen.
 * If multiple formal meanings exist with materially different effects, the
 * system MUST ask for clarification or present explicit options.
 *
 * Failure mode: System picks interpretation A when user meant B, causing
 * wrong edits without explicit choice.
 *
 * Mitigation: Parse forest scoring + ambiguity threshold + clarification UI.
 */
export const INV_NO_SILENT_AMBIGUITY: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-001-no-silent-ambiguity'),
  name: 'No Silent Ambiguity Resolution',
  category: INVARIANT_CATEGORIES.AMBIGUITY_PROHIBITION,
  description:
    'When multiple parse interpretations exist with materially different ' +
    'execution effects, the system must not silently choose one. Instead, ' +
    'it must trigger clarification or show options.',
  severity: 'critical', enabled: true,
  check: (state, operation) => {
    // Implementation note: This check happens in parse/disambiguate stage
    // Check that ambiguity score threshold is not exceeded without clarification
    const result = checkAmbiguityThreshold(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_NO_SILENT_AMBIGUITY.id,
        severity: INV_NO_SILENT_AMBIGUITY.severity,
        message: 'Ambiguous parse resolved without clarification',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

/**
 * INV-002: Constraints Must Be Executable
 *
 * Rationale: "Keep melody exact" or "don't change chords" are not documentation.
 * They are executable predicates that must be checked against actual diffs.
 *
 * Failure mode: User specifies "preserve X" but system silently violates it
 * because constraint was not actually enforced.
 *
 * Mitigation: Every constraint type has a verifier function that inspects
 * before/after state and reports violations.
 */
export const INV_CONSTRAINTS_EXECUTABLE: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-002-constraints-executable'),
  name: 'Constraints Must Be Executable',
  category: INVARIANT_CATEGORIES.CONSTRAINT_EXECUTABILITY,
  description:
    'Every constraint in CPL must have a corresponding executable checker ' +
    'that can validate whether the constraint is satisfied by comparing ' +
    'before and after states.',
  severity: 'critical', enabled: true,
  check: (state, operation) => {
    const result = checkConstraintExecutability(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_CONSTRAINTS_EXECUTABLE.id,
        severity: INV_CONSTRAINTS_EXECUTABLE.severity,
        message: 'Constraint declared without executable verifier',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

/**
 * INV-003: Referents Must Resolve or Trigger Clarification
 *
 * Rationale: Pronouns ("it", "that chorus") must bind to entities in the
 * project world or dialogue state. If no unique binding exists, ask.
 *
 * Failure mode: "that chorus" binds to wrong chorus because salience model
 * is stale or user meant a different one.
 *
 * Mitigation: Symbol table + salience tracker + explicit clarification when
 * multiple candidates exist.
 */
export const INV_REFERENTS_RESOLVE: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-003-referents-resolve'),
  name: 'Referents Must Resolve or Trigger Clarification',
  category: INVARIANT_CATEGORIES.REFERENT_RESOLUTION,
  description:
    'All referential expressions (pronouns, demonstratives, definite NPs) ' +
    'must resolve to unique entities in the project world or dialogue state. ' +
    'If ambiguous, system must clarify.',
  severity: 'error', enabled: true,
  check: (state, operation) => {
    const result = checkReferentResolution(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_REFERENTS_RESOLVE.id,
        severity: INV_REFERENTS_RESOLVE.severity,
        message: 'Referent failed to resolve uniquely',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

/**
 * INV-004: Scope Must Be Visible and Validated
 *
 * Rationale: "In the chorus" only makes sense if a chorus exists. Edits
 * must target entities that are present in the project.
 *
 * Failure mode: System attempts to edit section that doesn't exist, or
 * applies edit to wrong scope due to stale binding.
 *
 * Mitigation: Scope validator that checks project world before planning.
 */
export const INV_SCOPE_VISIBLE: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-004-scope-visible'),
  name: 'Scope Must Be Visible and Validated',
  category: INVARIANT_CATEGORIES.SCOPE_VISIBILITY,
  description:
    'Every CPL scope expression must resolve to existing entities in the ' +
    'current project state. References to non-existent sections, layers, ' +
    'or cards must be rejected with helpful error messages.',
  severity: 'error', enabled: true,
  check: (state, operation) => {
    const result = checkScopeVisibility(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_SCOPE_VISIBLE.id,
        severity: INV_SCOPE_VISIBLE.severity,
        message: 'Scope references non-existent entity',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

/**
 * INV-005: Presuppositions Must Be Satisfied
 *
 * Rationale: "Keep the melody" presupposes a melody layer exists. "Make it
 * wider" presupposes production layer capability. Check before planning.
 *
 * Failure mode: Plan fails at execution because precondition was not checked.
 *
 * Mitigation: Presupposition checker validates all implicit requirements.
 */
export const INV_PRESUPPOSITIONS_SATISFIED: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-005-presuppositions-satisfied'),
  name: 'Presuppositions Must Be Satisfied',
  category: INVARIANT_CATEGORIES.PRESUPPOSITION,
  description:
    'Utterances carry presuppositions (implicit requirements). These must ' +
    'be validated against project world before planning. Examples: "keep X" ' +
    'presupposes X exists; "wider" presupposes production capability.',
  severity: 'error', enabled: true,
  check: (state, operation) => {
    const result = checkPresuppositions(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_PRESUPPOSITIONS_SATISFIED.id,
        severity: INV_PRESUPPOSITIONS_SATISFIED.severity,
        message: 'Presupposition not satisfied',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

/**
 * INV-006: Effect Types Must Match Board Policy
 *
 * Rationale: A "full manual" board should never execute mutation effects
 * without explicit apply. Only inspect/propose effects are safe by default.
 *
 * Failure mode: GOFAI mutates project in manual board, violating user trust.
 *
 * Mitigation: Effect type system + board capability checks + gating.
 */
export const INV_EFFECT_TYPES_MATCH_POLICY: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-006-effect-types-match-policy'),
  name: 'Effect Types Must Match Board Policy',
  category: INVARIANT_CATEGORIES.EFFECT_TYPING,
  description:
    'Plans have effect types (inspect, propose, mutate). Board control ' +
    'level determines which are allowed. Manual boards require explicit ' +
    'apply for mutations; collaborative boards allow propose; generative ' +
    'boards may allow direct mutation with undo.',
  severity: 'critical', enabled: true,
  check: (state, operation) => {
    const result = checkEffectTypePolicy(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_EFFECT_TYPES_MATCH_POLICY.id,
        severity: INV_EFFECT_TYPES_MATCH_POLICY.severity,
        message: 'Effect type violates board policy',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

/**
 * INV-007: Preservation Constraints Must Be Verified Post-Execution
 *
 * Rationale: If user says "keep melody exact", the diff MUST show melody
 * unchanged. This is checked after execution, not trusted to planner intent.
 *
 * Failure mode: Planner thinks it preserved X but didn't; user gets wrong edit.
 *
 * Mitigation: Post-execution diff checker validates all preserve constraints.
 */
export const INV_PRESERVATION_VERIFIED: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-007-preservation-verified'),
  name: 'Preservation Constraints Verified Post-Execution',
  category: INVARIANT_CATEGORIES.PRESERVATION,
  description:
    'When a CPL constraint specifies preservation (e.g., preserve melody ' +
    'exact), the system must verify after execution that the constraint ' +
    'is satisfied by comparing before/after diffs. Violations must trigger ' +
    'rollback or explicit override.',
  severity: 'critical', enabled: true,
  check: (state, operation) => {
    const result = checkPreservationConstraints(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_PRESERVATION_VERIFIED.id,
        severity: INV_PRESERVATION_VERIFIED.severity,
        message: 'Preservation constraint violated after execution',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

/**
 * INV-008: Compiler Must Be Deterministic
 *
 * Rationale: Same input + same project state → same CPL/plan. No random
 * choices, no Date.now() in semantics. Enables replay and debugging.
 *
 * Failure mode: Paraphrases compile to different meanings; bugs are unreproducible.
 *
 * Mitigation: Determinism policy + no random/time in core pipeline + stable sorting.
 */
export const INV_COMPILER_DETERMINISTIC: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-008-compiler-deterministic'),
  name: 'Compiler Must Be Deterministic',
  category: INVARIANT_CATEGORIES.DETERMINISM,
  description:
    'Given identical input utterance and project state, the compiler must ' +
    'produce identical CPL and plan. No randomness, no Date.now() in core ' +
    'pipeline. Timestamps are metadata only.',
  severity: 'error', enabled: true,
  check: (state, operation) => {
    const result = checkDeterminism(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_COMPILER_DETERMINISTIC.id,
        severity: INV_COMPILER_DETERMINISTIC.severity,
        message: 'Non-deterministic behavior detected',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

/**
 * INV-009: Every Edit Must Have Undo Token
 *
 * Rationale: Users must be able to undo any applied edit. Undo tokens are
 * linear resources: apply → token, token + undo → original state.
 *
 * Failure mode: Edit is applied but cannot be undone; user loses work.
 *
 * Mitigation: EditPackage system + undo integration with CardPlay store.
 */
export const INV_EDITS_UNDOABLE: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-009-edits-undoable'),
  name: 'Every Edit Must Have Undo Token',
  category: INVARIANT_CATEGORIES.UNDOABILITY,
  description:
    'Every applied edit must yield an undo token that can be consumed to ' +
    'restore the previous state. Undo must be deterministic and complete.',
  severity: 'critical', enabled: true,
  check: (state, operation) => {
    const result = checkUndoability(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_EDITS_UNDOABLE.id,
        severity: INV_EDITS_UNDOABLE.severity,
        message: 'Edit applied without undo token',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

/**
 * INV-010: Every Action Must Be Explainable
 *
 * Rationale: User should always be able to ask "what changed?" and "why?".
 * Provenance must link each diff item to the goal it serves.
 *
 * Failure mode: User sees changes but can't understand rationale; trust erodes.
 *
 * Mitigation: Provenance tracking + explanation generator + reason traces.
 */
export const INV_ACTIONS_EXPLAINABLE: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-010-actions-explainable'),
  name: 'Every Action Must Be Explainable',
  category: INVARIANT_CATEGORIES.EXPLAINABILITY,
  description:
    'Every plan step and diff item must have provenance linking it back to ' +
    'user goals. System must be able to answer "what changed?" and "why?" ' +
    'with specific references to CPL intent.',
  severity: 'error', enabled: true,
  check: (state, operation) => {
    const result = checkExplainability(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_ACTIONS_EXPLAINABLE.id,
        severity: INV_ACTIONS_EXPLAINABLE.severity,
        message: 'Action lacks explanation provenance',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

/**
 * INV-011: Constraints Must Be Mutually Compatible
 *
 * Rationale: "Make it louder" + "don't change dynamics" is unsatisfiable.
 * System must detect conflicts before planning or report unsatisfiability.
 *
 * Failure mode: Planner produces no valid plans and user doesn't know why.
 *
 * Mitigation: Constraint compatibility checker + conflict reporter with suggestions.
 */
export const INV_CONSTRAINTS_COMPATIBLE: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-011-constraints-compatible'),
  name: 'Constraints Must Be Mutually Compatible',
  category: INVARIANT_CATEGORIES.CONSTRAINT_COMPATIBILITY,
  description:
    'The set of constraints in a CPL request must be mutually satisfiable. ' +
    'Conflicting constraints must be detected and reported with suggestions ' +
    'for relaxation.',
  severity: 'error', enabled: true,
  check: (state, operation) => {
    const result = checkConstraintCompatibility(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_CONSTRAINTS_COMPATIBLE.id,
        severity: INV_CONSTRAINTS_COMPATIBLE.severity,
        message: 'Conflicting constraints detected',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

/**
 * INV-012: Extensions Must Be Isolated
 *
 * Rationale: Extension code should not directly mutate project state. It
 * should propose EditPackages that core executor applies. Prevents malicious
 * or buggy extensions from corrupting state.
 *
 * Failure mode: Extension has bug that directly mutates state bypassing undo/validation.
 *
 * Mitigation: Extension API enforces purity; only core executor has mutation rights.
 */
export const INV_EXTENSIONS_ISOLATED: InvariantDefinition<unknown, unknown> = {
  id: invariantId('inv-012-extensions-isolated'),
  name: 'Extensions Must Be Isolated',
  category: INVARIANT_CATEGORIES.EXTENSION_ISOLATION,
  description:
    'Extension handlers must not directly mutate project state. They return ' +
    'proposed EditPackages which core execution validates and applies. This ' +
    'ensures all mutations flow through undo/diff/constraint system.',
  severity: 'critical', enabled: true,
  check: (state, operation) => {
    const result = checkExtensionIsolation(state, operation);
    if (!result.ok) {
      return {
        ok: false,
        invariantId: INV_EXTENSIONS_ISOLATED.id,
        severity: INV_EXTENSIONS_ISOLATED.severity,
        message: 'Extension violated isolation boundary',
        evidence: result.evidence,
      };
    }
    return { ok: true };
  },
};

// =============================================================================
// Invariant Registry
// =============================================================================

/**
 * All semantic safety invariants, indexed by ID for lookup.
 */
export const SEMANTIC_SAFETY_INVARIANTS = new Map<
  InvariantId,
  InvariantDefinition<unknown, unknown>
>([
  [INV_NO_SILENT_AMBIGUITY.id, INV_NO_SILENT_AMBIGUITY],
  [INV_CONSTRAINTS_EXECUTABLE.id, INV_CONSTRAINTS_EXECUTABLE],
  [INV_REFERENTS_RESOLVE.id, INV_REFERENTS_RESOLVE],
  [INV_SCOPE_VISIBLE.id, INV_SCOPE_VISIBLE],
  [INV_PRESUPPOSITIONS_SATISFIED.id, INV_PRESUPPOSITIONS_SATISFIED],
  [INV_EFFECT_TYPES_MATCH_POLICY.id, INV_EFFECT_TYPES_MATCH_POLICY],
  [INV_PRESERVATION_VERIFIED.id, INV_PRESERVATION_VERIFIED],
  [INV_COMPILER_DETERMINISTIC.id, INV_COMPILER_DETERMINISTIC],
  [INV_EDITS_UNDOABLE.id, INV_EDITS_UNDOABLE],
  [INV_ACTIONS_EXPLAINABLE.id, INV_ACTIONS_EXPLAINABLE],
  [INV_CONSTRAINTS_COMPATIBLE.id, INV_CONSTRAINTS_COMPATIBLE],
  [INV_EXTENSIONS_ISOLATED.id, INV_EXTENSIONS_ISOLATED],
]);

/**
 * Get all invariants for a specific category.
 */
export function getInvariantsByCategory(
  category: InvariantCategory
): InvariantDefinition<unknown, unknown>[] {
  return Array.from(SEMANTIC_SAFETY_INVARIANTS.values()).filter(
    (inv) => inv.category === category
  );
}

/**
 * Get all critical invariants (must never be violated).
 */
export function getCriticalInvariants(): InvariantDefinition<unknown, unknown>[] {
  return Array.from(SEMANTIC_SAFETY_INVARIANTS.values()).filter(
    (inv) => inv.severity === 'critical'
  );
}

// =============================================================================
// Check Implementation Functions
// =============================================================================

/**
 * Ambiguity threshold for parse forests.
 * If top two parses score within this ratio, trigger clarification.
 */
const AMBIGUITY_THRESHOLD = 0.85;

interface ParseCandidate {
  readonly score: number;
  readonly meaningDiffers: boolean;
  readonly utteranceSource?: string;
}

function checkAmbiguityThreshold(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if operation has parse candidates
  if (!op?.parseCandidates || !Array.isArray(op.parseCandidates)) {
    return { ok: true };
  }

  const candidates = op.parseCandidates as ParseCandidate[];
  if (candidates.length < 2) {
    return { ok: true };
  }

  // Sort by score descending
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const secondBest = sorted[1];

  // If scores are too close AND meanings differ, this is ambiguous
  if (
    secondBest.score / best.score >= AMBIGUITY_THRESHOLD &&
    secondBest.meaningDiffers
  ) {
    return {
      ok: false,
      evidence: {
        type: 'ambiguity',
        details: {
          bestScore: best.score,
          secondBestScore: secondBest.score,
          ratio: secondBest.score / best.score,
          threshold: AMBIGUITY_THRESHOLD,
          candidateCount: candidates.length,
        },
        context: op.utteranceSource || 'unknown',
      },
    };
  }

  return { ok: true };
}

interface ConstraintDefinition {
  readonly type: string;
  readonly hasVerifier: boolean;
  readonly namespace?: string;
}

function checkConstraintExecutability(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if operation has constraints
  if (!op?.constraints || !Array.isArray(op.constraints)) {
    return { ok: true };
  }

  const constraints = op.constraints as ConstraintDefinition[];
  const unverifiable: string[] = [];

  for (const constraint of constraints) {
    if (!constraint.hasVerifier) {
      const constraintId = constraint.namespace
        ? `${constraint.namespace}:${constraint.type}`
        : constraint.type;
      unverifiable.push(constraintId);
    }
  }

  if (unverifiable.length > 0) {
    return {
      ok: false,
      evidence: {
        type: 'missing-verifier',
        details: {
          unverifiableConstraints: unverifiable,
          count: unverifiable.length,
        },
        context: 'constraint-verification',
      },
    };
  }

  return { ok: true };
}

interface ReferentBinding {
  readonly expression: string;
  readonly candidates: readonly string[];
  readonly resolved: boolean;
  readonly ambiguous: boolean;
}

function checkReferentResolution(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if operation has referents
  if (!op?.referents || !Array.isArray(op.referents)) {
    return { ok: true };
  }

  const referents = op.referents as ReferentBinding[];
  const unresolved: string[] = [];
  const ambiguous: Array<{ expr: string; candidates: readonly string[] }> = [];

  for (const ref of referents) {
    if (!ref.resolved) {
      if (ref.candidates.length === 0) {
        unresolved.push(ref.expression);
      } else if (ref.ambiguous && ref.candidates.length > 1) {
        ambiguous.push({
          expr: ref.expression,
          candidates: ref.candidates,
        });
      }
    }
  }

  if (unresolved.length > 0 || ambiguous.length > 0) {
    return {
      ok: false,
      evidence: {
        type: 'referent-resolution-failure',
        details: {
          unresolved,
          ambiguous,
        },
        context: 'referent-binding',
      },
    };
  }

  return { ok: true };
}

interface ScopeReference {
  readonly type: 'section' | 'layer' | 'card' | 'selection' | 'global';
  readonly id: string;
  readonly exists: boolean;
  readonly name?: string;
}

function checkScopeVisibility(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if operation has scope
  if (!op?.scope) {
    return { ok: true };
  }

  const scopes = Array.isArray(op.scope) ? op.scope : [op.scope];
  const nonExistent: Array<{ type: string; id: string; name?: string }> = [];

  for (const scope of scopes as ScopeReference[]) {
    if (!scope.exists && scope.type !== 'global') {
      nonExistent.push({
        type: scope.type,
        id: scope.id,
        name: scope.name,
      });
    }
  }

  if (nonExistent.length > 0) {
    return {
      ok: false,
      evidence: {
        type: 'scope-not-found',
        details: {
          nonExistentScopes: nonExistent,
          count: nonExistent.length,
        },
        context: 'scope-validation',
      },
    };
  }

  return { ok: true };
}

interface Presupposition {
  readonly type: string;
  readonly entity: string;
  readonly satisfied: boolean;
  readonly reason?: string;
}

function checkPresuppositions(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if operation has presuppositions
  if (!op?.presuppositions || !Array.isArray(op.presuppositions)) {
    return { ok: true };
  }

  const presuppositions = op.presuppositions as Presupposition[];
  const unsatisfied: Array<{
    type: string;
    entity: string;
    reason?: string;
  }> = [];

  for (const presup of presuppositions) {
    if (!presup.satisfied) {
      unsatisfied.push({
        type: presup.type,
        entity: presup.entity,
        reason: presup.reason,
      });
    }
  }

  if (unsatisfied.length > 0) {
    return {
      ok: false,
      evidence: {
        type: 'presupposition-failure',
        details: {
          unsatisfiedPresuppositions: unsatisfied,
          count: unsatisfied.length,
        },
        context: 'presupposition-checking',
      },
    };
  }

  return { ok: true };
}

interface EffectType {
  readonly effect: 'inspect' | 'propose' | 'mutate';
  readonly allowed: boolean;
  readonly boardPolicy: string;
}

function checkEffectTypePolicy(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if operation has effect type
  if (!op?.effectType) {
    return { ok: true };
  }

  const effectInfo = op.effectType as EffectType;
  
  if (!effectInfo.allowed) {
    return {
      ok: false,
      evidence: {
        type: 'effect-policy-violation',
        details: {
          requestedEffect: effectInfo.effect,
          boardPolicy: effectInfo.boardPolicy,
          reason: `Effect type '${effectInfo.effect}' not allowed by board policy '${effectInfo.boardPolicy}'`,
        },
        context: 'effect-type-checking',
      },
    };
  }

  return { ok: true };
}

interface PreservationConstraint {
  readonly target: string;
  readonly aspect: string;
  readonly mode: 'exact' | 'functional' | 'recognizable';
  readonly beforeHash: string;
  readonly afterHash: string;
}

function checkPreservationConstraints(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if operation has preservation checks
  if (!op?.preservationChecks || !Array.isArray(op.preservationChecks)) {
    return { ok: true };
  }

  const checks = op.preservationChecks as PreservationConstraint[];
  const violations: Array<{
    target: string;
    aspect: string;
    mode: string;
  }> = [];

  for (const check of checks) {
    // Compare hashes based on mode
    if (check.mode === 'exact' && check.beforeHash !== check.afterHash) {
      violations.push({
        target: check.target,
        aspect: check.aspect,
        mode: check.mode,
      });
    }
    // For 'functional' and 'recognizable', would need more sophisticated comparison
  }

  if (violations.length > 0) {
    return {
      ok: false,
      evidence: {
        type: 'preservation-violation',
        details: {
          violations,
          count: violations.length,
        },
        context: 'preservation-verification',
      },
    };
  }

  return { ok: true };
}

interface DeterminismCheck {
  readonly hasRandomness: boolean;
  readonly hasTimestamp: boolean;
  readonly hasNetworkCall: boolean;
  readonly unstableOrdering: boolean;
  readonly details?: string[];
}

function checkDeterminism(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if operation has determinism info
  if (!op?.determinismCheck) {
    return { ok: true };
  }

  const check = op.determinismCheck as DeterminismCheck;
  const violations: string[] = [];

  if (check.hasRandomness) {
    violations.push('Random number generation detected');
  }
  if (check.hasTimestamp) {
    violations.push('Timestamp usage detected in core pipeline');
  }
  if (check.hasNetworkCall) {
    violations.push('Network call detected in compilation path');
  }
  if (check.unstableOrdering) {
    violations.push('Unstable collection ordering detected');
  }

  if (check.details) {
    violations.push(...check.details);
  }

  if (violations.length > 0) {
    return {
      ok: false,
      evidence: {
        type: 'non-determinism',
        details: {
          violations,
          count: violations.length,
        },
        context: 'determinism-checking',
      },
    };
  }

  return { ok: true };
}

interface UndoInfo {
  readonly hasUndoToken: boolean;
  readonly tokenId?: string;
  readonly reversible: boolean;
}

function checkUndoability(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if this is a mutate operation
  if (op?.effectType?.effect !== 'mutate') {
    return { ok: true };
  }

  // Check if operation has undo info
  if (!op?.undoInfo) {
    return {
      ok: false,
      evidence: {
        type: 'no-undo-token',
        details: {
          reason: 'Mutation operation missing undo information',
        },
        context: 'undo-checking',
      },
    };
  }

  const undoInfo = op.undoInfo as UndoInfo;
  
  if (!undoInfo.hasUndoToken) {
    return {
      ok: false,
      evidence: {
        type: 'no-undo-token',
        details: {
          reason: 'Undo token not generated for mutation',
        },
        context: 'undo-checking',
      },
    };
  }

  if (!undoInfo.reversible) {
    return {
      ok: false,
      evidence: {
        type: 'irreversible-mutation',
        details: {
          tokenId: undoInfo.tokenId,
          reason: 'Mutation marked as irreversible',
        },
        context: 'undo-checking',
      },
    };
  }

  return { ok: true };
}

interface ExplanationProvenance {
  readonly hasProvenance: boolean;
  readonly linkedToGoal: boolean;
  readonly hasReason: boolean;
  readonly steps?: number;
}

function checkExplainability(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if operation has explanation info
  if (!op?.explanation) {
    return {
      ok: false,
      evidence: {
        type: 'missing-explanation',
        details: {
          reason: 'Operation lacks explanation provenance',
        },
        context: 'explainability-checking',
      },
    };
  }

  const explanation = op.explanation as ExplanationProvenance;
  const issues: string[] = [];

  if (!explanation.hasProvenance) {
    issues.push('Missing provenance tracking');
  }
  if (!explanation.linkedToGoal) {
    issues.push('Not linked to user goal');
  }
  if (!explanation.hasReason) {
    issues.push('No reason provided for action');
  }

  if (issues.length > 0) {
    return {
      ok: false,
      evidence: {
        type: 'incomplete-explanation',
        details: {
          issues,
          count: issues.length,
          steps: explanation.steps,
        },
        context: 'explainability-checking',
      },
    };
  }

  return { ok: true };
}

interface ConstraintPair {
  readonly c1: { type: string; target?: string };
  readonly c2: { type: string; target?: string };
  readonly conflict: boolean;
  readonly reason?: string;
}

function checkConstraintCompatibility(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if operation has compatibility info
  if (!op?.constraintCompatibility) {
    return { ok: true };
  }

  const compatibility = op.constraintCompatibility as {
    conflicts: ConstraintPair[];
  };

  const conflicts = compatibility.conflicts.filter((pair) => pair.conflict);

  if (conflicts.length > 0) {
    return {
      ok: false,
      evidence: {
        type: 'constraint-conflict',
        details: {
          conflicts: conflicts.map((c) => ({
            constraint1: c.c1.type,
            constraint2: c.c2.type,
            target1: c.c1.target,
            target2: c.c2.target,
            reason: c.reason,
          })),
          count: conflicts.length,
        },
        context: 'constraint-compatibility',
      },
    };
  }

  return { ok: true };
}

interface ExtensionIsolationInfo {
  readonly namespace: string;
  readonly directMutation: boolean;
  readonly bypassedValidation: boolean;
  readonly details?: string[];
}

function checkExtensionIsolation(
  state: unknown,
  operation: unknown
): { ok: true } | { ok: false; evidence: ViolationEvidence } {
  const op = operation as any;
  
  // Check if operation involves extensions
  if (!op?.extensionInfo) {
    return { ok: true };
  }

  const extensionInfo = op.extensionInfo as ExtensionIsolationInfo;
  const violations: string[] = [];

  if (extensionInfo.directMutation) {
    violations.push(
      `Extension '${extensionInfo.namespace}' attempted direct state mutation`
    );
  }
  if (extensionInfo.bypassedValidation) {
    violations.push(
      `Extension '${extensionInfo.namespace}' bypassed validation layer`
    );
  }

  if (extensionInfo.details) {
    violations.push(...extensionInfo.details);
  }

  if (violations.length > 0) {
    return {
      ok: false,
      evidence: {
        type: 'extension-isolation-violation',
        details: {
          namespace: extensionInfo.namespace,
          violations,
          count: violations.length,
        },
        context: 'extension-isolation',
      },
    };
  }

  return { ok: true };
}
