/**
 * @file Extension Semantics - Unknown-but-Declared Types
 * @module gofai/canon/extension-semantics
 * 
 * Implements Step 017: Define how "unknown-but-declared" extension semantics
 * are represented (opaque namespaced nodes with schemas).
 * 
 * This module allows GOFAI to work with extension-provided meanings even when
 * the core system doesn't understand their internal semantics. The key insight:
 * if an extension declares a schema for its semantic nodes, the core system
 * can validate, serialize, and pretty-print them without knowing what they mean.
 * 
 * Design principles:
 * - Extensions declare schemas for their semantic contributions
 * - Core system validates against schemas but doesn't interpret semantics
 * - Namespace-based trust model prevents collisions
 * - Schema versioning enables migration
 * 
 * @see gofai_goalB.md Step 017
 * @see docs/gofai/vocabulary-policy.md
 */

import type { GofaiId, LexemeId, AxisId, OpcodeId, ConstraintTypeId } from './types.js';

// ============================================================================
// Extension Semantic Node Types
// ============================================================================

/**
 * A semantic node contributed by an extension
 * 
 * Extension nodes are opaque to the core system but carry enough metadata
 * for validation, serialization, and provenance tracking.
 */
export interface ExtensionSemanticNode {
  /** Node type (namespaced) */
  readonly type: ExtensionNodeType;
  
  /** Namespace that provided this node */
  readonly namespace: string;
  
  /** Version of the extension that created this node */
  readonly version: string;
  
  /** Schema ID for validation */
  readonly schemaId: string;
  
  /** Schema version */
  readonly schemaVersion: string;
  
  /** Opaque payload (validated against schema) */
  readonly payload: unknown;
  
  /** Provenance metadata */
  readonly provenance: ExtensionProvenance;
}

/**
 * Types of extension semantic nodes
 */
export type ExtensionNodeType =
  | 'extension:meaning'      // New semantic meaning
  | 'extension:constraint'   // New constraint type
  | 'extension:opcode'       // New edit operation
  | 'extension:axis'         // New perceptual axis
  | 'extension:selector'     // New selection logic
  | 'extension:analysis';    // New analysis fact

/**
 * Provenance for extension contributions
 */
export interface ExtensionProvenance {
  /** Extension ID */
  readonly extensionId: string;
  
  /** Which module provided this */
  readonly moduleId: string;
  
  /** When it was registered */
  readonly registeredAt: number;
  
  /** Which lexeme(s) triggered this */
  readonly lexemes?: readonly LexemeId[];
}

// ============================================================================
// Extension Schema System
// ============================================================================

/**
 * Schema for an extension semantic node
 * 
 * Extensions must declare schemas for their contributions. Schemas enable:
 * - Type-safe validation of payloads
 * - Deterministic serialization
 * - Pretty-printing for users
 * - Migration between versions
 */
export interface ExtensionSemanticSchema {
  /** Schema ID (namespaced) */
  readonly id: string;
  
  /** Schema version (semantic versioning) */
  readonly version: string;
  
  /** Node type this schema validates */
  readonly nodeType: ExtensionNodeType;
  
  /** JSON Schema definition for payload */
  readonly jsonSchema: JSONSchema;
  
  /** Human-readable description */
  readonly description: string;
  
  /** Example valid payloads */
  readonly examples: readonly unknown[];
  
  /** Migration from previous versions */
  readonly migrations?: readonly SchemaMigration[];
}

/**
 * JSON Schema (simplified subset for validation)
 */
export interface JSONSchema {
  readonly type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  readonly properties?: Record<string, JSONSchema>;
  readonly items?: JSONSchema;
  readonly required?: readonly string[];
  readonly enum?: readonly unknown[];
  readonly pattern?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly additionalProperties?: boolean | JSONSchema;
}

/**
 * Schema migration from one version to another
 */
export interface SchemaMigration {
  /** Version this migration applies to */
  readonly fromVersion: string;
  
  /** Version this migration produces */
  readonly toVersion: string;
  
  /** Migration function ID (registered separately) */
  readonly migrationId: string;
  
  /** Description of changes */
  readonly changes: string;
}

// ============================================================================
// Extension Semantic Registry
// ============================================================================

/**
 * Registry of extension schemas
 * 
 * Extensions register schemas when they load. The core system uses these
 * schemas to validate and handle extension nodes without understanding them.
 */
export interface ExtensionSemanticRegistry {
  /** Register a new schema */
  registerSchema(schema: ExtensionSemanticSchema): void;
  
  /** Get schema by ID and version */
  getSchema(id: string, version: string): ExtensionSemanticSchema | undefined;
  
  /** Get latest version of a schema */
  getLatestSchema(id: string): ExtensionSemanticSchema | undefined;
  
  /** Validate a node against its schema */
  validateNode(node: ExtensionSemanticNode): ValidationResult;
  
  /** Migrate a node to a new schema version */
  migrateNode(node: ExtensionSemanticNode, targetVersion: string): ExtensionSemanticNode | undefined;
  
  /** Pretty-print a node for user display */
  prettyPrint(node: ExtensionSemanticNode): string;
}

/**
 * Result of schema validation
 */
export interface ValidationResult {
  /** Is the node valid? */
  readonly valid: boolean;
  
  /** Validation errors (if any) */
  readonly errors: readonly ValidationError[];
  
  /** Warnings (non-fatal issues) */
  readonly warnings: readonly ValidationWarning[];
}

export interface ValidationError {
  /** Error path in payload */
  readonly path: string;
  
  /** Error message */
  readonly message: string;
  
  /** Schema rule that was violated */
  readonly rule: string;
}

export interface ValidationWarning {
  /** Warning path */
  readonly path: string;
  
  /** Warning message */
  readonly message: string;
}

// ============================================================================
// Extension Lexeme Bindings
// ============================================================================

/**
 * Binding from a lexeme to extension semantics
 * 
 * Extensions can register new lexemes or extend existing ones with new meanings.
 */
export interface ExtensionLexemeBinding {
  /** Lexeme ID (namespaced) */
  readonly lexemeId: LexemeId;
  
  /** Which extension provides this binding */
  readonly namespace: string;
  
  /** What this lexeme maps to */
  readonly target: ExtensionBindingTarget;
  
  /** Schema for the semantic contribution */
  readonly schemaId: string;
  
  /** Optional: priority for disambiguation */
  readonly priority?: number;
}

/**
 * What an extension lexeme can bind to
 */
export type ExtensionBindingTarget =
  | { readonly type: 'axis'; readonly axisId: AxisId; readonly direction: 'increase' | 'decrease' }
  | { readonly type: 'opcode'; readonly opcodeId: OpcodeId }
  | { readonly type: 'constraint'; readonly constraintTypeId: ConstraintTypeId }
  | { readonly type: 'meaning'; readonly meaningId: GofaiId };

// ============================================================================
// Extension Axis Contributions
// ============================================================================

/**
 * A new perceptual axis contributed by an extension
 */
export interface ExtensionAxis {
  /** Axis ID (namespaced) */
  readonly id: AxisId;
  
  /** Namespace */
  readonly namespace: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Description */
  readonly description: string;
  
  /** Pole descriptions (negative and positive) */
  readonly poles: readonly [string, string];
  
  /** Schema for axis-specific metadata */
  readonly schemaId: string;
  
  /** Lever mapping: how to actuate this axis */
  readonly levers: readonly ExtensionAxisLever[];
}

/**
 * A lever for actuating an extension axis
 */
export interface ExtensionAxisLever {
  /** Lever ID */
  readonly id: string;
  
  /** What this lever does */
  readonly description: string;
  
  /** Opcode(s) this lever triggers */
  readonly opcodes: readonly OpcodeId[];
  
  /** Parameter mappings */
  readonly paramMappings: readonly ParameterMapping[];
}

export interface ParameterMapping {
  /** Parameter path (e.g., "card:reverb:wet") */
  readonly paramPath: string;
  
  /** How axis value maps to parameter value */
  readonly mapping: MappingFunction;
}

/**
 * Mapping from axis value to parameter value
 */
export type MappingFunction =
  | { readonly type: 'linear'; readonly min: number; readonly max: number }
  | { readonly type: 'exponential'; readonly base: number; readonly min: number; readonly max: number }
  | { readonly type: 'custom'; readonly functionId: string };

// ============================================================================
// Extension Constraint Types
// ============================================================================

/**
 * A new constraint type contributed by an extension
 */
export interface ExtensionConstraintType {
  /** Constraint type ID (namespaced) */
  readonly id: ConstraintTypeId;
  
  /** Namespace */
  readonly namespace: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Description */
  readonly description: string;
  
  /** Schema for constraint parameters */
  readonly schemaId: string;
  
  /** Checker function ID (registered separately) */
  readonly checkerId: string;
  
  /** Examples */
  readonly examples: readonly ConstraintExample[];
}

export interface ConstraintExample {
  /** Natural language */
  readonly utterance: string;
  
  /** Constraint parameters */
  readonly params: unknown;
  
  /** Explanation */
  readonly explanation: string;
}

// ============================================================================
// Extension Opcode Definitions
// ============================================================================

/**
 * A new edit opcode contributed by an extension
 */
export interface ExtensionOpcode {
  /** Opcode ID (namespaced) */
  readonly id: OpcodeId;
  
  /** Namespace */
  readonly namespace: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Description */
  readonly description: string;
  
  /** Schema for opcode parameters */
  readonly schemaId: string;
  
  /** Handler function ID (registered separately) */
  readonly handlerId: string;
  
  /** Effect type (inspect, propose, mutate) */
  readonly effectType: 'inspect' | 'propose' | 'mutate';
  
  /** Preconditions (what must be true to execute) */
  readonly preconditions: readonly OpcodePrecondition[];
  
  /** Postconditions (what will be true after execution) */
  readonly postconditions: readonly OpcodePostcondition[];
  
  /** Examples */
  readonly examples: readonly OpcodeExample[];
}

export interface OpcodePrecondition {
  /** Precondition description */
  readonly description: string;
  
  /** Checker function ID */
  readonly checkerId: string;
}

export interface OpcodePostcondition {
  /** Postcondition description */
  readonly description: string;
  
  /** Verifier function ID */
  readonly verifierId: string;
}

export interface OpcodeExample {
  /** Context description */
  readonly context: string;
  
  /** Opcode parameters */
  readonly params: unknown;
  
  /** What changes */
  readonly expectedChanges: string;
}

// ============================================================================
// Unknown Node Handling
// ============================================================================

/**
 * Policy for handling unknown extension nodes
 */
export interface UnknownNodePolicy {
  /** What to do when encountering an unknown node */
  readonly behavior: 'reject' | 'warn' | 'preserve';
  
  /** Should we try to find a compatible schema? */
  readonly attemptMigration: boolean;
  
  /** Should we preserve unknown nodes in serialization? */
  readonly preserveInSerialization: boolean;
}

/**
 * Result of encountering an unknown node
 */
export interface UnknownNodeHandling {
  /** The unknown node */
  readonly node: ExtensionSemanticNode;
  
  /** What happened */
  readonly outcome: 'rejected' | 'warned' | 'preserved' | 'migrated';
  
  /** Message for user/logs */
  readonly message: string;
  
  /** Migrated node (if migration succeeded) */
  readonly migratedNode?: ExtensionSemanticNode;
  
  /** Suggestions (e.g., which extension to install) */
  readonly suggestions: readonly string[];
}

/**
 * Handle an unknown semantic node
 */
export function handleUnknownNode(
  node: ExtensionSemanticNode,
  policy: UnknownNodePolicy,
  registry: ExtensionSemanticRegistry
): UnknownNodeHandling {
  // Try to find schema
  const schema = registry.getSchema(node.schemaId, node.schemaVersion);
  
  if (schema) {
    // Schema exists, validate
    const validation = registry.validateNode(node);
    if (validation.valid) {
      return {
        node,
        outcome: 'preserved',
        message: `Valid extension node from ${node.namespace}`,
        suggestions: []
      };
    }
  }
  
  // Schema not found
  if (policy.attemptMigration) {
    const latestSchema = registry.getLatestSchema(node.schemaId);
    if (latestSchema) {
      const migrated = registry.migrateNode(node, latestSchema.version);
      if (migrated) {
        return {
          node,
          outcome: 'migrated',
          message: `Migrated node from ${node.schemaVersion} to ${latestSchema.version}`,
          migratedNode: migrated,
          suggestions: []
        };
      }
    }
  }
  
  // Cannot handle
  switch (policy.behavior) {
    case 'reject':
      return {
        node,
        outcome: 'rejected',
        message: `Unknown semantic node: ${node.type} from ${node.namespace}@${node.version}`,
        suggestions: [
          `Install ${node.namespace} extension`,
          `Update ${node.namespace} to version ${node.version}`,
          'Remove this node from the plan'
        ]
      };
    
    case 'warn':
      return {
        node,
        outcome: 'warned',
        message: `Warning: Skipping unknown node from ${node.namespace}`,
        suggestions: [`Consider installing ${node.namespace} for full functionality`]
      };
    
    case 'preserve':
      return {
        node,
        outcome: 'preserved',
        message: `Preserved unknown node from ${node.namespace} (opaque)`,
        suggestions: []
      };
  }
}

// ============================================================================
// Extension Compatibility Checking
// ============================================================================

/**
 * Check if an extension node is compatible with the current system
 */
export interface CompatibilityCheck {
  /** Is it compatible? */
  readonly compatible: boolean;
  
  /** Extension version requirements */
  readonly requires: ExtensionRequirement[];
  
  /** Conflicts with other extensions */
  readonly conflicts: ExtensionConflict[];
  
  /** Warnings */
  readonly warnings: readonly string[];
}

export interface ExtensionRequirement {
  /** Extension namespace */
  readonly namespace: string;
  
  /** Required version (semver range) */
  readonly version: string;
  
  /** Why it's required */
  readonly reason: string;
}

export interface ExtensionConflict {
  /** Conflicting extension namespace */
  readonly namespace: string;
  
  /** Type of conflict */
  readonly type: 'namespace-collision' | 'incompatible-version' | 'semantic-conflict';
  
  /** Description */
  readonly description: string;
  
  /** Suggested resolution */
  readonly resolution: string;
}

/**
 * Check compatibility of an extension node
 */
export function checkCompatibility(
  node: ExtensionSemanticNode,
  installedExtensions: Map<string, string>
): CompatibilityCheck {
  const requires: ExtensionRequirement[] = [];
  const conflicts: ExtensionConflict[] = [];
  const warnings: string[] = [];
  
  // Check if required extension is installed
  const installedVersion = installedExtensions.get(node.namespace);
  if (!installedVersion) {
    requires.push({
      namespace: node.namespace,
      version: node.version,
      reason: `Node type ${node.type} requires ${node.namespace}`
    });
  } else if (installedVersion !== node.version) {
    warnings.push(
      `Extension ${node.namespace} version mismatch: have ${installedVersion}, node requires ${node.version}`
    );
  }
  
  return {
    compatible: requires.length === 0 && conflicts.length === 0,
    requires,
    conflicts,
    warnings
  };
}

// ============================================================================
// Serialization Support
// ============================================================================

/**
 * Serialize an extension node to JSON
 */
export function serializeExtensionNode(node: ExtensionSemanticNode): string {
  return JSON.stringify({
    __extensionNode: true,
    type: node.type,
    namespace: node.namespace,
    version: node.version,
    schemaId: node.schemaId,
    schemaVersion: node.schemaVersion,
    payload: node.payload,
    provenance: node.provenance
  }, null, 2);
}

/**
 * Deserialize an extension node from JSON
 */
export function deserializeExtensionNode(json: string): ExtensionSemanticNode | undefined {
  try {
    const obj = JSON.parse(json);
    if (!obj.__extensionNode) return undefined;
    
    return {
      type: obj.type,
      namespace: obj.namespace,
      version: obj.version,
      schemaId: obj.schemaId,
      schemaVersion: obj.schemaVersion,
      payload: obj.payload,
      provenance: obj.provenance
    };
  } catch {
    return undefined;
  }
}
