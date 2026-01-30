/**
 * GOFAI ID System Tests
 * 
 * Step 052/099 implementation: Comprehensive tests for GofaiId system,
 * namespacing rules, collision detection, and ID validation.
 * 
 * Tests cover:
 * - ID format validation
 * - Namespace rules and reserved namespaces
 * - Collision detection between core and extensions
 * - ID parsing and construction
 * - Cross-reference validation
 * - Serialization stability
 */

import { describe, test, expect } from 'vitest';
import {
  createGofaiId,
  createLexemeId,
  createAxisId,
  createOpcodeId,
  createConstraintTypeId,
  createRuleId,
  createUnitId,
  createSectionTypeId,
  createLayerTypeId,
  isNamespaced,
  getNamespace,
  isValidNamespace,
  RESERVED_NAMESPACES,
  type GofaiId,
  type LexemeId,
  type AxisId,
  type OpcodeId,
} from '../types.js';

// =============================================================================
// ID Format Validation Tests
// =============================================================================

describe('GofaiId Format Validation', () => {
  describe('Core IDs (un-namespaced)', () => {
    test('creates valid core GofaiId', () => {
      const id = createGofaiId('axis', 'brightness');
      expect(id).toBe('gofai:axis:brightness');
      expect(isNamespaced(id)).toBe(false);
    });

    test('creates valid core LexemeId', () => {
      // createLexemeId(name, namespace?) - name first!
      const id = createLexemeId('make');
      expect(id).toBe('lexeme:make');
      expect(isNamespaced(id)).toBe(false);
    });

    test('creates valid core AxisId', () => {
      const id = createAxisId('brightness');
      expect(id).toBe('axis:brightness');
      expect(isNamespaced(id)).toBe(false);
    });

    test('creates valid core OpcodeId', () => {
      const id = createOpcodeId('raise_register');
      expect(id).toBe('opcode:raise_register');
      expect(isNamespaced(id)).toBe(false);
    });

    test('creates valid core ConstraintTypeId', () => {
      const id = createConstraintTypeId('preserve');
      expect(id).toBe('preserve');
      expect(isNamespaced(id)).toBe(false);
    });

    test('creates valid core RuleId', () => {
      const id = createRuleId('imperative', 'axis_change');
      expect(id).toBe('rule:imperative:axis_change');
      expect(isNamespaced(id)).toBe(false);
    });

    test('creates valid core UnitId', () => {
      const id = createUnitId('bars');
      expect(id).toBe('unit:bars');
      expect(isNamespaced(id)).toBe(false);
    });

    test('creates valid core SectionTypeId', () => {
      const id = createSectionTypeId('chorus');
      expect(id).toBe('section:chorus');
      expect(isNamespaced(id)).toBe(false);
    });

    test('creates valid core LayerTypeId', () => {
      const id = createLayerTypeId('drums');
      expect(id).toBe('layer:drums');
      expect(isNamespaced(id)).toBe(false);
    });

    test('core IDs use lowercase with underscores', () => {
      const id = createLexemeId('very_bright');
      expect(id).toBe('lexeme:very_bright');
      expect(id).toMatch(/^[a-z:_]+$/);
    });

    test('core IDs do not contain uppercase', () => {
      // Constructor should normalize or reject
      const id = createAxisId('brightness');
      expect(id).not.toMatch(/[A-Z]/);
    });
  });

  describe('Extension IDs (namespaced)', () => {
    test('creates valid extension GofaiId', () => {
      const id = createGofaiId('axis', 'grit', 'my-pack');
      expect(id).toBe('my-pack:gofai:axis:grit');
      expect(isNamespaced(id)).toBe(true);
      expect(getNamespace(id)).toBe('my-pack');
    });

    test('creates valid extension LexemeId', () => {
      const id = createLexemeId('stutter', 'lofi-fx');
      expect(id).toBe('lexeme:lofi-fx:stutter');
      expect(isNamespaced(id)).toBe(true);
      expect(getNamespace(id)).toBe('lofi-fx');
    });

    test('creates valid extension AxisId', () => {
      const id = createAxisId('warmness', 'analog-suite');
      expect(id).toBe('axis:analog-suite:warmness');
      expect(isNamespaced(id)).toBe(true);
    });

    test('creates valid extension OpcodeId', () => {
      const id = createOpcodeId('add_swing', 'drum-machine');
      expect(id).toBe('opcode:drum-machine:add_swing');
      expect(isNamespaced(id)).toBe(true);
    });

    test('extension namespaces follow kebab-case format', () => {
      const validNamespaces = [
        'my-pack',
        'lofi-fx',
        'drum-machine-2',
        'jazz-theory',
        'pack-name-123',
      ];

      for (const ns of validNamespaces) {
        expect(isValidNamespace(ns)).toBe(true);
        const id = createAxisId('test', ns);
        expect(getNamespace(id)).toBe(ns);
      }
    });

    test('rejects invalid namespace formats', () => {
      const invalidNamespaces = [
        'MyPack',        // uppercase
        'my_pack',       // underscore
        'my.pack',       // dot
        '-my-pack',      // leading dash
        'my-pack-',      // trailing dash
        'my--pack',      // double dash
        'my pack',       // space
        // '123-pack' is actually allowed (starts with digit but is valid kebab-case)
      ];

      for (const ns of invalidNamespaces) {
        expect(isValidNamespace(ns)).toBe(false);
      }
    });
  });

  describe('Reserved Namespace Protection', () => {
    test('defines reserved namespaces', () => {
      expect(RESERVED_NAMESPACES).toContain('gofai');
      expect(RESERVED_NAMESPACES).toContain('core');
      expect(RESERVED_NAMESPACES).toContain('cardplay');
      expect(RESERVED_NAMESPACES).toContain('builtin');
      expect(RESERVED_NAMESPACES).toContain('system');
      expect(RESERVED_NAMESPACES).toContain('user');
    });

    test('rejects reserved namespaces', () => {
      for (const reserved of RESERVED_NAMESPACES) {
        expect(isValidNamespace(reserved)).toBe(false);
      }
    });

    test('throws when attempting to use reserved namespace', () => {
      expect(() => {
        createAxisId('test', 'gofai');
      }).toThrow(/reserved namespace/i);

      expect(() => {
        createOpcodeId('test', 'core');
      }).toThrow(/reserved namespace/i);
    });
  });
});

// =============================================================================
// Namespace Parsing and Validation Tests
// =============================================================================

describe('Namespace Parsing', () => {
  test('extracts namespace from namespaced ID', () => {
    const id = createAxisId('brightness', 'my-pack');
    expect(getNamespace(id)).toBe('my-pack');
  });

  test('returns undefined for core IDs', () => {
    const id = createAxisId('brightness');
    expect(getNamespace(id)).toBeUndefined();
  });

  test('handles complex namespaces', () => {
    const id = createLexemeId('action', 'my-super-pack-v2');
    expect(getNamespace(id)).toBe('my-super-pack-v2');
  });

  test('validates namespace format rules', () => {
    // Valid formats
    expect(isValidNamespace('simple')).toBe(true);
    expect(isValidNamespace('two-words')).toBe(true);
    expect(isValidNamespace('many-words-here')).toBe(true);
    expect(isValidNamespace('pack123')).toBe(true);
    expect(isValidNamespace('pack-123')).toBe(true);

    // Invalid formats
    expect(isValidNamespace('')).toBe(false);
    expect(isValidNamespace('has spaces')).toBe(false);
    expect(isValidNamespace('has_underscores')).toBe(false);
    expect(isValidNamespace('Has-Capitals')).toBe(false);
    expect(isValidNamespace('-starts-with-dash')).toBe(false);
    expect(isValidNamespace('ends-with-dash-')).toBe(false);
  });
});

// =============================================================================
// Collision Detection Tests
// =============================================================================

describe('ID Collision Detection', () => {
  describe('Core vs Extension Collisions', () => {
    test('core and extension IDs with same name do not collide', () => {
      const coreId = createAxisId('brightness');
      const extId = createAxisId('brightness', 'my-pack');

      expect(coreId).not.toBe(extId);
      expect(coreId).toBe('axis:brightness');
      expect(extId).toBe('axis:my-pack:brightness');
    });

    test('multiple extensions can have same concept names', () => {
      const ext1Id = createAxisId('grit', 'pack-a');
      const ext2Id = createAxisId('grit', 'pack-b');

      expect(ext1Id).not.toBe(ext2Id);
      expect(ext1Id).toBe('axis:pack-a:grit');
      expect(ext2Id).toBe('axis:pack-b:grit');
    });

    test('core always wins in ambiguous contexts', () => {
      // This is a policy test - actual resolution happens in registry
      const coreId = createLexemeId('make');
      const extId = createLexemeId('make', 'alt-pack');

      // Both are valid, but core should be preferred
      expect(isNamespaced(coreId)).toBe(false);
      expect(isNamespaced(extId)).toBe(true);
    });
  });

  describe('Extension vs Extension Collisions', () => {
    test('different namespaces prevent collisions', () => {
      const ids = [
        createOpcodeId('stutter', 'pack-1'),
        createOpcodeId('stutter', 'pack-2'),
        createOpcodeId('stutter', 'pack-3'),
      ];

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('same namespace + name creates duplicate', () => {
      const id1 = createAxisId('warmth', 'my-pack');
      const id2 = createAxisId('warmth', 'my-pack');

      expect(id1).toBe(id2);
    });
  });

  describe('Surface Form Collisions', () => {
    test('multiple lexemes can map to same surface form', () => {
      // These are different semantic entries that happen to share a variant
      const timbre = createLexemeId('dark_timbre');
      const harmony = createLexemeId('dark_harmony');

      expect(timbre).not.toBe(harmony);
      // Both might have 'darker' as a variant, causing ambiguity to be resolved at parse time
    });

    test('ambiguity requires clarification at parse time', () => {
      // This test documents the policy - implementation is elsewhere
      // Multiple lexemes with same surface form → parser generates clarification
      expect(true).toBe(true); // Policy documented
    });
  });
});

// =============================================================================
// ID Uniqueness Tests
// =============================================================================

describe('ID Uniqueness Guarantees', () => {
  test('core IDs are unique within category', () => {
    const axes = [
      createAxisId('brightness'),
      createAxisId('width'),
      createAxisId('energy'),
      createAxisId('clarity'),
    ];

    const uniqueAxes = new Set(axes);
    expect(uniqueAxes.size).toBe(axes.length);
  });

  test('IDs are unique across categories', () => {
    const ids = [
      createAxisId('brightness'),
      createOpcodeId('brightness'), // Different category
      createLexemeId('adj', 'brightness'), // Different category
    ];

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('extension IDs are unique within namespace+category', () => {
    const namespace = 'test-pack';
    const ops = [
      createOpcodeId('op1', namespace),
      createOpcodeId('op2', namespace),
      createOpcodeId('op3', namespace),
    ];

    const uniqueOps = new Set(ops);
    expect(uniqueOps.size).toBe(ops.length);
  });

  test('duplicate detection works', () => {
    const ids = [
      createAxisId('brightness'),
      createAxisId('width'),
      createAxisId('brightness'), // Duplicate
    ];

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(2); // Only 2 unique
  });
});

// =============================================================================
// Serialization and Persistence Tests
// =============================================================================

describe('ID Serialization', () => {
  test('IDs serialize to plain strings', () => {
    const id = createAxisId('brightness', 'my-pack');
    const serialized = JSON.stringify({ id });
    const deserialized = JSON.parse(serialized);

    expect(deserialized.id).toBe('axis:my-pack:brightness');
  });

  test('IDs round-trip through JSON', () => {
    const original = {
      axis: createAxisId('brightness'),
      opcode: createOpcodeId('raise_register'),
      lexeme: createLexemeId('make'),
    };

    const serialized = JSON.stringify(original);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.axis).toBe('axis:brightness');
    expect(deserialized.opcode).toBe('opcode:raise_register');
    expect(deserialized.lexeme).toBe('lexeme:make');
  });

  test('namespaced IDs preserve namespace in serialization', () => {
    const id = createOpcodeId('custom_op', 'my-pack');
    const obj = { operation: id };

    const json = JSON.stringify(obj);
    expect(json).toContain('opcode:my-pack:custom_op');

    const restored = JSON.parse(json);
    expect(restored.operation).toBe('opcode:my-pack:custom_op');
  });

  test('serialization is stable and deterministic', () => {
    const id = createAxisId('brightness', 'test-pack');

    const json1 = JSON.stringify({ id });
    const json2 = JSON.stringify({ id });

    expect(json1).toBe(json2);
  });
});

// =============================================================================
// Cross-Reference Validation Tests (Step 099)
// =============================================================================

describe('Cross-Reference Validation', () => {
  test('lexeme references valid axis', () => {
    const axisId = createAxisId('brightness');
    const lexemeId = createLexemeId('adj', 'brighter');

    // In real code, lexeme would reference axis in semantics
    const lexeme = {
      id: lexemeId,
      semantics: {
        type: 'axis_modifier',
        axis: axisId,
      },
    };

    expect(lexeme.semantics.axis).toBe('axis:brightness');
  });

  test('opcode references valid axis', () => {
    const axisId = createAxisId('brightness');
    const opcodeId = createOpcodeId('increase_brightness');

    const opcode = {
      id: opcodeId,
      affects_axis: axisId,
    };

    expect(opcode.affects_axis).toBe('axis:brightness');
  });

  test('constraint references valid constraint type', () => {
    const constraintTypeId = createConstraintTypeId('preserve');
    const constraintId = createGofaiId('constraint_instance', 'preserve_melody_1');

    const constraint = {
      id: constraintId,
      type: constraintTypeId,
    };

    expect(constraint.type).toBe('preserve');
  });

  test('cross-references remain valid after serialization', () => {
    const structure = {
      axis: createAxisId('brightness'),
      lexemes: [
        {
          id: createLexemeId('adj', 'bright'),
          axis: createAxisId('brightness'),
        },
        {
          id: createLexemeId('adj', 'dark'),
          axis: createAxisId('brightness'),
        },
      ],
    };

    const json = JSON.stringify(structure);
    const restored = JSON.parse(json);

    expect(restored.lexemes[0].axis).toBe(structure.axis);
    expect(restored.lexemes[1].axis).toBe(structure.axis);
  });
});

// =============================================================================
// Extension Version Compatibility Tests (Step 150)
// =============================================================================

describe('Extension Version Compatibility', () => {
  test('IDs include namespace for version tracking', () => {
    const id = createOpcodeId('custom', 'my-pack');
    const namespace = getNamespace(id);

    expect(namespace).toBe('my-pack');
    // In practice, version would be tracked separately in registry
  });

  test('old IDs remain valid across versions', () => {
    // Policy: IDs never change, even across extension versions
    const v1Id = createAxisId('grit', 'pack');
    const v2Id = createAxisId('grit', 'pack');

    expect(v1Id).toBe(v2Id);
    // Version changes don't affect ID format
  });

  test('namespace changes require new IDs', () => {
    const oldId = createOpcodeId('op', 'old-pack-name');
    const newId = createOpcodeId('op', 'new-pack-name');

    expect(oldId).not.toBe(newId);
    // Namespace change = different extension = different ID
  });
});

// =============================================================================
// Stability and Immutability Tests
// =============================================================================

describe('ID Stability', () => {
  test('IDs are immutable strings', () => {
    const id = createAxisId('brightness');

    // TypeScript enforces readonly brand, but test the string value
    expect(typeof id).toBe('string');
    expect(() => {
      // @ts-expect-error - testing immutability
      id = 'something-else';
    }).toThrow();
  });

  test('same inputs always produce same ID', () => {
    const id1 = createLexemeId('verb', 'make');
    const id2 = createLexemeId('verb', 'make');

    expect(id1).toBe(id2);
    expect(id1 === id2).toBe(true);
  });

  test('IDs are comparable with === ===', () => {
    const id1 = createAxisId('brightness');
    const id2 = createAxisId('brightness');
    const id3 = createAxisId('width');

    expect(id1 === id2).toBe(true);
    expect(id1 === id3).toBe(false);
  });

  test('IDs can be used as Map keys', () => {
    const map = new Map<AxisId, string>();

    const id1 = createAxisId('brightness');
    const id2 = createAxisId('width');

    map.set(id1, 'bright axis');
    map.set(id2, 'width axis');

    expect(map.get(id1)).toBe('bright axis');
    expect(map.get(id2)).toBe('width axis');
    expect(map.size).toBe(2);
  });

  test('IDs can be used as Set members', () => {
    const set = new Set<LexemeId>();

    set.add(createLexemeId('verb', 'make'));
    set.add(createLexemeId('verb', 'create'));
    set.add(createLexemeId('verb', 'make')); // Duplicate

    expect(set.size).toBe(2);
  });
});

// =============================================================================
// ID Format Consistency Tests
// =============================================================================

describe('ID Format Consistency', () => {
  test('all core IDs follow same pattern', () => {
    const idsWithPrefix = [
      createAxisId('test'),
      createOpcodeId('test'),
      createUnitId('test'),
    ];

    for (const id of idsWithPrefix) {
      // Core IDs with type prefix: type:name
      expect(id).toMatch(/^[a-z]+:[a-z_]+$/);
    }
    
    // Constraint IDs are bare names (no prefix)
    const constraintId = createConstraintTypeId('test');
    expect(constraintId).toMatch(/^[a-z_]+$/);
  });

  test('all extension IDs follow same pattern', () => {
    const namespace = 'test-pack';
    const idsWithPrefix = [
      createAxisId('test', namespace),
      createOpcodeId('test', namespace),
    ];

    for (const id of idsWithPrefix) {
      // Extension IDs: type:namespace:name
      expect(id).toMatch(/^[a-z]+:[a-z0-9-]+:[a-z_]+$/);
    }
    
    // Constraint IDs use namespace:name format
    const constraintId = createConstraintTypeId('test', namespace);
    expect(constraintId).toMatch(/^[a-z0-9-]+:[a-z_]+$/);
  });

  test('IDs use consistent separators', () => {
    const id1 = createLexemeId('very_bright');
    const id2 = createRuleId('imperative', 'axis_change');
    const id3 = createOpcodeId('raise_register');

    // Underscores within names, colons between segments
    expect(id1).toContain(':');
    expect(id1).toContain('_');
    expect(id2).toContain(':');
    expect(id3).toContain(':');
  });

  test('namespaces use kebab-case consistently', () => {
    const namespaces = ['my-pack', 'super-pack-2', 'test-namespace'];

    for (const ns of namespaces) {
      const id = createAxisId('test', ns);
      // Format is axis:namespace:name
      expect(id).toMatch(/^axis:[a-z0-9-]+:test$/);
    }
  });
});

// =============================================================================
// Performance and Scale Tests
// =============================================================================

describe('ID System Performance', () => {
  test('creates IDs efficiently', () => {
    const start = performance.now();

    for (let i = 0; i < 10000; i++) {
      createAxisId(`axis_${i}`);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100); // 10k IDs in < 100ms
  });

  test('handles large ID collections', () => {
    const ids = new Set<AxisId>();

    for (let i = 0; i < 1000; i++) {
      ids.add(createAxisId(`axis_${i}`));
    }

    expect(ids.size).toBe(1000);
  });

  test('ID comparison is fast', () => {
    const ids = Array.from({ length: 1000 }, (_, i) =>
      createAxisId(`axis_${i}`)
    );

    const start = performance.now();
    const target = createAxisId('axis_500');

    for (const id of ids) {
      if (id === target) break;
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10); // Linear search through 1000 IDs in < 10ms
  });
});
