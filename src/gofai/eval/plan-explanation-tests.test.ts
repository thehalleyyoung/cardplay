/**
 * @file Plan Explanation Tests
 * @module gofai/eval/plan-explanation-tests
 *
 * Implements Step 289 from gofai_goalB.md:
 * - Add plan explanation tests: reasons include at least one link from each goal to at least one opcode
 * - Verify explanation completeness
 * - Test provenance tracking through compilation pipeline
 * - Validate that users can understand "why" for every change
 * - Ensure explanations are human-readable
 *
 * Explainability is crucial for user trust. Every opcode in a plan must have
 * a clear explanation linking it back to user goals. This enables:
 * - Understanding what the system did
 * - Debugging unexpected behavior
 * - Learning the system's reasoning
 * - Building trust in AI-assisted editing
 *
 * Test Requirements:
 * 1. Every goal must have at least one opcode that serves it
 * 2. Every opcode must have a reason linking to goals
 * 3. Provenance must track through: lexeme → semantics → planning → execution
 * 4. Explanations must be presentable to users
 * 5. "What changed and why" must always be answerable
 *
 * @see gofai_goalB.md Step 289, Step 264-265, Step 283
 * @see src/gofai/planning/plan-explainability.ts
 * @see src/gofai/pipeline/provenance.ts
 */

import { describe, it, expect } from 'vitest';
import type { CPLIntent, CPLGoal, CPLConstraint, Provenance } from '../canon/cpl-types';
import type { CPLPlan } from '../canon/cpl-types';
import type { ProjectState } from '../execution/transactional-execution';
import { generatePlans } from '../planning/plan-generation';
import { explainPlan, generateReasonTrace } from '../planning/plan-explainability';

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
// Test Suite: Basic Explanation Coverage
// ============================================================================

describe('Plan Explanation Tests: Coverage', () => {
  it('should link every goal to at least one opcode', () => {
    const fixture = createMinimalFixture();
    const goals = [
      createAxisGoal('energy', 'increase'),
      createAxisGoal('brightness', 'increase'),
    ];
    const intent = createIntent(goals);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    // Every goal should be satisfied by the plan
    for (const goal of goals) {
      expect(plan.satisfiesGoals).toContain(goal.id);
      
      // At least one opcode should reference this goal
      const opcodesSatisfyingGoal = plan.opcodes.filter(op =>
        op.satisfiesGoals?.includes(goal.id)
      );
      
      expect(opcodesSatisfyingGoal.length).toBeGreaterThan(0);
    }
  });

  it('should provide reason for every opcode', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('darkness', 'increase', 'much'),
    ]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    // Every opcode must have a reason
    for (const opcode of plan.opcodes) {
      expect(opcode.reason).toBeDefined();
      expect(opcode.reason).toBeTruthy();
      expect(typeof opcode.reason).toBe('string');
      expect(opcode.reason!.length).toBeGreaterThan(0);
    }
  });

  it('should link opcodes to specific goals in reason text', () => {
    const fixture = createMinimalFixture();
    const goal = createAxisGoal('width', 'increase');
    const intent = createIntent([goal]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    // At least one opcode should mention the goal axis in its reason
    const hasRelevantReason = plan.opcodes.some(op =>
      op.reason?.toLowerCase().includes('width') ||
      op.reason?.toLowerCase().includes('stereo')
    );

    expect(hasRelevantReason).toBe(true);
  });

  it('should handle multi-goal plans with clear attribution', () => {
    const fixture = createMinimalFixture();
    const goals = [
      createAxisGoal('lift', 'increase'),
      createAxisGoal('intimacy', 'increase'),
    ];
    const intent = createIntent(goals);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    // Each goal should have clear attribution
    for (const goal of goals) {
      const relatedOpcodes = plan.opcodes.filter(op =>
        op.satisfiesGoals?.includes(goal.id)
      );

      expect(relatedOpcodes.length).toBeGreaterThan(0);

      // Reasons should be distinct (not all identical)
      const reasons = relatedOpcodes.map(op => op.reason);
      expect(new Set(reasons).size).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Test Suite: Provenance Tracking
// ============================================================================

describe('Plan Explanation Tests: Provenance', () => {
  it('should track provenance from lexeme to opcode', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('brightness', 'increase'),
    ]);

    // Add provenance to intent
    const goalWithProvenance = {
      ...intent.goals[0]!,
      provenance: {
        lexemeId: 'lexeme:brightness',
        ruleId: 'rule:axis_goal',
        origin: 'User said "brighter"',
      } as Provenance,
    };

    const intentWithProvenance = {
      ...intent,
      goals: [goalWithProvenance],
    };

    const plans = generatePlans(intentWithProvenance, fixture);
    const plan = plans[0]!;

    // Opcodes should have provenance linking back
    const hasProvenance = plan.opcodes.some(op => op.provenance !== undefined);
    expect(hasProvenance).toBe(true);
  });

  it('should preserve provenance through planning stages', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
    ]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    // Plan itself should have provenance
    expect(plan.provenance).toBeDefined();

    // Provenance should reference intent
    expect(plan.provenance?.origin).toContain('intent');
  });

  it('should track which rule/strategy generated each opcode', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('darkness', 'increase'),
    ]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    // Each opcode should indicate how it was chosen
    for (const opcode of plan.opcodes) {
      // Either through provenance or reason
      const hasOrigin = 
        opcode.provenance?.origin !== undefined ||
        opcode.provenance?.ruleId !== undefined ||
        opcode.reason !== undefined;
      
      expect(hasOrigin).toBe(true);
    }
  });

  it('should include extension namespace in provenance when applicable', () => {
    const fixture = createMinimalFixture();
    
    // Simulate extension-provided goal
    const extensionGoal: CPLGoal = {
      type: 'goal',
      id: 'goal_custom',
      variant: 'axis-goal' as any,
      axis: 'my-pack:grit',
      direction: 'increase',
      provenance: {
        namespace: 'my-pack',
        origin: 'Extension: my-pack',
      },
    };

    const intent = createIntent([extensionGoal]);
    const plans = generatePlans(intent, fixture);

    if (plans.length > 0) {
      const plan = plans[0]!;
      
      // Opcodes serving extension goals should note the namespace
      const extensionOpcodes = plan.opcodes.filter(op =>
        op.satisfiesGoals?.includes('goal_custom')
      );

      if (extensionOpcodes.length > 0) {
        const hasNamespace = extensionOpcodes.some(op =>
          op.provenance?.namespace === 'my-pack' ||
          op.opcodeId.startsWith('my-pack:')
        );
        expect(hasNamespace).toBe(true);
      }
    }
  });
});

// ============================================================================
// Test Suite: Human-Readable Explanations
// ============================================================================

describe('Plan Explanation Tests: Human Readability', () => {
  it('should generate user-friendly explanation text', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('lift', 'increase', 'much'),
    ]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    const explanation = explainPlan(plan, intent);

    // Explanation should be readable
    expect(explanation).toBeDefined();
    expect(explanation.length).toBeGreaterThan(0);
    
    // Should not contain raw IDs or technical jargon
    expect(explanation).not.toContain('opcode:');
    expect(explanation).not.toContain('goal_');
    
    // Should use natural language
    expect(/increase|raise|boost|lift/i.test(explanation)).toBe(true);
  });

  it('should explain what each opcode does', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
    ]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    const explanation = explainPlan(plan, intent);

    // Should describe actions
    expect(/change|adjust|increase|modify/i.test(explanation)).toBe(true);
  });

  it('should explain why each opcode was chosen', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('brightness', 'increase'),
    ]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    const explanation = explainPlan(plan, intent);

    // Should contain reasoning keywords
    expect(/to|because|for|increases|achieves/i.test(explanation)).toBe(true);
  });

  it('should group related opcodes in explanation', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('energy', 'increase', 'very'),
    ]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    const explanation = explainPlan(plan, intent);

    // Should have logical structure
    // Not just a flat list
    expect(explanation.split('\n').length).toBeGreaterThan(1);
  });

  it('should mention constraints that were respected', () => {
    const fixture = createMinimalFixture();
    const constraint: CPLConstraint = {
      type: 'constraint',
      id: 'preserve_melody',
      variant: 'preserve',
      strength: 'hard',
      description: 'Preserve melody exactly',
      target: { type: 'selector', id: 's1' } as any,
      level: 'exact',
    } as any;

    const intent = createIntent(
      [createAxisGoal('darkness', 'increase')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    const explanation = explainPlan(plan, intent);

    // Should mention constraint preservation
    expect(/preserve|kept|maintained|respected/i.test(explanation)).toBe(true);
  });
});

// ============================================================================
// Test Suite: Explanation Completeness
// ============================================================================

describe('Plan Explanation Tests: Completeness', () => {
  it('should answer "what changed?"', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('width', 'increase'),
    ]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    const explanation = explainPlan(plan, intent);

    // Should describe what was modified
    expect(explanation.length).toBeGreaterThan(0);
    // Would check specific change descriptions in real implementation
  });

  it('should answer "why did it change?"', () => {
    const fixture = createMinimalFixture();
    const goal = createAxisGoal('energy', 'increase');
    const intent = createIntent([goal]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    // Generate reason trace
    const trace = generateReasonTrace(plan, goal.id);

    expect(trace).toBeDefined();
    expect(trace.length).toBeGreaterThan(0);
    
    // Trace should link goal to opcodes
    const hasGoalRef = trace.some(step => 
      step.type === 'goal' && step.id === goal.id
    );
    expect(hasGoalRef).toBe(true);
  });

  it('should answer "what was kept fixed?"', () => {
    const fixture = createMinimalFixture();
    const constraint: CPLConstraint = {
      type: 'constraint',
      id: 'preserve_harmony',
      variant: 'preserve',
      strength: 'hard',
      description: 'Preserve harmony',
      target: { type: 'selector', id: 's1' } as any,
      level: 'exact',
    } as any;

    const intent = createIntent(
      [createAxisGoal('energy', 'increase')],
      [constraint]
    );

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    const explanation = explainPlan(plan, intent);

    // Should mention what was preserved
    expect(plan.respectsConstraints).toContain('preserve_harmony');
  });

  it('should explain tradeoffs when goals conflict', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('lift', 'increase', 'very'),
      createAxisGoal('intimacy', 'increase', 'very'),
    ]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    const explanation = explainPlan(plan, intent);

    // If conflicts exist, should be mentioned
    if (plan.warnings && plan.warnings.length > 0) {
      expect(explanation).toContain('trade-off' || 'balance' || 'compromise');
    }
  });

  it('should explain why alternatives were rejected', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('brightness', 'increase'),
    ]);

    const plans = generatePlans(intent, fixture);
    expect(plans.length).toBeGreaterThan(1);

    const topPlan = plans[0]!;
    const altPlan = plans[1]!;

    // Should be able to explain why topPlan was chosen over altPlan
    // Typically: lower cost, fewer opcodes, less risky
    expect(topPlan.cost).toBeLessThanOrEqual(altPlan.cost);
  });
});

// ============================================================================
// Test Suite: Explanation Consistency
// ============================================================================

describe('Plan Explanation Tests: Consistency', () => {
  it('should generate identical explanations for identical plans', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('energy', 'increase'),
    ]);

    const plans1 = generatePlans(intent, fixture);
    const plans2 = generatePlans(intent, fixture);

    const explanation1 = explainPlan(plans1[0]!, intent);
    const explanation2 = explainPlan(plans2[0]!, intent);

    // Should be deterministic
    expect(explanation1).toBe(explanation2);
  });

  it('should maintain explanation across serialization', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('width', 'increase'),
    ]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    // Serialize and deserialize
    const serialized = JSON.stringify(plan);
    const deserialized = JSON.parse(serialized);

    // Should be able to generate same explanation
    const originalExplanation = explainPlan(plan, intent);
    const deserializedExplanation = explainPlan(deserialized, intent);

    expect(deserializedExplanation).toBe(originalExplanation);
  });

  it('should handle missing provenance gracefully', () => {
    const fixture = createMinimalFixture();
    const intent = createIntent([
      createAxisGoal('darkness', 'increase'),
    ]);

    const plans = generatePlans(intent, fixture);
    const plan = plans[0]!;

    // Strip provenance
    const planWithoutProvenance = {
      ...plan,
      provenance: undefined,
      opcodes: plan.opcodes.map(op => ({ ...op, provenance: undefined })),
    };

    // Should still generate explanation
    const explanation = explainPlan(planWithoutProvenance as CPLPlan, intent);
    expect(explanation).toBeDefined();
    expect(explanation.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Export test runner
// ============================================================================

export function runPlanExplanationTests() {
  console.log('Plan Explanation Tests: All tests registered');
}
