/**
 * @file Constraint Violation Tests
 * @module gofai/eval/constraint-violation-tests
 *
 * Implements Step 287 from gofai_goalB.md:
 * - Add constraint violation tests: planner must never output a plan that violates hard constraints
 * - Test all constraint types (preserve, only-change, range, relation)
 * - Ensure constraint checkers catch violations
 * - Test constraint priority (hard vs soft)
 * - Validate constraint interaction (multiple constraints)
 *
 * This module provides exhaustive testing of constraint enforcement.
 * The planner must NEVER produce a plan that violates a hard constraint.
 * This is a critical safety property that must be maintained.
 *
 * Test Categories:
 * 1. Preserve constraints (melody, harmony, rhythm exact preservation)
 * 2. Only-change constraints (scope restrictions)
 * 3. Range constraints (value bounds)
 * 4. Relation constraints (value relationships)
 * 5. Structural constraints (form preservation)
 * 6. Multiple constraints (interaction and priority)
 *
 * @see gofai_goalB.md Step 287
 * @see src/gofai/planning/constraint-satisfaction.ts
 * @see src/gofai/invariants/constraint-verifiers.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  CPLIntent,
  CPLGoal,
  CPLConstraint,
  CPLPreserveConstraint,
  CPLOnlyChangeConstraint,
  CPLRangeConstraint,
  CPLRelationConstraint,
  CPLScope,
} from '../canon/cpl-types';
import type { CPLPlan } from '../canon/cpl-types';
import type { ProjectState } from '../execution/transactional-execution';
import { generatePlans } from '../planning/plan-generation';
import { validateConstraints } from '../planning/constraint-satisfaction';
import { applyPlanToFork, computeDiff } from '../execution/plan-executor';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a fixture with melody, harmony, and rhythm
 */
function createMusicalFixture(): ProjectState {
  // Simplified fixture with musical content
  return {
    events: {
      get: (id: string) => ({
        id,
        kind: 'note',
        pitch: 60,
        velocity: 100,
        onset: 0,
        duration: 480,
      }),
      getAll: () => [
        { id: 'note1', kind: 'note', pitch: 60, velocity: 100, onset: 0, duration: 480 },
        { id: 'note2', kind: 'note', pitch: 64, velocity: 100, onset: 480, duration: 480 },
        { id: 'note3', kind: 'note', pitch: 67, velocity: 100, onset: 960, duration: 480 },
      ],
      add: () => {},
      remove: () => {},
      update: () => {},
      query: () => [],
    },
    tracks: {
      get: () => undefined,
      getAll: () => [
        { id: 'melody', name: 'Melody', role: 'melody' },
        { id: 'harmony', name: 'Chords', role: 'harmony' },
        { id: 'drums', name: 'Drums', role: 'drums' },
      ],
      add: () => {},
      remove: () => {},
      update: () => {},
    },
    cards: {
      get: () => undefined,
      getAll: () => [],
      add: () => {},
      remove: () => {},
      updateParameter: () => {},
    },
    sections: {
      get: () => undefined,
      getAll: () => [],
      add: () => {},
      remove: () => {},
      update: () => {},
    },
    routing: {
      get: () => undefined,
      getAll: () => [],
      add: () => {},
      remove: () => {},
      connect: () => {},
      disconnect: () => {},
    },
    metadata: {
      tempo: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      key: 'C',
      lengthInBars: 8,
    },
  };
}

// ============================================================================
// Constraint Builders
// ============================================================================

function createPreserveConstraint(
  target: string,
  level: 'exact' | 'recognizable' | 'functional' = 'exact'
): CPLPreserveConstraint {
  return {
    type: 'constraint',
    id: `preserve_${target}`,
    variant: 'preserve',
    strength: 'hard',
    description: `Preserve ${target} ${level}`,
    target: {
      type: 'selector',
      id: `sel_${target}`,
      kind: 'role',
      role: target,
    } as any,
    level,
  } as any;
}

function createOnlyChangeConstraint(
  allowed: string,
  preserveLevel: 'exact' | 'recognizable' | 'functional' = 'exact'
): CPLOnlyChangeConstraint {
  return {
    type: 'constraint',
    id: `only_change_${allowed}`,
    variant: 'only-change',
    strength: 'hard',
    description: `Only change ${allowed}`,
    allowed: {
      type: 'selector',
      id: `sel_${allowed}`,
      kind: 'role',
      role: allowed,
    } as any,
    preserveLevel,
  } as any;
}

function createRangeConstraint(
  target: string,
  min?: number,
  max?: number
): CPLRangeConstraint {
  return {
    type: 'constraint',
    id: `range_${target}`,
    variant: 'range',
    strength: 'hard',
    description: `${target} must be in range [${min}, ${max}]`,
    target,
    min: min !== undefined ? { type: 'absolute', value: min } : undefined,
    max: max !== undefined ? { type: 'absolute', value: max } : undefined,
  } as any;
}

function createRelationConstraint(
  left: string,
  relation: 'less-than' | 'greater-than' | 'equal' | 'proportional',
  right: string,
  constant?: number
): CPLRelationConstraint {
  return {
    type: 'constraint',
    id: `relation_${left}_${relation}_${right}`,
    variant: 'relation',
    strength: 'hard',
    description: `${left} ${relation} ${right}`,
    left,
    relation,
    right,
    constant,
  } as any;
}

function createAxisGoal(
  axis: string,
  direction: 'increase' | 'decrease',
  amount?: string
): CPLGoal {
  return {
    type: 'goal',
    id: `goal_${axis}_${direction}`,
    variant: 'axis-goal',
    axis,
    direction,
    targetValue: amount ? { type: 'qualitative', qualifier: amount as any } : undefined,
  };
}

function createIntent(
  goals: CPLGoal[],
  constraints: CPLConstraint[] = []
): CPLIntent {
  return {
    type: 'intent',
    id: 'test_intent',
    goals,
    constraints,
    preferences: [],
    schemaVersion: { major: 1, minor: 0, patch: 0 },
  };
}

// ============================================================================
// Constraint Verification Helpers
// ============================================================================

/**
 * Verify that a plan respects all hard constraints
 */
function verifyConstraintsNotViolated(
  plan: CPLPlan,
  constraints: readonly CPLConstraint[],
  beforeState: ProjectState,
  afterState: ProjectState
): void {
  const hardConstraints = constraints.filter(c => c.strength === 'hard');

  for (const constraint of hardConstraints) {
    const result = validateConstraints(plan, [constraint], beforeState, afterState);

    if (!result.satisfied) {
      throw new Error(
        `CONSTRAINT VIOLATION: ${constraint.description}\n` +
        `Violations: ${JSON.stringify(result.violations, null, 2)}`
      );
    }
  }
}

/**
 * Apply plan and check constraints
 */
function applyAndVerifyConstraints(
  plan: CPLPlan,
  constraints: readonly CPLConstraint[],
  fixture: ProjectState
): { beforeState: ProjectState; afterState: ProjectState; valid: boolean } {
  // Fork state
  const afterState = applyPlanToFork(plan, fixture);

  // Verify constraints
  try {
    verifyConstraintsNotViolated(plan, constraints, fixture, afterState);
    return { beforeState: fixture, afterState, valid: true };
  } catch (error) {
    return { beforeState: fixture, afterState, valid: false };
  }
}

// ============================================================================
// Test Suite: Preserve Constraints
// ============================================================================

describe('Constraint Violation Tests: Preserve Constraints', () => {
  let fixture: ProjectState;

  beforeEach(() => {
    fixture = createMusicalFixture();
  });

  it('should never violate melody preservation (exact)', () => {
    const constraint = createPreserveConstraint('melody', 'exact');
    const intent = createIntent(
      [createAxisGoal('energy', 'increase', 'very')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    // Every plan must respect melody preservation
    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);
    }
  });

  it('should never violate harmony preservation (exact)', () => {
    const constraint = createPreserveConstraint('harmony', 'exact');
    const intent = createIntent(
      [createAxisGoal('brightness', 'increase', 'much')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);
    }
  });

  it('should never violate rhythm preservation (exact)', () => {
    const constraint = createPreserveConstraint('rhythm', 'exact');
    const intent = createIntent(
      [createAxisGoal('swing', 'increase', 'somewhat')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);
    }
  });

  it('should respect recognizable preservation level', () => {
    const constraint = createPreserveConstraint('melody', 'recognizable');
    const intent = createIntent(
      [createAxisGoal('ornamentation', 'increase')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);
    }
  });

  it('should handle multiple preserve constraints', () => {
    const constraints = [
      createPreserveConstraint('melody', 'exact'),
      createPreserveConstraint('harmony', 'exact'),
    ];

    const intent = createIntent(
      [createAxisGoal('energy', 'increase')],
      constraints
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, constraints, fixture);
      expect(valid).toBe(true);
    }
  });
});

// ============================================================================
// Test Suite: Only-Change Constraints
// ============================================================================

describe('Constraint Violation Tests: Only-Change Constraints', () => {
  let fixture: ProjectState;

  beforeEach(() => {
    fixture = createMusicalFixture();
  });

  it('should only change drums when constrained', () => {
    const constraint = createOnlyChangeConstraint('drums', 'exact');
    const intent = createIntent(
      [createAxisGoal('energy', 'increase')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);

      // Additionally verify that opcodes target only drums
      for (const opcode of plan.opcodes) {
        // Would need to evaluate scope against fixture
        // For now, trust constraint validation
      }
    }
  });

  it('should only change production params when constrained', () => {
    const constraint = createOnlyChangeConstraint('production', 'exact');
    const intent = createIntent(
      [createAxisGoal('width', 'increase')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);
    }
  });

  it('should never violate only-change with aggressive goals', () => {
    const constraint = createOnlyChangeConstraint('bass', 'exact');
    const intent = createIntent(
      [
        createAxisGoal('energy', 'increase', 'very'),
        createAxisGoal('lift', 'increase', 'very'),
        createAxisGoal('brightness', 'increase', 'very'),
      ],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    // Even with aggressive goals, constraint must be respected
    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);
    }
  });
});

// ============================================================================
// Test Suite: Range Constraints
// ============================================================================

describe('Constraint Violation Tests: Range Constraints', () => {
  let fixture: ProjectState;

  beforeEach(() => {
    fixture = createMusicalFixture();
  });

  it('should respect tempo range bounds', () => {
    const constraint = createRangeConstraint('tempo', 110, 130);
    const intent = createIntent(
      [createAxisGoal('energy', 'increase')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { afterState, valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);

      // Verify tempo is within bounds
      const tempo = afterState.metadata.tempo;
      expect(tempo).toBeGreaterThanOrEqual(110);
      expect(tempo).toBeLessThanOrEqual(130);
    }
  });

  it('should respect minimum-only bounds', () => {
    const constraint = createRangeConstraint('brightness', 0.3, undefined);
    const intent = createIntent(
      [createAxisGoal('darkness', 'increase')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);
    }
  });

  it('should respect maximum-only bounds', () => {
    const constraint = createRangeConstraint('volume', undefined, 0.8);
    const intent = createIntent(
      [createAxisGoal('energy', 'increase')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);
    }
  });
});

// ============================================================================
// Test Suite: Relation Constraints
// ============================================================================

describe('Constraint Violation Tests: Relation Constraints', () => {
  let fixture: ProjectState;

  beforeEach(() => {
    fixture = createMusicalFixture();
  });

  it('should maintain less-than relation', () => {
    const constraint = createRelationConstraint('bass_volume', 'less-than', 'kick_volume');
    const intent = createIntent(
      [createAxisGoal('energy', 'increase')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);
    }
  });

  it('should maintain proportional relation', () => {
    const constraint = createRelationConstraint('reverb_wet', 'proportional', 'delay_wet', 1.5);
    const intent = createIntent(
      [createAxisGoal('spaciousness', 'increase')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);
    }
  });

  it('should maintain equality relation', () => {
    const constraint = createRelationConstraint('left_gain', 'equal', 'right_gain');
    const intent = createIntent(
      [createAxisGoal('volume', 'increase')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, [constraint], fixture);
      expect(valid).toBe(true);
    }
  });
});

// ============================================================================
// Test Suite: Multiple Constraints
// ============================================================================

describe('Constraint Violation Tests: Multiple Constraints', () => {
  let fixture: ProjectState;

  beforeEach(() => {
    fixture = createMusicalFixture();
  });

  it('should respect all constraints when multiple are specified', () => {
    const constraints = [
      createPreserveConstraint('melody', 'exact'),
      createOnlyChangeConstraint('drums', 'exact'),
      createRangeConstraint('tempo', 110, 130),
    ];

    const intent = createIntent(
      [createAxisGoal('energy', 'increase')],
      constraints
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, constraints, fixture);
      expect(valid).toBe(true);

      // Verify plan acknowledges all constraints
      for (const constraint of constraints) {
        expect(plan.respectsConstraints).toContain(constraint.id);
      }
    }
  });

  it('should handle conflicting constraints gracefully', () => {
    // These constraints may conflict
    const constraints = [
      createPreserveConstraint('drums', 'exact'),
      createOnlyChangeConstraint('drums', 'exact'),
    ];

    const intent = createIntent(
      [createAxisGoal('energy', 'increase')],
      constraints
    );

    const plans = generatePlans(intent, fixture);

    // Should either:
    // 1. Return no plans (impossible to satisfy)
    // 2. Return plans with warnings
    // 3. Return plans that satisfy constraints trivially (no changes)

    if (plans.length > 0) {
      for (const plan of plans) {
        const { valid } = applyAndVerifyConstraints(plan, constraints, fixture);
        expect(valid).toBe(true);
      }
    }
  });

  it('should prioritize hard constraints over soft preferences', () => {
    const constraints = [
      createPreserveConstraint('harmony', 'exact'),
    ];

    const intent = createIntent(
      [createAxisGoal('brightness', 'increase', 'very')],
      constraints
    );

    // Add soft preference that might conflict
    intent.preferences = [
      {
        type: 'preference',
        id: 'pref_harmony_changes',
        category: 'method-preference',
        value: 'harmony-based',
        weight: 0.8,
      },
    ];

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      // Hard constraint MUST be respected, even if preference suggests otherwise
      const { valid } = applyAndVerifyConstraints(plan, constraints, fixture);
      expect(valid).toBe(true);
    }
  });
});

// ============================================================================
// Test Suite: Stress Tests
// ============================================================================

describe('Constraint Violation Tests: Stress Tests', () => {
  let fixture: ProjectState;

  beforeEach(() => {
    fixture = createMusicalFixture();
  });

  it('should never violate constraints even with extreme goals', () => {
    const constraints = [
      createPreserveConstraint('melody', 'exact'),
      createPreserveConstraint('harmony', 'exact'),
    ];

    const intent = createIntent(
      [
        createAxisGoal('energy', 'increase', 'extremely'),
        createAxisGoal('brightness', 'increase', 'extremely'),
        createAxisGoal('width', 'increase', 'extremely'),
        createAxisGoal('lift', 'increase', 'extremely'),
      ],
      constraints
    );

    const plans = generatePlans(intent, fixture);

    // Even with extreme goals, constraints are sacrosanct
    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, constraints, fixture);
      expect(valid).toBe(true);
    }
  });

  it('should handle many constraints efficiently', () => {
    const constraints = Array.from({ length: 10 }, (_, i) =>
      createPreserveConstraint(`param_${i}`, 'exact')
    );

    const intent = createIntent(
      [createAxisGoal('energy', 'increase')],
      constraints
    );

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      const { valid } = applyAndVerifyConstraints(plan, constraints, fixture);
      expect(valid).toBe(true);
    }
  });

  it('should fail fast when constraints are impossible', () => {
    // Impossible: preserve everything exactly but also change it
    const constraints = [
      createPreserveConstraint('melody', 'exact'),
      createPreserveConstraint('harmony', 'exact'),
      createPreserveConstraint('rhythm', 'exact'),
      createPreserveConstraint('texture', 'exact'),
      createPreserveConstraint('production', 'exact'),
    ];

    const intent = createIntent(
      [createAxisGoal('everything', 'increase', 'completely')],
      constraints
    );

    const plans = generatePlans(intent, fixture);

    // Should return no plans or plans with clear warnings
    expect(plans.length).toBe(0); // Preferred: reject impossible requests
  });
});

// ============================================================================
// Export test runner
// ============================================================================

export function runConstraintViolationTests() {
  console.log('Constraint Violation Tests: All tests registered');
}
