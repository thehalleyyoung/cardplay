/**
 * GOFAI Canon — Effect Taxonomy Tests (Step 008 Complete Test Suite)
 *
 * Tests for the effect taxonomy that defines compiler output effects:
 * inspect vs propose vs mutate, to forbid silent mutation in manual boards.
 *
 * Coverage:
 * - Effect type definitions and policies
 * - Effect checking and capability requirements
 * - Policy enforcement for different board types
 * - Effect violation reporting and suggestions
 * - Preview and confirmation requirements
 * - Undo requirements
 * - Board-specific policies
 * - Effect metadata and descriptions
 *
 * @module gofai/canon/__tests__/effect-taxonomy
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  EffectType,
  EffectCapability,
  EffectPolicy,
  EffectCheckResult,
  EffectViolation,
  EffectMetadata,

  // Standard policies
  EFFECT_POLICY_READ_ONLY,
  EFFECT_POLICY_PREVIEW_ONLY,
  EFFECT_POLICY_STRICT_STUDIO,
  EFFECT_POLICY_ASSISTED,
  EFFECT_POLICY_FULL_AUTO,
  STANDARD_EFFECT_POLICIES,

  // Board-specific policies
  EFFECT_POLICY_MANUAL_BOARD,
  EFFECT_POLICY_ASSISTED_BOARD,
  EFFECT_POLICY_AI_BOARD,

  // Effect checking functions
  isEffectAllowed,
  getRequiredCapability,
  requiresPreview,
  requiresConfirmation,
  requiresUndo,
  checkEffect,

  // Effect metadata
  INSPECT_EFFECT_METADATA,
  PROPOSE_EFFECT_METADATA,
  MUTATE_EFFECT_METADATA,
  getEffectMetadata,
} from '../effect-taxonomy';

// =============================================================================
// Effect Type Tests
// =============================================================================

describe('Effect Types', () => {
  it('should have three effect types', () => {
    const types: EffectType[] = ['inspect', 'propose', 'mutate'];
    expect(types).toHaveLength(3);
  });

  it('should have distinct effect capabilities', () => {
    const capabilities: EffectCapability[] = ['none', 'preview', 'execute'];
    expect(capabilities).toHaveLength(3);
  });
});

// =============================================================================
// Standard Policy Tests
// =============================================================================

describe('Standard Effect Policies', () => {
  it('should have all standard policies defined', () => {
    expect(STANDARD_EFFECT_POLICIES).toHaveLength(5);
    expect(STANDARD_EFFECT_POLICIES).toContain(EFFECT_POLICY_READ_ONLY);
    expect(STANDARD_EFFECT_POLICIES).toContain(EFFECT_POLICY_PREVIEW_ONLY);
    expect(STANDARD_EFFECT_POLICIES).toContain(EFFECT_POLICY_STRICT_STUDIO);
    expect(STANDARD_EFFECT_POLICIES).toContain(EFFECT_POLICY_ASSISTED);
    expect(STANDARD_EFFECT_POLICIES).toContain(EFFECT_POLICY_FULL_AUTO);
  });

  it('should have unique policy names', () => {
    const names = STANDARD_EFFECT_POLICIES.map(p => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

describe('Read-Only Policy', () => {
  it('should only allow inspect operations', () => {
    expect(EFFECT_POLICY_READ_ONLY.allowedEffects).toEqual(['inspect']);
  });

  it('should not require preview or confirmation', () => {
    expect(EFFECT_POLICY_READ_ONLY.requiresPreview).toBe(false);
    expect(EFFECT_POLICY_READ_ONLY.requiresConfirmation).toBe(false);
  });

  it('should not require undo', () => {
    expect(EFFECT_POLICY_READ_ONLY.requiresUndo).toBe(false);
  });

  it('should have descriptive name and description', () => {
    expect(EFFECT_POLICY_READ_ONLY.name).toBe('read-only');
    expect(EFFECT_POLICY_READ_ONLY.description).toContain('no mutations');
  });
});

describe('Preview-Only Policy', () => {
  it('should allow inspect and propose', () => {
    expect(EFFECT_POLICY_PREVIEW_ONLY.allowedEffects).toContain('inspect');
    expect(EFFECT_POLICY_PREVIEW_ONLY.allowedEffects).toContain('propose');
    expect(EFFECT_POLICY_PREVIEW_ONLY.allowedEffects).not.toContain('mutate');
  });

  it('should require preview', () => {
    expect(EFFECT_POLICY_PREVIEW_ONLY.requiresPreview).toBe(true);
  });

  it('should not require confirmation (mutations not allowed)', () => {
    expect(EFFECT_POLICY_PREVIEW_ONLY.requiresConfirmation).toBe(false);
  });
});

describe('Strict Studio Policy', () => {
  it('should allow all effect types', () => {
    expect(EFFECT_POLICY_STRICT_STUDIO.allowedEffects).toContain('inspect');
    expect(EFFECT_POLICY_STRICT_STUDIO.allowedEffects).toContain('propose');
    expect(EFFECT_POLICY_STRICT_STUDIO.allowedEffects).toContain('mutate');
  });

  it('should require preview and confirmation', () => {
    expect(EFFECT_POLICY_STRICT_STUDIO.requiresPreview).toBe(true);
    expect(EFFECT_POLICY_STRICT_STUDIO.requiresConfirmation).toBe(true);
  });

  it('should require undo', () => {
    expect(EFFECT_POLICY_STRICT_STUDIO.requiresUndo).toBe(true);
  });

  it('should be suitable for professional work', () => {
    expect(EFFECT_POLICY_STRICT_STUDIO.description).toContain('explicit confirmation');
  });
});

describe('Assisted Policy', () => {
  it('should allow all effect types', () => {
    expect(EFFECT_POLICY_ASSISTED.allowedEffects).toContain('inspect');
    expect(EFFECT_POLICY_ASSISTED.allowedEffects).toContain('propose');
    expect(EFFECT_POLICY_ASSISTED.allowedEffects).toContain('mutate');
  });

  it('should require preview but not confirmation', () => {
    expect(EFFECT_POLICY_ASSISTED.requiresPreview).toBe(true);
    expect(EFFECT_POLICY_ASSISTED.requiresConfirmation).toBe(false);
  });

  it('should require undo', () => {
    expect(EFFECT_POLICY_ASSISTED.requiresUndo).toBe(true);
  });

  it('should be suitable for rapid iteration', () => {
    expect(EFFECT_POLICY_ASSISTED.description).toContain('no confirmation');
  });
});

describe('Full Auto Policy', () => {
  it('should allow all effect types', () => {
    expect(EFFECT_POLICY_FULL_AUTO.allowedEffects).toContain('inspect');
    expect(EFFECT_POLICY_FULL_AUTO.allowedEffects).toContain('propose');
    expect(EFFECT_POLICY_FULL_AUTO.allowedEffects).toContain('mutate');
  });

  it('should not require preview or confirmation', () => {
    expect(EFFECT_POLICY_FULL_AUTO.requiresPreview).toBe(false);
    expect(EFFECT_POLICY_FULL_AUTO.requiresConfirmation).toBe(false);
  });

  it('should require undo (safety net)', () => {
    expect(EFFECT_POLICY_FULL_AUTO.requiresUndo).toBe(true);
  });

  it('should warn about trust requirement', () => {
    expect(EFFECT_POLICY_FULL_AUTO.description).toContain('immediately');
  });
});

// =============================================================================
// Board-Specific Policy Tests
// =============================================================================

describe('Board-Specific Policies', () => {
  it('manual boards should use strict studio policy', () => {
    expect(EFFECT_POLICY_MANUAL_BOARD).toBe(EFFECT_POLICY_STRICT_STUDIO);
    expect(EFFECT_POLICY_MANUAL_BOARD.requiresConfirmation).toBe(true);
  });

  it('assisted boards should use assisted policy', () => {
    expect(EFFECT_POLICY_ASSISTED_BOARD).toBe(EFFECT_POLICY_ASSISTED);
    expect(EFFECT_POLICY_ASSISTED_BOARD.requiresPreview).toBe(true);
    expect(EFFECT_POLICY_ASSISTED_BOARD.requiresConfirmation).toBe(false);
  });

  it('AI boards should use preview-only policy by default', () => {
    expect(EFFECT_POLICY_AI_BOARD).toBe(EFFECT_POLICY_PREVIEW_ONLY);
    expect(EFFECT_POLICY_AI_BOARD.allowedEffects).not.toContain('mutate');
  });

  it('board policies should prevent silent mutation', () => {
    // Manual boards must confirm
    expect(EFFECT_POLICY_MANUAL_BOARD.requiresConfirmation).toBe(true);

    // AI boards start without mutation
    expect(EFFECT_POLICY_AI_BOARD.allowedEffects).not.toContain('mutate');
  });
});

// =============================================================================
// Effect Checking Tests
// =============================================================================

describe('isEffectAllowed', () => {
  it('should allow inspect in all policies', () => {
    for (const policy of STANDARD_EFFECT_POLICIES) {
      expect(isEffectAllowed('inspect', policy)).toBe(true);
    }
  });

  it('should allow propose in preview-capable policies', () => {
    expect(isEffectAllowed('propose', EFFECT_POLICY_READ_ONLY)).toBe(false);
    expect(isEffectAllowed('propose', EFFECT_POLICY_PREVIEW_ONLY)).toBe(true);
    expect(isEffectAllowed('propose', EFFECT_POLICY_STRICT_STUDIO)).toBe(true);
    expect(isEffectAllowed('propose', EFFECT_POLICY_ASSISTED)).toBe(true);
    expect(isEffectAllowed('propose', EFFECT_POLICY_FULL_AUTO)).toBe(true);
  });

  it('should allow mutate only in execution-capable policies', () => {
    expect(isEffectAllowed('mutate', EFFECT_POLICY_READ_ONLY)).toBe(false);
    expect(isEffectAllowed('mutate', EFFECT_POLICY_PREVIEW_ONLY)).toBe(false);
    expect(isEffectAllowed('mutate', EFFECT_POLICY_STRICT_STUDIO)).toBe(true);
    expect(isEffectAllowed('mutate', EFFECT_POLICY_ASSISTED)).toBe(true);
    expect(isEffectAllowed('mutate', EFFECT_POLICY_FULL_AUTO)).toBe(true);
  });
});

describe('getRequiredCapability', () => {
  it('should require no capability for inspect', () => {
    expect(
      getRequiredCapability('inspect', EFFECT_POLICY_STRICT_STUDIO)
    ).toBe('none');
  });

  it('should require preview capability for propose', () => {
    expect(
      getRequiredCapability('propose', EFFECT_POLICY_STRICT_STUDIO)
    ).toBe('preview');
  });

  it('should require execute capability for mutate', () => {
    expect(
      getRequiredCapability('mutate', EFFECT_POLICY_STRICT_STUDIO)
    ).toBe('execute');
  });

  it('should throw if effect not allowed', () => {
    expect(() =>
      getRequiredCapability('mutate', EFFECT_POLICY_READ_ONLY)
    ).toThrow(/not allowed/);
  });
});

describe('requiresPreview', () => {
  it('should not require preview for inspect or propose', () => {
    expect(requiresPreview('inspect', EFFECT_POLICY_STRICT_STUDIO)).toBe(
      false
    );
    expect(requiresPreview('propose', EFFECT_POLICY_STRICT_STUDIO)).toBe(
      false
    );
  });

  it('should require preview for mutate if policy says so', () => {
    expect(requiresPreview('mutate', EFFECT_POLICY_STRICT_STUDIO)).toBe(true);
    expect(requiresPreview('mutate', EFFECT_POLICY_ASSISTED)).toBe(true);
    expect(requiresPreview('mutate', EFFECT_POLICY_FULL_AUTO)).toBe(false);
  });

  it('should respect policy preview requirement', () => {
    expect(requiresPreview('mutate', EFFECT_POLICY_PREVIEW_ONLY)).toBe(true);
  });
});

describe('requiresConfirmation', () => {
  it('should not require confirmation for inspect or propose', () => {
    expect(
      requiresConfirmation('inspect', EFFECT_POLICY_STRICT_STUDIO)
    ).toBe(false);
    expect(
      requiresConfirmation('propose', EFFECT_POLICY_STRICT_STUDIO)
    ).toBe(false);
  });

  it('should require confirmation for mutate if policy says so', () => {
    expect(requiresConfirmation('mutate', EFFECT_POLICY_STRICT_STUDIO)).toBe(
      true
    );
    expect(requiresConfirmation('mutate', EFFECT_POLICY_ASSISTED)).toBe(false);
    expect(requiresConfirmation('mutate', EFFECT_POLICY_FULL_AUTO)).toBe(
      false
    );
  });

  it('should prevent silent mutation in manual boards', () => {
    expect(requiresConfirmation('mutate', EFFECT_POLICY_MANUAL_BOARD)).toBe(
      true
    );
  });
});

describe('requiresUndo', () => {
  it('should not require undo for inspect or propose', () => {
    expect(requiresUndo('inspect', EFFECT_POLICY_STRICT_STUDIO)).toBe(false);
    expect(requiresUndo('propose', EFFECT_POLICY_STRICT_STUDIO)).toBe(false);
  });

  it('should require undo for mutate if policy says so', () => {
    expect(requiresUndo('mutate', EFFECT_POLICY_STRICT_STUDIO)).toBe(true);
    expect(requiresUndo('mutate', EFFECT_POLICY_ASSISTED)).toBe(true);
    expect(requiresUndo('mutate', EFFECT_POLICY_FULL_AUTO)).toBe(true);
  });

  it('should not require undo in read-only mode', () => {
    expect(requiresUndo('inspect', EFFECT_POLICY_READ_ONLY)).toBe(false);
  });
});

// =============================================================================
// Effect Check Result Tests
// =============================================================================

describe('checkEffect', () => {
  it('should return ok for allowed effects', () => {
    const result = checkEffect('inspect', EFFECT_POLICY_READ_ONLY);
    expect(result.ok).toBe(true);
  });

  it('should return violation for disallowed effects', () => {
    const result = checkEffect('mutate', EFFECT_POLICY_READ_ONLY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violation.attemptedEffect).toBe('mutate');
      expect(result.violation.policy).toBe(EFFECT_POLICY_READ_ONLY);
    }
  });

  it('should provide helpful violation message', () => {
    const result = checkEffect('mutate', EFFECT_POLICY_PREVIEW_ONLY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violation.message).toContain('mutate');
      expect(result.violation.message).toContain('preview-only');
    }
  });

  it('should identify missing capability', () => {
    const result = checkEffect('mutate', EFFECT_POLICY_READ_ONLY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violation.missingCapability).toBe('execute');
    }
  });

  it('should provide suggestions for violation', () => {
    const result = checkEffect('mutate', EFFECT_POLICY_PREVIEW_ONLY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violation.suggestions.length).toBeGreaterThan(0);
      // Suggestions mention preview capability
      const allSuggestions = result.violation.suggestions.join(' ');
      expect(allSuggestions).toContain('preview');
    }
  });
});

describe('Effect Violation Suggestions', () => {
  it('should suggest policy change for mutation denial', () => {
    const result = checkEffect('mutate', EFFECT_POLICY_READ_ONLY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const suggestions = result.violation.suggestions.join(' ');
      expect(suggestions).toContain('policy');
      expect(suggestions).toContain('allows mutations');
    }
  });

  it('should suggest policy change for propose denial', () => {
    const result = checkEffect('propose', EFFECT_POLICY_READ_ONLY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const suggestions = result.violation.suggestions.join(' ');
      expect(suggestions).toContain('plan generation');
    }
  });

  it('should suggest upgrade for preview-only users wanting to execute', () => {
    const result = checkEffect('mutate', EFFECT_POLICY_PREVIEW_ONLY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const suggestions = result.violation.suggestions.join(' ');
      expect(suggestions).toContain('preview');
      expect(suggestions).toContain('Upgrade');
    }
  });
});

// =============================================================================
// Effect Metadata Tests
// =============================================================================

describe('Inspect Effect Metadata', () => {
  it('should describe read-only capabilities', () => {
    expect(INSPECT_EFFECT_METADATA.effect).toBe('inspect');
    expect(INSPECT_EFFECT_METADATA.capabilities.length).toBeGreaterThan(0);
    expect(INSPECT_EFFECT_METADATA.capabilities.join(' ')).toContain('Read');
  });

  it('should list limitations', () => {
    expect(INSPECT_EFFECT_METADATA.limitations.length).toBeGreaterThan(0);
    expect(INSPECT_EFFECT_METADATA.limitations.join(' ')).toContain(
      'Cannot modify'
    );
  });

  it('should provide safety guarantees', () => {
    expect(INSPECT_EFFECT_METADATA.guarantees.length).toBeGreaterThan(0);
    expect(INSPECT_EFFECT_METADATA.guarantees.join(' ')).toContain(
      'No side effects'
    );
  });
});

describe('Propose Effect Metadata', () => {
  it('should describe planning capabilities', () => {
    expect(PROPOSE_EFFECT_METADATA.effect).toBe('propose');
    expect(PROPOSE_EFFECT_METADATA.capabilities.length).toBeGreaterThan(0);
    expect(PROPOSE_EFFECT_METADATA.capabilities.join(' ')).toContain('plan');
  });

  it('should list limitations', () => {
    expect(PROPOSE_EFFECT_METADATA.limitations.length).toBeGreaterThan(0);
    expect(PROPOSE_EFFECT_METADATA.limitations.join(' ')).toContain(
      'Cannot apply'
    );
  });

  it('should provide safety guarantees', () => {
    expect(PROPOSE_EFFECT_METADATA.guarantees.length).toBeGreaterThan(0);
    expect(PROPOSE_EFFECT_METADATA.guarantees.join(' ')).toContain('No project mutations');
  });
});

describe('Mutate Effect Metadata', () => {
  it('should describe mutation capabilities', () => {
    expect(MUTATE_EFFECT_METADATA.effect).toBe('mutate');
    expect(MUTATE_EFFECT_METADATA.capabilities.length).toBeGreaterThan(0);
    expect(MUTATE_EFFECT_METADATA.capabilities.join(' ')).toContain('Apply');
  });

  it('should list limitations', () => {
    expect(MUTATE_EFFECT_METADATA.limitations.length).toBeGreaterThan(0);
    expect(MUTATE_EFFECT_METADATA.limitations.join(' ')).toContain('constraints');
  });

  it('should provide safety guarantees', () => {
    expect(MUTATE_EFFECT_METADATA.guarantees.length).toBeGreaterThan(0);
    expect(MUTATE_EFFECT_METADATA.guarantees.join(' ')).toContain('Undo');
  });
});

describe('getEffectMetadata', () => {
  it('should return metadata for each effect type', () => {
    const inspectMeta = getEffectMetadata('inspect');
    expect(inspectMeta.effect).toBe('inspect');

    const proposeMeta = getEffectMetadata('propose');
    expect(proposeMeta.effect).toBe('propose');

    const mutateMeta = getEffectMetadata('mutate');
    expect(mutateMeta.effect).toBe('mutate');
  });

  it('should return consistent metadata', () => {
    expect(getEffectMetadata('inspect')).toBe(INSPECT_EFFECT_METADATA);
    expect(getEffectMetadata('propose')).toBe(PROPOSE_EFFECT_METADATA);
    expect(getEffectMetadata('mutate')).toBe(MUTATE_EFFECT_METADATA);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Policy Hierarchy', () => {
  it('should enforce increasingly permissive policies', () => {
    const policies = [
      EFFECT_POLICY_READ_ONLY,
      EFFECT_POLICY_PREVIEW_ONLY,
      EFFECT_POLICY_STRICT_STUDIO,
      EFFECT_POLICY_ASSISTED,
      EFFECT_POLICY_FULL_AUTO,
    ];

    // Each policy should allow at least what previous allowed
    for (let i = 1; i < policies.length; i++) {
      const prev = policies[i - 1];
      const curr = policies[i];
      expect(curr.allowedEffects.length).toBeGreaterThanOrEqual(
        prev.allowedEffects.length
      );
    }
  });

  it('should progressively relax requirements', () => {
    expect(EFFECT_POLICY_STRICT_STUDIO.requiresConfirmation).toBe(true);
    expect(EFFECT_POLICY_ASSISTED.requiresConfirmation).toBe(false);
    expect(EFFECT_POLICY_FULL_AUTO.requiresConfirmation).toBe(false);
  });
});

describe('Silent Mutation Prevention', () => {
  it('should prevent silent mutation in read-only mode', () => {
    expect(isEffectAllowed('mutate', EFFECT_POLICY_READ_ONLY)).toBe(false);
  });

  it('should prevent silent mutation in preview-only mode', () => {
    expect(isEffectAllowed('mutate', EFFECT_POLICY_PREVIEW_ONLY)).toBe(false);
  });

  it('should require confirmation in manual boards', () => {
    expect(requiresConfirmation('mutate', EFFECT_POLICY_MANUAL_BOARD)).toBe(
      true
    );
  });

  it('should require preview in all mutation-capable policies except full-auto', () => {
    expect(requiresPreview('mutate', EFFECT_POLICY_STRICT_STUDIO)).toBe(true);
    expect(requiresPreview('mutate', EFFECT_POLICY_ASSISTED)).toBe(true);
    expect(requiresPreview('mutate', EFFECT_POLICY_FULL_AUTO)).toBe(false);
  });

  it('should always require undo for mutations', () => {
    const mutationPolicies = [
      EFFECT_POLICY_STRICT_STUDIO,
      EFFECT_POLICY_ASSISTED,
      EFFECT_POLICY_FULL_AUTO,
    ];

    for (const policy of mutationPolicies) {
      expect(requiresUndo('mutate', policy)).toBe(true);
    }
  });
});

describe('Real-World Scenarios', () => {
  it('should handle "make it darker" in manual board', () => {
    // Manual board requires strict studio policy
    const policy = EFFECT_POLICY_MANUAL_BOARD;

    // Inspect is always allowed (analyzing current state)
    expect(isEffectAllowed('inspect', policy)).toBe(true);

    // Propose is allowed (generating plan)
    expect(isEffectAllowed('propose', policy)).toBe(true);

    // Mutate requires confirmation
    expect(isEffectAllowed('mutate', policy)).toBe(true);
    expect(requiresConfirmation('mutate', policy)).toBe(true);
    expect(requiresPreview('mutate', policy)).toBe(true);
  });

  it('should handle "what key is this in?" (inspect only)', () => {
    // Even in read-only mode, inspect works
    expect(isEffectAllowed('inspect', EFFECT_POLICY_READ_ONLY)).toBe(true);

    // This is safe in all policies
    for (const policy of STANDARD_EFFECT_POLICIES) {
      const result = checkEffect('inspect', policy);
      expect(result.ok).toBe(true);
    }
  });

  it('should handle "show me a plan to lift the chorus"', () => {
    // Preview-only can generate plans
    expect(isEffectAllowed('propose', EFFECT_POLICY_PREVIEW_ONLY)).toBe(true);

    // But cannot apply them
    expect(isEffectAllowed('mutate', EFFECT_POLICY_PREVIEW_ONLY)).toBe(false);

    const result = checkEffect('mutate', EFFECT_POLICY_PREVIEW_ONLY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violation.suggestions.some(s => s.includes('preview'))).toBe(
        true
      );
    }
  });

  it('should handle rapid iteration in assisted board', () => {
    const policy = EFFECT_POLICY_ASSISTED_BOARD;

    // All effects allowed
    expect(isEffectAllowed('inspect', policy)).toBe(true);
    expect(isEffectAllowed('propose', policy)).toBe(true);
    expect(isEffectAllowed('mutate', policy)).toBe(true);

    // Preview required but not confirmation (fast iteration)
    expect(requiresPreview('mutate', policy)).toBe(true);
    expect(requiresConfirmation('mutate', policy)).toBe(false);

    // But undo must be available
    expect(requiresUndo('mutate', policy)).toBe(true);
  });

  it('should protect AI board from accidental execution', () => {
    const policy = EFFECT_POLICY_AI_BOARD;

    // Can analyze and propose
    expect(isEffectAllowed('inspect', policy)).toBe(true);
    expect(isEffectAllowed('propose', policy)).toBe(true);

    // But cannot execute by default
    expect(isEffectAllowed('mutate', policy)).toBe(false);

    const result = checkEffect('mutate', policy);
    expect(result.ok).toBe(false);
  });
});

describe('Type Safety', () => {
  it('should enforce effect type at compile time', () => {
    // These should type-check
    const effects: EffectType[] = ['inspect', 'propose', 'mutate'];
    expect(effects).toHaveLength(3);

    // TypeScript would catch invalid effect types at compile time
    // const invalid: EffectType = 'invalid'; // would not compile
  });

  it('should enforce capability type at compile time', () => {
    const capabilities: EffectCapability[] = ['none', 'preview', 'execute'];
    expect(capabilities).toHaveLength(3);
  });

  it('should type-check policy structure', () => {
    const policy: EffectPolicy = {
      name: 'test',
      description: 'Test policy',
      allowedEffects: ['inspect'],
      requiresPreview: false,
      requiresConfirmation: false,
      requiresUndo: false,
    };

    expect(policy.name).toBe('test');
  });
});
