/**
 * @file Plan Serialization and Persistence
 * @module gofai/planning/plan-serialization
 *
 * Implements Step 300 from gofai_goalB.md:
 * - Add a plan serialization format (with schema + provenance)
 * - Plans can be saved, shared, and replayed
 * - Include full provenance for audit and debugging
 * - Support versioning for forward/backward compatibility
 * - Enable deterministic replay across sessions
 *
 * The serialization format must:
 * - Be human-readable (JSON-based)
 * - Include complete provenance chain
 * - Preserve all metadata for explanation
 * - Support schema evolution
 * - Be stable across compiler versions
 * - Allow validation before deserialization
 *
 * @see src/gofai/planning/plan-types.ts (core plan types)
 * @see src/gofai/canon/cpl-types.ts (CPL schema versioning)
 * @see src/persistence/schema-versioning.ts (versioning strategy)
 */

import type {
  CPLPlan,
  Opcode,
  OpcodeId,
  OpcodePrecondition,
  OpcodePostcondition,
} from './plan-types';
import type { CPLGoal, CPLConstraint, CPLScope } from '../canon/cpl-types';

// ============================================================================
// Serialization Schema Version
// ============================================================================

/**
 * Current version of the plan serialization schema
 * Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes to structure
 * - MINOR: New fields (backward compatible)
 * - PATCH: Bug fixes, clarifications
 */
export const PLAN_SCHEMA_VERSION = '1.0.0';

/**
 * Minimum supported version for deserialization
 */
export const MIN_SUPPORTED_VERSION = '1.0.0';

// ============================================================================
// Serialized Plan Format
// ============================================================================

/**
 * Complete serialized representation of a plan
 * This is the top-level structure saved to disk or transmitted
 */
export interface SerializedPlan {
  /** Schema version for compatibility checking */
  readonly schemaVersion: string;

  /** Unique identifier for this serialized instance */
  readonly serializedId: string;

  /** Timestamp when serialized (ISO 8601) */
  readonly serializedAt: string;

  /** The plan itself */
  readonly plan: SerializedPlanCore;

  /** Full provenance chain */
  readonly provenance: SerializedProvenance;

  /** Compiler version that generated this plan */
  readonly compilerVersion: CompilerVersion;

  /** Optional metadata */
  readonly metadata?: SerializedMetadata;

  /** Checksum for integrity validation */
  readonly checksum: string;
}

/**
 * Core plan structure (minimal for execution)
 */
export interface SerializedPlanCore {
  /** Plan ID */
  readonly id: string;

  /** Goals this plan satisfies */
  readonly goals: readonly SerializedGoal[];

  /** Constraints preserved by this plan */
  readonly constraints: readonly SerializedConstraint[];

  /** Ordered sequence of operations */
  readonly steps: readonly SerializedOpcode[];

  /** Plan quality score */
  readonly score: SerializedScore;

  /** Scope this plan applies to */
  readonly scope: SerializedScope;
}

/**
 * Serialized opcode with all execution details
 */
export interface SerializedOpcode {
  /** Opcode identifier */
  readonly opcodeId: OpcodeId;

  /** Operation category */
  readonly category: string;

  /** Risk level */
  readonly risk: string;

  /** Human-readable description */
  readonly description: string;

  /** Parameters for execution */
  readonly parameters: Record<string, any>;

  /** Preconditions that must be met */
  readonly preconditions: readonly SerializedPrecondition[];

  /** Expected effects */
  readonly postconditions: readonly SerializedPostcondition[];

  /** Reason trace linking to goals */
  readonly reasonTrace?: SerializedReasonTrace;
}

/**
 * Serialized precondition
 */
export interface SerializedPrecondition {
  readonly type: string;
  readonly description: string;
  readonly required: boolean;
}

/**
 * Serialized postcondition
 */
export interface SerializedPostcondition {
  readonly type: string;
  readonly description: string;
  readonly scope: SerializedScope;
}

/**
 * Serialized reason trace
 */
export interface SerializedReasonTrace {
  /** Goals this step serves */
  readonly goalIds: readonly string[];

  /** Levers activated */
  readonly levers: readonly string[];

  /** Why this opcode was chosen */
  readonly rationale: string;
}

/**
 * Serialized goal
 */
export interface SerializedGoal {
  readonly type: string;
  readonly description?: string;
  readonly [key: string]: any;
}

/**
 * Serialized constraint
 */
export interface SerializedConstraint {
  readonly type: string;
  readonly description?: string;
  readonly [key: string]: any;
}

/**
 * Serialized scope
 */
export interface SerializedScope {
  readonly type: string;
  readonly [key: string]: any;
}

/**
 * Serialized score breakdown
 */
export interface SerializedScore {
  readonly total: number;
  readonly goalSatisfaction?: number;
  readonly editCost?: number;
  readonly constraintRisk?: number;
  readonly breakdown?: Record<string, number>;
}

// ============================================================================
// Provenance Information
// ============================================================================

/**
 * Complete provenance chain for a plan
 */
export interface SerializedProvenance {
  /** Original user utterance(s) */
  readonly utterances: readonly string[];

  /** CPL-Intent that generated this plan */
  readonly intent?: any; // Full CPL-Intent structure

  /** Planning strategy used */
  readonly strategy: string;

  /** Alternative plans that were considered */
  readonly alternatives?: readonly SerializedAlternative[];

  /** Parent plan if this is a modification */
  readonly derivedFrom?: string;

  /** Modifications made from parent */
  readonly modifications?: readonly SerializedModification[];

  /** User who created/approved this plan */
  readonly author?: string;

  /** Session context */
  readonly session?: SerializedSessionContext;
}

/**
 * Alternative plan that was considered
 */
export interface SerializedAlternative {
  readonly planId: string;
  readonly score: SerializedScore;
  readonly distinguishingFeatures: readonly string[];
  readonly whyNotChosen: string;
}

/**
 * Modification from a parent plan
 */
export interface SerializedModification {
  readonly type: 'parameter-adjustment' | 'step-removal' | 'step-addition' | 'reordering';
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Session context when plan was created
 */
export interface SerializedSessionContext {
  readonly sessionId: string;
  readonly turnIndex: number;
  readonly focusStack: readonly string[];
  readonly salience: Record<string, number>;
}

// ============================================================================
// Compiler Version Information
// ============================================================================

/**
 * Version of the GOFAI compiler that generated this plan
 */
export interface CompilerVersion {
  /** Core compiler version */
  readonly core: string;

  /** Lexicon version/hash */
  readonly lexicon: string;

  /** Grammar version/hash */
  readonly grammar: string;

  /** Planner version */
  readonly planner: string;

  /** Active extensions and their versions */
  readonly extensions: Record<string, string>;

  /** Prolog KB version/hash */
  readonly prologKB?: string;
}

// ============================================================================
// Optional Metadata
// ============================================================================

/**
 * Optional metadata for plan organization and discovery
 */
export interface SerializedMetadata {
  /** Human-readable name */
  readonly name?: string;

  /** Description of what this plan does */
  readonly description?: string;

  /** Tags for categorization */
  readonly tags?: readonly string[];

  /** Musical context (genre, style, etc.) */
  readonly musicalContext?: Record<string, string>;

  /** Performance metrics (if plan was applied) */
  readonly performance?: {
    readonly executionTimeMs?: number;
    readonly eventsModified?: number;
    readonly userRating?: number;
  };

  /** Share settings */
  readonly sharing?: {
    readonly public: boolean;
    readonly license?: string;
    readonly attribution?: string;
  };
}

// ============================================================================
// Serialization Functions
// ============================================================================

/**
 * Serialize a plan to JSON-compatible format
 */
export function serializePlan(
  plan: CPLPlan,
  compilerVersion: CompilerVersion,
  provenance?: Partial<SerializedProvenance>,
  metadata?: SerializedMetadata
): SerializedPlan {
  const serializedAt = new Date().toISOString();
  const serializedId = generateSerializedId(plan, serializedAt);

  const serialized: any = {
    schemaVersion: PLAN_SCHEMA_VERSION,
    serializedId,
    serializedAt,
    plan: serializePlanCore(plan),
    provenance: {
      utterances: [],
      strategy: 'unknown',
      ...provenance,
    },
    compilerVersion,
    metadata,
  };

  // Compute checksum over serialized content
  const checksum = computeChecksum(serialized);

  return {
    ...serialized,
    checksum,
  };
}

/**
 * Serialize core plan structure
 */
function serializePlanCore(plan: CPLPlan): SerializedPlanCore {
  return {
    id: plan.id,
    goals: plan.goals.map(serializeGoal),
    constraints: plan.constraints.map(serializeConstraint),
    steps: plan.opcodes.map(serializeOpcode),
    score: {
      total: plan.totalCost,
      goalSatisfaction: plan.satisfactionScore,
    },
    scope: serializeScope(plan.scope),
  };
}

/**
 * Serialize an opcode
 */
function serializeOpcode(opcode: any): SerializedOpcode {
  return {
    opcodeId: opcode.id,
    category: opcode.category,
    risk: opcode.risk,
    description: opcode.description,
    parameters: { ...opcode.params },
    preconditions: opcode.preconditions.map(serializePrecondition),
    postconditions: opcode.postconditions.map(serializePostcondition),
    reasonTrace: opcode.reason
      ? {
          goalIds: opcode.satisfiesGoals || [],
          levers: [],
          rationale: opcode.reason,
        }
      : undefined,
  } as SerializedOpcode;
}

/**
 * Serialize a goal (preserves structure for any goal type)
 */
function serializeGoal(goal: CPLGoal): SerializedGoal {
  return { ...goal };
}

/**
 * Serialize a constraint
 */
function serializeConstraint(constraint: CPLConstraint): SerializedConstraint {
  return { ...constraint };
}

/**
 * Serialize a scope
 */
function serializeScope(scope: CPLScope): SerializedScope {
  return { ...scope };
}

function serializeScore(_totalCost: number, _satisfactionScore?: number): SerializedScore {
  return {
    total: _totalCost,
    goalSatisfaction: _satisfactionScore,
  };
}

/**
 * Serialize precondition
 */
function serializePrecondition(
  precondition: OpcodePrecondition
): SerializedPrecondition {
  return {
    type: precondition.type,
    description: precondition.description,
    required: precondition.required,
  };
}

/**
 * Serialize postcondition
 */
function serializePostcondition(
  postcondition: OpcodePostcondition
): SerializedPostcondition {
  return {
    type: postcondition.type,
    description: postcondition.description,
    scope: serializeScope(postcondition.scope),
  };
}

// ============================================================================
// Deserialization Functions
// ============================================================================

/**
 * Deserialize a plan from JSON
 */
export function deserializePlan(
  serialized: SerializedPlan
): DeserializationResult {
  // Validate schema version
  const versionCheck = validateSchemaVersion(serialized.schemaVersion);
  if (!versionCheck.compatible) {
    return {
      success: false,
      errors: [versionCheck.error!],
    };
  }

  // Validate checksum
  const checksumValid = validateChecksum(serialized);
  if (!checksumValid) {
    return {
      success: false,
      errors: ['Checksum validation failed - plan may be corrupted'],
    };
  }

  try {
    // Reconstruct plan object
    const plan: any = {
      id: serialized.plan.id,
      opcodes: serialized.plan.steps.map(deserializeOpcode),
      totalCost: serialized.plan.score.total,
      satisfactionScore: serialized.plan.score.goalSatisfaction || 0,
      goals: serialized.plan.goals as any,
      constraints: serialized.plan.constraints as any,
      scope: { ...serialized.plan.scope, id: 'deserialized-scope' } as any,
      explanation: 'Deserialized plan',
      warnings: [],
      requiredCapabilities: [],
      riskLevel: 'low' as const,
      requiresPreview: false,
      confidence: 0.8,
      provenance: [
        {
          goalId: 'deserialized',
          opcodeIds: [],
          reasoning: 'Loaded from serialized format',
        },
      ],
    };

    return {
      success: true,
      plan: plan as CPLPlan,
      provenance: serialized.provenance,
      compilerVersion: serialized.compilerVersion,
      metadata: serialized.metadata,
      warnings: versionCheck.warnings || [],
    } as any;
  } catch (error) {
    return {
      success: false,
      errors: [`Deserialization failed: ${error}`],
    };
  }
}

/**
 * Deserialize an opcode
 */
function deserializeOpcode(serialized: SerializedOpcode): any {
  // This is simplified - real implementation would construct proper Opcode subtypes
  return {
    id: serialized.opcodeId,
    category: serialized.category,
    name: 'deserialized',
    description: serialized.description,
    scope: { type: 'scope', id: 'deserialized-scope' },
    params: serialized.parameters,
    requiredCapabilities: [],
    preconditions: serialized.preconditions,
    postconditions: serialized.postconditions,
    cost: 0,
    risk: serialized.risk,
    destructive: false,
    requiresPreview: false,
    reason: serialized.reasonTrace?.rationale,
    satisfiesGoals: serialized.reasonTrace?.goalIds,
  };
}

/**
 * Result of deserialization
 */
export interface DeserializationResult {
  readonly success: boolean;
  readonly plan?: CPLPlan;
  readonly provenance?: SerializedProvenance;
  readonly compilerVersion?: CompilerVersion;
  readonly metadata?: SerializedMetadata;
  readonly errors?: readonly string[];
  readonly warnings?: readonly string[];
}

// ============================================================================
// Version Compatibility
// ============================================================================

/**
 * Check if a schema version is compatible
 */
function validateSchemaVersion(
  version: string
): { compatible: boolean; error?: string; warnings?: string[] } {
  const versionParts = version.split('.').map(Number);
  const minParts = MIN_SUPPORTED_VERSION.split('.').map(Number);
  const currentParts = PLAN_SCHEMA_VERSION.split('.').map(Number);
  
  const major = versionParts[0] || 0;
  const minor = versionParts[1] || 0;
  const minMajor = minParts[0] || 0;
  const minMinor = minParts[1] || 0;
  const currentMajor = currentParts[0] || 0;
  const currentMinor = currentParts[1] || 0;

  // Major version must match
  if (major !== currentMajor) {
    return {
      compatible: false,
      error: `Incompatible schema version: ${version} (current: ${PLAN_SCHEMA_VERSION})`,
    };
  }

  // Check minimum version
  if (major < minMajor || (major === minMajor && minor < minMinor)) {
    return {
      compatible: false,
      error: `Schema version ${version} is too old (minimum: ${MIN_SUPPORTED_VERSION})`,
    };
  }

  const warnings: string[] = [];

  // Warn if newer minor version
  if (minor > currentMinor) {
    warnings.push(
      `Plan was created with newer schema version ${version}. Some features may not be supported.`
    );
  }

  return { compatible: true, warnings };
}

// ============================================================================
// Integrity Validation
// ============================================================================

/**
 * Generate a unique ID for this serialization
 */
function generateSerializedId(plan: CPLPlan, timestamp: string): string {
  return `${plan.id}-${timestamp}`;
}

/**
 * Compute checksum for integrity validation
 */
function computeChecksum(serialized: Omit<SerializedPlan, 'checksum'>): string {
  // In production, use a proper hash function (SHA-256)
  // For now, simplified version
  const str = JSON.stringify(serialized);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validate checksum
 */
function validateChecksum(serialized: SerializedPlan): boolean {
  const { checksum, ...rest } = serialized;
  const computed = computeChecksum(rest);
  return computed === checksum;
}

// ============================================================================
// File I/O Helpers
// ============================================================================

/**
 * Convert serialized plan to JSON string
 */
export function planToJSON(serialized: SerializedPlan, pretty = true): string {
  return JSON.stringify(serialized, null, pretty ? 2 : 0);
}

/**
 * Parse JSON string to serialized plan
 */
export function planFromJSON(json: string): SerializedPlan {
  return JSON.parse(json);
}

/**
 * Validate a serialized plan structure
 */
export function validateSerializedPlan(
  data: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required top-level fields
  if (!data.schemaVersion) errors.push('Missing schemaVersion');
  if (!data.serializedId) errors.push('Missing serializedId');
  if (!data.serializedAt) errors.push('Missing serializedAt');
  if (!data.plan) errors.push('Missing plan');
  if (!data.provenance) errors.push('Missing provenance');
  if (!data.compilerVersion) errors.push('Missing compilerVersion');
  if (!data.checksum) errors.push('Missing checksum');

  // Validate plan structure
  if (data.plan) {
    if (!data.plan.id) errors.push('Missing plan.id');
    if (!data.plan.goals) errors.push('Missing plan.goals');
    if (!data.plan.constraints) errors.push('Missing plan.constraints');
    if (!Array.isArray(data.plan.steps)) errors.push('plan.steps must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Exports (type-only exports to avoid duplication)
// ============================================================================

export type {
  SerializedPlan,
  SerializedPlanCore,
  SerializedOpcode,
  SerializedProvenance,
  CompilerVersion,
  SerializedMetadata,
  DeserializationResult,
};
