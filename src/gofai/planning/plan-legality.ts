/**
 * GOFAI Planning — Plan Legality Checks
 *
 * Step 263 [Sem] — Implement "plan legality" checks: ensure opcodes only touch
 * allowed scope and do not mutate forbidden targets.
 *
 * This module validates that generated plans:
 * 1. Only affect entities within the allowed scope
 * 2. Do not violate "preserve" constraints
 * 3. Do not exceed capability restrictions
 * 4. Respect "only_change" directives
 * 5. Have sufficient confidence in all parameters
 *
 * All checks are deterministic and produce structured violation reports.
 *
 * @module gofai/planning/plan-legality
 */

import type {
  CPLPlan,
  CPLOpcode,
} from '../canon/cpl-public-interface';
import type {
  CPLConstraint,
  CPLScope,
} from '../canon/cpl-types';
import type { InferredMagnitude } from './parameter-inference';

// Simple capability set for plan legality checking
export type CapabilitySet = ReadonlySet<string>;

// =============================================================================
// Types
// =============================================================================

/**
 * Result of a legality check.
 */
export interface LegalityCheckResult {
  /** Whether the plan is legal */
  readonly legal: boolean;

  /** All violations found */
  readonly violations: readonly LegalityViolation[];

  /** Summary of checks */
  readonly summary: LegalitySummary;
}

/**
 * A specific legality violation.
 */
export interface LegalityViolation {
  /** Violation type */
  readonly type: ViolationType;

  /** Severity */
  readonly severity: 'error' | 'warning';

  /** Which step in the plan */
  readonly stepIndex: number;

  /** Opcode that violated */
  readonly opcode: CPLOpcode;

  /** Human-readable message */
  readonly message: string;

  /** Suggested fix */
  readonly suggestion: string;

  /** Evidence of violation */
  readonly evidence: ViolationEvidence;
}

/**
 * Types of legality violations.
 */
export type ViolationType =
  | 'out_of_scope'         // Opcode affects entities outside allowed scope
  | 'forbidden_mutation'   // Opcode mutates a preserved target
  | 'capability_mismatch'  // Opcode requires unavailable capability
  | 'only_change_violation' // Opcode affects disallowed targets
  | 'low_confidence'       // Parameter has insufficient confidence
  | 'missing_target'       // Target entity doesn't exist
  | 'invalid_parameter'    // Parameter out of valid range
  | 'circular_dependency'; // Opcode depends on its own output

/**
 * Evidence for a violation.
 */
export interface ViolationEvidence {
  /** What was expected */
  readonly expected: string;

  /** What was found */
  readonly actual: string;

  /** Additional context */
  readonly context: Record<string, unknown>;
}

/**
 * Summary of legality checks.
 */
export interface LegalitySummary {
  /** Total steps checked */
  readonly stepsChecked: number;

  /** Number of errors */
  readonly errors: number;

  /** Number of warnings */
  readonly warnings: number;

  /** Checks performed */
  readonly checksPerformed: readonly string[];
}

/**
 * Context for legality checking.
 */
export interface LegalityContext {
  /** Allowed scope */
  readonly scope: CPLScope;

  /** Hard constraints */
  readonly constraints: readonly CPLConstraint[];

  /** Available capabilities */
  readonly capabilities: CapabilitySet;

  /** Existing entities (for target validation) */
  readonly availableEntities: ReadonlySet<string>;

  /** Minimum confidence threshold */
  readonly minConfidence: number;
}

// =============================================================================
// Main Legality Check
// =============================================================================

/**
 * Check if a plan is legal given context.
 *
 * This is the main entry point for plan validation.
 */
export function checkPlanLegality(
  plan: CPLPlan,
  context: LegalityContext
): LegalityCheckResult {
  const violations: LegalityViolation[] = [];
  const checksPerformed: string[] = [];

  // Check each step
  for (let i = 0; i < plan.opcodes.length; i++) {
    const step = plan.opcodes[i];

    // 1. Scope check
    const scopeViolations = checkScopeCompliance(step, context.scope, i);
    violations.push(...scopeViolations);
    checksPerformed.push('scope_compliance');

    // 2. Constraint check
    const constraintViolations = checkConstraintCompliance(
      step,
      context.constraints,
      i
    );
    violations.push(...constraintViolations);
    checksPerformed.push('constraint_compliance');

    // 3. Capability check
    const capabilityViolations = checkCapabilityRequirements(
      step,
      context.capabilities,
      i
    );
    violations.push(...capabilityViolations);
    checksPerformed.push('capability_requirements');

    // 4. Target existence check
    const targetViolations = checkTargetExistence(
      step,
      context.availableEntities,
      i
    );
    violations.push(...targetViolations);
    checksPerformed.push('target_existence');

    // 5. Parameter confidence check
    const confidenceViolations = checkParameterConfidence(
      step,
      context.minConfidence,
      i
    );
    violations.push(...confidenceViolations);
    checksPerformed.push('parameter_confidence');

    // 6. Parameter validity check
    const paramViolations = checkParameterValidity(step, i);
    violations.push(...paramViolations);
    checksPerformed.push('parameter_validity');
  }

  // 7. Cross-step checks
  const circularViolations = checkCircularDependencies(plan.opcodes);
  violations.push(...circularViolations);
  checksPerformed.push('circular_dependencies');

  // Compute summary
  const errors = violations.filter(v => v.severity === 'error').length;
  const warnings = violations.filter(v => v.severity === 'warning').length;

  return {
    legal: errors === 0,
    violations,
    summary: {
      stepsChecked: plan.opcodes.length,
      errors,
      warnings,
      checksPerformed: Array.from(new Set(checksPerformed)),
    },
  };
}

// =============================================================================
// Individual Check Functions
// =============================================================================

/**
 * Check that opcode only affects entities within allowed scope.
 */
function checkScopeCompliance(
  opcode: CPLOpcode,
  scope: CPLScope,
  stepIndex: number
): readonly LegalityViolation[] {
  const violations: LegalityViolation[] = [];

  // Extract targets from opcode params
  const targets = extractTargets(opcode);

  for (const target of targets) {
    if (!isInScope(target, scope)) {
      violations.push({
        type: 'out_of_scope',
        severity: 'error',
        stepIndex,
        opcode,
        message: `Opcode "${opcode.opcodeId}" affects target "${target}" which is outside allowed scope`,
        suggestion: `Adjust scope to include "${target}" or remove this operation`,
        evidence: {
          expected: describeSCope(scope),
          actual: `Target: ${target}`,
          context: { target, scope },
        },
      });
    }
  }

  return violations;
}

/**
 * Check that opcode doesn't violate preservation constraints.
 */
function checkConstraintCompliance(
  opcode: CPLOpcode,
  constraints: readonly CPLConstraint[],
  stepIndex: number
): readonly LegalityViolation[] {
  const violations: LegalityViolation[] = [];

  // Find preserve constraints
  const preserveConstraints = constraints.filter(
    c => c.variant === 'preserve'
  );

  // Check if opcode affects any preserved aspects
  for (const constraint of preserveConstraints) {
    if (violatesPreserve(opcode, constraint)) {
      violations.push({
        type: 'forbidden_mutation',
        severity: 'error',
        stepIndex,
        opcode,
        message: `Opcode "${opcode.opcodeId}" would modify "${(constraint as any).aspect}" which is marked as preserve`,
        suggestion: `Remove this operation or relax the preservation constraint`,
        evidence: {
          expected: `Preserve ${(constraint as any).aspect}`,
          actual: `Opcode modifies ${(constraint as any).aspect}`,
          context: { opcode, constraint },
        },
      });
    }
  }

  // Find only_change constraints
  const onlyChangeConstraints = constraints.filter(
    c => c.variant === 'only-change'
  );

  for (const constraint of onlyChangeConstraints) {
    if (violatesOnlyChange(opcode, constraint)) {
      violations.push({
        type: 'only_change_violation',
        severity: 'error',
        stepIndex,
        opcode,
        message: `Opcode "${opcode.opcodeId}" affects targets outside allowed set`,
        suggestion: `Ensure opcode only affects: ${(constraint as any).allowed.join(', ')}`,
        evidence: {
          expected: `Only change: ${(constraint as any).allowed.join(', ')}`,
          actual: `Opcode affects: ${extractTargets(opcode).join(', ')}`,
          context: { opcode, constraint },
        },
      });
    }
  }

  return violations;
}

/**
 * Check that opcode doesn't require unavailable capabilities.
 */
function checkCapabilityRequirements(
  opcode: CPLOpcode,
  capabilities: CapabilitySet,
  stepIndex: number
): readonly LegalityViolation[] {
  const violations: LegalityViolation[] = [];

  // Get required capabilities for this opcode
  const required = getRequiredCapabilities(opcode);

  for (const cap of Array.from(required)) {
    if (!capabilities.has(cap)) {
      violations.push({
        type: 'capability_mismatch',
        severity: 'error',
        stepIndex,
        opcode,
        message: `Opcode "${opcode.opcodeId}" requires capability "${cap}" which is not available`,
        suggestion: `Enable "${cap}" capability or choose a different operation`,
        evidence: {
          expected: `Capability: ${cap}`,
          actual: 'Not available',
          context: { opcode, required: Array.from(required), available: Array.from(capabilities) },
        },
      });
    }
  }

  return violations;
}

/**
 * Check that all referenced targets exist.
 */
function checkTargetExistence(
  opcode: CPLOpcode,
  availableEntities: ReadonlySet<string>,
  stepIndex: number
): readonly LegalityViolation[] {
  const violations: LegalityViolation[] = [];

  const targets = extractTargets(opcode);

  for (const target of targets) {
    if (!availableEntities.has(target)) {
      violations.push({
        type: 'missing_target',
        severity: 'error',
        stepIndex,
        opcode,
        message: `Opcode "${opcode.opcodeId}" references target "${target}" which doesn't exist`,
        suggestion: `Check that target name is correct or create the entity first`,
        evidence: {
          expected: `Existing entity: ${target}`,
          actual: 'Not found',
          context: { target, available: Array.from(availableEntities) },
        },
      });
    }
  }

  return violations;
}

/**
 * Check that all parameters have sufficient confidence.
 */
function checkParameterConfidence(
  opcode: CPLOpcode,
  minConfidence: number,
  stepIndex: number
): readonly LegalityViolation[] {
  const violations: LegalityViolation[] = [];

  // Check if params have inference metadata
  const params = opcode.params as any;
  if (params && params._inference) {
    for (const [key, inferred] of Object.entries(params._inference)) {
      const inf = inferred as InferredMagnitude;
      if (inf.confidence < minConfidence) {
        violations.push({
          type: 'low_confidence',
          severity: 'warning',
          stepIndex,
          opcode,
          message: `Parameter "${key}" has low confidence (${(inf.confidence * 100).toFixed(0)}%)`,
          suggestion: `Provide explicit value or accept uncertainty`,
          evidence: {
            expected: `Confidence >= ${(minConfidence * 100).toFixed(0)}%`,
            actual: `${(inf.confidence * 100).toFixed(0)}%`,
            context: { parameter: key, inferred: inf },
          },
        });
      }
    }
  }

  return violations;
}

/**
 * Check that parameter values are within valid ranges.
 */
function checkParameterValidity(
  opcode: CPLOpcode,
  stepIndex: number
): readonly LegalityViolation[] {
  const violations: LegalityViolation[] = [];

  // Get parameter schemas for this opcode
  const schemas = getParameterSchemas(String(opcode.opcodeId));

  for (const [key, schema] of Object.entries(schemas)) {
    const value = (opcode.params as any)[key];

    if (value !== undefined) {
      if (schema.type === 'number') {
        if (schema.min !== undefined && value < schema.min) {
          violations.push({
            type: 'invalid_parameter',
            severity: 'error',
            stepIndex,
            opcode,
            message: `Parameter "${key}" value ${value} is below minimum ${schema.min}`,
            suggestion: `Use value >= ${schema.min}`,
            evidence: {
              expected: `>= ${schema.min}`,
              actual: `${value}`,
              context: { parameter: key, value, schema },
            },
          });
        }
        if (schema.max !== undefined && value > schema.max) {
          violations.push({
            type: 'invalid_parameter',
            severity: 'error',
            stepIndex,
            opcode,
            message: `Parameter "${key}" value ${value} exceeds maximum ${schema.max}`,
            suggestion: `Use value <= ${schema.max}`,
            evidence: {
              expected: `<= ${schema.max}`,
              actual: `${value}`,
              context: { parameter: key, value, schema },
            },
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Check for circular dependencies between steps.
 */
function checkCircularDependencies(
  steps: readonly CPLOpcode[]
): readonly LegalityViolation[] {
  const violations: LegalityViolation[] = [];

  // Build dependency graph
  const dependencies = new Map<number, Set<number>>();
  
  for (let i = 0; i < steps.length; i++) {
    const outputs = extractOutputs(steps[i]);
    
    for (let j = i + 1; j < steps.length; j++) {
      const inputs = extractInputs(steps[j]);
      
      // Check if j depends on i
      const dependsOnI = inputs.some(input => outputs.includes(input));
      
      if (dependsOnI) {
        if (!dependencies.has(j)) {
          dependencies.set(j, new Set());
        }
        dependencies.get(j)!.add(i);
      }
    }
  }

  // Check for cycles (simplified - just check if any step depends on itself indirectly)
  for (const [step, deps] of Array.from(dependencies.entries())) {
    if (hasCycle(step, deps, dependencies)) {
      violations.push({
        type: 'circular_dependency',
        severity: 'error',
        stepIndex: step,
        opcode: steps[step],
        message: `Step ${step} has circular dependency`,
        suggestion: `Reorder operations to resolve dependency cycle`,
        evidence: {
          expected: 'Acyclic dependency graph',
          actual: 'Cycle detected',
          context: { step, dependencies: Array.from(deps) },
        },
      });
    }
  }

  return violations;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract target entity refs from opcode params.
 */
function extractTargets(opcode: CPLOpcode): readonly string[] {
  const targets: string[] = [];
  const params = opcode.params as any;

  // Common target param names
  if (params.target) {
    targets.push(params.target);
  }
  if (params.targets && Array.isArray(params.targets)) {
    targets.push(...params.targets);
  }
  if (params.layer) {
    targets.push(params.layer);
  }
  if (params.layers && Array.isArray(params.layers)) {
    targets.push(...params.layers);
  }
  if (params.section) {
    targets.push(params.section);
  }

  return targets;
}

/**
 * Check if target is within scope.
 */
function isInScope(target: string, scope: CPLScope): boolean {
  // If scope is empty/undefined, everything is in scope
  if (!scope) return true;

  const s = scope as any;
  
  // Check section scope
  if (s.sections && Array.isArray(s.sections)) {
    if (s.sections.includes(target)) return true;
  }

  // Check layer scope
  if (s.layers && Array.isArray(s.layers)) {
    if (s.layers.includes(target)) return true;
  }

  // If no specific scope, it's in scope
  if (!s.sections && !s.layers) return true;

  return false;
}

/**
 * Describe scope for error messages.
 */
function describeScope(scope: CPLScope): string {
  const s = scope as any;
  const parts: string[] = [];

  if (s.sections) {
    parts.push(`sections: ${s.sections.join(', ')}`);
  }
  if (s.layers) {
    parts.push(`layers: ${s.layers.join(', ')}`);
  }
  if (s.timeRange) {
    parts.push(`time: ${s.timeRange.start}-${s.timeRange.end}`);
  }

  return parts.length > 0 ? parts.join('; ') : 'unrestricted';
}

/**
 * Check if opcode violates a preserve constraint.
 */
function violatesPreserve(
  opcode: CPLOpcode,
  constraint: CPLConstraint
): boolean {
  // Simplified: check if opcode affects preserved aspect
  const c = constraint as any;
  const affectedAspects = getAffectedAspects(opcode);

  return affectedAspects.some(aspect => 
    c.aspects && c.aspects.includes(aspect)
  );
}

/**
 * Check if opcode violates only_change constraint.
 */
function violatesOnlyChange(
  opcode: CPLOpcode,
  constraint: CPLConstraint
): boolean {
  const c = constraint as any;
  const targets = extractTargets(opcode);

  // If opcode has targets, all must be in allowed set
  if (targets.length > 0 && c.allowed) {
    return !targets.every(t => c.allowed.includes(t));
  }

  return false;
}

/**
 * Get required capabilities for an opcode.
 */
function getRequiredCapabilities(opcode: CPLOpcode): ReadonlySet<string> {
  const caps = new Set<string>();

  // Map opcodes to required capabilities
  const capabilityMap: Record<string, string[]> = {
    'add_card': ['edit_routing'],
    'set_param': ['edit_params'],
    'add_track': ['edit_routing'],
    'quantize': ['edit_events'],
    'widen_stereo': ['edit_production'],
    'boost_highs': ['edit_production'],
  };

  const opcodeKey = String(opcode.opcodeId);
  if (capabilityMap[opcodeKey]) {
    capabilityMap[opcodeKey].forEach(cap => caps.add(cap));
  }

  return caps;
}

/**
 * Get parameter schemas for an opcode.
 */
function getParameterSchemas(opcodeId: string): Record<string, ParameterSchema> {
  // Simplified schema definitions
  const schemas: Record<string, Record<string, ParameterSchema>> = {
    'boost_highs': {
      freq: { type: 'number', min: 20, max: 20000, unit: 'Hz' },
      gain: { type: 'number', min: -24, max: 24, unit: 'dB' },
    },
    'widen_stereo': {
      amount: { type: 'number', min: 0, max: 1 },
    },
    'quantize': {
      strength: { type: 'number', min: 0, max: 1 },
    },
  };

  return schemas[opcodeId] || {};
}

interface ParameterSchema {
  readonly type: 'number' | 'string' | 'boolean';
  readonly min?: number;
  readonly max?: number;
  readonly unit?: string;
}

/**
 * Get aspects affected by an opcode.
 */
function getAffectedAspects(opcode: CPLOpcode): readonly string[] {
  // Map opcodes to aspects they affect
  const aspectMap: Record<string, string[]> = {
    'quantize': ['rhythm', 'timing'],
    'raise_register': ['pitch', 'melody'],
    'adjust_voicing': ['harmony', 'voicing'],
    'boost_highs': ['brightness', 'timbre'],
    'widen_stereo': ['width', 'space'],
  };

  return aspectMap[String(opcode.opcodeId)] || [];
}

/**
 * Extract outputs (modified entities) from opcode.
 */
function extractOutputs(opcode: CPLOpcode): readonly string[] {
  // Same as targets for most opcodes
  return extractTargets(opcode);
}

/**
 * Extract inputs (read entities) from opcode.
 */
function extractInputs(opcode: CPLOpcode): readonly string[] {
  // For now, same as targets
  return extractTargets(opcode);
}

/**
 * Check if step has circular dependency.
 */
function hasCycle(
  step: number,
  directDeps: Set<number>,
  allDeps: Map<number, Set<number>>
): boolean {
  // Simplified cycle detection
  for (const dep of Array.from(directDeps)) {
    if (dep === step) return true;
    
    const nextDeps = allDeps.get(dep);
    if (nextDeps && nextDeps.has(step)) {
      return true;
    }
  }
  return false;
}

// Fix the typo in describeScope function reference
function describeSCope(scope: CPLScope): string {
  return describeScope(scope);
}
