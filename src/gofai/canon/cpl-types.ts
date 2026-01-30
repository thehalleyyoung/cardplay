/**
 * GOFAI CPL (Compositional Predicate Logic) Public Interface
 *
 * Stable TypeScript types and JSON schema for CPL representations.
 * This is the SSOT for the external interface to GOFAI's internal representations.
 *
 * Design principles:
 * - Stable: Types evolve with semantic versioning
 * - Typed: All nodes have explicit types
 * - Provenance: Every node tracks its origin
 * - Extensible: Supports extension namespaces
 * - Serializable: Clean JSON schema for persistence
 *
 * Discourage leaking parse-tree internals - users should work with CPL types.
 *
 * @module gofai/canon/cpl-types
 */

import type { SemanticVersion } from './versioning';

// =============================================================================
// Core CPL Types
// =============================================================================

/**
 * CPL node type discriminator.
 *
 * Every CPL node has a `type` field for runtime discrimination.
 */
export type CPLNodeType =
  // High-level intent
  | 'intent'
  | 'goal'
  | 'constraint'
  | 'preference'
  // Scope and selection
  | 'scope'
  | 'selector'
  | 'time-range'
  | 'entity-ref'
  // Musical concepts
  | 'axis-goal'
  | 'preserve-constraint'
  | 'only-change-constraint'
  | 'range-constraint'
  | 'relation-constraint'
  // Low-level operations
  | 'plan'
  | 'opcode'
  | 'param-set'
  // Extensions
  | 'extension-node';

/**
 * Base interface for all CPL nodes.
 *
 * Every node must have:
 * - type: For runtime discrimination
 * - id: For provenance and debugging
 * - provenance: Optional source tracking
 */
export interface CPLNode {
  readonly type: CPLNodeType;
  readonly id: string;
  readonly provenance?: Provenance;
}

/**
 * Provenance information for CPL nodes.
 *
 * Tracks where a node came from in the compilation pipeline.
 */
export interface Provenance {
  /** Source span in original utterance (if applicable) */
  readonly span?: readonly [number, number];

  /** Lexeme ID that produced this node */
  readonly lexemeId?: string;

  /** Grammar rule ID that produced this node */
  readonly ruleId?: string;

  /** Semantic frame ID */
  readonly frameId?: string;

  /** Extension namespace (if from extension) */
  readonly namespace?: string;

  /** Human-readable origin description */
  readonly origin?: string;
}

// =============================================================================
// CPL-Intent: High-Level User Intent
// =============================================================================

/**
 * Complete user intent representation.
 *
 * This is the output of semantic composition + pragmatic resolution.
 */
export interface CPLIntent extends CPLNode {
  readonly type: 'intent';

  /** User's goals (what they want to change) */
  readonly goals: readonly CPLGoal[];

  /** Hard constraints (what must be preserved) */
  readonly constraints: readonly CPLConstraint[];

  /** Soft preferences (hints for planning) */
  readonly preferences: readonly CPLPreference[];

  /** Scope of application */
  readonly scope?: CPLScope;

  /** Explicit amount/degree specifications */
  readonly amounts?: ReadonlyMap<string, CPLAmount>;

  /** Holes (unresolved references requiring clarification) */
  readonly holes?: readonly CPLHole[];

  /** Schema version */
  readonly schemaVersion: SemanticVersion;
}

/**
 * Goal: What the user wants to accomplish.
 */
export interface CPLGoal extends CPLNode {
  readonly type: 'goal';

  /** Goal variant */
  readonly variant: 'axis-goal' | 'structural-goal' | 'production-goal';

  /** Target axis (for axis goals) */
  readonly axis?: string;

  /** Direction of change */
  readonly direction?: 'increase' | 'decrease' | 'set';

  /** Target value (if specific) */
  readonly targetValue?: CPLAmount;

  /** Scope restriction */
  readonly scope?: CPLScope;
}

/**
 * Axis goal: Change a perceptual/musical axis.
 */
export interface CPLAxisGoal extends CPLGoal {
  readonly variant: 'axis-goal';
  readonly axis: string;
  readonly direction: 'increase' | 'decrease' | 'set';
  readonly targetValue?: CPLAmount;
}

/**
 * Constraint: What must be preserved.
 */
export interface CPLConstraint extends CPLNode {
  readonly type: 'constraint';

  /** Constraint variant */
  readonly variant:
    | 'preserve'
    | 'only-change'
    | 'range'
    | 'relation'
    | 'structural';

  /** Strength (hard constraints cannot be violated) */
  readonly strength: 'hard' | 'soft';

  /** Description for error messages */
  readonly description: string;
}

/**
 * Preserve constraint: Keep something unchanged.
 */
export interface CPLPreserveConstraint extends CPLConstraint {
  readonly variant: 'preserve';

  /** What to preserve */
  readonly target: CPLSelector;

  /** Preservation level */
  readonly level: 'exact' | 'recognizable' | 'functional' | 'approximate';
}

/**
 * Only-change constraint: Restrict modifications to specific scope.
 */
export interface CPLOnlyChangeConstraint extends CPLConstraint {
  readonly variant: 'only-change';

  /** What is allowed to change */
  readonly allowed: CPLSelector;

  /** Everything else must be preserved */
  readonly preserveLevel: 'exact' | 'recognizable' | 'functional';
}

/**
 * Range constraint: Keep value within bounds.
 */
export interface CPLRangeConstraint extends CPLConstraint {
  readonly variant: 'range';

  /** Parameter/axis being constrained */
  readonly target: string;

  /** Lower bound (inclusive, optional) */
  readonly min?: CPLAmount;

  /** Upper bound (inclusive, optional) */
  readonly max?: CPLAmount;
}

/**
 * Relation constraint: Maintain relationship between values.
 */
export interface CPLRelationConstraint extends CPLConstraint {
  readonly variant: 'relation';

  /** First value */
  readonly left: string;

  /** Relation type */
  readonly relation: 'less-than' | 'greater-than' | 'equal' | 'proportional';

  /** Second value */
  readonly right: string;

  /** Proportionality constant (if applicable) */
  readonly constant?: number;
}

/**
 * Preference: Soft guidance for planning.
 */
export interface CPLPreference extends CPLNode {
  readonly type: 'preference';

  /** Preference category */
  readonly category:
    | 'edit-style'
    | 'layer-preference'
    | 'method-preference'
    | 'cost-preference';

  /** Preference value */
  readonly value: string | number | boolean;

  /** Weight (higher = stronger preference) */
  readonly weight: number;
}

// =============================================================================
// CPL Scope and Selection
// =============================================================================

/**
 * Scope: Where to apply an operation.
 */
export interface CPLScope extends CPLNode {
  readonly type: 'scope';

  /** Time range */
  readonly timeRange?: CPLTimeRange;

  /** Entity selector */
  readonly entities?: CPLSelector;

  /** Explicit exclusions */
  readonly exclude?: CPLSelector;
}

/**
 * Time range specification.
 */
export interface CPLTimeRange extends CPLNode {
  readonly type: 'time-range';

  /** Start position (in ticks) */
  readonly start?: number;

  /** End position (in ticks) */
  readonly end?: number;

  /** Section names (if specified by name) */
  readonly sections?: readonly string[];

  /** Bar range (if specified by bars) */
  readonly bars?: readonly [number, number];
}

/**
 * Entity selector: Selects entities by various criteria.
 */
export interface CPLSelector extends CPLNode {
  readonly type: 'selector';

  /** Selector kind */
  readonly kind:
    | 'all'
    | 'track'
    | 'layer'
    | 'role'
    | 'tag'
    | 'card'
    | 'event-type';

  /** Value (e.g., track name, role name) */
  readonly value?: string | string[];

  /** Combination logic */
  readonly combinator?: 'and' | 'or' | 'not';

  /** Sub-selectors (for combinators) */
  readonly selectors?: readonly CPLSelector[];
}

/**
 * Entity reference: Points to a specific entity.
 */
export interface CPLEntityRef extends CPLNode {
  readonly type: 'entity-ref';

  /** Entity type */
  readonly entityType:
    | 'track'
    | 'section'
    | 'marker'
    | 'card'
    | 'deck'
    | 'board';

  /** Entity ID */
  readonly entityId: string;

  /** Human-readable name */
  readonly name?: string;
}

// =============================================================================
// CPL Amounts and Values
// =============================================================================

/**
 * Amount specification.
 */
export interface CPLAmount {
  /** Amount type */
  readonly type: 'absolute' | 'relative' | 'percentage' | 'qualitative';

  /** Numeric value (if applicable) */
  readonly value?: number;

  /** Unit (if applicable) */
  readonly unit?: string;

  /** Qualitative descriptor */
  readonly qualifier?:
    | 'a-little'
    | 'somewhat'
    | 'much'
    | 'completely'
    | 'slightly';

  /** Range (if fuzzy) */
  readonly range?: readonly [number, number];
}

// =============================================================================
// CPL-Plan: Executable Plan
// =============================================================================

/**
 * Complete execution plan.
 *
 * This is the output of the planning phase.
 */
export interface CPLPlan extends CPLNode {
  readonly type: 'plan';

  /** Plan variant */
  readonly variant: 'sequential' | 'parallel' | 'conditional';

  /** Sequence of opcodes */
  readonly opcodes: readonly CPLOpcode[];

  /** Estimated cost */
  readonly cost: number;

  /** Estimated satisfaction score */
  readonly satisfaction: number;

  /** Goals this plan satisfies */
  readonly satisfiesGoals: readonly string[]; // Goal IDs

  /** Constraints this plan respects */
  readonly respectsConstraints: readonly string[]; // Constraint IDs

  /** Warnings */
  readonly warnings?: readonly string[];

  /** Schema version */
  readonly schemaVersion: SemanticVersion;
}

/**
 * Opcode: Atomic operation in a plan.
 */
export interface CPLOpcode extends CPLNode {
  readonly type: 'opcode';

  /** Opcode identifier (namespaced) */
  readonly opcodeId: string;

  /** Opcode category */
  readonly category:
    | 'event'
    | 'structure'
    | 'routing'
    | 'production'
    | 'dsp'
    | 'metadata';

  /** Scope of application */
  readonly scope: CPLScope;

  /** Parameters */
  readonly params: ReadonlyMap<string, unknown>;

  /** Cost estimate */
  readonly cost: number;

  /** Risk level */
  readonly risk: 'low' | 'medium' | 'high';

  /** Can be destructive */
  readonly destructive: boolean;

  /** Requires preview */
  readonly requiresPreview: boolean;

  /** Reason (links to goals) */
  readonly reason?: string;
}

// =============================================================================
// CPL Holes and Clarifications
// =============================================================================

/**
 * Hole: Unresolved element requiring clarification.
 */
export interface CPLHole extends CPLNode {
  readonly type: string; // Will be set to specific hole type

  /** What kind of information is missing */
  readonly holeKind:
    | 'ambiguous-reference'
    | 'missing-scope'
    | 'missing-amount'
    | 'conflicting-constraints'
    | 'unknown-term';

  /** Priority of resolution */
  readonly priority: 'critical' | 'high' | 'medium' | 'low';

  /** Suggested clarification question */
  readonly question: string;

  /** Possible resolutions */
  readonly options?: readonly CPLHoleOption[];

  /** Default resolution (if any) */
  readonly defaultOption?: number;
}

/**
 * Option for resolving a hole.
 */
export interface CPLHoleOption {
  /** Option ID */
  readonly id: string;

  /** Human-readable description */
  readonly description: string;

  /** Resolved value */
  readonly resolution: CPLNode | string | number;

  /** Confidence score */
  readonly confidence: number;
}

// =============================================================================
// Extension Nodes
// =============================================================================

/**
 * Extension-contributed semantic node.
 *
 * Opaque to core but validated against schema.
 */
export interface CPLExtensionNode extends CPLNode {
  readonly type: 'extension-node';

  /** Extension namespace */
  readonly namespace: string;

  /** Extension-specific node type */
  readonly extensionType: string;

  /** Extension payload (must conform to registered schema) */
  readonly payload: Record<string, unknown>;

  /** Schema version */
  readonly schemaVersion: SemanticVersion;
}

// =============================================================================
// JSON Schema Definitions
// =============================================================================

/**
 * JSON Schema for CPL-Intent.
 *
 * This is the stable schema for serialization/deserialization.
 */
export const CPL_INTENT_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://cardplay.app/schemas/gofai/cpl-intent.json',
  title: 'CPL-Intent',
  description:
    'GOFAI Music+ Compositional Predicate Logic Intent Representation',
  type: 'object',
  required: ['type', 'id', 'goals', 'constraints', 'preferences', 'schemaVersion'],
  properties: {
    type: { const: 'intent' },
    id: { type: 'string' },
    goals: {
      type: 'array',
      items: { $ref: '#/definitions/CPLGoal' },
    },
    constraints: {
      type: 'array',
      items: { $ref: '#/definitions/CPLConstraint' },
    },
    preferences: {
      type: 'array',
      items: { $ref: '#/definitions/CPLPreference' },
    },
    scope: { $ref: '#/definitions/CPLScope' },
    amounts: {
      type: 'object',
      additionalProperties: { $ref: '#/definitions/CPLAmount' },
    },
    holes: {
      type: 'array',
      items: { $ref: '#/definitions/CPLHole' },
    },
    schemaVersion: { $ref: '#/definitions/SemanticVersion' },
    provenance: { $ref: '#/definitions/Provenance' },
  },
  definitions: {
    SemanticVersion: {
      type: 'object',
      required: ['major', 'minor', 'patch'],
      properties: {
        major: { type: 'integer', minimum: 0 },
        minor: { type: 'integer', minimum: 0 },
        patch: { type: 'integer', minimum: 0 },
      },
    },
    Provenance: {
      type: 'object',
      properties: {
        span: {
          type: 'array',
          items: { type: 'integer' },
          minItems: 2,
          maxItems: 2,
        },
        lexemeId: { type: 'string' },
        ruleId: { type: 'string' },
        frameId: { type: 'string' },
        namespace: { type: 'string' },
        origin: { type: 'string' },
      },
    },
    CPLGoal: {
      type: 'object',
      required: ['type', 'id', 'variant'],
      properties: {
        type: { const: 'goal' },
        id: { type: 'string' },
        variant: {
          enum: ['axis-goal', 'structural-goal', 'production-goal'],
        },
        axis: { type: 'string' },
        direction: { enum: ['increase', 'decrease', 'set'] },
        targetValue: { $ref: '#/definitions/CPLAmount' },
        scope: { $ref: '#/definitions/CPLScope' },
        provenance: { $ref: '#/definitions/Provenance' },
      },
    },
    CPLConstraint: {
      type: 'object',
      required: ['type', 'id', 'variant', 'strength', 'description'],
      properties: {
        type: { const: 'constraint' },
        id: { type: 'string' },
        variant: {
          enum: ['preserve', 'only-change', 'range', 'relation', 'structural'],
        },
        strength: { enum: ['hard', 'soft'] },
        description: { type: 'string' },
        provenance: { $ref: '#/definitions/Provenance' },
      },
    },
    CPLPreference: {
      type: 'object',
      required: ['type', 'id', 'category', 'value', 'weight'],
      properties: {
        type: { const: 'preference' },
        id: { type: 'string' },
        category: {
          enum: [
            'edit-style',
            'layer-preference',
            'method-preference',
            'cost-preference',
          ],
        },
        value: { type: ['string', 'number', 'boolean'] },
        weight: { type: 'number' },
        provenance: { $ref: '#/definitions/Provenance' },
      },
    },
    CPLScope: {
      type: 'object',
      required: ['type', 'id'],
      properties: {
        type: { const: 'scope' },
        id: { type: 'string' },
        timeRange: { $ref: '#/definitions/CPLTimeRange' },
        entities: { $ref: '#/definitions/CPLSelector' },
        exclude: { $ref: '#/definitions/CPLSelector' },
        provenance: { $ref: '#/definitions/Provenance' },
      },
    },
    CPLTimeRange: {
      type: 'object',
      required: ['type', 'id'],
      properties: {
        type: { const: 'time-range' },
        id: { type: 'string' },
        start: { type: 'integer' },
        end: { type: 'integer' },
        sections: { type: 'array', items: { type: 'string' } },
        bars: {
          type: 'array',
          items: { type: 'integer' },
          minItems: 2,
          maxItems: 2,
        },
        provenance: { $ref: '#/definitions/Provenance' },
      },
    },
    CPLSelector: {
      type: 'object',
      required: ['type', 'id', 'kind'],
      properties: {
        type: { const: 'selector' },
        id: { type: 'string' },
        kind: {
          enum: ['all', 'track', 'layer', 'role', 'tag', 'card', 'event-type'],
        },
        value: { type: ['string', 'array'] },
        combinator: { enum: ['and', 'or', 'not'] },
        selectors: {
          type: 'array',
          items: { $ref: '#/definitions/CPLSelector' },
        },
        provenance: { $ref: '#/definitions/Provenance' },
      },
    },
    CPLAmount: {
      type: 'object',
      required: ['type'],
      properties: {
        type: {
          enum: ['absolute', 'relative', 'percentage', 'qualitative'],
        },
        value: { type: 'number' },
        unit: { type: 'string' },
        qualifier: {
          enum: ['a-little', 'somewhat', 'much', 'completely', 'slightly'],
        },
        range: {
          type: 'array',
          items: { type: 'number' },
          minItems: 2,
          maxItems: 2,
        },
      },
    },
    CPLHole: {
      type: 'object',
      required: ['type', 'id', 'holeKind', 'priority', 'question'],
      properties: {
        type: { type: 'string' },
        id: { type: 'string' },
        holeKind: {
          enum: [
            'ambiguous-reference',
            'missing-scope',
            'missing-amount',
            'conflicting-constraints',
            'unknown-term',
          ],
        },
        priority: { enum: ['critical', 'high', 'medium', 'low'] },
        question: { type: 'string' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'description', 'resolution', 'confidence'],
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              resolution: {}, // Can be any type
              confidence: { type: 'number', minimum: 0, maximum: 1 },
            },
          },
        },
        defaultOption: { type: 'integer', minimum: 0 },
        provenance: { $ref: '#/definitions/Provenance' },
      },
    },
  },
} as const;

/**
 * JSON Schema for CPL-Plan.
 */
export const CPL_PLAN_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://cardplay.app/schemas/gofai/cpl-plan.json',
  title: 'CPL-Plan',
  description: 'GOFAI Music+ Executable Plan Representation',
  type: 'object',
  required: [
    'type',
    'id',
    'variant',
    'opcodes',
    'cost',
    'satisfaction',
    'satisfiesGoals',
    'respectsConstraints',
    'schemaVersion',
  ],
  properties: {
    type: { const: 'plan' },
    id: { type: 'string' },
    variant: { enum: ['sequential', 'parallel', 'conditional'] },
    opcodes: {
      type: 'array',
      items: { $ref: '#/definitions/CPLOpcode' },
    },
    cost: { type: 'number' },
    satisfaction: { type: 'number', minimum: 0, maximum: 1 },
    satisfiesGoals: { type: 'array', items: { type: 'string' } },
    respectsConstraints: { type: 'array', items: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } },
    schemaVersion: { $ref: '#/definitions/SemanticVersion' },
    provenance: { $ref: '#/definitions/Provenance' },
  },
  definitions: {
    SemanticVersion: {
      type: 'object',
      required: ['major', 'minor', 'patch'],
      properties: {
        major: { type: 'integer', minimum: 0 },
        minor: { type: 'integer', minimum: 0 },
        patch: { type: 'integer', minimum: 0 },
      },
    },
    Provenance: {
      type: 'object',
      properties: {
        span: {
          type: 'array',
          items: { type: 'integer' },
          minItems: 2,
          maxItems: 2,
        },
        lexemeId: { type: 'string' },
        ruleId: { type: 'string' },
        frameId: { type: 'string' },
        namespace: { type: 'string' },
        origin: { type: 'string' },
      },
    },
    CPLOpcode: {
      type: 'object',
      required: [
        'type',
        'id',
        'opcodeId',
        'category',
        'scope',
        'params',
        'cost',
        'risk',
        'destructive',
        'requiresPreview',
      ],
      properties: {
        type: { const: 'opcode' },
        id: { type: 'string' },
        opcodeId: { type: 'string' },
        category: {
          enum: ['event', 'structure', 'routing', 'production', 'dsp', 'metadata'],
        },
        scope: {
          type: 'object',
        },
        params: {
          type: 'object',
        },
        cost: { type: 'number' },
        risk: { enum: ['low', 'medium', 'high'] },
        destructive: { type: 'boolean' },
        requiresPreview: { type: 'boolean' },
        reason: { type: 'string' },
        provenance: { $ref: '#/definitions/Provenance' },
      },
    },
  },
} as const;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for CPL nodes.
 */
export function isCPLNode(value: unknown): value is CPLNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'id' in value
  );
}

/**
 * Type guard for CPL-Intent.
 */
export function isCPLIntent(value: unknown): value is CPLIntent {
  return (
    isCPLNode(value) &&
    value.type === 'intent' &&
    'goals' in value &&
    'constraints' in value &&
    'preferences' in value
  );
}

/**
 * Type guard for CPL-Plan.
 */
export function isCPLPlan(value: unknown): value is CPLPlan {
  return (
    isCPLNode(value) &&
    value.type === 'plan' &&
    'opcodes' in value &&
    'cost' in value
  );
}

/**
 * Type guard for CPL-Goal.
 */
export function isCPLGoal(value: unknown): value is CPLGoal {
  return (
    isCPLNode(value) && value.type === 'goal' && 'variant' in value
  );
}

/**
 * Type guard for CPL-Constraint.
 */
export function isCPLConstraint(value: unknown): value is CPLConstraint {
  return (
    isCPLNode(value) &&
    value.type === 'constraint' &&
    'variant' in value &&
    'strength' in value
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extract all holes from a CPL-Intent.
 */
export function extractHoles(intent: CPLIntent): readonly CPLHole[] {
  return intent.holes ?? [];
}

/**
 * Check if intent has critical holes that block execution.
 */
export function hasCriticalHoles(intent: CPLIntent): boolean {
  const holes = extractHoles(intent);
  return holes.some(h => h.priority === 'critical');
}

/**
 * Get all entity references from a CPL tree.
 */
export function extractEntityRefs(node: CPLNode): CPLEntityRef[] {
  const refs: CPLEntityRef[] = [];

  function visit(n: unknown): void {
    if (typeof n !== 'object' || n === null) return;

    if (isCPLNode(n) && n.type === 'entity-ref') {
      refs.push(n as CPLEntityRef);
    }

    // Recurse into children
    for (const value of Object.values(n)) {
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else {
        visit(value);
      }
    }
  }

  visit(node);
  return refs;
}

/**
 * Pretty-print a CPL node for debugging.
 */
export function prettyPrintCPL(node: CPLNode, indent = 0): string {
  const spaces = ' '.repeat(indent);
  const lines: string[] = [`${spaces}${node.type}#${node.id}`];

  if (node.provenance?.origin) {
    lines.push(`${spaces}  origin: ${node.provenance.origin}`);
  }

  // Add type-specific details
  if (isCPLIntent(node)) {
    lines.push(`${spaces}  goals: ${node.goals.length}`);
    lines.push(`${spaces}  constraints: ${node.constraints.length}`);
    if (node.holes && node.holes.length > 0) {
      lines.push(`${spaces}  holes: ${node.holes.length}`);
    }
  } else if (isCPLPlan(node)) {
    lines.push(`${spaces}  opcodes: ${node.opcodes.length}`);
    lines.push(`${spaces}  cost: ${node.cost}`);
    lines.push(`${spaces}  satisfaction: ${node.satisfaction}`);
  }

  return lines.join('\n');
}
