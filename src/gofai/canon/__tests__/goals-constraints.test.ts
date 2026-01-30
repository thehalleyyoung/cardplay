/**
 * Tests for Goals, Constraints, and Preferences Type System
 * 
 * Step 011: Comprehensive testing of the distinction between goals, constraints,
 * and preferences (hard vs soft), validating the stable typed model.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { AxisId, LexemeId } from '../types.js';
import type {
  Goal,
  Constraint,
  Preference,
  IntentBundle,
  IntentProvenance,
  GoalAmount,
  PreserveMode,
  PreserveTarget,
  ConstraintStrength,
  SelectorId,
  PreferenceType,
  IntentHole,
  IntentConflict,
} from '../goals-constraints.js';
import {
  createGoal,
  createPreserveConstraint,
  createOnlyChangeConstraint,
  createPreference,
  createIntentBundle,
  checkConstraint,
  checkConstraints,
  analyzeIntentBundle,
} from '../goals-constraints.js';
import { MockProjectWorld } from '../../infra/project-world-api.js';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestProvenance(
  utterance: string,
  turnIndex: number = 0
): IntentProvenance {
  return {
    utterance,
    span: [0, utterance.length] as const,
    lexemes: ['lexeme:test' as LexemeId],
    turnIndex,
  };
}

// =============================================================================
// Goals: What the User Wants to Accomplish
// =============================================================================

describe('Goals', () => {
  describe('createGoal', () => {
    it('creates a basic goal with increase direction', () => {
      const goal = createGoal({
        axis: 'brightness' as AxisId,
        direction: 'increase',
        provenance: createTestProvenance('make it brighter'),
      });

      expect(goal.category).toBe('goal');
      expect(goal.axis).toBe('brightness');
      expect(goal.direction).toBe('increase');
      expect(goal.amount.type).toBe('unspecified');
      expect(goal.description).toContain('brightness');
    });

    it('creates a goal with decrease direction', () => {
      const goal = createGoal({
        axis: 'brightness' as AxisId,
        direction: 'decrease',
        provenance: createTestProvenance('make it darker'),
      });

      expect(goal.direction).toBe('decrease');
      expect(goal.description).toContain('brightness');
    });

    it('creates a goal with relative amount', () => {
      const amount: GoalAmount = { type: 'relative', value: 0.3 };
      const goal = createGoal({
        axis: 'lift' as AxisId,
        direction: 'increase',
        amount,
        provenance: createTestProvenance('lift it a little'),
      });

      expect(goal.amount).toEqual({ type: 'relative', value: 0.3 });
    });

    it('creates a goal with absolute amount', () => {
      const amount: GoalAmount = { type: 'absolute', value: 120 };
      const goal = createGoal({
        axis: 'tempo' as AxisId,
        direction: 'increase',
        amount,
        provenance: createTestProvenance('set tempo to 120'),
      });

      expect(goal.amount).toEqual({ type: 'absolute', value: 120 });
    });

    it('creates a goal with explicit scope', () => {
      const goal = createGoal({
        axis: 'density' as AxisId,
        direction: 'decrease',
        scope: 'selector:section:chorus' as SelectorId,
        provenance: createTestProvenance('thin the chorus'),
      });

      expect(goal.scope).toBe('selector:section:chorus');
    });

    it('creates a goal with custom description', () => {
      const goal = createGoal({
        axis: 'lift' as AxisId,
        direction: 'increase',
        description: 'Increase energy and excitement',
        provenance: createTestProvenance('make it more exciting'),
      });

      expect(goal.description).toBe('Increase energy and excitement');
    });

    it('generates unique IDs for each goal', () => {
      const goal1 = createGoal({
        axis: 'brightness' as AxisId,
        direction: 'increase',
        provenance: createTestProvenance('brighter'),
      });

      const goal2 = createGoal({
        axis: 'brightness' as AxisId,
        direction: 'increase',
        provenance: createTestProvenance('brighter'),
      });

      expect(goal1.id).not.toBe(goal2.id);
      expect(goal1.id).toMatch(/^intent:goal:/);
      expect(goal2.id).toMatch(/^intent:goal:/);
    });

    it('preserves provenance information', () => {
      const provenance = createTestProvenance('make it brighter', 5);
      const goal = createGoal({
        axis: 'brightness' as AxisId,
        direction: 'increase',
        provenance,
      });

      expect(goal.provenance).toEqual(provenance);
      expect(goal.provenance.turnIndex).toBe(5);
      expect(goal.provenance.utterance).toBe('make it brighter');
    });
  });

  describe('GoalAmount types', () => {
    it('handles unspecified amounts', () => {
      const amount: GoalAmount = { type: 'unspecified' };
      expect(amount.type).toBe('unspecified');
    });

    it('handles relative amounts in range [0, 1]', () => {
      const amounts: GoalAmount[] = [
        { type: 'relative', value: 0.0 },
        { type: 'relative', value: 0.5 },
        { type: 'relative', value: 1.0 },
      ];

      amounts.forEach((amount) => {
        expect(amount.type).toBe('relative');
        if (amount.type === 'relative') {
          expect(amount.value).toBeGreaterThanOrEqual(0);
          expect(amount.value).toBeLessThanOrEqual(1);
        }
      });
    });

    it('handles absolute amounts with specific values', () => {
      const amount: GoalAmount = { type: 'absolute', value: 120 };
      expect(amount.type).toBe('absolute');
      if (amount.type === 'absolute') {
        expect(amount.value).toBe(120);
      }
    });
  });
});

// =============================================================================
// Constraints: Hard Requirements That Must Be Satisfied
// =============================================================================

describe('Constraints', () => {
  describe('createPreserveConstraint', () => {
    it('creates a preserve constraint with exact mode', () => {
      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody exact'),
      });

      expect(constraint.category).toBe('constraint');
      expect(constraint.strength).toBe('required');
      expect(constraint.type.kind).toBe('preserve');
      if (constraint.type.kind === 'preserve') {
        expect(constraint.type.target).toBe('melody');
        expect(constraint.type.mode).toBe('exact');
      }
    });

    it('creates a preserve constraint with recognizable mode', () => {
      const constraint = createPreserveConstraint({
        target: 'harmony',
        mode: 'recognizable',
        provenance: createTestProvenance('keep harmony recognizable'),
      });

      if (constraint.type.kind === 'preserve') {
        expect(constraint.type.mode).toBe('recognizable');
      }
    });

    it('creates a preserve constraint with functional mode', () => {
      const constraint = createPreserveConstraint({
        target: 'harmony',
        mode: 'functional',
        provenance: createTestProvenance('preserve harmonic function'),
      });

      if (constraint.type.kind === 'preserve') {
        expect(constraint.type.mode).toBe('functional');
      }
    });

    it('creates a preserve constraint with approximate mode', () => {
      const constraint = createPreserveConstraint({
        target: 'rhythm',
        mode: 'approximate',
        provenance: createTestProvenance('keep rhythm roughly the same'),
      });

      if (constraint.type.kind === 'preserve') {
        expect(constraint.type.mode).toBe('approximate');
      }
    });

    it('supports all preserve targets', () => {
      const targets: PreserveTarget[] = [
        'melody',
        'harmony',
        'rhythm',
        'structure',
        'tempo',
        'dynamics',
        'arrangement',
        'voicing',
        'register',
        'orchestration',
      ];

      targets.forEach((target) => {
        const constraint = createPreserveConstraint({
          target,
          mode: 'exact',
          provenance: createTestProvenance(`preserve ${target}`),
        });

        if (constraint.type.kind === 'preserve') {
          expect(constraint.type.target).toBe(target);
        }
      });
    });

    it('supports all preserve modes', () => {
      const modes: PreserveMode[] = [
        'exact',
        'recognizable',
        'functional',
        'approximate',
      ];

      modes.forEach((mode) => {
        const constraint = createPreserveConstraint({
          target: 'melody',
          mode,
          provenance: createTestProvenance(`preserve melody ${mode}`),
        });

        if (constraint.type.kind === 'preserve') {
          expect(constraint.type.mode).toBe(mode);
        }
      });
    });

    it('creates a constraint with preferred strength', () => {
      const constraint = createPreserveConstraint({
        target: 'tempo',
        mode: 'exact',
        strength: 'preferred',
        provenance: createTestProvenance('prefer steady tempo'),
      });

      expect(constraint.strength).toBe('preferred');
    });

    it('creates a constraint with suggested strength', () => {
      const constraint = createPreserveConstraint({
        target: 'voicing',
        mode: 'recognizable',
        strength: 'suggested',
        provenance: createTestProvenance('try to keep voicing'),
      });

      expect(constraint.strength).toBe('suggested');
    });

    it('supports constraint strength hierarchy', () => {
      const strengths: ConstraintStrength[] = [
        'required',
        'preferred',
        'suggested',
      ];

      strengths.forEach((strength) => {
        const constraint = createPreserveConstraint({
          target: 'melody',
          mode: 'exact',
          strength,
          provenance: createTestProvenance('preserve melody'),
        });

        expect(constraint.strength).toBe(strength);
      });
    });

    it('creates a constraint with explicit scope', () => {
      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        scope: 'selector:section:chorus' as SelectorId,
        provenance: createTestProvenance('preserve chorus melody'),
      });

      expect(constraint.scope).toBe('selector:section:chorus');
      if (constraint.type.kind === 'preserve') {
        expect(constraint.type.scope).toBe('selector:section:chorus');
      }
    });

    it('generates unique IDs for each constraint', () => {
      const c1 = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const c2 = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      expect(c1.id).not.toBe(c2.id);
      expect(c1.id).toMatch(/^intent:constraint:/);
    });
  });

  describe('createOnlyChangeConstraint', () => {
    it('creates an only-change constraint', () => {
      const constraint = createOnlyChangeConstraint({
        allowed: 'selector:role:drums' as SelectorId,
        provenance: createTestProvenance('only change drums'),
      });

      expect(constraint.category).toBe('constraint');
      expect(constraint.type.kind).toBe('only-change');
      if (constraint.type.kind === 'only-change') {
        expect(constraint.type.allowed).toBe('selector:role:drums');
      }
    });

    it('creates a constraint with forbidden scope', () => {
      const constraint = createOnlyChangeConstraint({
        allowed: 'selector:section:chorus' as SelectorId,
        forbidden: 'selector:role:melody' as SelectorId,
        provenance: createTestProvenance('change chorus but not melody'),
      });

      if (constraint.type.kind === 'only-change') {
        expect(constraint.type.allowed).toBe('selector:section:chorus');
        expect(constraint.type.forbidden).toBe('selector:role:melody');
      }
    });

    it('defaults to required strength', () => {
      const constraint = createOnlyChangeConstraint({
        allowed: 'selector:role:bass' as SelectorId,
        provenance: createTestProvenance('only bass'),
      });

      expect(constraint.strength).toBe('required');
    });

    it('supports custom strength', () => {
      const constraint = createOnlyChangeConstraint({
        allowed: 'selector:role:drums' as SelectorId,
        strength: 'preferred',
        provenance: createTestProvenance('prefer drums only'),
      });

      expect(constraint.strength).toBe('preferred');
    });
  });

  describe('Constraint types', () => {
    it('preserves constraint type information', () => {
      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      // Type guard should work
      if (constraint.type.kind === 'preserve') {
        expect(constraint.type.target).toBe('melody');
        expect(constraint.type.mode).toBe('exact');
      } else {
        throw new Error('Expected preserve constraint');
      }
    });
  });
});

// =============================================================================
// Preferences: Soft Requirements That Influence Planning
// =============================================================================

describe('Preferences', () => {
  describe('createPreference', () => {
    it('creates an edit-style preference', () => {
      const preferenceType: PreferenceType = {
        kind: 'edit-style',
        style: 'minimal',
      };

      const preference = createPreference({
        type: preferenceType,
        provenance: createTestProvenance('prefer minimal changes'),
      });

      expect(preference.category).toBe('preference');
      expect(preference.type).toEqual(preferenceType);
      expect(preference.weight).toBe(0.5);
    });

    it('creates a layer preference', () => {
      const preferenceType: PreferenceType = {
        kind: 'layer',
        prefer: 'selector:role:drums' as SelectorId,
      };

      const preference = createPreference({
        type: preferenceType,
        provenance: createTestProvenance('prefer drums'),
      });

      expect(preference.type).toEqual(preferenceType);
    });

    it('creates a method preference', () => {
      const preferenceType: PreferenceType = {
        kind: 'method',
        method: 'orchestration',
        direction: 'prefer',
      };

      const preference = createPreference({
        type: preferenceType,
        provenance: createTestProvenance('prefer orchestration'),
      });

      expect(preference.type).toEqual(preferenceType);
    });

    it('creates a cost preference', () => {
      const preferenceType: PreferenceType = {
        kind: 'cost',
        preferMinimal: true,
      };

      const preference = createPreference({
        type: preferenceType,
        provenance: createTestProvenance('prefer minimal edits'),
      });

      expect(preference.type).toEqual(preferenceType);
    });

    it('supports custom weight', () => {
      const preferenceType: PreferenceType = {
        kind: 'edit-style',
        style: 'bold',
      };

      const preference = createPreference({
        type: preferenceType,
        weight: 0.8,
        provenance: createTestProvenance('be bold'),
      });

      expect(preference.weight).toBe(0.8);
    });

    it('generates unique IDs for each preference', () => {
      const preferenceType: PreferenceType = {
        kind: 'edit-style',
        style: 'minimal',
      };

      const p1 = createPreference({
        type: preferenceType,
        provenance: createTestProvenance('prefer minimal'),
      });

      const p2 = createPreference({
        type: preferenceType,
        provenance: createTestProvenance('prefer minimal'),
      });

      expect(p1.id).not.toBe(p2.id);
      expect(p1.id).toMatch(/^intent:preference:/);
    });
  });

  describe('PreferenceType variants', () => {
    it('supports all edit styles', () => {
      const styles = ['minimal', 'moderate', 'bold', 'experimental'] as const;

      styles.forEach((style) => {
        const preferenceType: PreferenceType = {
          kind: 'edit-style',
          style,
        };

        const preference = createPreference({
          type: preferenceType,
          provenance: createTestProvenance(`style ${style}`),
        });

        expect(preference.type.kind).toBe('edit-style');
        if (preference.type.kind === 'edit-style') {
          expect(preference.type.style).toBe(style);
        }
      });
    });

    it('supports layer preferences with prefer', () => {
      const preferenceType: PreferenceType = {
        kind: 'layer',
        prefer: 'selector:role:drums' as SelectorId,
      };

      const preference = createPreference({
        type: preferenceType,
        provenance: createTestProvenance('prefer drums'),
      });

      if (preference.type.kind === 'layer') {
        expect(preference.type.prefer).toBe('selector:role:drums');
        expect(preference.type.avoid).toBeUndefined();
      }
    });

    it('supports layer preferences with avoid', () => {
      const preferenceType: PreferenceType = {
        kind: 'layer',
        avoid: 'selector:role:melody' as SelectorId,
      };

      const preference = createPreference({
        type: preferenceType,
        provenance: createTestProvenance('avoid melody'),
      });

      if (preference.type.kind === 'layer') {
        expect(preference.type.avoid).toBe('selector:role:melody');
        expect(preference.type.prefer).toBeUndefined();
      }
    });

    it('supports all method types', () => {
      const methods = [
        'orchestration',
        'dsp',
        'arrangement',
        'composition',
      ] as const;

      methods.forEach((method) => {
        const preferenceType: PreferenceType = {
          kind: 'method',
          method,
          direction: 'prefer',
        };

        const preference = createPreference({
          type: preferenceType,
          provenance: createTestProvenance(`prefer ${method}`),
        });

        if (preference.type.kind === 'method') {
          expect(preference.type.method).toBe(method);
        }
      });
    });

    it('supports cost preferences with max cost', () => {
      const preferenceType: PreferenceType = {
        kind: 'cost',
        maxCost: 100,
        preferMinimal: true,
      };

      const preference = createPreference({
        type: preferenceType,
        provenance: createTestProvenance('low cost edits'),
      });

      if (preference.type.kind === 'cost') {
        expect(preference.type.maxCost).toBe(100);
        expect(preference.type.preferMinimal).toBe(true);
      }
    });
  });
});

// =============================================================================
// Intent Bundles
// =============================================================================

describe('IntentBundle', () => {
  describe('createIntentBundle', () => {
    it('creates an empty bundle', () => {
      const bundle = createIntentBundle({
        utterance: 'test utterance',
        turnIndex: 0,
      });

      expect(bundle.goals).toEqual([]);
      expect(bundle.constraints).toEqual([]);
      expect(bundle.preferences).toEqual([]);
      expect(bundle.metadata.utterance).toBe('test utterance');
      expect(bundle.metadata.turnIndex).toBe(0);
    });

    it('creates a bundle with goals', () => {
      const goal = createGoal({
        axis: 'brightness' as AxisId,
        direction: 'increase',
        provenance: createTestProvenance('brighter'),
      });

      const bundle = createIntentBundle({
        goals: [goal],
        utterance: 'make it brighter',
        turnIndex: 0,
      });

      expect(bundle.goals).toHaveLength(1);
      expect(bundle.goals[0]).toEqual(goal);
    });

    it('creates a bundle with constraints', () => {
      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const bundle = createIntentBundle({
        constraints: [constraint],
        utterance: 'preserve melody exact',
        turnIndex: 0,
      });

      expect(bundle.constraints).toHaveLength(1);
      expect(bundle.constraints[0]).toEqual(constraint);
    });

    it('creates a bundle with preferences', () => {
      const preference = createPreference({
        type: { kind: 'edit-style', style: 'minimal' },
        provenance: createTestProvenance('prefer minimal'),
      });

      const bundle = createIntentBundle({
        preferences: [preference],
        utterance: 'prefer minimal changes',
        turnIndex: 0,
      });

      expect(bundle.preferences).toHaveLength(1);
      expect(bundle.preferences[0]).toEqual(preference);
    });

    it('creates a bundle with all intent types', () => {
      const goal = createGoal({
        axis: 'brightness' as AxisId,
        direction: 'increase',
        provenance: createTestProvenance('brighter'),
      });

      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const preference = createPreference({
        type: { kind: 'edit-style', style: 'minimal' },
        provenance: createTestProvenance('minimal'),
      });

      const bundle = createIntentBundle({
        goals: [goal],
        constraints: [constraint],
        preferences: [preference],
        utterance: 'make it brighter but preserve melody',
        turnIndex: 0,
      });

      expect(bundle.goals).toHaveLength(1);
      expect(bundle.constraints).toHaveLength(1);
      expect(bundle.preferences).toHaveLength(1);
    });

    it('includes metadata with timestamp', () => {
      const before = Date.now();
      const bundle = createIntentBundle({
        utterance: 'test',
        turnIndex: 0,
      });
      const after = Date.now();

      expect(bundle.metadata.timestamp).toBeGreaterThanOrEqual(before);
      expect(bundle.metadata.timestamp).toBeLessThanOrEqual(after);
    });

    it('defaults to medium confidence', () => {
      const bundle = createIntentBundle({
        utterance: 'test',
        turnIndex: 0,
      });

      expect(bundle.metadata.confidence).toBe('medium');
    });

    it('supports explicit confidence levels', () => {
      const confidences = ['high', 'medium', 'low'] as const;

      confidences.forEach((confidence) => {
        const bundle = createIntentBundle({
          utterance: 'test',
          turnIndex: 0,
          confidence,
        });

        expect(bundle.metadata.confidence).toBe(confidence);
      });
    });

    it('includes holes for clarification', () => {
      const hole: IntentHole = {
        id: 'hole:1',
        type: 'scope',
        description: 'Which section?',
        options: [
          {
            id: 'opt:verse',
            description: 'Verse',
            resolution: 'selector:section:verse',
          },
          {
            id: 'opt:chorus',
            description: 'Chorus',
            resolution: 'selector:section:chorus',
          },
        ],
      };

      const bundle = createIntentBundle({
        utterance: 'make it brighter',
        turnIndex: 0,
        holes: [hole],
      });

      expect(bundle.metadata.holes).toHaveLength(1);
      expect(bundle.metadata.holes[0]).toEqual(hole);
    });

    it('preserves turn index for conversation tracking', () => {
      const bundle = createIntentBundle({
        utterance: 'test',
        turnIndex: 42,
      });

      expect(bundle.metadata.turnIndex).toBe(42);
    });
  });
});

// =============================================================================
// Constraint Checking
// =============================================================================

describe('Constraint Checking', () => {
  let mockWorld: MockProjectWorld;

  beforeEach(() => {
    mockWorld = new MockProjectWorld();
  });

  describe('checkConstraint', () => {
    it('returns satisfied for valid constraint', () => {
      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const result = checkConstraint(constraint, {}, {}, mockWorld);

      expect(result.satisfied).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.score).toBe(1.0);
    });

    it('has violations array', () => {
      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const result = checkConstraint(constraint, {}, {}, mockWorld);

      expect(Array.isArray(result.violations)).toBe(true);
    });

    it('has warnings array', () => {
      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const result = checkConstraint(constraint, {}, {}, mockWorld);

      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('includes score between 0 and 1', () => {
      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const result = checkConstraint(constraint, {}, {}, mockWorld);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  describe('checkConstraints', () => {
    it('checks empty bundle', () => {
      const bundle = createIntentBundle({
        utterance: 'test',
        turnIndex: 0,
      });

      const result = checkConstraints(bundle, {}, {}, mockWorld);

      expect(result.satisfied).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('checks bundle with single constraint', () => {
      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const bundle = createIntentBundle({
        constraints: [constraint],
        utterance: 'preserve melody',
        turnIndex: 0,
      });

      const result = checkConstraints(bundle, {}, {}, mockWorld);

      expect(result.satisfied).toBe(true);
    });

    it('checks bundle with multiple constraints', () => {
      const c1 = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const c2 = createPreserveConstraint({
        target: 'harmony',
        mode: 'recognizable',
        provenance: createTestProvenance('keep harmony'),
      });

      const bundle = createIntentBundle({
        constraints: [c1, c2],
        utterance: 'preserve melody and harmony',
        turnIndex: 0,
      });

      const result = checkConstraints(bundle, {}, {}, mockWorld);

      expect(result.satisfied).toBe(true);
    });

    it('aggregates violations from multiple constraints', () => {
      const c1 = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const c2 = createPreserveConstraint({
        target: 'harmony',
        mode: 'exact',
        provenance: createTestProvenance('preserve harmony'),
      });

      const bundle = createIntentBundle({
        constraints: [c1, c2],
        utterance: 'preserve everything',
        turnIndex: 0,
      });

      const result = checkConstraints(bundle, {}, {}, mockWorld);

      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('computes average score across constraints', () => {
      const c1 = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const c2 = createPreserveConstraint({
        target: 'harmony',
        mode: 'exact',
        provenance: createTestProvenance('preserve harmony'),
      });

      const bundle = createIntentBundle({
        constraints: [c1, c2],
        utterance: 'preserve melody and harmony',
        turnIndex: 0,
      });

      const result = checkConstraints(bundle, {}, {}, mockWorld);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });
});

// =============================================================================
// Intent Analysis
// =============================================================================

describe('Intent Analysis', () => {
  describe('analyzeIntentBundle', () => {
    it('analyzes empty bundle', () => {
      const bundle = createIntentBundle({
        utterance: 'test',
        turnIndex: 0,
      });

      const analysis = analyzeIntentBundle(bundle);

      expect(analysis.complete).toBe(true);
      expect(analysis.coherent).toBe(true);
      expect(analysis.conflicts).toHaveLength(0);
      expect(analysis.clarifications).toHaveLength(0);
      expect(analysis.complexity).toBe(0);
    });

    it('marks bundle with holes as incomplete', () => {
      const hole: IntentHole = {
        id: 'hole:1',
        type: 'scope',
        description: 'Which section?',
      };

      const bundle = createIntentBundle({
        utterance: 'make it brighter',
        turnIndex: 0,
        holes: [hole],
      });

      const analysis = analyzeIntentBundle(bundle);

      expect(analysis.complete).toBe(false);
      expect(analysis.clarifications).toHaveLength(1);
    });

    it('calculates complexity based on intent counts', () => {
      const goal = createGoal({
        axis: 'brightness' as AxisId,
        direction: 'increase',
        provenance: createTestProvenance('brighter'),
      });

      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const preference = createPreference({
        type: { kind: 'edit-style', style: 'minimal' },
        provenance: createTestProvenance('minimal'),
      });

      const bundle = createIntentBundle({
        goals: [goal],
        constraints: [constraint],
        preferences: [preference],
        utterance: 'complex request',
        turnIndex: 0,
      });

      const analysis = analyzeIntentBundle(bundle);

      // Complexity = goals * 1 + constraints * 2 + preferences * 0.5
      // = 1 + 2 + 0.5 = 3.5
      expect(analysis.complexity).toBe(3.5);
    });

    it('includes conflicts array', () => {
      const bundle = createIntentBundle({
        utterance: 'test',
        turnIndex: 0,
      });

      const analysis = analyzeIntentBundle(bundle);

      expect(Array.isArray(analysis.conflicts)).toBe(true);
    });

    it('detects coherence', () => {
      const goal = createGoal({
        axis: 'brightness' as AxisId,
        direction: 'increase',
        provenance: createTestProvenance('brighter'),
      });

      const bundle = createIntentBundle({
        goals: [goal],
        utterance: 'make it brighter',
        turnIndex: 0,
      });

      const analysis = analyzeIntentBundle(bundle);

      expect(analysis.coherent).toBe(true);
    });

    it('includes clarifications from holes', () => {
      const hole: IntentHole = {
        id: 'hole:1',
        type: 'amount',
        description: 'How much brighter?',
      };

      const bundle = createIntentBundle({
        utterance: 'brighter',
        turnIndex: 0,
        holes: [hole],
      });

      const analysis = analyzeIntentBundle(bundle);

      expect(analysis.clarifications).toContain(hole);
    });
  });

  describe('Complexity calculation', () => {
    it('simple goal has low complexity', () => {
      const goal = createGoal({
        axis: 'brightness' as AxisId,
        direction: 'increase',
        provenance: createTestProvenance('brighter'),
      });

      const bundle = createIntentBundle({
        goals: [goal],
        utterance: 'make it brighter',
        turnIndex: 0,
      });

      const analysis = analyzeIntentBundle(bundle);

      expect(analysis.complexity).toBe(1);
    });

    it('constraint adds more complexity than goal', () => {
      const constraint = createPreserveConstraint({
        target: 'melody',
        mode: 'exact',
        provenance: createTestProvenance('preserve melody'),
      });

      const bundle = createIntentBundle({
        constraints: [constraint],
        utterance: 'preserve melody exact',
        turnIndex: 0,
      });

      const analysis = analyzeIntentBundle(bundle);

      expect(analysis.complexity).toBe(2);
    });

    it('preference adds less complexity than goal', () => {
      const preference = createPreference({
        type: { kind: 'edit-style', style: 'minimal' },
        provenance: createTestProvenance('minimal'),
      });

      const bundle = createIntentBundle({
        preferences: [preference],
        utterance: 'prefer minimal',
        turnIndex: 0,
      });

      const analysis = analyzeIntentBundle(bundle);

      expect(analysis.complexity).toBe(0.5);
    });

    it('multiple intents compound complexity', () => {
      const goals = [
        createGoal({
          axis: 'brightness' as AxisId,
          direction: 'increase',
          provenance: createTestProvenance('brighter'),
        }),
        createGoal({
          axis: 'lift' as AxisId,
          direction: 'increase',
          provenance: createTestProvenance('lift'),
        }),
      ];

      const constraints = [
        createPreserveConstraint({
          target: 'melody',
          mode: 'exact',
          provenance: createTestProvenance('preserve melody'),
        }),
      ];

      const bundle = createIntentBundle({
        goals,
        constraints,
        utterance: 'brighter and lift, preserve melody',
        turnIndex: 0,
      });

      const analysis = analyzeIntentBundle(bundle);

      // 2 goals + 1 constraint = 2 + 2 = 4
      expect(analysis.complexity).toBe(4);
    });
  });
});

// =============================================================================
// Type Safety and Discriminated Unions
// =============================================================================

describe('Type Safety', () => {
  it('goals have correct category', () => {
    const goal = createGoal({
      axis: 'brightness' as AxisId,
      direction: 'increase',
      provenance: createTestProvenance('brighter'),
    });

    expect(goal.category).toBe('goal');
    
    // Type guard works
    if (goal.category === 'goal') {
      expect(goal.axis).toBeDefined();
      expect(goal.direction).toBeDefined();
    }
  });

  it('constraints have correct category', () => {
    const constraint = createPreserveConstraint({
      target: 'melody',
      mode: 'exact',
      provenance: createTestProvenance('preserve melody'),
    });

    expect(constraint.category).toBe('constraint');
    
    // Type guard works
    if (constraint.category === 'constraint') {
      expect(constraint.strength).toBeDefined();
      expect(constraint.type).toBeDefined();
    }
  });

  it('preferences have correct category', () => {
    const preference = createPreference({
      type: { kind: 'edit-style', style: 'minimal' },
      provenance: createTestProvenance('minimal'),
    });

    expect(preference.category).toBe('preference');
    
    // Type guard works
    if (preference.category === 'preference') {
      expect(preference.type).toBeDefined();
      expect(preference.weight).toBeDefined();
    }
  });

  it('constraint types are discriminated by kind', () => {
    const constraint = createPreserveConstraint({
      target: 'melody',
      mode: 'exact',
      provenance: createTestProvenance('preserve melody'),
    });

    if (constraint.type.kind === 'preserve') {
      expect(constraint.type.target).toBe('melody');
    } else if (constraint.type.kind === 'only-change') {
      // Would not reach here
      expect.fail('Wrong constraint type');
    }
  });

  it('preference types are discriminated by kind', () => {
    const preference = createPreference({
      type: { kind: 'edit-style', style: 'minimal' },
      provenance: createTestProvenance('minimal'),
    });

    if (preference.type.kind === 'edit-style') {
      expect(preference.type.style).toBe('minimal');
    } else {
      expect.fail('Wrong preference type');
    }
  });

  it('goal amount types are discriminated', () => {
    const relativeAmount: GoalAmount = { type: 'relative', value: 0.5 };
    const absoluteAmount: GoalAmount = { type: 'absolute', value: 120 };
    const unspecifiedAmount: GoalAmount = { type: 'unspecified' };

    if (relativeAmount.type === 'relative') {
      expect(relativeAmount.value).toBe(0.5);
    }

    if (absoluteAmount.type === 'absolute') {
      expect(absoluteAmount.value).toBe(120);
    }

    if (unspecifiedAmount.type === 'unspecified') {
      expect(unspecifiedAmount).toEqual({ type: 'unspecified' });
    }
  });
});
