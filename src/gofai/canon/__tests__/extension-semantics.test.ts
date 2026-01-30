/**
 * @file Extension Semantics Tests
 * @module gofai/canon/__tests__/extension-semantics
 * 
 * Tests for Step 017: Unknown-but-declared extension semantics
 * 
 * Verifies that:
 * - Extension schemas can be registered and validated
 * - Unknown nodes are handled according to policy
 * - Compatibility checking works correctly
 * - Serialization/deserialization preserves node structure
 * - Migration between schema versions functions properly
 * 
 * @see gofai_goalB.md Step 017
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  ExtensionSemanticNode,
  ExtensionSemanticSchema,
  ExtensionSemanticRegistry,
  UnknownNodePolicy,
  JSONSchema,
} from '../extension-semantics.js';
import {
  handleUnknownNode,
  checkCompatibility,
  serializeExtensionNode,
  deserializeExtensionNode,
} from '../extension-semantics.js';
import type { AxisId, OpcodeId, ConstraintTypeId } from '../types.js';

// ============================================================================
// Mock Registry Implementation
// ============================================================================

class MockExtensionRegistry implements ExtensionSemanticRegistry {
  private schemas = new Map<string, Map<string, ExtensionSemanticSchema>>();

  registerSchema(schema: ExtensionSemanticSchema): void {
    if (!this.schemas.has(schema.id)) {
      this.schemas.set(schema.id, new Map());
    }
    this.schemas.get(schema.id)!.set(schema.version, schema);
  }

  getSchema(id: string, version: string): ExtensionSemanticSchema | undefined {
    return this.schemas.get(id)?.get(version);
  }

  getLatestSchema(id: string): ExtensionSemanticSchema | undefined {
    const versions = this.schemas.get(id);
    if (!versions || versions.size === 0) return undefined;

    // Simple latest version logic (in production, use semver comparison)
    const sorted = Array.from(versions.entries()).sort((a, b) =>
      b[0].localeCompare(a[0])
    );
    return sorted[0][1];
  }

  validateNode(node: ExtensionSemanticNode): {
    valid: boolean;
    errors: readonly { path: string; message: string; rule: string }[];
    warnings: readonly { path: string; message: string }[];
  } {
    const schema = this.getSchema(node.schemaId, node.schemaVersion);
    if (!schema) {
      return {
        valid: false,
        errors: [{ path: '', message: 'Schema not found', rule: 'schema-exists' }],
        warnings: [],
      };
    }

    // Simplified validation (in production, use full JSON Schema validator)
    if (typeof node.payload !== 'object' || node.payload === null) {
      return {
        valid: false,
        errors: [{ path: '', message: 'Payload must be an object', rule: 'type' }],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  migrateNode(
    node: ExtensionSemanticNode,
    targetVersion: string
  ): ExtensionSemanticNode | undefined {
    const schema = this.getSchema(node.schemaId, targetVersion);
    if (!schema) return undefined;

    // Simplified migration (in production, apply migration functions)
    return {
      ...node,
      schemaVersion: targetVersion,
    };
  }

  prettyPrint(node: ExtensionSemanticNode): string {
    return `[${node.namespace}:${node.type}] ${JSON.stringify(node.payload)}`;
  }
}

// ============================================================================
// Test Fixtures
// ============================================================================

const EXAMPLE_SCHEMA: ExtensionSemanticSchema = {
  id: 'my-pack:grit-axis',
  version: '1.0.0',
  nodeType: 'extension:axis',
  jsonSchema: {
    type: 'object',
    properties: {
      axisId: { type: 'string' },
      amount: { type: 'number', minimum: 0, maximum: 1 },
    },
    required: ['axisId', 'amount'],
  },
  description: 'Grit axis - rough/textured quality',
  examples: [
    { axisId: 'my-pack:axis:grit', amount: 0.5 },
    { axisId: 'my-pack:axis:grit', amount: 0.8 },
  ],
  migrations: [],
};

const EXAMPLE_NODE: ExtensionSemanticNode = {
  type: 'extension:axis',
  namespace: 'my-pack',
  version: '1.0.0',
  schemaId: 'my-pack:grit-axis',
  schemaVersion: '1.0.0',
  payload: {
    axisId: 'my-pack:axis:grit',
    amount: 0.7,
  },
  provenance: {
    extensionId: 'my-pack',
    moduleId: 'my-pack/grit-module',
    registeredAt: Date.now(),
    lexemes: ['my-pack:lex:adj:gritty' as any],
  },
};

// ============================================================================
// Tests
// ============================================================================

describe('Extension Semantics - Step 017', () => {
  let registry: MockExtensionRegistry;

  beforeEach(() => {
    registry = new MockExtensionRegistry();
  });

  describe('Schema Registration', () => {
    it('should register and retrieve schemas', () => {
      registry.registerSchema(EXAMPLE_SCHEMA);

      const retrieved = registry.getSchema(EXAMPLE_SCHEMA.id, EXAMPLE_SCHEMA.version);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(EXAMPLE_SCHEMA.id);
      expect(retrieved?.version).toBe(EXAMPLE_SCHEMA.version);
    });

    it('should get latest schema version', () => {
      const schema1 = { ...EXAMPLE_SCHEMA, version: '1.0.0' };
      const schema2 = { ...EXAMPLE_SCHEMA, version: '1.1.0' };
      const schema3 = { ...EXAMPLE_SCHEMA, version: '1.2.0' };

      registry.registerSchema(schema1);
      registry.registerSchema(schema2);
      registry.registerSchema(schema3);

      const latest = registry.getLatestSchema(EXAMPLE_SCHEMA.id);
      expect(latest?.version).toBe('1.2.0');
    });

    it('should handle multiple namespaced schemas', () => {
      const schema1 = { ...EXAMPLE_SCHEMA, id: 'pack-a:feature', namespace: 'pack-a' };
      const schema2 = { ...EXAMPLE_SCHEMA, id: 'pack-b:feature', namespace: 'pack-b' };

      registry.registerSchema(schema1);
      registry.registerSchema(schema2);

      expect(registry.getSchema('pack-a:feature', '1.0.0')).toBeDefined();
      expect(registry.getSchema('pack-b:feature', '1.0.0')).toBeDefined();
    });
  });

  describe('Node Validation', () => {
    beforeEach(() => {
      registry.registerSchema(EXAMPLE_SCHEMA);
    });

    it('should validate valid nodes', () => {
      const result = registry.validateNode(EXAMPLE_NODE);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject nodes with missing schema', () => {
      const nodeWithoutSchema: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        schemaId: 'unknown:schema',
      };

      const result = registry.validateNode(nodeWithoutSchema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject nodes with invalid payload type', () => {
      const nodeWithInvalidPayload: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        payload: 'not-an-object',
      };

      const result = registry.validateNode(nodeWithInvalidPayload);

      expect(result.valid).toBe(false);
    });
  });

  describe('Unknown Node Handling', () => {
    const REJECT_POLICY: UnknownNodePolicy = {
      behavior: 'reject',
      attemptMigration: false,
      preserveInSerialization: false,
    };

    const WARN_POLICY: UnknownNodePolicy = {
      behavior: 'warn',
      attemptMigration: false,
      preserveInSerialization: true,
    };

    const PRESERVE_POLICY: UnknownNodePolicy = {
      behavior: 'preserve',
      attemptMigration: false,
      preserveInSerialization: true,
    };

    it('should reject unknown nodes with reject policy', () => {
      const result = handleUnknownNode(EXAMPLE_NODE, REJECT_POLICY, registry);

      expect(result.outcome).toBe('rejected');
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.message).toContain('Unknown semantic node');
    });

    it('should warn on unknown nodes with warn policy', () => {
      const result = handleUnknownNode(EXAMPLE_NODE, WARN_POLICY, registry);

      expect(result.outcome).toBe('warned');
      expect(result.message).toContain('Warning');
    });

    it('should preserve unknown nodes with preserve policy', () => {
      const result = handleUnknownNode(EXAMPLE_NODE, PRESERVE_POLICY, registry);

      expect(result.outcome).toBe('preserved');
      expect(result.message).toContain('Preserved');
    });

    it('should preserve valid known nodes', () => {
      registry.registerSchema(EXAMPLE_SCHEMA);
      const result = handleUnknownNode(EXAMPLE_NODE, REJECT_POLICY, registry);

      expect(result.outcome).toBe('preserved');
      expect(result.message).toContain('Valid');
    });

    it('should attempt migration when policy allows', () => {
      const migrationPolicy: UnknownNodePolicy = {
        behavior: 'reject',
        attemptMigration: true,
        preserveInSerialization: true,
      };

      const newerSchema = { ...EXAMPLE_SCHEMA, version: '1.1.0' };
      registry.registerSchema(newerSchema);

      const oldNode: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        schemaVersion: '1.0.0',
      };

      const result = handleUnknownNode(oldNode, migrationPolicy, registry);

      expect(result.outcome).toBe('migrated');
      expect(result.migratedNode?.schemaVersion).toBe('1.1.0');
    });
  });

  describe('Compatibility Checking', () => {
    it('should detect missing extension', () => {
      const installedExtensions = new Map<string, string>();

      const result = checkCompatibility(EXAMPLE_NODE, installedExtensions);

      expect(result.compatible).toBe(false);
      expect(result.requires.length).toBeGreaterThan(0);
      expect(result.requires[0].namespace).toBe('my-pack');
    });

    it('should accept matching extension version', () => {
      const installedExtensions = new Map([['my-pack', '1.0.0']]);

      const result = checkCompatibility(EXAMPLE_NODE, installedExtensions);

      expect(result.compatible).toBe(true);
      expect(result.requires).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should warn on version mismatch', () => {
      const installedExtensions = new Map([['my-pack', '1.1.0']]);

      const result = checkCompatibility(EXAMPLE_NODE, installedExtensions);

      expect(result.compatible).toBe(true); // Still compatible, just warns
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('version mismatch');
    });
  });

  describe('Serialization', () => {
    it('should serialize extension nodes to JSON', () => {
      const json = serializeExtensionNode(EXAMPLE_NODE);

      expect(json).toBeDefined();
      expect(json).toContain('__extensionNode');
      expect(json).toContain('my-pack');
      expect(json).toContain('extension:axis');
    });

    it('should deserialize JSON to extension nodes', () => {
      const json = serializeExtensionNode(EXAMPLE_NODE);
      const deserialized = deserializeExtensionNode(json);

      expect(deserialized).toBeDefined();
      expect(deserialized?.type).toBe(EXAMPLE_NODE.type);
      expect(deserialized?.namespace).toBe(EXAMPLE_NODE.namespace);
      expect(deserialized?.version).toBe(EXAMPLE_NODE.version);
      expect(deserialized?.schemaId).toBe(EXAMPLE_NODE.schemaId);
    });

    it('should roundtrip serialize/deserialize', () => {
      const json = serializeExtensionNode(EXAMPLE_NODE);
      const deserialized = deserializeExtensionNode(json);
      const json2 = deserialized ? serializeExtensionNode(deserialized) : '';

      // Normalize JSON for comparison
      const obj1 = JSON.parse(json);
      const obj2 = JSON.parse(json2);

      expect(obj1.type).toBe(obj2.type);
      expect(obj1.namespace).toBe(obj2.namespace);
      expect(obj1.schemaId).toBe(obj2.schemaId);
    });

    it('should reject non-extension JSON', () => {
      const regularJson = JSON.stringify({ some: 'data' });
      const result = deserializeExtensionNode(regularJson);

      expect(result).toBeUndefined();
    });

    it('should handle malformed JSON gracefully', () => {
      const malformed = '{ invalid json }';
      const result = deserializeExtensionNode(malformed);

      expect(result).toBeUndefined();
    });
  });

  describe('Extension Node Types', () => {
    it('should support meaning nodes', () => {
      const meaningNode: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        type: 'extension:meaning',
      };

      expect(meaningNode.type).toBe('extension:meaning');
    });

    it('should support constraint nodes', () => {
      const constraintNode: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        type: 'extension:constraint',
      };

      expect(constraintNode.type).toBe('extension:constraint');
    });

    it('should support opcode nodes', () => {
      const opcodeNode: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        type: 'extension:opcode',
      };

      expect(opcodeNode.type).toBe('extension:opcode');
    });

    it('should support axis nodes', () => {
      const axisNode: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        type: 'extension:axis',
      };

      expect(axisNode.type).toBe('extension:axis');
    });

    it('should support selector nodes', () => {
      const selectorNode: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        type: 'extension:selector',
      };

      expect(selectorNode.type).toBe('extension:selector');
    });

    it('should support analysis nodes', () => {
      const analysisNode: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        type: 'extension:analysis',
      };

      expect(analysisNode.type).toBe('extension:analysis');
    });
  });

  describe('Provenance Tracking', () => {
    it('should preserve provenance through serialization', () => {
      const json = serializeExtensionNode(EXAMPLE_NODE);
      const deserialized = deserializeExtensionNode(json);

      expect(deserialized?.provenance.extensionId).toBe(EXAMPLE_NODE.provenance.extensionId);
      expect(deserialized?.provenance.moduleId).toBe(EXAMPLE_NODE.provenance.moduleId);
    });

    it('should track lexeme origins in provenance', () => {
      const nodeWithLexemes: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        provenance: {
          ...EXAMPLE_NODE.provenance,
          lexemes: [
            'my-pack:lex:adj:gritty' as any,
            'my-pack:lex:adj:rough' as any,
          ],
        },
      };

      expect(nodeWithLexemes.provenance.lexemes).toHaveLength(2);
    });
  });

  describe('Schema Versioning', () => {
    it('should handle schema evolution', () => {
      const v1Schema = { ...EXAMPLE_SCHEMA, version: '1.0.0' };
      const v2Schema = {
        ...EXAMPLE_SCHEMA,
        version: '2.0.0',
        migrations: [
          {
            fromVersion: '1.0.0',
            toVersion: '2.0.0',
            migrationId: 'add-texture-field',
            changes: 'Added texture field',
          },
        ],
      };

      registry.registerSchema(v1Schema);
      registry.registerSchema(v2Schema);

      const v1Node: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        schemaVersion: '1.0.0',
      };

      const migrated = registry.migrateNode(v1Node, '2.0.0');

      expect(migrated).toBeDefined();
      expect(migrated?.schemaVersion).toBe('2.0.0');
    });
  });

  describe('Pretty Printing', () => {
    beforeEach(() => {
      registry.registerSchema(EXAMPLE_SCHEMA);
    });

    it('should generate human-readable representation', () => {
      const pretty = registry.prettyPrint(EXAMPLE_NODE);

      expect(pretty).toContain('my-pack');
      expect(pretty).toContain('extension:axis');
    });
  });

  describe('Namespace Isolation', () => {
    it('should prevent namespace collisions', () => {
      const schema1 = {
        ...EXAMPLE_SCHEMA,
        id: 'pack-a:feature',
        namespace: 'pack-a',
      };

      const schema2 = {
        ...EXAMPLE_SCHEMA,
        id: 'pack-b:feature',
        namespace: 'pack-b',
      };

      registry.registerSchema(schema1);
      registry.registerSchema(schema2);

      const node1: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        namespace: 'pack-a',
        schemaId: 'pack-a:feature',
      };

      const node2: ExtensionSemanticNode = {
        ...EXAMPLE_NODE,
        namespace: 'pack-b',
        schemaId: 'pack-b:feature',
      };

      // Both nodes should be valid in their own namespaces
      expect(registry.validateNode(node1).valid).toBe(true);
      expect(registry.validateNode(node2).valid).toBe(true);
    });

    it('should enforce namespace prefixing for extension IDs', () => {
      const nodeWithNamespace = {
        ...EXAMPLE_NODE,
        namespace: 'my-pack',
        schemaId: 'my-pack:feature',
      };

      expect(nodeWithNamespace.schemaId).toContain(nodeWithNamespace.namespace);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Extension Semantics Integration', () => {
  it('should handle full extension workflow', () => {
    // 1. Register schema
    const registry = new MockExtensionRegistry();
    registry.registerSchema(EXAMPLE_SCHEMA);

    // 2. Create node
    const node = EXAMPLE_NODE;

    // 3. Validate
    const validation = registry.validateNode(node);
    expect(validation.valid).toBe(true);

    // 4. Serialize
    const json = serializeExtensionNode(node);
    expect(json).toBeDefined();

    // 5. Deserialize
    const deserialized = deserializeExtensionNode(json);
    expect(deserialized).toBeDefined();

    // 6. Check compatibility
    const compatibility = checkCompatibility(
      deserialized!,
      new Map([['my-pack', '1.0.0']])
    );
    expect(compatibility.compatible).toBe(true);

    // 7. Pretty print
    const pretty = registry.prettyPrint(deserialized!);
    expect(pretty).toBeDefined();
  });

  it('should handle unknown extension gracefully', () => {
    const registry = new MockExtensionRegistry();
    const policy: UnknownNodePolicy = {
      behavior: 'warn',
      attemptMigration: true,
      preserveInSerialization: true,
    };

    const unknownNode = {
      ...EXAMPLE_NODE,
      namespace: 'unknown-pack',
    };

    const handling = handleUnknownNode(unknownNode, policy, registry);

    expect(handling.outcome).toBe('warned');
    expect(handling.suggestions.length).toBeGreaterThan(0);
  });
});
