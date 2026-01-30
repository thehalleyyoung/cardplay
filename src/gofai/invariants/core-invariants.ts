/**
 * GOFAI Core Invariants — The Seven Non-Negotiable Invariants
 *
 * This module defines the core invariant registry with all seven
 * non-negotiable semantic safety invariants from the specification.
 *
 * @module gofai/invariants/core-invariants
 */

import {
  InvariantBuilder,
  ok,
  violation,
  invariantId,
  type InvariantRegistry,
} from './types';
import { CONSTRAINT_VERIFIERS, type ProjectStateSnapshot } from './constraint-verifiers';

// =============================================================================
// CPL Operation Types (for invariant checking)
// =============================================================================

/**
 * Simplified CPL operation for invariant checking.
 */
export interface CPLOperation {
  /** Operation ID */
  readonly id: string;

  /** Opcode name */
  readonly opcode: string;

  /** Effect type */
  readonly effectType: 'inspect' | 'propose' | 'mutate';

  /** Target entities */
  readonly targets: readonly string[];

  /** Constraints that must hold */
  readonly constraints: readonly {
    readonly typeId: string;
    readonly params: Record<string, unknown>;
  }[];

  /** Whether user has approved this operation */
  readonly approved: boolean;

  /** Undo token if already applied */
  readonly undoToken?: string;

  /** Detected ambiguities */
  readonly ambiguities: readonly {
    readonly type: string;
    readonly expression: string;
    readonly interpretations: readonly string[];
    readonly resolved: boolean;
  }[];

  /** Referential expressions */
  readonly references: readonly {
    readonly expression: string;
    readonly resolved: boolean;
    readonly resolvedTo?: string;
  }[];

  /** Presuppositions */
  readonly presuppositions: readonly {
    readonly description: string;
    readonly verified: boolean;
    readonly holds?: boolean;
  }[];

  /** Scope of the operation */
  readonly scope?: {
    readonly sections: readonly string[];
    readonly layers: readonly string[];
    readonly parameters: readonly string[];
  };

  /** State before operation (for mutation verification) */
  readonly stateBefore?: ProjectStateSnapshot;

  /** State after operation (for mutation verification) */
  readonly stateAfter?: ProjectStateSnapshot;
}

/**
 * Context for invariant checking.
 */
export interface InvariantContext {
  /** Current project state */
  readonly state: ProjectStateSnapshot;

  /** Whether in "auto-apply" mode (dangerous) */
  readonly autoApplyEnabled: boolean;

  /** User's approval state */
  readonly userApproved: boolean;

  /** Whether determinism checking is enabled */
  readonly determinismCheckEnabled: boolean;

  /** Previous run results for determinism check */
  readonly previousRunResult?: unknown;
}

// =============================================================================
// Core Invariant Definitions
// =============================================================================

const builder = new InvariantBuilder<InvariantContext, CPLOperation>();

// -----------------------------------------------------------------------------
// 1. Constraint Executability Invariant
// -----------------------------------------------------------------------------

builder.define({
  id: 'constraint-executability',
  name: 'Constraint Executability',
  category: 'constraint-executability',
  description:
    'Every constraint must have an executable verifier. ' +
    'Constraints are not annotations—they are runtime-checked predicates.',
  severity: 'critical',

  check(_ctx, operation) {
    for (const constraint of operation.constraints) {
      const verifier = CONSTRAINT_VERIFIERS.getVerifier(constraint.typeId);

      if (!verifier) {
        return violation(
          invariantId('constraint-executability'),
          'critical',
          `Constraint type "${constraint.typeId}" has no registered verifier`,
          {
            expected: 'A verifier function for this constraint type',
            actual: 'No verifier registered',
            location: `operation.constraints[typeId=${constraint.typeId}]`,
            context: { constraintTypeId: constraint.typeId },
          }
        );
      }
    }

    return ok();
  },
});

// -----------------------------------------------------------------------------
// 2. Silent Ambiguity Prohibition Invariant
// -----------------------------------------------------------------------------

builder.define({
  id: 'ambiguity-prohibition',
  name: 'Silent Ambiguity Prohibition',
  category: 'ambiguity-prohibition',
  description:
    'No ambiguity may be resolved silently. ' +
    'If an ambiguity is detected, the user must be prompted for clarification.',
  severity: 'critical',

  check(_ctx, operation) {
    for (const ambiguity of operation.ambiguities) {
      if (!ambiguity.resolved) {
        // This is expected - we should be prompting the user
        return ok();
      }

      // If resolved without multiple interpretations, something is wrong
      if (ambiguity.interpretations.length <= 1 && ambiguity.resolved) {
        return violation(
          invariantId('ambiguity-prohibition'),
          'critical',
          `Ambiguity "${ambiguity.expression}" was marked resolved but has only ${ambiguity.interpretations.length} interpretation(s)`,
          {
            expected: 'At least 2 interpretations for an ambiguity, or explicit user resolution',
            actual: `${ambiguity.interpretations.length} interpretation(s), marked as resolved`,
            location: `operation.ambiguities[expression="${ambiguity.expression}"]`,
          }
        );
      }
    }

    // Check that all ambiguities are resolved before allowing mutation
    if (operation.effectType === 'mutate') {
      const unresolved = operation.ambiguities.filter((a) => !a.resolved);

      if (unresolved.length > 0) {
        return violation(
          invariantId('ambiguity-prohibition'),
          'critical',
          `Cannot mutate with ${unresolved.length} unresolved ambiguity/ambiguities`,
          {
            expected: 'All ambiguities resolved before mutation',
            actual: `${unresolved.length} unresolved: ${unresolved.map((a) => a.expression).join(', ')}`,
            location: 'operation.ambiguities',
          }
        );
      }
    }

    return ok();
  },
});

// -----------------------------------------------------------------------------
// 3. Constraint Preservation Invariant
// -----------------------------------------------------------------------------

builder.define({
  id: 'constraint-preservation',
  name: 'Constraint Preservation',
  category: 'preservation',
  description:
    'Preserve constraints are inviolable during planning. ' +
    'If a preserve constraint is specified, the preserved aspects must not change.',
  severity: 'critical',

  check(_ctx, operation) {
    // Only check after mutation
    if (operation.effectType !== 'mutate') return ok();
    if (!operation.stateBefore || !operation.stateAfter) return ok();

    for (const constraint of operation.constraints) {
      // Check preservation constraints
      if (
        constraint.typeId.startsWith('preserve') ||
        constraint.typeId === 'only_change' ||
        constraint.typeId === 'exclude' ||
        constraint.typeId === 'no_structural_change' ||
        constraint.typeId === 'no_new_layers' ||
        constraint.typeId === 'no_new_chords'
      ) {
        const result = CONSTRAINT_VERIFIERS.verify(
          constraint,
          operation.stateBefore,
          operation.stateAfter
        );

        if (!result.satisfied) {
          return violation(
            invariantId('constraint-preservation'),
            'critical',
            `Constraint "${constraint.typeId}" was violated: ${result.reason}`,
            {
              expected: `Constraint "${constraint.typeId}" to be satisfied`,
              actual: result.reason,
              location: `operation.constraints[typeId=${constraint.typeId}]`,
              context: { constraintParams: constraint.params, details: result.details },
            }
          );
        }
      }
    }

    return ok();
  },
});

// -----------------------------------------------------------------------------
// 4. Referent Resolution Completeness Invariant
// -----------------------------------------------------------------------------

builder.define({
  id: 'referent-resolution',
  name: 'Referent Resolution Completeness',
  category: 'referent-resolution',
  description:
    'All referential expressions must resolve or fail explicitly. ' +
    'No operation may proceed with unresolved references.',
  severity: 'critical',

  check(_ctx, operation) {
    const unresolved = operation.references.filter((r) => !r.resolved);

    if (unresolved.length > 0) {
      const unresolvedExprs = unresolved.map((r) => r.expression).join(', ');

      return violation(
        invariantId('referent-resolution'),
        'critical',
        `${unresolved.length} unresolved reference(s): ${unresolvedExprs}`,
        {
          expected: 'All referential expressions to resolve to entities',
          actual: `${unresolved.length} unresolved: ${unresolvedExprs}`,
          location: 'operation.references',
        }
      );
    }

    return ok();
  },
});

// -----------------------------------------------------------------------------
// 5. Effect Typing Invariant
// -----------------------------------------------------------------------------

builder.define({
  id: 'effect-typing',
  name: 'Effect Typing',
  category: 'effect-typing',
  description:
    'Every operation has a declared effect type (inspect, propose, mutate). ' +
    'Mutate operations require explicit user approval.',
  severity: 'critical',

  check(ctx, operation) {
    // Verify effect type is declared
    if (!['inspect', 'propose', 'mutate'].includes(operation.effectType)) {
      return violation(
        invariantId('effect-typing'),
        'critical',
        `Invalid effect type: ${operation.effectType}`,
        {
          expected: 'One of: inspect, propose, mutate',
          actual: operation.effectType,
          location: 'operation.effectType',
        }
      );
    }

    // Mutate requires approval
    if (operation.effectType === 'mutate' && !operation.approved) {
      // Unless in auto-apply mode (which should be rare)
      if (!ctx.autoApplyEnabled) {
        return violation(
          invariantId('effect-typing'),
          'critical',
          'Mutate operation requires user approval',
          {
            expected: 'operation.approved === true for mutate operations',
            actual: 'operation.approved === false',
            location: 'operation.approved',
          }
        );
      }
    }

    return ok();
  },
});

// -----------------------------------------------------------------------------
// 6. Determinism Invariant
// -----------------------------------------------------------------------------

builder.define({
  id: 'determinism',
  name: 'Determinism',
  category: 'determinism',
  description:
    'Same input + same state = same output. ' +
    'No random choices, no time-based logic, no external calls.',
  severity: 'critical',

  check(ctx, operation) {
    if (!ctx.determinismCheckEnabled) return ok();
    if (!ctx.previousRunResult) return ok();

    // In a real implementation, this would compare the current operation
    // result with the previous run result. Here we just verify the
    // operation has deterministic characteristics.

    // Check for non-deterministic indicators
    const opStr = JSON.stringify(operation);

    // Look for obvious non-determinism markers
    if (opStr.includes('Math.random') || opStr.includes('Date.now')) {
      return violation(
        invariantId('determinism'),
        'critical',
        'Operation contains non-deterministic elements',
        {
          expected: 'No random or time-based logic in operations',
          actual: 'Found potential non-determinism markers',
          location: 'operation',
        }
      );
    }

    return ok();
  },
});

// -----------------------------------------------------------------------------
// 7. Undoability Invariant
// -----------------------------------------------------------------------------

builder.define({
  id: 'undoability',
  name: 'Undoability',
  category: 'undoability',
  description:
    'Every mutation is reversible. ' +
    'Every mutate operation must produce an undo token.',
  severity: 'critical',

  check(_ctx, operation) {
    // Only check mutate operations that have been applied
    if (operation.effectType !== 'mutate') return ok();

    // If the operation has been applied (has stateAfter), it should have an undo token
    if (operation.stateAfter && !operation.undoToken) {
      return violation(
        invariantId('undoability'),
        'critical',
        'Mutate operation was applied without producing an undo token',
        {
          expected: 'An undo token after applying mutation',
          actual: 'No undo token present',
          location: 'operation.undoToken',
        }
      );
    }

    return ok();
  },
});

// -----------------------------------------------------------------------------
// Secondary Invariants
// -----------------------------------------------------------------------------

builder.define({
  id: 'scope-visibility',
  name: 'Scope Visibility',
  category: 'scope-visibility',
  description:
    "Every edit's scope is visible before execution. " +
    'The UI must highlight what will be affected before user approval.',
  severity: 'error',

  check(_ctx, operation) {
    if (operation.effectType !== 'mutate') return ok();

    if (!operation.scope) {
      return violation(
        invariantId('scope-visibility'),
        'error',
        'Mutate operation has no scope defined',
        {
          expected: 'Scope with sections, layers, and parameters',
          actual: 'No scope present',
          location: 'operation.scope',
        }
      );
    }

    const { sections, layers, parameters } = operation.scope;

    if (sections.length === 0 && layers.length === 0 && parameters.length === 0) {
      return violation(
        invariantId('scope-visibility'),
        'error',
        'Mutate operation has empty scope',
        {
          expected: 'At least one affected section, layer, or parameter',
          actual: 'Empty scope',
          location: 'operation.scope',
        }
      );
    }

    return ok();
  },
});

builder.define({
  id: 'presupposition-verification',
  name: 'Presupposition Verification',
  category: 'presupposition',
  description:
    'Presuppositions are verified, not assumed. ' +
    'If a presupposition fails, the operation must report an error.',
  severity: 'error',

  check(_ctx, operation) {
    for (const presup of operation.presuppositions) {
      if (!presup.verified) {
        return violation(
          invariantId('presupposition-verification'),
          'error',
          `Presupposition not verified: "${presup.description}"`,
          {
            expected: 'All presuppositions verified before execution',
            actual: `Presupposition "${presup.description}" not verified`,
            location: 'operation.presuppositions',
          }
        );
      }

      if (presup.verified && presup.holds === false) {
        return violation(
          invariantId('presupposition-verification'),
          'error',
          `Presupposition failed: "${presup.description}"`,
          {
            expected: 'Presupposition to hold',
            actual: 'Presupposition does not hold',
            location: 'operation.presuppositions',
          }
        );
      }
    }

    return ok();
  },
});

builder.define({
  id: 'constraint-compatibility',
  name: 'Constraint Compatibility',
  category: 'constraint-compatibility',
  description:
    'Conflicting constraints are detected, not ignored. ' +
    'If constraints conflict, the operation must fail.',
  severity: 'error',

  check(_ctx, operation) {
    const constraints = operation.constraints;

    // Check for obvious conflicts
    const preserveTargets = new Set<string>();
    const changeTargets = new Set<string>();

    for (const c of constraints) {
      if (c.typeId.startsWith('preserve') && c.params.target) {
        preserveTargets.add(c.params.target as string);
      }

      if (c.typeId === 'change' && c.params.target) {
        changeTargets.add(c.params.target as string);
      }
    }

    // Check for preserve + change on same target
    for (const target of preserveTargets) {
      if (changeTargets.has(target)) {
        return violation(
          invariantId('constraint-compatibility'),
          'error',
          `Conflicting constraints: preserve and change on same target "${target}"`,
          {
            expected: 'No conflicting constraints',
            actual: `Target "${target}" has both preserve and change constraints`,
            location: 'operation.constraints',
          }
        );
      }
    }

    // Check for tempo range conflicts
    const tempoConstraints = constraints.filter((c) => c.typeId === 'tempo');
    if (tempoConstraints.length > 1) {
      let globalMin = -Infinity;
      let globalMax = Infinity;

      for (const tc of tempoConstraints) {
        const min = (tc.params.min as number) ?? -Infinity;
        const max = (tc.params.max as number) ?? Infinity;
        globalMin = Math.max(globalMin, min);
        globalMax = Math.min(globalMax, max);
      }

      if (globalMin > globalMax) {
        return violation(
          invariantId('constraint-compatibility'),
          'error',
          'Conflicting tempo constraints: no valid tempo range',
          {
            expected: 'Compatible tempo ranges',
            actual: `Computed range [${globalMin}, ${globalMax}] is empty`,
            location: 'operation.constraints',
          }
        );
      }
    }

    return ok();
  },
});

// =============================================================================
// Export Registry
// =============================================================================

/**
 * The core invariant registry.
 */
export const CORE_INVARIANTS: InvariantRegistry<InvariantContext, CPLOperation> =
  builder.build();

/**
 * Check all core invariants.
 */
export function checkCoreInvariants(
  context: InvariantContext,
  operation: CPLOperation
) {
  return CORE_INVARIANTS.checkAll(context, operation);
}

/**
 * Check only critical invariants.
 */
export function checkCriticalInvariants(
  context: InvariantContext,
  operation: CPLOperation
) {
  return CORE_INVARIANTS.checkCritical(context, operation);
}
