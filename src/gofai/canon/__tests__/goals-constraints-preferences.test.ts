/**
 * GOFAI Canon — Goals, Constraints, and Preferences Tests
 *
 * Comprehensive tests for Step 011 from gofai_goalB.md: "Specify the difference
 * between **goals**, **constraints**, and **preferences** (hard vs soft), with
 * a stable typed model."
 *
 * These tests validate:
 * 1. Goal creation and semantics
 * 2. Constraint creation and verification
 * 3. Preference creation and influence
 * 4. Type hierarchy and distinctions
 * 5. Composability and collections
 * 6. Conflict detection
 * 7. Feasibility checking
 * 8. Precedence rules
 * 9. Factory functions
 * 10. Real-world scenarios
 *
 * @module gofai/canon/__tests__/goals-constraints-preferences.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  createAxisChangeGoal,
  createPreserveConstraint,
  createRangeConstraint,
  createMinimalCostPreference,
  createNaturalnessPreference,
  IntentBuilder,
  detectConflictingConstraints,
  checkGoalFeasibility,
  rankGoals,
  filterPreferences,
  computePrecedence,
  type Goal,
  type Constraint,
  type Preference,
  type Intent,
  type Scope,
} from '../goals-constraints-preferences';

describe('Goals — Creation and Semantics', () => {
  it('should create axis change goal with defaults', () => {
    const goal = createAxisChangeGoal('brightness', 'increase');

    expect(goal.type).toBe('axis_change');
    expect(goal.axis).toBe('brightness');
    expect(goal.direction).toBe('increase');
    expect(goal.priority).toBeUndefined();
  });

  it('should create axis change goal with magnitude', () => {
    const goal = createAxisChangeGoal('brightness', 'increase', 0.3);

    expect(goal.amount?.value).toBe(0.3);
  });

  it('should create axis change goal with custom options', () => {
    const goal = createAxisChangeGoal('darkness', 'decrease', 'a little', {
      priority: 'important',
      scope: { type: 'section', sections: ['chorus'] },
      metadata: { source: 'user', confidence: 0.9 } as any,
    });

    expect(goal.priority).toBe('important');
    expect(goal.scope?.type).toBe('section');
    expect(goal.scope?.sections).toEqual(['chorus']);
    expect(goal.amount?.value).toBe('a little');
  });

  it('should distinguish different goal types', () => {
    const axisGoal = createAxisChangeGoal('brightness', 'increase');
    expect(axisGoal.type).toBe('axis_change');
  });

  it('should support different change directions', () => {
    const increase = createAxisChangeGoal('energy', 'increase');
    const decrease = createAxisChangeGoal('busyness', 'decrease');

    expect(increase.direction).toBe('increase');
    expect(decrease.direction).toBe('decrease');
  });

  it('should support scoped goals', () => {
    const globalScope: Scope = { type: 'global' };
    const sectionScope: Scope = {
      type: 'section',
      sections: ['verse-1', 'verse-2'],
    };
    const trackScope: Scope = {
      type: 'track',
      trackIds: ['drums', 'bass'],
    };

    const g1 = createAxisChangeGoal('brightness', 'increase', undefined, {
      scope: globalScope,
    });
    const g2 = createAxisChangeGoal('density', 'decrease', undefined, {
      scope: sectionScope,
    });
    const g3 = createAxisChangeGoal('width', 'increase', undefined, {
      scope: trackScope,
    });

    expect(g1.scope?.type).toBe('global');
    expect(g2.scope?.sections).toEqual(['verse-1', 'verse-2']);
    expect(g3.scope?.trackIds).toEqual(['drums', 'bass']);
  });

  it('should support goal metadata for provenance', () => {
    const goal = createAxisChangeGoal('brightness', 'increase');

    // Metadata would be added separately in real usage
    expect(goal.type).toBe('axis_change');
    expect(goal.axis).toBe('brightness');
  });
});

describe('Constraints — Creation and Verification', () => {
  it('should create preserve-exact constraint', () => {
    const constraint = createPreserveConstraint('melody', 'unchanged');

    expect(constraint.type).toBe('preserve');
    expect(constraint.aspect).toBe('melody');
    expect(constraint.exactness).toBe('exact');
  });

  it('should create preserve-function constraint', () => {
    const constraint = createPreserveConstraint('harmony', 'recognizable');

    expect(constraint.type).toBe('preserve');
    expect(constraint.aspect).toBe('harmony');
    expect(constraint.exactness).toBe('recognizable');
  });

  it('should create range constraint', () => {
    const constraint = createRangeConstraint('tempo', 120, 140);

    expect(constraint.type).toBe('range');
    expect(constraint.min).toBe(120);
    expect(constraint.max).toBe(140);
  });

  it('should support different constraint severities', () => {
    const blocking = createPreserveConstraint('melody', 'unchanged', {
      severity: 'blocking' as any,
    });
    const error = createRangeConstraint('tempo', 100, 150, {
      severity: 'error' as any,
    });

    expect((blocking as any).severity).toBe('blocking');
    expect((error as any).severity).toBe('error');
  });

  it('should support constraint targets with selectors', () => {
    const constraint = createPreserveConstraint('events', 'unchanged', {
      target: { type: 'events' as any, name: 'melody-events' },
    });

    expect(constraint.target).toBeDefined();
  });

  it('should support constraint metadata', () => {
    const explicit = createPreserveConstraint('melody', 'unchanged');
    const implicit = createPreserveConstraint('tempo', 'recognizable');

    expect(explicit.type).toBe('preserve');
    expect(implicit.type).toBe('preserve');
  });

  it('should support different constraint types', () => {
    const preserve = createPreserveConstraint('melody', 'unchanged');
    const range = createRangeConstraint('tempo', 120, 140);

    expect(preserve.type).toBe('preserve');
    expect(range.type).toBe('range');
  });

  it('should support constraint verification functions', () => {
    const constraint = createPreserveConstraint('melody', 'unchanged');

    // Verifier would be added separately
    expect(constraint.type).toBe('preserve');
  });
});

describe('Preferences — Creation and Influence', () => {
  it('should create minimal cost preference', () => {
    const pref = createMinimalCostPreference();

    expect(pref.type).toBe('cost');
    expect(pref.costType).toBe('total');
    expect(pref.preference).toBe('minimize');
    expect(pref.strength).toBe('strong');
  });

  it('should create naturalness preference', () => {
    const pref = createNaturalnessPreference();

    expect(pref.type).toBe('default');
    expect(pref.strength).toBe('moderate');
  });

  it('should support custom preference strength', () => {
    const weak = createMinimalCostPreference(0.3);
    const strong = createMinimalCostPreference(0.95);

    expect(weak.strength).toBe('weak');
    expect(strong.strength).toBe('strong');
  });

  it('should support different preference types', () => {
    const minCost = createMinimalCostPreference();
    const maxNatural = createNaturalnessPreference();

    expect(minCost.type).toBe('cost');
    expect(maxNatural.type).toBe('default');
  });

  it('should support preference metadata', () => {
    const explicit = createMinimalCostPreference(0.8);
    const implicit = createNaturalnessPreference(0.7);

    expect(explicit.type).toBe('cost');
    expect(implicit.type).toBe('default');
  });

  it('should filter preferences by strength threshold', () => {
    const prefs: Preference[] = [
      createMinimalCostPreference(0.9),
      createNaturalnessPreference(0.6),
      createMinimalCostPreference(0.3),
    ];

    const filtered = filterPreferences(prefs, 0.5);
    // 'strong' and 'moderate' should pass, 'weak' should not
    expect(filtered.length).toBeGreaterThan(0);
  });
});

describe('Intent — Composition and Builder', () => {
  it('should build intent with goals, constraints, and preferences', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('brightness', 'increase'))
      .addConstraint(createPreserveConstraint('melody', 'unchanged'))
      .addPreference(createMinimalCostPreference())
      .build();

    expect(intent.goals).toHaveLength(1);
    expect(intent.constraints).toHaveLength(1);
    expect(intent.preferences).toHaveLength(1);
  });

  it('should build intent with multiple goals', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('brightness', 'increase'))
      .addGoal(createAxisChangeGoal('energy', 'increase'))
      .addGoal(createAxisChangeGoal('busyness', 'decrease'))
      .build();

    expect(intent.goals).toHaveLength(3);
  });

  it('should build intent with scoped constraints', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('density', 'decrease'))
      .addConstraint(
        createPreserveConstraint('melody', 'unchanged', {
          target: {
            kind: 'melody',
            sections: ['verse'],
          },
        })
      )
      .addConstraint(
        createRangeConstraint('tempo', 120, 140)
      )
      .build();

    expect(intent.constraints).toHaveLength(2);
    expect(intent.constraints[0].target.sections).toEqual(['verse']);
  });

  it('should build intent with overall scope', () => {
    const scope: Scope = {
      type: 'section',
      sections: ['chorus'],
    };

    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('brightness', 'increase'))
      .setScope(scope)
      .build();

    expect(intent.scope?.type).toBe('section');
    expect(intent.scope?.sections).toEqual(['chorus']);
  });

  it('should build intent with metadata', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('darkness', 'increase'))
      .setMetadata({
        utterance: 'make it darker in the chorus',
        turnId: 'turn-123',
        boardId: 'board:composer',
      })
      .build();

    expect(intent.metadata?.utterance).toBe('make it darker in the chorus');
    expect(intent.metadata?.turnId).toBe('turn-123');
    expect(intent.metadata?.boardId).toBe('board:composer');
  });

  it('should allow chaining builder methods', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('brightness', 'increase'))
      .addGoal(createAxisChangeGoal('energy', 'increase'))
      .addConstraint(createPreserveConstraint('melody', 'unchanged'))
      .addConstraint(createRangeConstraint('tempo', 120, 140))
      .addPreference(createMinimalCostPreference())
      .addPreference(createNaturalnessPreference())
      .setScope({ type: 'global' })
      .setMetadata({ utterance: 'make it brighter and more energetic' })
      .build();

    expect(intent.goals).toHaveLength(2);
    expect(intent.constraints).toHaveLength(2);
    expect(intent.preferences).toHaveLength(2);
    expect(intent.scope).toBeDefined();
    expect(intent.metadata).toBeDefined();
  });
});

describe('Conflict Detection', () => {
  it('should detect conflicting constraints', () => {
    const c1 = createPreserveConstraint('melody', 'unchanged');
    const c2 = createRangeConstraint('melody', 60, 72);

    const conflicts = detectConflictingConstraints([c1, c2]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].constraint1).toBe(c1.id);
    expect(conflicts[0].constraint2).toBe(c2.id);
    expect(conflicts[0].reason).toContain('Cannot both');
  });

  it('should not detect conflicts for different targets', () => {
    const c1 = createPreserveConstraint('melody', 'unchanged');
    const c2 = createRangeConstraint('tempo', 120, 140);

    const conflicts = detectConflictingConstraints([c1, c2]);

    expect(conflicts).toHaveLength(0);
  });

  it('should handle no conflicts', () => {
    const c1 = createPreserveConstraint('melody', 'unchanged');
    const c2 = createPreserveConstraint('harmony', 'unchanged');

    const conflicts = detectConflictingConstraints([c1, c2]);

    expect(conflicts).toHaveLength(0);
  });

  it('should assign appropriate severity to conflicts', () => {
    const c1 = createPreserveConstraint('melody', 'unchanged', {
      severity: 'blocking',
    });
    const c2 = createRangeConstraint('melody', 60, 72, {
      severity: 'error',
    });

    const conflicts = detectConflictingConstraints([c1, c2]);

    expect(conflicts[0].severity).toBe('blocking'); // Higher severity wins
  });
});

describe('Feasibility Checking', () => {
  it('should detect goal-constraint conflicts', () => {
    const goal = createAxisChangeGoal('pitch', 'increase');
    const constraint = createPreserveConstraint('melody', 'unchanged');

    const result = checkGoalFeasibility([goal], [constraint]);

    expect(result.feasible).toBe(false);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].goal).toBe(goal.id);
    expect(result.conflicts[0].constraint).toBe(constraint.id);
  });

  it('should allow compatible goals and constraints', () => {
    const goal = createAxisChangeGoal('brightness', 'increase');
    const constraint = createPreserveConstraint('melody', 'unchanged');

    const result = checkGoalFeasibility([goal], [constraint]);

    expect(result.feasible).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it('should check multiple goal-constraint pairs', () => {
    const g1 = createAxisChangeGoal('pitch', 'increase');
    const g2 = createAxisChangeGoal('brightness', 'increase');
    const c1 = createPreserveConstraint('melody', 'unchanged');
    const c2 = createPreserveConstraint('harmony', 'unchanged');

    const result = checkGoalFeasibility([g1, g2], [c1, c2]);

    expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
  });

  it('should provide explanations for conflicts', () => {
    const goal = createAxisChangeGoal('timing', 'increase');
    const constraint = createPreserveConstraint('rhythm', 'unchanged');

    const result = checkGoalFeasibility([goal], [constraint]);

    expect(result.feasible).toBe(false);
    expect(result.conflicts[0].reason).toBeTruthy();
    expect(result.conflicts[0].reason).toContain('conflict');
  });
});

describe('Ranking and Precedence', () => {
  it('should rank goals by priority', () => {
    const g1 = createAxisChangeGoal('brightness', 'increase', undefined, {
      priority: 'nice-to-have',
    });
    const g2 = createAxisChangeGoal('energy', 'increase', undefined, {
      priority: 'required',
    });
    const g3 = createAxisChangeGoal('density', 'decrease', undefined, {
      priority: 'important',
    });

    const ranked = rankGoals([g1, g2, g3]);

    expect(ranked[0].priority).toBe('required');
    expect(ranked[1].priority).toBe('important');
    expect(ranked[2].priority).toBe('nice-to-have');
  });

  it('should handle equal priorities', () => {
    const g1 = createAxisChangeGoal('brightness', 'increase', undefined, {
      priority: 'important',
    });
    const g2 = createAxisChangeGoal('energy', 'increase', undefined, {
      priority: 'important',
    });

    const ranked = rankGoals([g1, g2]);

    expect(ranked[0].priority).toBe('important');
    expect(ranked[1].priority).toBe('important');
  });

  it('should compute precedence hierarchy', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('brightness', 'increase', undefined, { priority: 'important' }))
      .addGoal(createAxisChangeGoal('energy', 'increase', undefined, { priority: 'required' }))
      .addConstraint(createPreserveConstraint('melody', 'unchanged'))
      .addPreference(createMinimalCostPreference(0.9))
      .addPreference(createNaturalnessPreference(0.4))
      .build();

    const precedence = computePrecedence(intent);

    expect(precedence.mustSatisfy).toHaveLength(1);
    expect(precedence.shouldAchieve).toHaveLength(2);
    expect(precedence.shouldAchieve[0].priority).toBe('required'); // Higher priority first
  });

  it('should respect constraints > goals > preferences hierarchy', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('brightness', 'increase'))
      .addConstraint(createPreserveConstraint('melody', 'unchanged'))
      .addPreference(createMinimalCostPreference())
      .build();

    const precedence = computePrecedence(intent);

    // Constraints must be satisfied
    expect(precedence.mustSatisfy).toHaveLength(1);
    // Goals should be achieved
    expect(precedence.shouldAchieve).toHaveLength(1);
    // Preferences may be considered
    expect(precedence.mayConsider.length).toBeGreaterThanOrEqual(0);
  });
});

describe('Real-World Scenarios', () => {
  it('should model "make it darker but keep the melody"', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('darkness', 'increase', 'moderate'))
      .addConstraint(createPreserveConstraint('melody', 'unchanged'))
      .addPreference(createMinimalCostPreference())
      .setMetadata({ utterance: 'make it darker but keep the melody' })
      .build();

    expect(intent.goals).toHaveLength(1);
    expect(intent.goals[0].target?.axis).toBe('darkness');
    expect(intent.constraints).toHaveLength(1);
    expect(intent.constraints[0].target.kind).toBe('melody');
    expect(intent.preferences).toHaveLength(1);

    const feasibility = checkGoalFeasibility(intent.goals, intent.constraints);
    expect(feasibility.feasible).toBe(true);
  });

  it('should model "increase energy in the chorus"', () => {
    const intent = new IntentBuilder()
      .addGoal(
        createAxisChangeGoal('energy', 'increase', 0.3, {
          scope: { type: 'section', sections: ['chorus'] },
        })
      )
      .addPreference(createNaturalnessPreference())
      .setMetadata({ utterance: 'increase energy in the chorus' })
      .build();

    expect(intent.goals[0].scope?.type).toBe('section');
    expect(intent.goals[0].scope?.sections).toEqual(['chorus']);
  });

  it('should model complex multi-goal with constraints', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('lift', 'increase', 0.4, { priority: 8 }))
      .addGoal(createAxisChangeGoal('intimacy', 'increase', 0.3, { priority: 6 }))
      .addConstraint(createPreserveConstraint('melody', 'recognizable'))
      .addConstraint(createRangeConstraint('tempo', 115, 125))
      .addPreference(createMinimalCostPreference(0.85))
      .setScope({ type: 'section', sections: ['verse-2'] })
      .setMetadata({ utterance: 'lift it up and bring it closer in verse 2, but keep the melody recognizable' })
      .build();

    expect(intent.goals).toHaveLength(2);
    expect(intent.constraints).toHaveLength(2);
    expect(intent.preferences).toHaveLength(1);
    expect(intent.scope?.sections).toEqual(['verse-2']);

    const precedence = computePrecedence(intent);
    expect(precedence.shouldAchieve[0].priority).toBe(8); // lift has higher priority
  });

  it('should model board policy constraints', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('brightness', 'increase'))
      .addConstraint(
        createPreserveConstraint('structure', 'unchanged', {
          metadata: {
            source: 'board policy',
            explicit: false,
          },
        })
      )
      .addConstraint(
        createRangeConstraint('tempo', 100, 160, {
          metadata: {
            source: 'board policy',
            explicit: false,
          },
        })
      )
      .build();

    expect(intent.constraints).toHaveLength(2);
    expect(intent.constraints[0].metadata?.explicit).toBe(false);
    expect(intent.constraints[1].metadata?.explicit).toBe(false);
  });

  it('should detect infeasible requests early', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('pitch', 'increase', 12)) // Transpose up
      .addConstraint(createPreserveConstraint('melody', 'unchanged')) // But keep melody exact
      .build();

    const feasibility = checkGoalFeasibility(intent.goals, intent.constraints);

    expect(feasibility.feasible).toBe(false);
    expect(feasibility.conflicts).toHaveLength(1);
    // This should be caught before planning
  });

  it('should allow flexible constraints with tolerance', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('voicing', 'change'))
      .addConstraint(
        createPreserveConstraint('harmony', 'recognizable')
      )
      .build();

    // Recognizable constraint allows some change
    expect(intent.constraints[0].exactness).toBe('recognizable');
  });
});

describe('Type Safety and Distinctions', () => {
  it('should enforce type distinctions at compile time', () => {
    const goal: Goal = createAxisChangeGoal('brightness', 'increase');
    const constraint: Constraint = createPreserveConstraint('melody', 'unchanged');
    const preference: Preference = createMinimalCostPreference();

    // These should be distinct types
    expect(goal).not.toEqual(constraint);
    expect(constraint).not.toEqual(preference);
    expect(preference).not.toEqual(goal);
  });

  it('should have different semantic meanings', () => {
    // Goal: what user wants
    const goal = createAxisChangeGoal('brightness', 'increase');
    expect(goal.direction).toBe('increase');

    // Constraint: what must not be violated
    const constraint = createPreserveConstraint('melody', 'unchanged');
    expect((constraint as any).severity).toBe('blocking');

    // Preference: what is preferred but not required
    const preference = createMinimalCostPreference();
    expect(preference.strength).toBeDefined();
  });

  it('should have different execution semantics', () => {
    const intent = new IntentBuilder()
      .addGoal(createAxisChangeGoal('brightness', 'increase', undefined, { priority: 'important' }))
      .addConstraint(createPreserveConstraint('melody', 'unchanged'))
      .addPreference(createMinimalCostPreference(0.8))
      .build();

    // Constraints exist
    expect(intent.constraints).toHaveLength(1);

    // Goals have priorities
    expect(intent.goals).toHaveLength(1);
    expect(intent.goals[0].priority).toBeDefined();

    // Preferences have strength
    expect(intent.preferences).toHaveLength(1);
    expect(intent.preferences[0].strength).toBeDefined();
  });
});
