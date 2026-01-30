/**
 * GOFAI Semantic Safety Invariants Test Suite — Step 002 Complete
 *
 * This comprehensive test suite validates all semantic safety invariants
 * defined in gofai_goalB.md Step 002. Each invariant is treated as a
 * first-class testable requirement with multiple test cases covering:
 *
 * - Happy paths (invariant satisfied)
 * - Violation paths (invariant violated with clear evidence)
 * - Edge cases and boundary conditions
 * - Real-world scenarios from musical editing contexts
 *
 * The goal is 100% coverage of invariant checking logic to ensure that
 * constraints are always executable checks, never silent assumptions.
 *
 * @module gofai/invariants/__tests__/semantic-safety-invariants
 */

import { describe, it, expect } from 'vitest';
import {
  checkCoreInvariants,
  checkCriticalInvariants,
  type CPLOperation,
  type InvariantContext,
} from '../core-invariants';
import type { ProjectStateSnapshot } from '../constraint-verifiers';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Create a minimal valid CPL operation for testing.
 */
function createTestOperation(overrides: Partial<CPLOperation> = {}): CPLOperation {
  return {
    id: 'test-op-001',
    opcode: 'test_opcode',
    effectType: 'inspect',
    targets: [],
    constraints: [],
    approved: false,
    ambiguities: [],
    references: [],
    presuppositions: [],
    ...overrides,
  };
}

/**
 * Create a minimal valid invariant context for testing.
 */
function createTestContext(overrides: Partial<InvariantContext> = {}): InvariantContext {
  return {
    state: createTestState(),
    autoApplyEnabled: false,
    userApproved: false,
    determinismCheckEnabled: false,
    ...overrides,
  };
}

/**
 * Create a minimal valid project state for testing.
 */
function createTestState(): ProjectStateSnapshot {
  return {
    version: 1,
    sections: [
      { id: 'section-chorus', name: 'Chorus', startBar: 0, endBar: 8 },
      { id: 'section-verse', name: 'Verse', startBar: 8, endBar: 16 },
    ],
    layers: [
      { id: 'layer-drums', name: 'Drums', trackIds: ['track-drums'] },
      { id: 'layer-bass', name: 'Bass', trackIds: ['track-bass'] },
    ],
    events: [
      { id: 'event-1', trackId: 'track-drums', bar: 0, beat: 0, pitch: 36 },
      { id: 'event-2', trackId: 'track-bass', bar: 0, beat: 0, pitch: 48 },
    ],
    cards: [
      { id: 'card-reverb', type: 'reverb', params: { mix: 0.3 } },
      { id: 'card-eq', type: 'eq', params: { gain: 0 } },
    ],
  };
}

/**
 * Extract violations from check results.
 */
function getViolations(results: ReturnType<typeof checkCoreInvariants>) {
  return results.filter((r): r is Extract<typeof r, { ok: false }> => !r.ok);
}

// =============================================================================
// Test Suite: Invariant 1 - Constraint Executability
// =============================================================================

describe('Invariant 1: Constraint Executability', () => {
  it('should pass when all constraints have verifiers', () => {
    const operation = createTestOperation({
      constraints: [
        { typeId: 'preserve_melody', params: { tolerance: 0 } },
        { typeId: 'preserve_harmony', params: { tolerance: 0 } },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);

    expect(violations).toHaveLength(0);
  });

  it('should fail when constraint has no verifier', () => {
    const operation = createTestOperation({
      constraints: [
        { typeId: 'unknown_constraint_type', params: {} },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);

    expect(violations.length).toBeGreaterThan(0);
    const violation = violations.find(
      (v) => !v.ok && v.invariantId === 'constraint-executability'
    );
    expect(violation).toBeDefined();
    if (violation && !violation.ok) {
      expect(violation.severity).toBe('critical');
      expect(violation.message).toContain('unknown_constraint_type');
      expect(violation.evidence.expected).toContain('verifier');
    }
  });

  it('should check multiple unknown constraints', () => {
    const operation = createTestOperation({
      constraints: [
        { typeId: 'unknown_a', params: {} },
        { typeId: 'preserve_melody', params: {} },
        { typeId: 'unknown_b', params: {} },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    expect(violations.length).toBeGreaterThan(0);
    // Should catch first unknown constraint
    expect(violations[0].message).toContain('unknown_a');
  });

  it('should allow empty constraint list', () => {
    const operation = createTestOperation({
      constraints: [],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'constraint-executability'
    );
    expect(violation).toBeUndefined();
  });
});

// =============================================================================
// Test Suite: Invariant 2 - Silent Ambiguity Prohibition
// =============================================================================

describe('Invariant 2: Silent Ambiguity Prohibition', () => {
  it('should pass when no ambiguities exist', () => {
    const operation = createTestOperation({
      ambiguities: [],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'ambiguity-prohibition'
    );
    expect(violation).toBeUndefined();
  });

  it('should pass when ambiguities are unresolved (prompting expected)', () => {
    const operation = createTestOperation({
      ambiguities: [
        {
          type: 'scope',
          expression: 'the chorus',
          interpretations: ['chorus-1', 'chorus-2'],
          resolved: false,
        },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'ambiguity-prohibition'
    );
    expect(violation).toBeUndefined();
  });

  it('should fail when ambiguity resolved with single interpretation', () => {
    const operation = createTestOperation({
      ambiguities: [
        {
          type: 'scope',
          expression: 'the chorus',
          interpretations: ['chorus-1'],
          resolved: true,
        },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    expect(violations.length).toBeGreaterThan(0);
    const violation = violations.find(
      (v) => v.invariantId === 'ambiguity-prohibition'
    );
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe('critical');
    expect(violation?.message).toContain('the chorus');
  });

  it('should fail when mutation attempted with unresolved ambiguities', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      ambiguities: [
        {
          type: 'referent',
          expression: 'it',
          interpretations: ['drums', 'bass'],
          resolved: false,
        },
      ],
      approved: true,
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    expect(violations.length).toBeGreaterThan(0);
    const violation = violations.find(
      (v) => v.invariantId === 'ambiguity-prohibition'
    );
    expect(violation).toBeDefined();
    expect(violation?.message).toContain('unresolved ambiguity');
  });

  it('should pass when ambiguities resolved with multiple interpretations', () => {
    const operation = createTestOperation({
      ambiguities: [
        {
          type: 'scope',
          expression: 'the verse',
          interpretations: ['verse-1', 'verse-2'],
          resolved: true,
        },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'ambiguity-prohibition'
    );
    expect(violation).toBeUndefined();
  });
});

// =============================================================================
// Test Suite: Invariant 3 - Constraint Preservation
// =============================================================================

describe('Invariant 3: Constraint Preservation', () => {
  it('should skip check for non-mutate operations', () => {
    const operation = createTestOperation({
      effectType: 'inspect',
      constraints: [{ typeId: 'preserve_melody', params: {} }],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'constraint-preservation'
    );
    expect(violation).toBeUndefined();
  });

  it('should skip check when no before/after state', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      constraints: [{ typeId: 'preserve_melody', params: {} }],
      approved: true,
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'constraint-preservation'
    );
    expect(violation).toBeUndefined();
  });

  it('should pass when preservation constraints are satisfied', () => {
    const stateBefore = createTestState();
    const stateAfter = createTestState();

    const operation = createTestOperation({
      effectType: 'mutate',
      constraints: [{ typeId: 'preserve_melody', params: { tolerance: 0 } }],
      stateBefore,
      stateAfter,
      approved: true,
      undoToken: 'undo-001',
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'constraint-preservation'
    );
    expect(violation).toBeUndefined();
  });

  it('should fail when preservation constraint is violated', () => {
    const stateBefore = createTestState();
    const stateAfter = createTestState();
    // Modify melody events
    stateAfter.events = [
      { id: 'event-1', trackId: 'track-drums', bar: 0, beat: 0, pitch: 36 },
      { id: 'event-2', trackId: 'track-bass', bar: 0, beat: 0, pitch: 50 }, // Changed!
    ];

    const operation = createTestOperation({
      effectType: 'mutate',
      constraints: [{ typeId: 'preserve_melody', params: { tolerance: 0 } }],
      stateBefore,
      stateAfter,
      approved: true,
      undoToken: 'undo-001',
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'constraint-preservation'
    );
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe('critical');
  });

  it('should check only_change constraints', () => {
    const stateBefore = createTestState();
    const stateAfter = createTestState();
    // Add extra layer that shouldn't be touched
    stateAfter.layers = [
      ...stateAfter.layers,
      { id: 'layer-keys', name: 'Keys', trackIds: ['track-keys'] },
    ];

    const operation = createTestOperation({
      effectType: 'mutate',
      constraints: [
        { typeId: 'only_change', params: { allowed: ['layer-drums'] } },
      ],
      stateBefore,
      stateAfter,
      approved: true,
      undoToken: 'undo-001',
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'constraint-preservation'
    );
    expect(violation).toBeDefined();
  });
});

// =============================================================================
// Test Suite: Invariant 4 - Referent Resolution Completeness
// =============================================================================

describe('Invariant 4: Referent Resolution Completeness', () => {
  it('should pass when all references are resolved', () => {
    const operation = createTestOperation({
      references: [
        { expression: 'the chorus', resolved: true, resolvedTo: 'section-chorus' },
        { expression: 'the drums', resolved: true, resolvedTo: 'layer-drums' },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'referent-resolution'
    );
    expect(violation).toBeUndefined();
  });

  it('should pass when no references exist', () => {
    const operation = createTestOperation({
      references: [],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'referent-resolution'
    );
    expect(violation).toBeUndefined();
  });

  it('should fail when any reference is unresolved', () => {
    const operation = createTestOperation({
      references: [
        { expression: 'the chorus', resolved: true, resolvedTo: 'section-chorus' },
        { expression: 'it', resolved: false },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    expect(violations.length).toBeGreaterThan(0);
    const violation = violations.find(
      (v) => v.invariantId === 'referent-resolution'
    );
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe('critical');
    expect(violation?.message).toContain('it');
  });

  it('should report all unresolved references', () => {
    const operation = createTestOperation({
      references: [
        { expression: 'it', resolved: false },
        { expression: 'that', resolved: false },
        { expression: 'them', resolved: false },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'referent-resolution'
    );
    expect(violation).toBeDefined();
    expect(violation?.message).toContain('3 unresolved');
  });
});

// =============================================================================
// Test Suite: Invariant 5 - Effect Typing
// =============================================================================

describe('Invariant 5: Effect Typing', () => {
  it('should pass for inspect operations without approval', () => {
    const operation = createTestOperation({
      effectType: 'inspect',
      approved: false,
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'effect-typing');
    expect(violation).toBeUndefined();
  });

  it('should pass for propose operations without approval', () => {
    const operation = createTestOperation({
      effectType: 'propose',
      approved: false,
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'effect-typing');
    expect(violation).toBeUndefined();
  });

  it('should fail for mutate operations without approval', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      approved: false,
    });
    const context = createTestContext({ autoApplyEnabled: false });

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    expect(violations.length).toBeGreaterThan(0);
    const violation = violations.find((v) => v.invariantId === 'effect-typing');
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe('critical');
    expect(violation?.message).toContain('approval');
  });

  it('should pass for mutate operations with approval', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      approved: true,
      undoToken: 'undo-001',
      stateBefore: createTestState(),
      stateAfter: createTestState(),
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'effect-typing');
    expect(violation).toBeUndefined();
  });

  it('should allow mutate in auto-apply mode without explicit approval', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      approved: false,
      undoToken: 'undo-001',
      stateBefore: createTestState(),
      stateAfter: createTestState(),
    });
    const context = createTestContext({ autoApplyEnabled: true });

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'effect-typing');
    expect(violation).toBeUndefined();
  });

  it('should fail for invalid effect type', () => {
    const operation = createTestOperation({
      effectType: 'invalid' as any,
      approved: true,
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    expect(violations.length).toBeGreaterThan(0);
    const violation = violations.find((v) => v.invariantId === 'effect-typing');
    expect(violation).toBeDefined();
    expect(violation?.message).toContain('Invalid effect type');
  });
});

// =============================================================================
// Test Suite: Invariant 6 - Determinism
// =============================================================================

describe('Invariant 6: Determinism', () => {
  it('should skip check when determinism checking disabled', () => {
    const operation = createTestOperation();
    const context = createTestContext({ determinismCheckEnabled: false });

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'determinism');
    expect(violation).toBeUndefined();
  });

  it('should skip check when no previous run result', () => {
    const operation = createTestOperation();
    const context = createTestContext({
      determinismCheckEnabled: true,
      previousRunResult: undefined,
    });

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'determinism');
    expect(violation).toBeUndefined();
  });

  it('should pass for deterministic operations', () => {
    const operation = createTestOperation({
      opcode: 'transpose',
      targets: ['section-chorus'],
    });
    const context = createTestContext({
      determinismCheckEnabled: true,
      previousRunResult: { /* some result */ },
    });

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'determinism');
    expect(violation).toBeUndefined();
  });
});

// =============================================================================
// Test Suite: Invariant 7 - Undoability
// =============================================================================

describe('Invariant 7: Undoability', () => {
  it('should skip check for non-mutate operations', () => {
    const operation = createTestOperation({
      effectType: 'inspect',
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'undoability');
    expect(violation).toBeUndefined();
  });

  it('should skip check for mutate operations not yet applied', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      approved: true,
      stateAfter: undefined,
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'undoability');
    expect(violation).toBeUndefined();
  });

  it('should fail when mutate operation applied without undo token', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      approved: true,
      stateBefore: createTestState(),
      stateAfter: createTestState(),
      undoToken: undefined,
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    expect(violations.length).toBeGreaterThan(0);
    const violation = violations.find((v) => v.invariantId === 'undoability');
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe('critical');
    expect(violation?.message).toContain('undo token');
  });

  it('should pass when mutate operation has undo token', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      approved: true,
      stateBefore: createTestState(),
      stateAfter: createTestState(),
      undoToken: 'undo-token-123',
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'undoability');
    expect(violation).toBeUndefined();
  });
});

// =============================================================================
// Test Suite: Secondary Invariants
// =============================================================================

describe('Secondary Invariant: Scope Visibility', () => {
  it('should skip check for non-mutate operations', () => {
    const operation = createTestOperation({
      effectType: 'inspect',
      scope: undefined,
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'scope-visibility');
    expect(violation).toBeUndefined();
  });

  it('should fail when mutate operation has no scope', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      approved: true,
      scope: undefined,
      undoToken: 'undo-001',
      stateBefore: createTestState(),
      stateAfter: createTestState(),
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'scope-visibility');
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe('error');
  });

  it('should fail when mutate operation has empty scope', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      approved: true,
      scope: { sections: [], layers: [], parameters: [] },
      undoToken: 'undo-001',
      stateBefore: createTestState(),
      stateAfter: createTestState(),
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'scope-visibility');
    expect(violation).toBeDefined();
    expect(violation?.message).toContain('empty scope');
  });

  it('should pass when mutate operation has valid scope', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      approved: true,
      scope: {
        sections: ['section-chorus'],
        layers: ['layer-drums'],
        parameters: [],
      },
      undoToken: 'undo-001',
      stateBefore: createTestState(),
      stateAfter: createTestState(),
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find((v) => v.invariantId === 'scope-visibility');
    expect(violation).toBeUndefined();
  });
});

describe('Secondary Invariant: Presupposition Verification', () => {
  it('should pass when no presuppositions', () => {
    const operation = createTestOperation({
      presuppositions: [],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'presupposition-verification'
    );
    expect(violation).toBeUndefined();
  });

  it('should fail when presupposition not verified', () => {
    const operation = createTestOperation({
      presuppositions: [
        {
          description: 'Section "chorus" exists',
          verified: false,
        },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'presupposition-verification'
    );
    expect(violation).toBeDefined();
    expect(violation?.message).toContain('not verified');
  });

  it('should fail when presupposition verified but does not hold', () => {
    const operation = createTestOperation({
      presuppositions: [
        {
          description: 'Section "bridge" exists',
          verified: true,
          holds: false,
        },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'presupposition-verification'
    );
    expect(violation).toBeDefined();
    expect(violation?.message).toContain('failed');
  });

  it('should pass when presupposition verified and holds', () => {
    const operation = createTestOperation({
      presuppositions: [
        {
          description: 'Section "chorus" exists',
          verified: true,
          holds: true,
        },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'presupposition-verification'
    );
    expect(violation).toBeUndefined();
  });
});

describe('Secondary Invariant: Constraint Compatibility', () => {
  it('should pass when no conflicting constraints', () => {
    const operation = createTestOperation({
      constraints: [
        { typeId: 'preserve_melody', params: {} },
        { typeId: 'preserve_harmony', params: {} },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'constraint-compatibility'
    );
    expect(violation).toBeUndefined();
  });

  it('should fail when preserve and change conflict on same target', () => {
    const operation = createTestOperation({
      constraints: [
        { typeId: 'preserve_melody', params: { target: 'melody' } },
        { typeId: 'change', params: { target: 'melody' } },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'constraint-compatibility'
    );
    expect(violation).toBeDefined();
    expect(violation?.message).toContain('Conflicting constraints');
  });

  it('should fail when tempo ranges are incompatible', () => {
    const operation = createTestOperation({
      constraints: [
        { typeId: 'tempo', params: { min: 120, max: 140 } },
        { typeId: 'tempo', params: { min: 150, max: 170 } },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'constraint-compatibility'
    );
    expect(violation).toBeDefined();
    expect(violation?.message).toContain('no valid tempo range');
  });

  it('should pass when tempo ranges overlap', () => {
    const operation = createTestOperation({
      constraints: [
        { typeId: 'tempo', params: { min: 120, max: 140 } },
        { typeId: 'tempo', params: { min: 130, max: 150 } },
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    const violation = violations.find(
      (v) => v.invariantId === 'constraint-compatibility'
    );
    expect(violation).toBeUndefined();
  });
});

// =============================================================================
// Integration Tests: Multiple Invariants
// =============================================================================

describe('Integration: Multiple Invariant Violations', () => {
  it('should report all critical violations', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      approved: false, // Violates effect-typing
      references: [{ expression: 'it', resolved: false }], // Violates referent-resolution
      constraints: [{ typeId: 'unknown_constraint', params: {} }], // Violates constraint-executability
    });
    const context = createTestContext();

    const results = checkCriticalInvariants(context, operation);
    const violations = getViolations(results);

    expect(violations.length).toBeGreaterThan(2);
    // Some invariants violated (violations found)
  });

  it('should report all violations across all invariants', () => {
    const operation = createTestOperation({
      effectType: 'mutate',
      approved: true,
      stateAfter: createTestState(), // Has after but no undo token - violates undoability
      scope: undefined, // Violates scope-visibility
      presuppositions: [
        { description: 'test', verified: false }, // Violates presupposition-verification
      ],
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    expect(violations.length).toBeGreaterThanOrEqual(3);
  });
});

// =============================================================================
// Real-World Scenario Tests
// =============================================================================

describe('Real-World Scenario: Make it darker in the chorus', () => {
  it('should pass all invariants for valid operation', () => {
    const operation = createTestOperation({
      id: 'darken-chorus-001',
      opcode: 'adjust_brightness',
      effectType: 'mutate',
      approved: true,
      targets: ['section-chorus'],
      scope: {
        sections: ['section-chorus'],
        layers: ['layer-drums', 'layer-bass'],
        parameters: ['brightness'],
      },
      constraints: [
        { typeId: 'preserve_melody', params: { tolerance: 0 } },
        { typeId: 'preserve_structure', params: {} },
      ],
      ambiguities: [],
      references: [
        { expression: 'the chorus', resolved: true, resolvedTo: 'section-chorus' },
      ],
      presuppositions: [
        {
          description: 'Section "chorus" exists',
          verified: true,
          holds: true,
        },
      ],
      stateBefore: createTestState(),
      stateAfter: createTestState(),
      undoToken: 'undo-darken-chorus-001',
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    expect(violations).toHaveLength(0);
    // All invariants passed (no violations)
  });
});

describe('Real-World Scenario: Transpose the melody', () => {
  it('should fail when melody reference is ambiguous', () => {
    const operation = createTestOperation({
      opcode: 'transpose',
      effectType: 'mutate',
      approved: true,
      ambiguities: [
        {
          type: 'layer',
          expression: 'the melody',
          interpretations: ['layer-melody-1', 'layer-melody-2'],
          resolved: false,
        },
      ],
      undoToken: 'undo-001',
      stateBefore: createTestState(),
      stateAfter: createTestState(),
    });
    const context = createTestContext();

    const results = checkCoreInvariants(context, operation);
    const violations = getViolations(results);

    expect(violations.length).toBeGreaterThan(0);
    const violation = violations.find(
      (v) => v.invariantId === 'ambiguity-prohibition'
    );
    expect(violation).toBeDefined();
  });
});
