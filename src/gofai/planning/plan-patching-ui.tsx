/**
 * @file Plan Patching UI Component
 * @module gofai/planning/plan-patching-ui
 *
 * Implements Steps 294-295 from gofai_goalB.md:
 * - Add UI for "plan patching": user can remove a step from the plan and revalidate
 * - Ensure plan patching re-runs constraint checks and displays violations before allowing apply
 * - Allow selective removal of plan steps while maintaining coherence
 * - Show impact of removing steps on goals and constraints
 * - Validate patched plan can still satisfy user intent
 *
 * Key Principles:
 * - Make it clear what removing a step means
 * - Show goal satisfaction impact immediately
 * - Validate constraints after each patch operation
 * - Allow undo of patch operations
 * - Warn if removing a step makes plan invalid
 * - Support reordering steps when it's safe
 *
 * @see src/gofai/planning/plan-types.ts (plan structure)
 * @see src/gofai/planning/constraint-satisfaction.ts (validation)
 * @see src/gofai/planning/plan-explainability.ts (goal linkage)
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { CPLPlan, PlanOpcode, PlanScore } from './plan-types';
import type { CPLConstraint, CPLGoal } from '../canon/cpl-types';

// ============================================================================
// Types
// ============================================================================

/**
 * A plan step with patching metadata
 */
export interface PatchableStep {
  /** Original step index */
  readonly originalIndex: number;

  /** The opcode */
  readonly opcode: PlanOpcode;

  /** Whether this step can be safely removed */
  readonly removable: boolean;

  /** Reason if not removable */
  readonly nonRemovableReason?: string;

  /** Goals this step contributes to */
  readonly servesGoals: readonly string[];

  /** Constraints this step helps satisfy */
  readonly satisfiesConstraints: readonly string[];

  /** Impact on overall plan if removed */
  readonly removalImpact: RemovalImpact;

  /** Whether this step is currently removed in the patch */
  readonly isRemoved: boolean;

  /** Whether this step depends on another step */
  readonly dependsOn: readonly number[];

  /** Which steps depend on this step */
  readonly dependedOnBy: readonly number[];
}

/**
 * Impact assessment for removing a step
 */
export interface RemovalImpact {
  /** Severity of removing this step */
  readonly severity: 'none' | 'low' | 'moderate' | 'high' | 'critical';

  /** Goals that will be unsatisfied */
  readonly unsatisfiedGoals: readonly string[];

  /** Constraints that might be violated */
  readonly riskedConstraints: readonly string[];

  /** Steps that will become invalid */
  readonly invalidatedSteps: readonly number[];

  /** Human-readable summary */
  readonly summary: string;
}

/**
 * Result of patching validation
 */
export interface PatchValidationResult {
  /** Whether the patched plan is valid */
  readonly valid: boolean;

  /** Whether the patched plan can satisfy original goals */
  readonly satisfiesGoals: boolean;

  /** Goals that are no longer satisfied */
  readonly unsatisfiedGoals: readonly CPLGoal[];

  /** Constraints that are violated */
  readonly violatedConstraints: readonly CPLConstraint[];

  /** Steps that became invalid due to dependencies */
  readonly invalidSteps: readonly number[];

  /** Overall score of patched plan vs original */
  readonly scoreChange: {
    readonly original: PlanScore;
    readonly patched: PlanScore;
    readonly delta: number;
  };

  /** Warnings about the patch */
  readonly warnings: readonly string[];

  /** Errors that prevent applying the patch */
  readonly errors: readonly string[];
}

/**
 * Props for PlanPatchingUI component
 */
export interface PlanPatchingUIProps {
  /** The original plan */
  readonly originalPlan: CPLPlan;

  /** Goals the plan was designed to satisfy */
  readonly goals: readonly CPLGoal[];

  /** Constraints to preserve */
  readonly constraints: readonly CPLConstraint[];

  /** Callback when patched plan is ready */
  readonly onPatchedPlan: (patchedPlan: CPLPlan, validation: PatchValidationResult) => void;

  /** Callback to cancel patching */
  readonly onCancel: () => void;

  /** Callback to validate a patched plan */
  readonly onValidate: (
    plan: CPLPlan,
    goals: readonly CPLGoal[],
    constraints: readonly CPLConstraint[]
  ) => PatchValidationResult;

  /** Whether to show technical details */
  readonly showTechnicalDetails?: boolean;
}

// ============================================================================
// Dependency Analysis
// ============================================================================

/**
 * Analyze step dependencies within a plan
 */
function analyzeStepDependencies(plan: CPLPlan): Map<number, number[]> {
  const dependencies = new Map<number, number[]>();

  plan.steps.forEach((step, index) => {
    const deps: number[] = [];

    // Check if step uses outputs/results from previous steps
    // This is simplified - real implementation would analyze parameter references
    if (step.parameters) {
      Object.values(step.parameters).forEach(value => {
        // Look for references to previous step outputs (e.g., "@step:2:result")
        if (typeof value === 'string' && value.startsWith('@step:')) {
          const refIndex = parseInt(value.split(':')[1], 10);
          if (!isNaN(refIndex) && refIndex < index) {
            deps.push(refIndex);
          }
        }
      });
    }

    // Some opcodes have implicit dependencies
    if (hasImplicitDependency(step, plan.steps.slice(0, index))) {
      deps.push(...findImplicitDependencies(step, plan.steps.slice(0, index)));
    }

    if (deps.length > 0) {
      dependencies.set(index, deps);
    }
  });

  return dependencies;
}

/**
 * Check if step has implicit dependency on prior steps
 */
function hasImplicitDependency(step: PlanOpcode, priorSteps: readonly PlanOpcode[]): boolean {
  // Example: revoicing depends on harmony being present
  if (step.opcodeId === 'opcode:harmony:revoice') {
    return priorSteps.some(s => s.category === 'harmony');
  }

  // Melody ornamentation depends on melody existing
  if (step.opcodeId === 'opcode:melody:ornament') {
    return priorSteps.some(s => s.category === 'melody' || s.opcodeId === 'opcode:event:add_notes');
  }

  return false;
}

/**
 * Find indices of steps this step implicitly depends on
 */
function findImplicitDependencies(
  step: PlanOpcode,
  priorSteps: readonly PlanOpcode[]
): number[] {
  const deps: number[] = [];

  // Find all prior steps of relevant category
  if (step.opcodeId === 'opcode:harmony:revoice') {
    priorSteps.forEach((s, i) => {
      if (s.category === 'harmony') {
        deps.push(i);
      }
    });
  }

  return deps;
}

/**
 * Build reverse dependency map (which steps depend on each step)
 */
function buildReverseDependencies(dependencies: Map<number, number[]>): Map<number, number[]> {
  const reverse = new Map<number, number[]>();

  dependencies.forEach((deps, stepIndex) => {
    deps.forEach(depIndex => {
      const existing = reverse.get(depIndex) || [];
      reverse.set(depIndex, [...existing, stepIndex]);
    });
  });

  return reverse;
}

// ============================================================================
// Removal Impact Analysis
// ============================================================================

/**
 * Analyze the impact of removing a step
 */
function analyzeRemovalImpact(
  stepIndex: number,
  step: PlanOpcode,
  plan: CPLPlan,
  goals: readonly CPLGoal[],
  dependedOnBy: readonly number[]
): RemovalImpact {
  const unsatisfiedGoals: string[] = [];
  const riskedConstraints: string[] = [];
  const invalidatedSteps = [...dependedOnBy];

  // Determine severity based on multiple factors
  let severity: RemovalImpact['severity'] = 'low';

  // Critical if other steps depend on this
  if (dependedOnBy.length > 0) {
    severity = 'critical';
  }

  // High if this is the only step serving a goal
  const servingGoals = getGoalsServedByStep(step, goals);
  servingGoals.forEach(goalId => {
    const otherStepsServingGoal = plan.steps.filter(
      (s, i) => i !== stepIndex && servesGoal(s, goalId, goals)
    );
    if (otherStepsServingGoal.length === 0) {
      unsatisfiedGoals.push(goalId);
      severity = severity === 'critical' ? 'critical' : 'high';
    }
  });

  // Moderate if step is high-cost/high-impact
  if (step.risk === 'high' || step.risk === 'critical') {
    severity = severity === 'critical' ? 'critical' : 'moderate';
  }

  const summary = generateRemovalSummary(
    step,
    severity,
    unsatisfiedGoals,
    invalidatedSteps
  );

  return {
    severity,
    unsatisfiedGoals,
    riskedConstraints,
    invalidatedSteps,
    summary,
  };
}

/**
 * Get goals that a step serves
 */
function getGoalsServedByStep(step: PlanOpcode, goals: readonly CPLGoal[]): string[] {
  // This would be extracted from plan provenance in real implementation
  // For now, infer from opcode category and goal types
  return step.reasonTrace?.goalIds || [];
}

/**
 * Check if a step serves a specific goal
 */
function servesGoal(step: PlanOpcode, goalId: string, goals: readonly CPLGoal[]): boolean {
  const servedGoals = getGoalsServedByStep(step, goals);
  return servedGoals.includes(goalId);
}

/**
 * Generate human-readable removal summary
 */
function generateRemovalSummary(
  step: PlanOpcode,
  severity: RemovalImpact['severity'],
  unsatisfiedGoals: readonly string[],
  invalidatedSteps: readonly number[]
): string {
  const parts: string[] = [];

  if (severity === 'critical') {
    parts.push('⚠️ Critical: ');
  } else if (severity === 'high') {
    parts.push('⚡ High impact: ');
  }

  parts.push(`Removing this ${step.category} step`);

  if (invalidatedSteps.length > 0) {
    parts.push(` will break ${invalidatedSteps.length} dependent step(s)`);
  }

  if (unsatisfiedGoals.length > 0) {
    parts.push(` and leave ${unsatisfiedGoals.length} goal(s) unsatisfied`);
  }

  if (parts.length === 1) {
    return `Removing this ${step.category} step should be safe`;
  }

  return parts.join('');
}

// ============================================================================
// Component
// ============================================================================

/**
 * PlanPatchingUI: Interactive plan editing interface
 */
export function PlanPatchingUI(props: PlanPatchingUIProps): React.ReactElement {
  const {
    originalPlan,
    goals,
    constraints,
    onPatchedPlan,
    onCancel,
    onValidate,
    showTechnicalDetails = false,
  } = props;

  // Track which steps are removed
  const [removedSteps, setRemovedSteps] = useState<Set<number>>(new Set());

  // Analyze dependencies once
  const dependencies = useMemo(
    () => analyzeStepDependencies(originalPlan),
    [originalPlan]
  );

  const reverseDependencies = useMemo(
    () => buildReverseDependencies(dependencies),
    [dependencies]
  );

  // Build patchable steps with metadata
  const patchableSteps = useMemo<PatchableStep[]>(() => {
    return originalPlan.steps.map((step, index) => {
      const dependsOn = dependencies.get(index) || [];
      const dependedOnBy = reverseDependencies.get(index) || [];
      const isRemoved = removedSteps.has(index);

      // Check if any dependencies are removed
      const missingDependencies = dependsOn.filter(dep => removedSteps.has(dep));
      const removable = missingDependencies.length === 0;

      const removalImpact = analyzeRemovalImpact(
        index,
        step,
        originalPlan,
        goals,
        dependedOnBy
      );

      return {
        originalIndex: index,
        opcode: step,
        removable,
        nonRemovableReason: !removable
          ? `Depends on removed step(s): ${missingDependencies.join(', ')}`
          : undefined,
        servesGoals: getGoalsServedByStep(step, goals),
        satisfiesConstraints: [], // Would be populated from constraint analysis
        removalImpact,
        isRemoved,
        dependsOn,
        dependedOnBy,
      };
    });
  }, [originalPlan, goals, removedSteps, dependencies, reverseDependencies]);

  // Build patched plan
  const patchedPlan = useMemo<CPLPlan>(() => {
    return {
      ...originalPlan,
      steps: originalPlan.steps.filter((_, i) => !removedSteps.has(i)),
    };
  }, [originalPlan, removedSteps]);

  // Validate patched plan
  const validation = useMemo<PatchValidationResult>(() => {
    if (removedSteps.size === 0) {
      // No changes, original plan is valid
      return {
        valid: true,
        satisfiesGoals: true,
        unsatisfiedGoals: [],
        violatedConstraints: [],
        invalidSteps: [],
        scoreChange: {
          original: originalPlan.score || { total: 0 },
          patched: originalPlan.score || { total: 0 },
          delta: 0,
        },
        warnings: [],
        errors: [],
      };
    }

    return onValidate(patchedPlan, goals, constraints);
  }, [patchedPlan, goals, constraints, removedSteps, onValidate, originalPlan]);

  // Toggle step removal
  const handleToggleStep = useCallback(
    (stepIndex: number) => {
      setRemovedSteps(prev => {
        const next = new Set(prev);
        if (next.has(stepIndex)) {
          next.delete(stepIndex);
          
          // Also restore any steps that were auto-removed due to dependencies
          patchableSteps.forEach((patchable, i) => {
            if (patchable.dependsOn.includes(stepIndex) && next.has(i)) {
              next.delete(i);
            }
          });
        } else {
          next.add(stepIndex);
          
          // Auto-remove dependent steps
          const dependents = reverseDependencies.get(stepIndex) || [];
          dependents.forEach(depIndex => {
            next.add(depIndex);
          });
        }
        return next;
      });
    },
    [patchableSteps, reverseDependencies]
  );

  // Reset to original plan
  const handleReset = useCallback(() => {
    setRemovedSteps(new Set());
  }, []);

  // Apply patched plan
  const handleApply = useCallback(() => {
    if (validation.valid) {
      onPatchedPlan(patchedPlan, validation);
    }
  }, [validation, patchedPlan, onPatchedPlan]);

  const hasChanges = removedSteps.size > 0;
  const canApply = validation.valid && !validation.errors.length;

  return (
    <div className="plan-patching-ui">
      <div className="patching-header">
        <h3>Edit Plan Steps</h3>
        <div className="header-actions">
          {hasChanges && (
            <button className="reset-button" onClick={handleReset}>
              Reset
            </button>
          )}
          <button className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="apply-button"
            onClick={handleApply}
            disabled={!canApply}
          >
            Apply Changes
          </button>
        </div>
      </div>

      {!validation.valid && (
        <div className="validation-errors">
          <strong>Validation Errors:</strong>
          <ul>
            {validation.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="validation-warnings">
          <strong>Warnings:</strong>
          <ul>
            {validation.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.unsatisfiedGoals.length > 0 && (
        <div className="unsatisfied-goals">
          <strong>Unsatisfied Goals:</strong>
          <ul>
            {validation.unsatisfiedGoals.map((goal, i) => (
              <li key={i}>{goal.description || 'Unnamed goal'}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.violatedConstraints.length > 0 && (
        <div className="violated-constraints">
          <strong>Constraint Violations:</strong>
          <ul>
            {validation.violatedConstraints.map((constraint, i) => (
              <li key={i}>{constraint.description || 'Unnamed constraint'}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="plan-steps">
        {patchableSteps.map((patchable, index) => (
          <PatchableStepCard
            key={patchable.originalIndex}
            step={patchable}
            onToggle={handleToggleStep}
            showTechnicalDetails={showTechnicalDetails}
          />
        ))}
      </div>

      <div className="patching-summary">
        <div className="summary-stats">
          <div className="stat">
            <strong>Original steps:</strong> {originalPlan.steps.length}
          </div>
          <div className="stat">
            <strong>Removed:</strong> {removedSteps.size}
          </div>
          <div className="stat">
            <strong>Remaining:</strong> {patchedPlan.steps.length}
          </div>
        </div>

        {hasChanges && validation.scoreChange && (
          <div className="score-change">
            <strong>Score change:</strong>
            <span
              className={
                validation.scoreChange.delta > 0 ? 'positive' : 'negative'
              }
            >
              {validation.scoreChange.delta > 0 ? '+' : ''}
              {validation.scoreChange.delta.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Patchable Step Card Component
// ============================================================================

interface PatchableStepCardProps {
  readonly step: PatchableStep;
  readonly onToggle: (stepIndex: number) => void;
  readonly showTechnicalDetails: boolean;
}

function PatchableStepCard(props: PatchableStepCardProps): React.ReactElement {
  const { step, onToggle, showTechnicalDetails } = props;

  const handleToggle = useCallback(() => {
    if (step.removable || step.isRemoved) {
      onToggle(step.originalIndex);
    }
  }, [step, onToggle]);

  const severityClass = `severity-${step.removalImpact.severity}`;

  return (
    <div
      className={`patchable-step-card ${step.isRemoved ? 'removed' : ''} ${
        !step.removable ? 'non-removable' : ''
      }`}
    >
      <div className="step-header">
        <div className="step-number">Step {step.originalIndex + 1}</div>
        <div className="step-category">{step.opcode.category}</div>
        <div className="step-risk">{step.opcode.risk}</div>
      </div>

      <div className="step-opcode">{step.opcode.opcodeId}</div>

      {step.opcode.description && (
        <div className="step-description">{step.opcode.description}</div>
      )}

      <div className="step-goals">
        {step.servesGoals.length > 0 && (
          <div>
            <strong>Serves goals:</strong> {step.servesGoals.join(', ')}
          </div>
        )}
      </div>

      {step.dependsOn.length > 0 && (
        <div className="step-dependencies">
          <strong>Depends on steps:</strong> {step.dependsOn.map(i => i + 1).join(', ')}
        </div>
      )}

      {step.dependedOnBy.length > 0 && (
        <div className="step-dependents">
          <strong>Required by steps:</strong>{' '}
          {step.dependedOnBy.map(i => i + 1).join(', ')}
        </div>
      )}

      <div className={`removal-impact ${severityClass}`}>
        {step.removalImpact.summary}
      </div>

      {!step.removable && step.nonRemovableReason && (
        <div className="non-removable-reason">{step.nonRemovableReason}</div>
      )}

      {showTechnicalDetails && step.opcode.parameters && (
        <div className="step-parameters">
          <strong>Parameters:</strong>
          <pre>{JSON.stringify(step.opcode.parameters, null, 2)}</pre>
        </div>
      )}

      <div className="step-actions">
        <button
          className={`toggle-button ${step.isRemoved ? 'restore' : 'remove'}`}
          onClick={handleToggle}
          disabled={!step.removable && !step.isRemoved}
        >
          {step.isRemoved ? 'Restore' : 'Remove'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// CSS (for reference - should be in separate stylesheet)
// ============================================================================

// .plan-patching-ui {
//   padding: 16px;
//   background: var(--surface-1);
//   border-radius: 8px;
// }
//
// .patching-header {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 16px;
// }
//
// .header-actions {
//   display: flex;
//   gap: 8px;
// }
//
// .plan-steps {
//   display: flex;
//   flex-direction: column;
//   gap: 12px;
//   margin: 16px 0;
// }
//
// .patchable-step-card {
//   padding: 16px;
//   background: var(--surface-2);
//   border-radius: 6px;
//   border: 2px solid var(--border-1);
//   transition: all 0.2s;
// }
//
// .patchable-step-card.removed {
//   opacity: 0.5;
//   border-color: var(--error-border);
//   background: var(--error-bg-subtle);
// }
//
// .patchable-step-card.non-removable {
//   border-color: var(--border-disabled);
// }
//
// .severity-critical {
//   color: var(--error-text);
//   font-weight: bold;
// }
//
// .severity-high {
//   color: var(--warning-text);
//   font-weight: bold;
// }
//
// .severity-moderate {
//   color: var(--warning-text);
// }
