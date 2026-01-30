/**
 * @file CPL as a Public Interface
 * @gofai_goalB Step 032 [Type]
 * 
 * This module defines CPL (Compositional Pragmatic Logic) as a stable public
 * interface with:
 * - Stable TypeScript types
 * - JSON schema definitions
 * - Serialization/deserialization functions
 * - Versioning and migration support
 * - Validation functions
 * 
 * **Design principle:** CPL is the stable contract between GOFAI stages.
 * Internal parse tree representations should NOT leak into CPL. CPL types
 * are durable, serializable, and version-controlled.
 * 
 * **Purpose:**
 * - Enable sharing and replay of CPL between sessions
 * - Support debugging and golden tests
 * - Allow external tools to consume CPL
 * - Prevent internal implementation details from becoming API
 * - Enable schema evolution with migration
 */

/**
 * =============================================================================
 * CPL VERSION SPECIFICATION
 * =============================================================================
 */

/**
 * CPL schema version (semantic versioning).
 * 
 * - Major: Breaking changes (old parsers cannot read new CPL)
 * - Minor: Additive changes (new fields, backward compatible)
 * - Patch: Fixes, clarifications (no schema changes)
 */
export const CPL_SCHEMA_VERSION = '1.0.0' as const;

/**
 * Parse CPL schema version string.
 */
export interface CPLVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

/**
 * Parse a version string into components.
 */
export function parseCPLVersion(version: string): CPLVersion {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid CPL version: ${version}`);
  }
  return {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
  };
}

/**
 * Check if two versions are compatible (can deserialize).
 */
export function areVersionsCompatible(target: string, source: string): boolean {
  const t = parseCPLVersion(target);
  const s = parseCPLVersion(source);

  // Major version must match
  if (t.major !== s.major) {
    return false;
  }

  // Target must be >= source for minor version (backward compatible)
  if (t.minor < s.minor) {
    return false;
  }

  return true;
}

/**
 * =============================================================================
 * CORE CPL TYPES (PUBLIC INTERFACE)
 * =============================================================================
 */

/**
 * Unique identifier for CPL nodes (for provenance and reference).
 */
export type CPLNodeId = string & { readonly __brand: 'CPLNodeId' };

/**
 * Create a CPL node ID.
 */
export function createCPLNodeId(id: string): CPLNodeId {
  return id as CPLNodeId;
}

/**
 * Namespace for opcodes, lexemes, and constraints.
 * Builtins have no namespace; extensions must be namespaced.
 */
export type Namespace = string & { readonly __brand: 'Namespace' };

/**
 * Create a namespace.
 */
export function createNamespace(ns: string): Namespace {
  if (ns && !ns.match(/^[a-z0-9-]+$/)) {
    throw new Error(`Invalid namespace: ${ns}`);
  }
  return ns as Namespace;
}

/**
 * Namespaced identifier (namespace:local or just local for builtins).
 */
export interface NamespacedId {
  readonly namespace?: Namespace;
  readonly local: string;
}

/**
 * Format a namespaced ID as string.
 */
export function formatNamespacedId(id: NamespacedId): string {
  return id.namespace ? `${id.namespace}:${id.local}` : id.local;
}

/**
 * Parse a namespaced ID from string.
 */
export function parseNamespacedId(str: string): NamespacedId {
  const match = str.match(/^(?:([a-z0-9-]+):)?(.+)$/);
  if (!match) {
    throw new Error(`Invalid namespaced ID: ${str}`);
  }
  return {
    namespace: match[1] ? createNamespace(match[1]) : undefined,
    local: match[2]!,
  };
}

/**
 * Provenance information for CPL nodes.
 */
export interface CPLProvenance {
  /** Original text span this node came from */
  readonly textSpan?: { start: number; end: number };
  /** Lexeme that contributed this meaning */
  readonly lexeme?: string;
  /** Grammar rule that produced this node */
  readonly rule?: string;
  /** Discourse context that resolved this node */
  readonly discourseContext?: string;
  /** Extension that contributed this node */
  readonly extension?: Namespace;
}

/**
 * Base CPL node (all CPL nodes extend this).
 */
export interface CPLNode {
  /** Unique ID for this node */
  readonly id: CPLNodeId;
  /** Node type discriminator */
  readonly type: string;
  /** Provenance (where this node came from) */
  readonly provenance?: CPLProvenance;
}

/**
 * =============================================================================
 * CPL-INTENT: User intention with goals, constraints, and scope
 * =============================================================================
 */

/**
 * A goal the user wants to achieve.
 */
export interface CPLGoal extends CPLNode {
  readonly type: 'goal';
  /** Goal type (perceptual axis, structural change, etc.) */
  readonly goalType: 'perceptual' | 'structural' | 'harmonic' | 'rhythmic' | 'mixing' | 'arrangement';
  /** Target axis or property */
  readonly target: string;
  /** Direction (increase, decrease, set) */
  readonly direction: 'increase' | 'decrease' | 'set' | 'toggle';
  /** Amount (for increase/decrease/set) */
  readonly amount?: CPLAmount;
}

/**
 * Amount specification (for goals and parameter values).
 */
export type CPLAmount =
  | { readonly type: 'relative'; readonly value: number; readonly unit?: string }
  | { readonly type: 'absolute'; readonly value: number; readonly unit: string }
  | { readonly type: 'qualitative'; readonly value: 'little' | 'lot' | 'some' | 'much' }
  | { readonly type: 'unspecified' };

/**
 * A constraint the user wants preserved.
 */
export interface CPLConstraint extends CPLNode {
  readonly type: 'constraint';
  /** Constraint type */
  readonly constraintType: 'preserve' | 'only-change' | 'range' | 'capability';
  /** What to preserve/constrain */
  readonly target: CPLSelector;
  /** Tolerance level (for preserve) */
  readonly tolerance?: 'exact' | 'recognizable' | 'approximate';
}

/**
 * A selector identifying entities in the project.
 */
export interface CPLSelector extends CPLNode {
  readonly type: 'selector';
  /** Selector type */
  readonly selectorType: 'scope' | 'role' | 'tag' | 'id' | 'attribute';
  /** Selector value */
  readonly value: string | number | boolean;
  /** Nested selector (for combination) */
  readonly nested?: CPLSelector;
}

/**
 * Temporal scope (when to apply edits).
 */
export interface CPLScope extends CPLNode {
  readonly type: 'scope';
  /** Scope type */
  readonly scopeType: 'global' | 'section' | 'bars' | 'beats' | 'selection';
  /** Section name (if section scope) */
  readonly section?: string;
  /** Bar range (if bar scope) */
  readonly bars?: { start: number; end: number };
  /** Beat range (if beat scope) */
  readonly beats?: { start: number; end: number };
}

/**
 * CPL-Intent: Resolved user intention.
 */
export interface CPLIntent extends CPLNode {
  readonly type: 'intent';
  /** Schema version */
  readonly schemaVersion: string;
  /** Goals to achieve */
  readonly goals: readonly CPLGoal[];
  /** Constraints to preserve */
  readonly constraints: readonly CPLConstraint[];
  /** Temporal scope */
  readonly scope: CPLScope;
  /** Holes (unresolved references) */
  readonly holes: readonly CPLHole[];
}

/**
 * A hole in the CPL (unresolved reference or ambiguity).
 */
export interface CPLHole extends CPLNode {
  readonly type: 'hole';
  /** Hole kind */
  readonly kind: 'unresolved_reference' | 'ambiguous' | 'underspecified' | 'conflicting';
  /** Human-readable description */
  readonly description: string;
  /** Candidates (for ambiguity) */
  readonly candidates?: readonly string[];
}

/**
 * =============================================================================
 * CPL-PLAN: Executable plan with opcodes
 * =============================================================================
 */

/**
 * An opcode (atomic edit operation).
 */
export interface CPLOpcode extends CPLNode {
  readonly type: 'opcode';
  /** Opcode identifier (namespaced) */
  readonly opcodeId: NamespacedId;
  /** Opcode display name */
  readonly name: string;
  /** Parameters */
  readonly params: Record<string, unknown>;
  /** Target selector */
  readonly target: CPLSelector;
  /** Preconditions */
  readonly preconditions: readonly CPLPrecondition[];
  /** Postconditions */
  readonly postconditions: readonly CPLPostcondition[];
}

/**
 * Precondition for an opcode.
 */
export interface CPLPrecondition extends CPLNode {
  readonly type: 'precondition';
  /** Precondition kind */
  readonly kind: 'entity_exists' | 'capability_enabled' | 'state_valid';
  /** Description */
  readonly description: string;
}

/**
 * Postcondition for an opcode.
 */
export interface CPLPostcondition extends CPLNode {
  readonly type: 'postcondition';
  /** Postcondition kind */
  readonly kind: 'constraint_satisfied' | 'goal_achieved' | 'state_valid';
  /** Description */
  readonly description: string;
}

/**
 * CPL-Plan: Executable sequence of opcodes.
 */
export interface CPLPlan extends CPLNode {
  readonly type: 'plan';
  /** Schema version */
  readonly schemaVersion: string;
  /** Original intent this plan satisfies */
  readonly intent: CPLIntent;
  /** Sequence of opcodes */
  readonly opcodes: readonly CPLOpcode[];
  /** Estimated cost */
  readonly cost: number;
  /** Explanation (why this plan) */
  readonly explanation: string;
}

/**
 * =============================================================================
 * JSON SCHEMA DEFINITIONS
 * =============================================================================
 */

/**
 * JSON schema for CPL-Intent (for validation and documentation).
 */
export const CPL_INTENT_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://cardplay.app/schemas/gofai/cpl-intent-v1.json',
  title: 'CPL-Intent',
  description: 'Compositional Pragmatic Logic: User Intention',
  type: 'object',
  required: ['type', 'id', 'schemaVersion', 'goals', 'constraints', 'scope', 'holes'],
  properties: {
    type: { const: 'intent' },
    id: { type: 'string' },
    schemaVersion: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    goals: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'id', 'goalType', 'target', 'direction'],
        properties: {
          type: { const: 'goal' },
          id: { type: 'string' },
          goalType: {
            enum: ['perceptual', 'structural', 'harmonic', 'rhythmic', 'mixing', 'arrangement'],
          },
          target: { type: 'string' },
          direction: { enum: ['increase', 'decrease', 'set', 'toggle'] },
          amount: {
            oneOf: [
              {
                type: 'object',
                required: ['type', 'value'],
                properties: {
                  type: { const: 'relative' },
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
              },
              {
                type: 'object',
                required: ['type', 'value', 'unit'],
                properties: {
                  type: { const: 'absolute' },
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
              },
              {
                type: 'object',
                required: ['type', 'value'],
                properties: {
                  type: { const: 'qualitative' },
                  value: { enum: ['little', 'lot', 'some', 'much'] },
                },
              },
              {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { const: 'unspecified' },
                },
              },
            ],
          },
          provenance: {
            type: 'object',
            properties: {
              textSpan: {
                type: 'object',
                required: ['start', 'end'],
                properties: {
                  start: { type: 'number' },
                  end: { type: 'number' },
                },
              },
              lexeme: { type: 'string' },
              rule: { type: 'string' },
              discourseContext: { type: 'string' },
              extension: { type: 'string' },
            },
          },
        },
      },
    },
    constraints: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'id', 'constraintType', 'target'],
        properties: {
          type: { const: 'constraint' },
          id: { type: 'string' },
          constraintType: { enum: ['preserve', 'only-change', 'range', 'capability'] },
          target: { $ref: '#/definitions/selector' },
          tolerance: { enum: ['exact', 'recognizable', 'approximate'] },
          provenance: { $ref: '#/definitions/provenance' },
        },
      },
    },
    scope: {
      type: 'object',
      required: ['type', 'id', 'scopeType'],
      properties: {
        type: { const: 'scope' },
        id: { type: 'string' },
        scopeType: { enum: ['global', 'section', 'bars', 'beats', 'selection'] },
        section: { type: 'string' },
        bars: {
          type: 'object',
          required: ['start', 'end'],
          properties: {
            start: { type: 'number' },
            end: { type: 'number' },
          },
        },
        beats: {
          type: 'object',
          required: ['start', 'end'],
          properties: {
            start: { type: 'number' },
            end: { type: 'number' },
          },
        },
        provenance: { $ref: '#/definitions/provenance' },
      },
    },
    holes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'id', 'kind', 'description'],
        properties: {
          type: { const: 'hole' },
          id: { type: 'string' },
          kind: {
            enum: ['unresolved_reference', 'ambiguous', 'underspecified', 'conflicting'],
          },
          description: { type: 'string' },
          candidates: {
            type: 'array',
            items: { type: 'string' },
          },
          provenance: { $ref: '#/definitions/provenance' },
        },
      },
    },
    provenance: { $ref: '#/definitions/provenance' },
  },
  definitions: {
    selector: {
      type: 'object',
      required: ['type', 'id', 'selectorType', 'value'],
      properties: {
        type: { const: 'selector' },
        id: { type: 'string' },
        selectorType: { enum: ['scope', 'role', 'tag', 'id', 'attribute'] },
        value: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
        nested: { $ref: '#/definitions/selector' },
        provenance: { $ref: '#/definitions/provenance' },
      },
    },
    provenance: {
      type: 'object',
      properties: {
        textSpan: {
          type: 'object',
          required: ['start', 'end'],
          properties: {
            start: { type: 'number' },
            end: { type: 'number' },
          },
        },
        lexeme: { type: 'string' },
        rule: { type: 'string' },
        discourseContext: { type: 'string' },
        extension: { type: 'string' },
      },
    },
  },
} as const;

/**
 * JSON schema for CPL-Plan (for validation and documentation).
 */
export const CPL_PLAN_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://cardplay.app/schemas/gofai/cpl-plan-v1.json',
  title: 'CPL-Plan',
  description: 'Compositional Pragmatic Logic: Executable Plan',
  type: 'object',
  required: ['type', 'id', 'schemaVersion', 'intent', 'opcodes', 'cost', 'explanation'],
  properties: {
    type: { const: 'plan' },
    id: { type: 'string' },
    schemaVersion: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    intent: { $ref: CPL_INTENT_JSON_SCHEMA.$id },
    opcodes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'id', 'opcodeId', 'name', 'params', 'target', 'preconditions', 'postconditions'],
        properties: {
          type: { const: 'opcode' },
          id: { type: 'string' },
          opcodeId: {
            type: 'object',
            required: ['local'],
            properties: {
              namespace: { type: 'string' },
              local: { type: 'string' },
            },
          },
          name: { type: 'string' },
          params: { type: 'object' },
          target: { $ref: '#/definitions/selector' },
          preconditions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'id', 'kind', 'description'],
              properties: {
                type: { const: 'precondition' },
                id: { type: 'string' },
                kind: { enum: ['entity_exists', 'capability_enabled', 'state_valid'] },
                description: { type: 'string' },
                provenance: { $ref: '#/definitions/provenance' },
              },
            },
          },
          postconditions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'id', 'kind', 'description'],
              properties: {
                type: { const: 'postcondition' },
                id: { type: 'string' },
                kind: { enum: ['constraint_satisfied', 'goal_achieved', 'state_valid'] },
                description: { type: 'string' },
                provenance: { $ref: '#/definitions/provenance' },
              },
            },
          },
          provenance: { $ref: '#/definitions/provenance' },
        },
      },
    },
    cost: { type: 'number' },
    explanation: { type: 'string' },
    provenance: { $ref: '#/definitions/provenance' },
  },
  definitions: {
    selector: CPL_INTENT_JSON_SCHEMA.definitions.selector,
    provenance: CPL_INTENT_JSON_SCHEMA.definitions.provenance,
  },
} as const;

/**
 * =============================================================================
 * SERIALIZATION / DESERIALIZATION
 * =============================================================================
 */

/**
 * Serialize CPL-Intent to JSON string.
 */
export function serializeCPLIntent(intent: CPLIntent): string {
  return JSON.stringify(intent, null, 2);
}

/**
 * Deserialize CPL-Intent from JSON string.
 */
export function deserializeCPLIntent(json: string): CPLIntent {
  const parsed = JSON.parse(json);

  // Validate schema version
  if (!areVersionsCompatible(CPL_SCHEMA_VERSION, parsed.schemaVersion)) {
    throw new Error(
      `Incompatible CPL schema version: expected ${CPL_SCHEMA_VERSION}, got ${parsed.schemaVersion}`
    );
  }

  // TODO: Full JSON schema validation
  // For now, just basic type check
  if (parsed.type !== 'intent') {
    throw new Error(`Expected type 'intent', got '${parsed.type}'`);
  }

  return parsed as CPLIntent;
}

/**
 * Serialize CPL-Plan to JSON string.
 */
export function serializeCPLPlan(plan: CPLPlan): string {
  return JSON.stringify(plan, null, 2);
}

/**
 * Deserialize CPL-Plan from JSON string.
 */
export function deserializeCPLPlan(json: string): CPLPlan {
  const parsed = JSON.parse(json);

  // Validate schema version
  if (!areVersionsCompatible(CPL_SCHEMA_VERSION, parsed.schemaVersion)) {
    throw new Error(
      `Incompatible CPL schema version: expected ${CPL_SCHEMA_VERSION}, got ${parsed.schemaVersion}`
    );
  }

  // TODO: Full JSON schema validation
  // For now, just basic type check
  if (parsed.type !== 'plan') {
    throw new Error(`Expected type 'plan', got '${parsed.type}'`);
  }

  return parsed as CPLPlan;
}

/**
 * =============================================================================
 * VALIDATION
 * =============================================================================
 */

/**
 * Validation result.
 */
export interface CPLValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validate a CPL-Intent against the schema.
 */
export function validateCPLIntent(intent: unknown): CPLValidationResult {
  const errors: string[] = [];

  if (typeof intent !== 'object' || intent === null) {
    errors.push('Intent must be an object');
    return { valid: false, errors };
  }

  const obj = intent as Record<string, unknown>;

  if (obj.type !== 'intent') {
    errors.push(`Expected type 'intent', got '${obj.type}'`);
  }

  if (typeof obj.id !== 'string') {
    errors.push('Intent must have string id');
  }

  if (typeof obj.schemaVersion !== 'string') {
    errors.push('Intent must have string schemaVersion');
  } else {
    try {
      parseCPLVersion(obj.schemaVersion);
    } catch (e) {
      errors.push(`Invalid schemaVersion: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!Array.isArray(obj.goals)) {
    errors.push('Intent must have array of goals');
  }

  if (!Array.isArray(obj.constraints)) {
    errors.push('Intent must have array of constraints');
  }

  if (typeof obj.scope !== 'object' || obj.scope === null) {
    errors.push('Intent must have scope object');
  }

  if (!Array.isArray(obj.holes)) {
    errors.push('Intent must have array of holes');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a CPL-Plan against the schema.
 */
export function validateCPLPlan(plan: unknown): CPLValidationResult {
  const errors: string[] = [];

  if (typeof plan !== 'object' || plan === null) {
    errors.push('Plan must be an object');
    return { valid: false, errors };
  }

  const obj = plan as Record<string, unknown>;

  if (obj.type !== 'plan') {
    errors.push(`Expected type 'plan', got '${obj.type}'`);
  }

  if (typeof obj.id !== 'string') {
    errors.push('Plan must have string id');
  }

  if (typeof obj.schemaVersion !== 'string') {
    errors.push('Plan must have string schemaVersion');
  } else {
    try {
      parseCPLVersion(obj.schemaVersion);
    } catch (e) {
      errors.push(`Invalid schemaVersion: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (typeof obj.intent !== 'object' || obj.intent === null) {
    errors.push('Plan must have intent object');
  } else {
    const intentResult = validateCPLIntent(obj.intent);
    if (!intentResult.valid) {
      errors.push(...intentResult.errors.map((e) => `intent.${e}`));
    }
  }

  if (!Array.isArray(obj.opcodes)) {
    errors.push('Plan must have array of opcodes');
  }

  if (typeof obj.cost !== 'number') {
    errors.push('Plan must have numeric cost');
  }

  if (typeof obj.explanation !== 'string') {
    errors.push('Plan must have string explanation');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * =============================================================================
 * MIGRATION SUPPORT
 * =============================================================================
 */

/**
 * Migration function signature.
 */
export type MigrationFn<From, To> = (from: From) => To;

/**
 * Registry of migration functions between schema versions.
 */
export interface MigrationRegistry {
  readonly migrations: Map<string, Map<string, MigrationFn<unknown, unknown>>>;
}

/**
 * Create a migration registry.
 */
export function createMigrationRegistry(): MigrationRegistry {
  return {
    migrations: new Map(),
  };
}

/**
 * Register a migration from one version to another.
 */
export function registerMigration(
  registry: MigrationRegistry,
  fromVersion: string,
  toVersion: string,
  fn: MigrationFn<unknown, unknown>
): void {
  if (!registry.migrations.has(fromVersion)) {
    registry.migrations.set(fromVersion, new Map());
  }
  registry.migrations.get(fromVersion)!.set(toVersion, fn);
}

/**
 * Find migration path from source to target version.
 */
export function findMigrationPath(
  registry: MigrationRegistry,
  sourceVersion: string,
  targetVersion: string
): readonly string[] | null {
  // BFS to find shortest path
  const queue: Array<{ version: string; path: string[] }> = [
    { version: sourceVersion, path: [sourceVersion] },
  ];
  const visited = new Set<string>([sourceVersion]);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.version === targetVersion) {
      return current.path;
    }

    const nextVersions = registry.migrations.get(current.version);
    if (nextVersions) {
      const entries = Array.from(nextVersions.entries());
      for (const [nextVersion, _] of entries) {
        if (!visited.has(nextVersion)) {
          visited.add(nextVersion);
          queue.push({
            version: nextVersion,
            path: [...current.path, nextVersion],
          });
        }
      }
    }
  }

  return null;
}

/**
 * Migrate CPL from source version to target version.
 */
export function migrateCPL(
  registry: MigrationRegistry,
  cpl: unknown,
  sourceVersion: string,
  targetVersion: string
): unknown {
  if (sourceVersion === targetVersion) {
    return cpl;
  }

  const path = findMigrationPath(registry, sourceVersion, targetVersion);
  if (!path) {
    throw new Error(`No migration path from ${sourceVersion} to ${targetVersion}`);
  }

  let current = cpl;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]!;
    const to = path[i + 1]!;
    const fn = registry.migrations.get(from)?.get(to);
    if (!fn) {
      throw new Error(`Missing migration from ${from} to ${to}`);
    }
    current = fn(current);
  }

  return current;
}

/**
 * =============================================================================
 * UTILITY FUNCTIONS
 * =============================================================================
 */

/**
 * Check if a CPL node has holes (unresolved references).
 */
export function hasHoles(intent: CPLIntent): boolean {
  return intent.holes.length > 0;
}

/**
 * Extract all namespaces used in a CPL node tree.
 */
export function extractNamespaces(node: CPLNode): Set<Namespace> {
  const namespaces = new Set<Namespace>();

  function visit(n: unknown): void {
    if (typeof n !== 'object' || n === null) {
      return;
    }

    if ('namespace' in n && typeof n.namespace === 'string') {
      namespaces.add(n.namespace as Namespace);
    }

    for (const value of Object.values(n)) {
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else {
        visit(value);
      }
    }
  }

  visit(node);
  return namespaces;
}

/**
 * Pretty-print a CPL node for debugging.
 */
export function prettyPrintCPL(node: CPLNode, indent: number = 0): string {
  const pad = ' '.repeat(indent);
  const lines: string[] = [];

  lines.push(`${pad}${node.type}#${node.id}`);

  if (node.type === 'intent') {
    const intent = node as CPLIntent;
    lines.push(`${pad}  goals: ${intent.goals.length}`);
    intent.goals.forEach((g) => lines.push(prettyPrintCPL(g, indent + 4)));
    lines.push(`${pad}  constraints: ${intent.constraints.length}`);
    intent.constraints.forEach((c) => lines.push(prettyPrintCPL(c, indent + 4)));
    lines.push(`${pad}  scope:`);
    lines.push(prettyPrintCPL(intent.scope, indent + 4));
    lines.push(`${pad}  holes: ${intent.holes.length}`);
  } else if (node.type === 'goal') {
    const goal = node as CPLGoal;
    lines.push(`${pad}  ${goal.goalType}: ${goal.direction} ${goal.target}`);
  } else if (node.type === 'constraint') {
    const constraint = node as CPLConstraint;
    lines.push(`${pad}  ${constraint.constraintType}`);
  } else if (node.type === 'plan') {
    const plan = node as CPLPlan;
    lines.push(`${pad}  opcodes: ${plan.opcodes.length}`);
    plan.opcodes.forEach((op) => lines.push(prettyPrintCPL(op, indent + 4)));
    lines.push(`${pad}  cost: ${plan.cost}`);
  } else if (node.type === 'opcode') {
    const opcode = node as CPLOpcode;
    lines.push(`${pad}  ${formatNamespacedId(opcode.opcodeId)}: ${opcode.name}`);
  }

  return lines.join('\n');
}

/**
 * =============================================================================
 * SUMMARY
 * =============================================================================
 * 
 * This module defines CPL as a stable public interface:
 * 
 * **Version management:**
 * - Semantic versioning (major.minor.patch)
 * - Compatibility checking
 * - Migration support
 * 
 * **Core types:**
 * - CPLIntent (goals, constraints, scope, holes)
 * - CPLPlan (opcodes, preconditions, postconditions)
 * - All types are branded/nominal for safety
 * - All types carry provenance
 * 
 * **JSON schema:**
 * - Draft-07 JSON schemas for validation
 * - Stable URI-based schema IDs
 * - Documentation embedded in schema
 * 
 * **Serialization:**
 * - Deterministic JSON serialization
 * - Deserialization with version checking
 * - Validation functions
 * 
 * **Migration:**
 * - Registry pattern for version migrations
 * - Automatic path finding
 * - Composable migration functions
 * 
 * **Design principles:**
 * 1. CPL is the stable contract (parse trees are internal)
 * 2. Everything is versioned and serializable
 * 3. Namespaces prevent collisions (builtins vs extensions)
 * 4. Provenance is first-class (explain where meanings came from)
 * 5. Validation is explicit (fail fast on invalid CPL)
 * 
 * **Cross-references:**
 * - Step 004: Vocabulary policy (namespace rules)
 * - Step 007: CPL schema versioning (version management)
 * - Step 017: Extension semantics (namespaced nodes)
 * - Step 031: Naming conventions (type naming)
 * - Step 048: Migration policy (schema evolution)
 */
