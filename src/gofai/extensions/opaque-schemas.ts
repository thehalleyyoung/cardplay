/**
 * Opaque Extension Semantics (Step 017)
 * 
 * This module implements Step 017 from gofai_goalB.md:
 * "Decide how 'unknown-but-declared' extension semantics are represented
 * (opaque namespaced nodes with schemas)."
 * 
 * The core principle: GOFAI core should be able to parse, serialize, validate,
 * and reason about extension semantics without understanding their meaning.
 * Extensions declare schemas that allow core to treat unknown nodes as
 * first-class typed values.
 * 
 * This enables:
 * 1. Extensions to add new CPL node types without forking core
 * 2. Core to validate structure even for unknown semantics
 * 3. Round-trip serialization of unknown nodes
 * 4. Type-safe handling of mixed core/extension content
 * 5. Clear error messages when schemas are violated
 * 
 * @module gofai/extensions/opaque-schemas
 */

import type { ExtensionNamespace } from './registry';
import type { GofaiId } from '../canon/gofai-id';

// =============================================================================
// Schema Definition Types
// =============================================================================

/**
 * JSON Schema subset used for opaque node validation.
 * We use a subset to ensure deterministic validation.
 */
export type OpaqueNodeSchema =
  | OpaqueObjectSchema
  | OpaqueArraySchema
  | OpaqueStringSchema
  | OpaqueNumberSchema
  | OpaqueBooleanSchema
  | OpaqueNullSchema
  | OpaqueEnumSchema
  | OpaqueUnionSchema
  | OpaqueReferenceSchema;

/**
 * Object schema.
 */
export interface OpaqueObjectSchema {
  readonly type: 'object';
  readonly properties: Readonly<Record<string, OpaqueNodeSchema>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
  readonly description?: string;
}

/**
 * Array schema.
 */
export interface OpaqueArraySchema {
  readonly type: 'array';
  readonly items: OpaqueNodeSchema;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly description?: string;
}

/**
 * String schema with optional patterns and length constraints.
 */
export interface OpaqueStringSchema {
  readonly type: 'string';
  readonly pattern?: string; // Regex pattern
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly format?: 'id' | 'namespace' | 'semver' | 'iso-date';
  readonly description?: string;
}

/**
 * Number schema with range constraints.
 */
export interface OpaqueNumberSchema {
  readonly type: 'number';
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: boolean;
  readonly exclusiveMaximum?: boolean;
  readonly multipleOf?: number;
  readonly description?: string;
}

/**
 * Boolean schema.
 */
export interface OpaqueBooleanSchema {
  readonly type: 'boolean';
  readonly description?: string;
}

/**
 * Null schema.
 */
export interface OpaqueNullSchema {
  readonly type: 'null';
  readonly description?: string;
}

/**
 * Enum schema (fixed set of values).
 */
export interface OpaqueEnumSchema {
  readonly type: 'enum';
  readonly values: readonly (string | number | boolean | null)[];
  readonly description?: string;
}

/**
 * Union schema (one of several schemas).
 */
export interface OpaqueUnionSchema {
  readonly type: 'union';
  readonly oneOf: readonly OpaqueNodeSchema[];
  readonly discriminator?: string; // Field to use for discriminating
  readonly description?: string;
}

/**
 * Reference to another schema (for recursive structures).
 */
export interface OpaqueReferenceSchema {
  readonly type: 'reference';
  readonly $ref: string; // Schema reference path
  readonly description?: string;
}

// =============================================================================
// Opaque Node Types
// =============================================================================

/**
 * A namespaced opaque node that core doesn't understand.
 * 
 * Core can:
 * - Store it
 * - Validate it against its declared schema
 * - Serialize/deserialize it
 * - Pass it to extension handlers
 * 
 * Core cannot:
 * - Inspect its semantic meaning
 * - Execute it directly
 * - Optimize or transform it
 */
export interface OpaqueNode {
  /** Node type (namespaced, e.g., "jazz-theory:neo-riemannian-transform") */
  readonly type: string;
  
  /** The extension namespace that owns this node type */
  readonly namespace: ExtensionNamespace;
  
  /** The actual node data (validated against schema) */
  readonly data: OpaqueNodeData;
  
  /** Schema ID this node conforms to */
  readonly schemaId: GofaiId;
  
  /** Version of the schema (for migration) */
  readonly schemaVersion: string;
  
  /** Provenance: which extension version created this node */
  readonly createdBy?: {
    readonly extensionId: GofaiId;
    readonly version: string;
  };
  
  /** Human-readable description (for UI display) */
  readonly description?: string;
  
  /** Whether this node is executable (vs. declarative only) */
  readonly executable: boolean;
}

/**
 * The data payload of an opaque node.
 * Must be JSON-serializable and conform to the declared schema.
 */
export type OpaqueNodeData =
  | null
  | boolean
  | number
  | string
  | readonly OpaqueNodeData[]
  | { readonly [key: string]: OpaqueNodeData };

/**
 * A registered schema for an opaque node type.
 */
export interface RegisteredOpaqueSchema {
  /** Unique ID for this schema */
  readonly id: GofaiId;
  
  /** Node type this schema validates (namespaced) */
  readonly nodeType: string;
  
  /** The extension that registered this schema */
  readonly namespace: ExtensionNamespace;
  
  /** Schema version (semantic versioning) */
  readonly version: string;
  
  /** The schema definition */
  readonly schema: OpaqueNodeSchema;
  
  /** Human-readable documentation */
  readonly documentation: string;
  
  /** Example valid nodes (for testing and docs) */
  readonly examples: readonly OpaqueNodeData[];
  
  /** Migration functions from older versions */
  readonly migrations?: ReadonlyMap<string, SchemaMigration>;
}

/**
 * A migration function from one schema version to another.
 */
export type SchemaMigration = (oldData: OpaqueNodeData) => OpaqueNodeData;

// =============================================================================
// Schema Registry
// =============================================================================

/**
 * Registry of opaque node schemas.
 * 
 * Extensions register schemas here so core can validate nodes
 * without understanding their semantics.
 */
export class OpaqueSchemaRegistry {
  private readonly schemas = new Map<string, RegisteredOpaqueSchema>();
  private readonly schemasByType = new Map<string, RegisteredOpaqueSchema[]>();
  
  /**
   * Register a schema for an opaque node type.
   * 
   * @throws Error if schema ID already registered
   * @throws Error if node type conflicts with different namespace
   */
  register(schema: RegisteredOpaqueSchema): void {
    // Validate the schema itself
    this.validateSchema(schema.schema);
    
    // Check for ID collision
    if (this.schemas.has(schema.id as string)) {
      throw new Error(`Schema already registered: ${schema.id}`);
    }
    
    // Check for type conflicts
    const existing = this.schemasByType.get(schema.nodeType) ?? [];
    for (const other of existing) {
      if (other.namespace !== schema.namespace) {
        throw new Error(
          `Node type "${schema.nodeType}" already registered by different namespace: ${other.namespace}`
        );
      }
    }
    
    // Register
    this.schemas.set(schema.id as string, schema);
    this.schemasByType.set(schema.nodeType, [...existing, schema]);
  }
  
  /**
   * Get a schema by ID.
   */
  getSchema(schemaId: GofaiId): RegisteredOpaqueSchema | undefined {
    return this.schemas.get(schemaId as string);
  }
  
  /**
   * Get all versions of a schema for a node type.
   */
  getSchemasForType(nodeType: string): readonly RegisteredOpaqueSchema[] {
    return this.schemasByType.get(nodeType) ?? [];
  }
  
  /**
   * Get the latest schema for a node type.
   */
  getLatestSchema(nodeType: string): RegisteredOpaqueSchema | undefined {
    const schemas = this.getSchemasForType(nodeType);
    if (schemas.length === 0) return undefined;
    
    // Sort by version (descending)
    const sorted = [...schemas].sort((a, b) => 
      this.compareVersions(b.version, a.version)
    );
    
    return sorted[0];
  }
  
  /**
   * Validate a node against its schema.
   * 
   * @returns Validation result with errors if invalid
   */
  validate(node: OpaqueNode): ValidationResult {
    const schema = this.getSchema(node.schemaId);
    
    if (!schema) {
      return {
        valid: false,
        errors: [`Unknown schema: ${node.schemaId}`],
      };
    }
    
    // Validate data against schema
    return this.validateData(node.data, schema.schema, []);
  }
  
  /**
   * Migrate a node to a newer schema version.
   * 
   * @throws Error if no migration path exists
   */
  migrate(node: OpaqueNode, targetVersion: string): OpaqueNode {
    const currentSchema = this.getSchema(node.schemaId);
    if (!currentSchema) {
      throw new Error(`Unknown schema: ${node.schemaId}`);
    }
    
    const targetSchemas = this.getSchemasForType(node.type);
    const targetSchema = targetSchemas.find(s => s.version === targetVersion);
    
    if (!targetSchema) {
      throw new Error(
        `Target schema version not found: ${node.type}@${targetVersion}`
      );
    }
    
    if (currentSchema.version === targetVersion) {
      return node; // Already at target version
    }
    
    // Build migration chain
    const chain = this.findMigrationChain(
      currentSchema.version,
      targetVersion,
      targetSchemas
    );
    
    if (!chain) {
      throw new Error(
        `No migration path from ${currentSchema.version} to ${targetVersion}`
      );
    }
    
    // Apply migrations in sequence
    let data = node.data;
    for (const migration of chain) {
      data = migration(data);
    }
    
    // Return migrated node
    return {
      ...node,
      data,
      schemaId: targetSchema.id,
      schemaVersion: targetVersion,
    };
  }
  
  // Private validation helpers
  
  private validateData(
    data: OpaqueNodeData,
    schema: OpaqueNodeSchema,
    path: string[]
  ): ValidationResult {
    const errors: string[] = [];
    
    switch (schema.type) {
      case 'null':
        if (data !== null) {
          errors.push(`${this.formatPath(path)}: expected null, got ${typeof data}`);
        }
        break;
      
      case 'boolean':
        if (typeof data !== 'boolean') {
          errors.push(`${this.formatPath(path)}: expected boolean, got ${typeof data}`);
        }
        break;
      
      case 'number':
        if (typeof data !== 'number') {
          errors.push(`${this.formatPath(path)}: expected number, got ${typeof data}`);
        } else {
          if (schema.minimum !== undefined) {
            const min = schema.exclusiveMinimum 
              ? data > schema.minimum 
              : data >= schema.minimum;
            if (!min) {
              errors.push(
                `${this.formatPath(path)}: value ${data} below minimum ${schema.minimum}`
              );
            }
          }
          if (schema.maximum !== undefined) {
            const max = schema.exclusiveMaximum 
              ? data < schema.maximum 
              : data <= schema.maximum;
            if (!max) {
              errors.push(
                `${this.formatPath(path)}: value ${data} above maximum ${schema.maximum}`
              );
            }
          }
          if (schema.multipleOf !== undefined && data % schema.multipleOf !== 0) {
            errors.push(
              `${this.formatPath(path)}: value ${data} not multiple of ${schema.multipleOf}`
            );
          }
        }
        break;
      
      case 'string':
        if (typeof data !== 'string') {
          errors.push(`${this.formatPath(path)}: expected string, got ${typeof data}`);
        } else {
          if (schema.minLength !== undefined && data.length < schema.minLength) {
            errors.push(
              `${this.formatPath(path)}: string too short (min ${schema.minLength})`
            );
          }
          if (schema.maxLength !== undefined && data.length > schema.maxLength) {
            errors.push(
              `${this.formatPath(path)}: string too long (max ${schema.maxLength})`
            );
          }
          if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(data)) {
              errors.push(
                `${this.formatPath(path)}: string does not match pattern ${schema.pattern}`
              );
            }
          }
        }
        break;
      
      case 'array':
        if (!Array.isArray(data)) {
          errors.push(`${this.formatPath(path)}: expected array, got ${typeof data}`);
        } else {
          if (schema.minItems !== undefined && data.length < schema.minItems) {
            errors.push(
              `${this.formatPath(path)}: too few items (min ${schema.minItems})`
            );
          }
          if (schema.maxItems !== undefined && data.length > schema.maxItems) {
            errors.push(
              `${this.formatPath(path)}: too many items (max ${schema.maxItems})`
            );
          }
          
          // Validate each item
          for (let i = 0; i < data.length; i++) {
            const result = this.validateData(
              data[i],
              schema.items,
              [...path, `[${i}]`]
            );
            errors.push(...result.errors);
          }
        }
        break;
      
      case 'object':
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          errors.push(`${this.formatPath(path)}: expected object, got ${typeof data}`);
        } else {
          const obj = data as { readonly [key: string]: OpaqueNodeData };
          
          // Check required properties
          for (const key of schema.required ?? []) {
            if (!(key in obj)) {
              errors.push(`${this.formatPath(path)}: missing required property "${key}"`);
            }
          }
          
          // Validate properties
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            if (key in obj) {
              const result = this.validateData(
                obj[key],
                propSchema,
                [...path, key]
              );
              errors.push(...result.errors);
            }
          }
          
          // Check additional properties
          if (schema.additionalProperties === false) {
            const allowedKeys = new Set(Object.keys(schema.properties));
            for (const key of Object.keys(obj)) {
              if (!allowedKeys.has(key)) {
                errors.push(
                  `${this.formatPath(path)}: unexpected property "${key}"`
                );
              }
            }
          }
        }
        break;
      
      case 'enum':
        if (!schema.values.includes(data as any)) {
          errors.push(
            `${this.formatPath(path)}: value not in enum: ${JSON.stringify(data)}`
          );
        }
        break;
      
      case 'union':
        // Try each schema until one succeeds
        let anyValid = false;
        for (const subSchema of schema.oneOf) {
          const result = this.validateData(data, subSchema, path);
          if (result.valid) {
            anyValid = true;
            break;
          }
        }
        if (!anyValid) {
          errors.push(
            `${this.formatPath(path)}: value does not match any union member`
          );
        }
        break;
      
      case 'reference':
        // Reference validation not yet implemented (would need schema resolution)
        errors.push(`${this.formatPath(path)}: schema references not yet supported`);
        break;
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  private validateSchema(schema: OpaqueNodeSchema): void {
    // Basic schema validation
    // In a full implementation, this would recursively validate the schema structure
    if (!schema.type) {
      throw new Error('Schema must have a type');
    }
  }
  
  private formatPath(path: string[]): string {
    return path.length > 0 ? path.join('.') : 'root';
  }
  
  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] ?? 0;
      const bVal = bParts[i] ?? 0;
      
      if (aVal !== bVal) {
        return aVal - bVal;
      }
    }
    
    return 0;
  }
  
  private findMigrationChain(
    fromVersion: string,
    toVersion: string,
    schemas: readonly RegisteredOpaqueSchema[]
  ): SchemaMigration[] | null {
    // Build a graph of migrations and find path
    // For now, simple linear migration (versions must be sequential)
    
    const sorted = [...schemas].sort((a, b) => 
      this.compareVersions(a.version, b.version)
    );
    
    const fromIdx = sorted.findIndex(s => s.version === fromVersion);
    const toIdx = sorted.findIndex(s => s.version === toVersion);
    
    if (fromIdx === -1 || toIdx === -1) {
      return null;
    }
    
    if (fromIdx >= toIdx) {
      return null; // Cannot migrate backwards (for now)
    }
    
    const migrations: SchemaMigration[] = [];
    
    for (let i = fromIdx; i < toIdx; i++) {
      const fromSchema = sorted[i];
      const toVersion = sorted[i + 1].version;
      
      const migration = fromSchema.migrations?.get(toVersion);
      if (!migration) {
        return null; // Missing migration in chain
      }
      
      migrations.push(migration);
    }
    
    return migrations;
  }
}

/**
 * Validation result.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create an opaque node.
 */
export function createOpaqueNode(
  type: string,
  namespace: ExtensionNamespace,
  data: OpaqueNodeData,
  schema: RegisteredOpaqueSchema,
  options?: {
    readonly description?: string;
    readonly createdBy?: OpaqueNode['createdBy'];
    readonly executable?: boolean;
  }
): OpaqueNode {
  return {
    type,
    namespace,
    data,
    schemaId: schema.id,
    schemaVersion: schema.version,
    description: options?.description,
    createdBy: options?.createdBy,
    executable: options?.executable ?? false,
  };
}

/**
 * Check if a value is an opaque node.
 */
export function isOpaqueNode(value: unknown): value is OpaqueNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'namespace' in value &&
    'data' in value &&
    'schemaId' in value &&
    'schemaVersion' in value
  );
}

/**
 * Extract the namespace from a namespaced type string.
 */
export function extractNamespace(type: string): ExtensionNamespace | null {
  const colonIdx = type.indexOf(':');
  if (colonIdx === -1) {
    return null; // Not namespaced
  }
  
  return type.slice(0, colonIdx) as ExtensionNamespace;
}

/**
 * Check if a type is namespaced (extension-provided).
 */
export function isNamespacedType(type: string): boolean {
  return type.includes(':');
}

/**
 * Create a minimal object schema.
 */
export function objectSchema(
  properties: Readonly<Record<string, OpaqueNodeSchema>>,
  required?: readonly string[],
  description?: string
): OpaqueObjectSchema {
  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
    description,
  };
}

/**
 * Create a minimal array schema.
 */
export function arraySchema(
  items: OpaqueNodeSchema,
  description?: string
): OpaqueArraySchema {
  return {
    type: 'array',
    items,
    description,
  };
}

/**
 * Create a string schema.
 */
export function stringSchema(
  options?: {
    readonly pattern?: string;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly format?: OpaqueStringSchema['format'];
    readonly description?: string;
  }
): OpaqueStringSchema {
  return {
    type: 'string',
    ...options,
  };
}

/**
 * Create a number schema.
 */
export function numberSchema(
  options?: {
    readonly minimum?: number;
    readonly maximum?: number;
    readonly exclusiveMinimum?: boolean;
    readonly exclusiveMaximum?: boolean;
    readonly multipleOf?: number;
    readonly description?: string;
  }
): OpaqueNumberSchema {
  return {
    type: 'number',
    ...options,
  };
}

/**
 * Create an enum schema.
 */
export function enumSchema(
  values: readonly (string | number | boolean | null)[],
  description?: string
): OpaqueEnumSchema {
  return {
    type: 'enum',
    values,
    description,
  };
}

/**
 * Create a union schema.
 */
export function unionSchema(
  oneOf: readonly OpaqueNodeSchema[],
  options?: {
    readonly discriminator?: string;
    readonly description?: string;
  }
): OpaqueUnionSchema {
  return {
    type: 'union',
    oneOf,
    ...options,
  };
}

// =============================================================================
// Global Registry Instance
// =============================================================================

/**
 * Global opaque schema registry.
 */
export const opaqueSchemaRegistry = new OpaqueSchemaRegistry();
