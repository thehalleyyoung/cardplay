/**
 * Tests for custom constraint namespacing enforcement.
 * Change 367: Ensures custom constraints use namespaced IDs.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  constraintRegistry,
  type CustomConstraintDefinition,
  type CustomConstraint,
  type ValidationResult,
} from './custom-constraints';

describe('custom-constraints namespacing', () => {
  beforeEach(() => {
    // Clear any existing registrations
    const types = constraintRegistry.getAllTypes();
    types.forEach(type => constraintRegistry.unregister(type));
  });

  describe('builtin type collision prevention', () => {
    it('rejects builtin constraint type "key"', () => {
      const definition: CustomConstraintDefinition = {
        type: 'key',
        displayName: 'Key',
        description: 'Test',
        category: 'pitch',
        toPrologFact: () => '',
        toPrologTerm: () => '',
      };

      expect(() => constraintRegistry.register(definition)).toThrow(/builtin type/);
    });

    it('rejects builtin constraint type "tempo"', () => {
      const definition: CustomConstraintDefinition = {
        type: 'tempo',
        displayName: 'Tempo',
        description: 'Test',
        category: 'rhythm',
        toPrologFact: () => '',
        toPrologTerm: () => '',
      };

      expect(() => constraintRegistry.register(definition)).toThrow(/builtin type/);
    });

    it('rejects builtin constraint type "raga"', () => {
      const definition: CustomConstraintDefinition = {
        type: 'raga',
        displayName: 'Raga',
        description: 'Test',
        category: 'pitch',
        toPrologFact: () => '',
        toPrologTerm: () => '',
      };

      expect(() => constraintRegistry.register(definition)).toThrow(/builtin type/);
    });
  });

  describe('namespacing requirement', () => {
    it('rejects non-namespaced custom type', () => {
      const definition: CustomConstraintDefinition = {
        type: 'my-constraint',
        displayName: 'My Constraint',
        description: 'Test',
        category: 'custom',
        toPrologFact: () => '',
        toPrologTerm: () => '',
      };

      expect(() => constraintRegistry.register(definition)).toThrow(/namespaced ID/);
    });

    it('accepts namespaced custom type', () => {
      const definition: CustomConstraintDefinition = {
        type: 'my-pack:my-constraint',
        displayName: 'My Constraint',
        description: 'Test',
        category: 'custom',
        toPrologFact: () => '',
        toPrologTerm: () => '',
      };

      expect(() => constraintRegistry.register(definition)).not.toThrow();
      expect(constraintRegistry.has('my-pack:my-constraint')).toBe(true);
    });

    it('accepts namespaced type even if base name matches builtin', () => {
      const definition: CustomConstraintDefinition = {
        type: 'my-pack:key',
        displayName: 'My Key Constraint',
        description: 'A custom key constraint',
        category: 'pitch',
        toPrologFact: () => '',
        toPrologTerm: () => '',
      };

      expect(() => constraintRegistry.register(definition)).not.toThrow();
      expect(constraintRegistry.has('my-pack:key')).toBe(true);
    });
  });

  describe('registration and retrieval', () => {
    it('registers and retrieves namespaced constraint', () => {
      const definition: CustomConstraintDefinition = {
        type: 'test-pack:custom-constraint',
        displayName: 'Custom Constraint',
        description: 'A test constraint',
        category: 'custom',
        toPrologFact: (constraint, specId) => `custom_constraint(${specId}).`,
        toPrologTerm: () => 'custom_constraint',
      };

      constraintRegistry.register(definition);

      const retrieved = constraintRegistry.get('test-pack:custom-constraint');
      expect(retrieved).toBeDefined();
      expect(retrieved?.displayName).toBe('Custom Constraint');
    });

    it('lists all registered types', () => {
      const def1: CustomConstraintDefinition = {
        type: 'pack1:constraint1',
        displayName: 'Constraint 1',
        description: 'Test',
        category: 'custom',
        toPrologFact: () => '',
        toPrologTerm: () => '',
      };

      const def2: CustomConstraintDefinition = {
        type: 'pack2:constraint2',
        displayName: 'Constraint 2',
        description: 'Test',
        category: 'custom',
        toPrologFact: () => '',
        toPrologTerm: () => '',
      };

      constraintRegistry.register(def1);
      constraintRegistry.register(def2);

      const types = constraintRegistry.getAllTypes();
      expect(types).toContain('pack1:constraint1');
      expect(types).toContain('pack2:constraint2');
      expect(types.length).toBe(2);
    });

    it('allows unregistering constraints', () => {
      const definition: CustomConstraintDefinition = {
        type: 'pack:constraint',
        displayName: 'Constraint',
        description: 'Test',
        category: 'custom',
        toPrologFact: () => '',
        toPrologTerm: () => '',
      };

      constraintRegistry.register(definition);
      expect(constraintRegistry.has('pack:constraint')).toBe(true);

      constraintRegistry.unregister('pack:constraint');
      expect(constraintRegistry.has('pack:constraint')).toBe(false);
    });
  });

  describe('error messages', () => {
    it('provides helpful error for builtin collision', () => {
      const definition: CustomConstraintDefinition = {
        type: 'meter',
        displayName: 'Meter',
        description: 'Test',
        category: 'rhythm',
        toPrologFact: () => '',
        toPrologTerm: () => '',
      };

      expect(() => constraintRegistry.register(definition)).toThrow(/builtin type/);
      expect(() => constraintRegistry.register(definition)).toThrow(/my-pack:meter/);
    });

    it('provides helpful error for missing namespace', () => {
      const definition: CustomConstraintDefinition = {
        type: 'awesome-constraint',
        displayName: 'Awesome',
        description: 'Test',
        category: 'custom',
        toPrologFact: () => '',
        toPrologTerm: () => '',
      };

      expect(() => constraintRegistry.register(definition)).toThrow(/namespaced ID/);
      expect(() => constraintRegistry.register(definition)).toThrow(/my-pack:awesome-constraint/);
    });
  });
});
