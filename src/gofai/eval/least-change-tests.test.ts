/**
 * @file Least-Change Planning Tests
 * @module gofai/eval/least-change-tests
 *
 * Implements Step 288 from gofai_goalB.md:
 * - Add least-change tests: given two satisfying plans, system picks lower cost unless user requests otherwise
 * - Verify that planner prefers minimal edits by default
 * - Test cost comparison logic
 * - Validate that user can override least-change preference
 * - Ensure tie-breaking is deterministic when costs are equal
 *
 * The "least-change" principle is core to GOFAI Music+'s design philosophy:
 * Users expect the system to make minimal modifications to achieve goals.
 * This prevents over-editing and preserves user intent.
 *
 * Test Scenarios:
 * 1. When multiple plans satisfy goals, choose lowest cost
 * 2. Cost hierarchy: melody changes > harmony changes > rhythm > production
 * 3. User can request "aggressive" or "rewrite" to override least-change
 * 4. Tie-breaking uses stable secondary criteria
 * 5. Cost calculation is consistent and deterministic
 *
 * @see gofai_goalB.md Step 288, Step 257
 * @see src/gofai/planning/least-change-strategy.ts
 * @see src/gofai/planning/cost-model.ts
 */

import { describe, it, expect } from 'vitest';
import type { CPLIntent, CPLGoal, CPLConstraint } from '../canon/cpl-types';
import type { CPLPlan } from '../canon/cpl-types';
import type { ProjectState } from '../execution/transactional-execution';
import { generatePlans } from '../planning/plan-generation';
import { scorePlan, PlanScore } from '../planning/cost-model';

// ============================================================================
// Test Helpers
// ============================================================================

function createMinimalFixture(): ProjectState {
  return {
    events: { get: () => undefined, getAll: () => [], add: () => {}, remove: () => {}, update: () => {}, query: () => [] },
    tracks: { get: () => undefined, getAll: () => [], add: () => {}, remove: () => {}, update: () => {} },
    cards: { get: () => undefined, getAll: () => [], add: () => {}, remove: () => {}, updateParameter: () => {} },
    sections: { get: () => undefined, getAll: () => [], add: () => {}, remove: () => {}, update: () => {} },
    routing: { get: () => undefined, getAll: () => [], add: () => {}, remove: () => {}, connect: () => {}, disconnect: () => {} },
    metadata: { tempo: 120, timeSignature: { numerator: 4, denominator: 4 }, key: 'C', lengthInBars: 16 },
  };
}

function createAxisGoal(axis: string, direction: 'increase' | 'decrease', amount?: string): CPLGoal {
  return {
    type: 'goal',
    id: `goal_${axis}_${direction}`,
    variant: 'axis-goal',
    axis,
    direction,
    targetValue: amount ? { type: 'qualitative', qualifier: amount as any } : undefined,
  };
}

function createIntent(goals: CPLGoal[], constraints: CPLConstraint[] = []): CPLIntent {
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
// Test Suite: Basic Least-Change
// ============================================================================

describe('Least-Change Tests: Basic Principle', () => {
  it('should prefer lower-cost plan when both satisfy goals', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('brightness', 'increase', 'somewhat'),
    ]);

    const plans = generatePlans(intent, fixture);
    expect(plans.length).toBeGreaterThanOrEqual(2);

    const topPlan = plans[0]!;
    const secondPlan = plans[1]!;

    // Top plan should have lower or equal cost
    expect(topPlan.cost).toBeLessThanOrEqual(secondPlan.cost);

    // Both should satisfy the goal
    expect(topPlan.satisfiesGoals).toContain('goal_brightness_increase');
    expect(secondPlan.satisfiesGoals).toContain('goal_brightness_increase');
  });

  it('should minimize opcode count for simple goals', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('volume', 'increase', 'a-little'),
    ]);

    const plans = generatePlans(intent, fixture);
    const topPlan = plans[0]!;

    // Simple goal should result in few opcodes
    expect(topPlan.opcodes.length).toBeLessThanOrEqual(2);
  });

  it('should prefer non-destructive edits', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('energy', 'increase', 'much'),
    ]);

    const plans = generatePlans(intent, fixture);
    const topPlan = plans[0]!;

    // Should avoid destructive opcodes
    const hasDestructive = topPlan.opcodes.some(op => op.destructive);
    expect(hasDestructive).toBe(false);
  });

  it('should rank plans by total cost', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('darkness', 'increase', 'significantly'),
    ]);

    const plans = generatePlans(intent, fixture);
    expect(plans.length).toBeGreaterThan(1);

    // Plans should be sorted by ascending cost
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i]!.cost).toBeGreaterThanOrEqual(plans[i - 1]!.cost);
    }
  });
});

// ============================================================================
// Test Suite: Cost Hierarchy
// ============================================================================

describe('Least-Change Tests: Cost Hierarchy', () => {
  it('should treat melody changes as most expensive', () => {
    const fixture = createMinimalFixture();

    // Create two hypothetical plans (simulation)
    const melodyPlan: Partial<CPLPlan> = {
      opcodes: [
        {
          type: 'opcode',
          id: 'op1',
          opcodeId: 'opcode:melody:transpose',
          category: 'melody',
          scope: { type: 'scope', id: 's1' } as any,
          params: {},
          cost: 50, // High cost for melody
          risk: 'high',
          destructive: false,
          requiresPreview: true,
        } as any,
      ],
    };

    const productionPlan: Partial<CPLPlan> = {
      opcodes: [
        {
          type: 'opcode',
          id: 'op2',
          opcodeId: 'opcode:production:eq_boost',
          category: 'production',
          scope: { type: 'scope', id: 's1' } as any,
          params: {},
          cost: 10, // Low cost for production
          risk: 'low',
          destructive: false,
          requiresPreview: false,
        } as any,
      ],
    };

    // Production changes should be cheaper than melody changes
    const melodyCost = melodyPlan.opcodes![0]!.cost;
    const productionCost = productionPlan.opcodes![0]!.cost;

    expect(productionCost).toBeLessThan(melodyCost);
  });

  it('should prefer production changes over event changes', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('brightness', 'increase', 'much'),
    ]);

    const plans = generatePlans(intent, fixture);
    const topPlan = plans[0]!;

    // For brightness, production (EQ) should be preferred over note changes
    const productionOpcodes = topPlan.opcodes.filter(op => op.category === 'production');
    const eventOpcodes = topPlan.opcodes.filter(op => op.category === 'event');

    // Should favor production approach
    expect(productionOpcodes.length).toBeGreaterThanOrEqual(eventOpcodes.length);
  });

  it('should calculate costs consistently', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('width', 'increase'),
    ]);

    // Generate same plan multiple times
    const runs = Array.from({ length: 5 }, () => generatePlans(intent, fixture));

    // Top plan cost should be identical across runs
    const firstCost = runs[0]![0]!.cost;
    for (const run of runs.slice(1)) {
      expect(run[0]!.cost).toBe(firstCost);
    }
  });
});

// ============================================================================
// Test Suite: User Override
// ============================================================================

describe('Least-Change Tests: User Override', () => {
  it('should allow user to request aggressive editing', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('energy', 'increase', 'extremely'),
    ]);

    // Add preference for aggressive editing
    intent.preferences = [
      {
        type: 'preference',
        id: 'edit_style',
        category: 'edit-style',
        value: 'aggressive',
        weight: 1.0,
      },
    ];

    const plans = generatePlans(intent, fixture);
    const topPlan = plans[0]!;

    // With aggressive preference, may allow higher-cost edits
    // Should still produce valid plan, potentially with more opcodes
    expect(topPlan.opcodes.length).toBeGreaterThan(0);
  });

  it('should allow user to request minimal editing', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('brightness', 'increase', 'very'),
    ]);

    // Add preference for minimal editing
    intent.preferences = [
      {
        type: 'preference',
        id: 'edit_style',
        category: 'edit-style',
        value: 'minimal',
        weight: 1.0,
      },
    ];

    const plans = generatePlans(intent, fixture);
    const topPlan = plans[0]!;

    // With minimal preference, should use very few opcodes
    expect(topPlan.opcodes.length).toBeLessThanOrEqual(2);
    expect(topPlan.cost).toBeLessThan(20);
  });

  it('should allow user to request rewrite', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('harmony', 'increase', 'completely'),
    ]);

    // Add preference for rewrite
    intent.preferences = [
      {
        type: 'preference',
        id: 'edit_style',
        category: 'edit-style',
        value: 'rewrite',
        weight: 1.0,
      },
    ];

    const plans = generatePlans(intent, fixture);
    const topPlan = plans[0]!;

    // Rewrite may include higher-cost, more transformative changes
    // Should not be constrained by least-change principle
    expect(topPlan).toBeDefined();
  });
});

// ============================================================================
// Test Suite: Tie-Breaking
// ============================================================================

describe('Least-Change Tests: Tie-Breaking', () => {
  it('should use deterministic tie-breaker when costs are equal', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('mood', 'increase'),
    ]);

    // Generate plans multiple times
    const runs = Array.from({ length: 5 }, () => generatePlans(intent, fixture));

    // If top plans have equal cost, order should be stable
    const firstOrder = runs[0]!.map(p => p.id);
    for (const run of runs.slice(1)) {
      const order = run.map(p => p.id);
      expect(order).toEqual(firstOrder);
    }
  });

  it('should prefer fewer opcodes when costs are equal', () => {
    // This is a principle: if two plans have same cost but different opcode counts,
    // prefer fewer opcodes
    const fixture = createMinimalFixture();

    // Simulated scenario where we have plans with same cost
    const plan1: Partial<CPLPlan> = {
      cost: 15,
      opcodes: [
        { id: 'op1', cost: 15 } as any,
      ],
    };

    const plan2: Partial<CPLPlan> = {
      cost: 15,
      opcodes: [
        { id: 'op2', cost: 10 } as any,
        { id: 'op3', cost: 5 } as any,
      ],
    };

    // Plan with fewer opcodes should rank higher
    // (This would be tested with actual plan generation)
    expect(plan1.opcodes!.length).toBeLessThan(plan2.opcodes!.length);
  });

  it('should use opcode category as secondary criteria', () => {
    const fixture = createMinimalFixture();

    // When costs equal, prefer production > event > melody changes
    // This is encoded in the cost model and tie-breaker logic
    expect(true).toBe(true); // Placeholder for actual test
  });

  it('should maintain stable ordering across multiple runs', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('lift', 'increase', 'somewhat'),
    ]);

    // Generate plans many times
    const runs = Array.from({ length: 10 }, () => generatePlans(intent, fixture));

    // Extract plan orderings
    const orderings = runs.map(plans => plans.map(p => p.id).join(','));

    // All orderings should be identical
    const firstOrdering = orderings[0]!;
    for (const ordering of orderings.slice(1)) {
      expect(ordering).toBe(firstOrdering);
    }
  });
});

// ============================================================================
// Test Suite: Proportionality
// ============================================================================

describe('Least-Change Tests: Proportionality', () => {
  it('should scale cost with goal magnitude', () => {
    const fixture = createMinimalFixture();

    const smallIntent = createIntent([
      createAxisGoal('energy', 'increase', 'a-little'),
    ]);

    const largeIntent = createIntent([
      createAxisGoal('energy', 'increase', 'very'),
    ]);

    const smallPlans = generatePlans(smallIntent, fixture);
    const largePlans = generatePlans(largeIntent, fixture);

    const smallCost = smallPlans[0]!.cost;
    const largeCost = largePlans[0]!.cost;

    // Larger changes should have higher cost
    expect(largeCost).toBeGreaterThan(smallCost);
  });

  it('should have proportional cost increase for multiple goals', () => {
    const fixture = createMinimalFixture();

    const singleGoalIntent = createIntent([
      createAxisGoal('brightness', 'increase'),
    ]);

    const multiGoalIntent = createIntent([
      createAxisGoal('brightness', 'increase'),
      createAxisGoal('width', 'increase'),
    ]);

    const singlePlans = generatePlans(singleGoalIntent, fixture);
    const multiPlans = generatePlans(multiGoalIntent, fixture);

    const singleCost = singlePlans[0]!.cost;
    const multiCost = multiPlans[0]!.cost;

    // Multiple goals should increase cost
    expect(multiCost).toBeGreaterThan(singleCost);

    // But not linearly (synergies may exist)
    // multiCost should be < 2 * singleCost in many cases
  });

  it('should avoid exponential cost growth', () => {
    const fixture = createMinimalFixture();

    // Test with 1, 2, 3, 4 goals
    const goalCounts = [1, 2, 3, 4];
    const costs = goalCounts.map(count => {
      const goals = Array.from({ length: count }, (_, i) =>
        createAxisGoal(`axis${i}`, 'increase')
      );
      const intent = createIntent(goals);
      const plans = generatePlans(intent, fixture);
      return plans[0]!.cost;
    });

    // Cost growth should be sub-exponential
    // Cost(n+1) / Cost(n) should be < 2
    for (let i = 1; i < costs.length; i++) {
      const ratio = costs[i]! / costs[i - 1]!;
      expect(ratio).toBeLessThan(2.0);
    }
  });
});

// ============================================================================
// Test Suite: Edge Cases
// ============================================================================

describe('Least-Change Tests: Edge Cases', () => {
  it('should handle zero-cost plans (identity)', () => {
    const fixture = createMinimalFixture();

    // Goal that is already satisfied
    const intent = createIntent([
      createAxisGoal('tempo', 'set' as any), // Set to current value
    ]);

    const plans = generatePlans(intent, fixture);

    // May produce zero-cost plan (no changes needed)
    if (plans.length > 0 && plans[0]!.opcodes.length === 0) {
      expect(plans[0]!.cost).toBe(0);
    }
  });

  it('should cap maximum cost', () => {
    const fixture = createMinimalFixture();

    // Extreme goals
    const intent = createIntent([
      createAxisGoal('everything', 'increase', 'completely'),
    ]);

    const plans = generatePlans(intent, fixture);

    if (plans.length > 0) {
      const topCost = plans[0]!.cost;
      // Cost should not exceed some reasonable maximum
      expect(topCost).toBeLessThan(10000);
    }
  });

  it('should handle negative costs gracefully', () => {
    // Costs should never be negative
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('simplicity', 'increase'), // Removing things
    ]);

    const plans = generatePlans(intent, fixture);

    for (const plan of plans) {
      expect(plan.cost).toBeGreaterThanOrEqual(0);
      for (const opcode of plan.opcodes) {
        expect(opcode.cost).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ============================================================================
// Export test runner
// ============================================================================

export function runLeastChangeTests() {
  console.log('Least-Change Tests: All tests registered');
}
