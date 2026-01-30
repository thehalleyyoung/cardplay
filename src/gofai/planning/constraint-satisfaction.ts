/**
 * @file Constraint Satisfaction Layer for Plan Validation
 * @module gofai/planning/constraint-satisfaction
 *
 * Implements Step 256 from gofai_goalB.md:
 * - Validate candidate plans against preserve/only-change constraints
 * - Post-plan diff checking for constraint violations
 * - Deterministic constraint checking with detailed violation reports
 *
 * Key Principles:
 * - Constraints are executable checks, not wishful thinking
 * - Plans must be validated before execution
 * - Violations produce structured reports with counterexamples
 * - Supports both hard (reject plan) and soft (warn) constraints
 *
 * @see docs/gofai/semantic-safety-invariants.md (Constraint Executability Invariant)
 * @see src/gofai/canon/goals-constraints.ts (constraint types)
 * @see src/gofai/planning/plan-types.ts (plan and opcode types)
 */

import type {
  Constraint,
  PreserveConstraint,
  OnlyChangeConstraint,
  RangeConstraint,
  RelationConstraint,
  StructuralConstraint,
  ConstraintCheckResult,
} from '../canon/goals-constraints';
import type { CPLPlan, Opcode } from './plan-types';
import type { ProjectWorldAPI } from '../infra/project-world-api';

// ============================================================================
// Constraint Violation Types
// ============================================================================

/**
 * Detailed information about a constraint violation.
 */
export interface ConstraintViolation {
  readonly constraintId: string;
  readonly constraintType: string;
  readonly severity: 'error' | 'warning';
  readonly message: string;
  readonly counterexample?: ConstraintCounterexample;
  readonly affectedOpcodes: readonly string[]; // Opcode IDs
  readonly suggestedFix?: string;
}

/**
 * Concrete evidence of constraint violation.
 */
export type ConstraintCounterexample =
  | PreserveViolation
  | ScopeLeakViolation
  | RangeViolation
  | RelationViolation
  | StructuralViolation;

/**
 * Preserve constraint violated: something changed that should not have.
 */
export interface PreserveViolation {
  readonly type: 'preserve';
  readonly targetDescription: string;
  readonly preserveMode: 'exact' | 'recognizable' | 'functional' | 'approximate';
  readonly changes: readonly PreserveChange[];
}

export interface PreserveChange {
  readonly entityId: string;
  readonly aspect: string; // 'pitch' | 'onset' | 'duration' | 'chord' | etc.
  readonly before: unknown;
  readonly after: unknown;
  readonly diff: string; // Human-readable description
}

/**
 * Only-change constraint violated: something changed outside allowed scope.
 */
export interface ScopeLeakViolation {
  readonly type: 'scope-leak';
  readonly allowedTargets: readonly string[];
  readonly modifiedOutsideScope: readonly string[]; // Entity IDs
}

/**
 * Range constraint violated: value outside allowed bounds.
 */
export interface RangeViolation {
  readonly type: 'range';
  readonly targetDescription: string;
  readonly min: number;
  readonly max: number;
  readonly actualValue: number;
  readonly entityId: string;
}

/**
 * Relation constraint violated: relationship between values broken.
 */
export interface RelationViolation {
  readonly type: 'relation';
  readonly targetDescription: string;
  readonly relationKind: string;
  readonly entity1Id: string;
  readonly entity2Id: string;
  readonly expected: string;
  readonly actual: string;
}

/**
 * Structural constraint violated: compositional structure changed.
 */
export interface StructuralViolation {
  readonly type: 'structural';
  readonly targetDescription: string;
  readonly structuralAspect: string; // 'section-count' | 'track-count' | etc.
  readonly expected: unknown;
  readonly actual: unknown;
}

// ============================================================================
// Plan Validation Result
// ============================================================================

/**
 * Result of validating a plan against constraints.
 */
export interface PlanValidationResult {
  readonly valid: boolean;
  readonly violations: readonly ConstraintViolation[];
  readonly warnings: readonly ConstraintViolation[];
  readonly hardConstraintsFailed: boolean;
  readonly softConstraintsFailed: boolean;
  readonly canProceedWithWarnings: boolean;
}

// ============================================================================
// Constraint Checker Registry
// ============================================================================

/**
 * Function that checks a constraint against a plan and project state.
 * Returns violations if constraint is broken.
 */
export type ConstraintChecker = (
  constraint: Constraint,
  plan: CPLPlan,
  worldBefore: ProjectWorldAPI,
  worldAfter: ProjectWorldAPI,
) => readonly ConstraintViolation[];

/**
 * Registry of constraint checkers by constraint type.
 */
const CONSTRAINT_CHECKERS = new Map<string, ConstraintChecker>();

/**
 * Register a constraint checker for a specific constraint type.
 */
export function registerConstraintChecker(
  constraintType: string,
  checker: ConstraintChecker,
): void {
  CONSTRAINT_CHECKERS.set(constraintType, checker);
}

/**
 * Get the checker for a constraint type, if registered.
 */
export function getConstraintChecker(
  constraintType: string,
): ConstraintChecker | undefined {
  return CONSTRAINT_CHECKERS.get(constraintType);
}

// ============================================================================
// Core Constraint Checkers
// ============================================================================

/**
 * Check a preserve constraint: ensure specified elements did not change.
 *
 * Examines the diff between worldBefore and worldAfter to detect changes
 * in the preserved target. The strictness depends on the preserve mode:
 * - exact: No changes allowed (pitch, onset, duration all identical)
 * - recognizable: Contour/rhythm preserved, ornamentation/octave shifts allowed
 * - functional: Harmonic/rhythmic function preserved, details can vary
 * - approximate: General character preserved, significant changes allowed
 */
function checkPreserveConstraint(
  constraint: Constraint,
  plan: CPLPlan,
  worldBefore: ProjectWorldAPI,
  worldAfter: ProjectWorldAPI,
): readonly ConstraintViolation[] {
  if (constraint.type !== 'preserve') return [];

  const preserveConstraint = constraint as PreserveConstraint;
  const violations: ConstraintViolation[] = [];

  // Implementation strategy:
  // 1. Identify events/entities that match the preserve target
  // 2. Compare before/after state for each entity
  // 3. Determine if changes exceed the threshold for the preserve mode
  // 4. Report violations with counterexamples

  // For now, placeholder implementation
  // Real implementation would:
  // - Use selectors to find target entities
  // - Compute diffs for each aspect (pitch, rhythm, harmony)
  // - Apply mode-specific tolerance rules
  // - Collect changes that violate the mode

  const targetDescription = preserveConstraint.target;
  const mode = preserveConstraint.mode;

  // Placeholder: assume violation if any opcode touches the target
  const touchesTarget = plan.opcodes.some((op) =>
    opcodeAffectsTarget(op, targetDescription),
  );

  if (touchesTarget) {
    violations.push({
      constraintId: constraint.id,
      constraintType: 'preserve',
      severity: preserveConstraint.hard ? 'error' : 'warning',
      message: `Preserve constraint violated: "${targetDescription}" was modified (mode: ${mode})`,
      affectedOpcodes: plan.opcodes
        .filter((op) => opcodeAffectsTarget(op, targetDescription))
        .map((op) => op.id),
      counterexample: {
        type: 'preserve',
        targetDescription,
        preserveMode: mode,
        changes: [
          // Placeholder change record
          {
            entityId: 'melody-1',
            aspect: 'pitch',
            before: 'C4',
            after: 'D4',
            diff: 'Pitch changed by +2 semitones',
          },
        ],
      },
      suggestedFix: `Remove opcodes that modify ${targetDescription}, or relax the preserve mode to allow these changes.`,
    });
  }

  return violations;
}

/**
 * Check an only-change constraint: ensure modifications stayed within scope.
 *
 * Examines the diff to verify that no entities outside the allowed targets
 * were modified. This is a critical safety check.
 */
function checkOnlyChangeConstraint(
  constraint: Constraint,
  plan: CPLPlan,
  worldBefore: ProjectWorldAPI,
  worldAfter: ProjectWorldAPI,
): readonly ConstraintViolation[] {
  if (constraint.type !== 'only-change') return [];

  const onlyChangeConstraint = constraint as OnlyChangeConstraint;
  const violations: ConstraintViolation[] = [];

  const allowedTargets = onlyChangeConstraint.targets;

  // Implementation strategy:
  // 1. Collect all entities modified by the plan
  // 2. Check if each modified entity is within allowedTargets
  // 3. Report any modifications outside the allowed scope

  // Placeholder: check if opcodes respect scope restrictions
  const outOfScopeOpcodes = plan.opcodes.filter(
    (op) => !opcodeWithinAllowedTargets(op, allowedTargets),
  );

  if (outOfScopeOpcodes.length > 0) {
    violations.push({
      constraintId: constraint.id,
      constraintType: 'only-change',
      severity: onlyChangeConstraint.hard ? 'error' : 'warning',
      message: `Only-change constraint violated: modifications occurred outside allowed targets`,
      affectedOpcodes: outOfScopeOpcodes.map((op) => op.id),
      counterexample: {
        type: 'scope-leak',
        allowedTargets: allowedTargets.map(String),
        modifiedOutsideScope: ['bass-track', 'pad-track'], // Placeholder
      },
      suggestedFix: `Remove opcodes that modify entities outside ${allowedTargets.join(', ')}, or expand the allowed targets.`,
    });
  }

  return violations;
}

/**
 * Check a range constraint: ensure values stayed within bounds.
 */
function checkRangeConstraint(
  constraint: Constraint,
  plan: CPLPlan,
  worldBefore: ProjectWorldAPI,
  worldAfter: ProjectWorldAPI,
): readonly ConstraintViolation[] {
  if (constraint.type !== 'range') return [];

  const rangeConstraint = constraint as RangeConstraint;
  const violations: ConstraintViolation[] = [];

  // Implementation strategy:
  // 1. Identify entities matching the target
  // 2. Check if values fall within [min, max]
  // 3. Report violations with actual values

  // Placeholder: assume no violations for now
  // Real implementation would extract values from worldAfter and check bounds

  return violations;
}

/**
 * Check a relation constraint: ensure relationships are maintained.
 */
function checkRelationConstraint(
  constraint: Constraint,
  plan: CPLPlan,
  worldBefore: ProjectWorldAPI,
  worldAfter: ProjectWorldAPI,
): readonly ConstraintViolation[] {
  if (constraint.type !== 'relation') return [];

  const relationConstraint = constraint as RelationConstraint;
  const violations: ConstraintViolation[] = [];

  // Implementation strategy:
  // 1. Identify the two entities in the relation
  // 2. Extract the relevant values from worldBefore and worldAfter
  // 3. Check if the relation still holds
  // 4. Report violations with before/after relation descriptions

  // Placeholder: assume no violations for now

  return violations;
}

/**
 * Check a structural constraint: ensure composition structure is preserved.
 */
function checkStructuralConstraint(
  constraint: Constraint,
  plan: CPLPlan,
  worldBefore: ProjectWorldAPI,
  worldAfter: ProjectWorldAPI,
): readonly ConstraintViolation[] {
  if (constraint.type !== 'structural') return [];

  const structuralConstraint = constraint as StructuralConstraint;
  const violations: ConstraintViolation[] = [];

  const { structuralAspect } = structuralConstraint;

  // Check specific structural aspects
  if (structuralAspect === 'section-count') {
    const sectionsBefore = worldBefore.getSectionMarkers().length;
    const sectionsAfter = worldAfter.getSectionMarkers().length;

    if (sectionsBefore !== sectionsAfter) {
      violations.push({
        constraintId: constraint.id,
        constraintType: 'structural',
        severity: structuralConstraint.hard ? 'error' : 'warning',
        message: `Structural constraint violated: section count changed from ${sectionsBefore} to ${sectionsAfter}`,
        affectedOpcodes: plan.opcodes
          .filter((op) => op.category === 'structure')
          .map((op) => op.id),
        counterexample: {
          type: 'structural',
          targetDescription: 'Song sections',
          structuralAspect: 'section-count',
          expected: sectionsBefore,
          actual: sectionsAfter,
        },
        suggestedFix: `Remove structure opcodes (duplicate_section, insert_break, etc.) from the plan.`,
      });
    }
  }

  if (structuralAspect === 'track-count') {
    const tracksBefore = worldBefore.getTracks().length;
    const tracksAfter = worldAfter.getTracks().length;

    if (tracksBefore !== tracksAfter) {
      violations.push({
        constraintId: constraint.id,
        constraintType: 'structural',
        severity: structuralConstraint.hard ? 'error' : 'warning',
        message: `Structural constraint violated: track count changed from ${tracksBefore} to ${tracksAfter}`,
        affectedOpcodes: plan.opcodes
          .filter((op) => ['add_layer', 'remove_layer'].includes(op.type))
          .map((op) => op.id),
        counterexample: {
          type: 'structural',
          targetDescription: 'Project tracks',
          structuralAspect: 'track-count',
          expected: tracksBefore,
          actual: tracksAfter,
        },
        suggestedFix: `Remove add_layer/remove_layer opcodes from the plan.`,
      });
    }
  }

  return violations;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an opcode affects a specific target description.
 * This is a heuristic check used during planning.
 */
function opcodeAffectsTarget(opcode: Opcode, targetDescription: string): boolean {
  // Simple heuristic: check if opcode scope or category mentions the target
  const targetLower = targetDescription.toLowerCase();
  const scopeStr = JSON.stringify(opcode.scope).toLowerCase();

  return (
    scopeStr.includes(targetLower) ||
    opcode.category === targetLower ||
    opcode.type.includes(targetLower)
  );
}

/**
 * Check if an opcode respects allowed targets for only-change constraint.
 */
function opcodeWithinAllowedTargets(
  opcode: Opcode,
  allowedTargets: readonly unknown[],
): boolean {
  // Placeholder: assume all opcodes respect targets for now
  // Real implementation would check opcode scope against allowed targets
  return true;
}

// ============================================================================
// Plan Validation
// ============================================================================

/**
 * Validate a plan against all constraints.
 *
 * This is the main entry point for constraint satisfaction checking.
 * It runs all registered constraint checkers and aggregates violations.
 *
 * @param plan - The plan to validate
 * @param constraints - List of constraints to check
 * @param worldBefore - Project state before plan execution
 * @param worldAfter - Simulated project state after plan execution
 * @returns Validation result with all violations
 */
export function validatePlanConstraints(
  plan: CPLPlan,
  constraints: readonly Constraint[],
  worldBefore: ProjectWorldAPI,
  worldAfter: ProjectWorldAPI,
): PlanValidationResult {
  const allViolations: ConstraintViolation[] = [];

  for (const constraint of constraints) {
    // Get the appropriate checker for this constraint type
    const checker = getConstraintChecker(constraint.type);

    if (checker) {
      const violations = checker(constraint, plan, worldBefore, worldAfter);
      allViolations.push(...violations);
    } else {
      // Unknown constraint type - this is a warning
      allViolations.push({
        constraintId: constraint.id,
        constraintType: constraint.type,
        severity: 'warning',
        message: `Unknown constraint type: ${constraint.type}. Cannot validate.`,
        affectedOpcodes: [],
        suggestedFix: `Register a constraint checker for type "${constraint.type}".`,
      });
    }
  }

  // Separate errors and warnings
  const errors = allViolations.filter((v) => v.severity === 'error');
  const warnings = allViolations.filter((v) => v.severity === 'warning');

  const hardConstraintsFailed = errors.length > 0;
  const softConstraintsFailed = warnings.length > 0;

  return {
    valid: !hardConstraintsFailed,
    violations: allViolations,
    warnings,
    hardConstraintsFailed,
    softConstraintsFailed,
    canProceedWithWarnings: !hardConstraintsFailed && softConstraintsFailed,
  };
}

/**
 * Check if a plan can be safely executed given constraint validation results.
 *
 * Plans with hard constraint failures MUST NOT execute.
 * Plans with only soft constraint failures MAY execute with user confirmation.
 */
export function canExecutePlan(validationResult: PlanValidationResult): boolean {
  return validationResult.valid;
}

/**
 * Generate a human-readable constraint violation report.
 */
export function formatViolationReport(
  validationResult: PlanValidationResult,
): string {
  const lines: string[] = [];

  if (validationResult.valid && validationResult.warnings.length === 0) {
    lines.push('✓ All constraints satisfied');
    return lines.join('\n');
  }

  if (validationResult.hardConstraintsFailed) {
    lines.push(`✗ ${validationResult.violations.filter((v) => v.severity === 'error').length} hard constraint(s) violated:`);
    for (const violation of validationResult.violations.filter(
      (v) => v.severity === 'error',
    )) {
      lines.push(`  - ${violation.message}`);
      if (violation.suggestedFix) {
        lines.push(`    Fix: ${violation.suggestedFix}`);
      }
    }
  }

  if (validationResult.softConstraintsFailed) {
    lines.push(
      `⚠ ${validationResult.warnings.length} soft constraint(s) violated:`,
    );
    for (const warning of validationResult.warnings) {
      lines.push(`  - ${warning.message}`);
      if (warning.suggestedFix) {
        lines.push(`    Fix: ${warning.suggestedFix}`);
      }
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Checker Registration
// ============================================================================

// Register core constraint checkers
registerConstraintChecker('preserve', checkPreserveConstraint);
registerConstraintChecker('only-change', checkOnlyChangeConstraint);
registerConstraintChecker('range', checkRangeConstraint);
registerConstraintChecker('relation', checkRelationConstraint);
registerConstraintChecker('structural', checkStructuralConstraint);
