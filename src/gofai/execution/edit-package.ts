/**
 * @file Edit Package - The Atomic Unit of Applied Edits
 * @module gofai/execution/edit-package
 * 
 * Implements Step 301: Define `EditPackage` as the atomic applied unit:
 * contains CPL, plan, diff, provenance, undo token, and timestamps.
 * 
 * An EditPackage is the complete record of a successfully executed musical edit.
 * It is the unit that:
 * - Gets stored in edit history
 * - Can be serialized and shared
 * - Enables undo/redo
 * - Provides audit trails
 * - Links intentions to outcomes
 * 
 * Design principles:
 * - Atomic: All-or-nothing application
 * - Serializable: Can be saved and replayed
 * - Inspectable: Full transparency
 * - Reversible: Includes undo information
 * - Traceable: Complete provenance chain
 * 
 * @see gofai_goalB.md Step 301
 * @see docs/gofai/architecture.md
 */

import type { GofaiId } from '../canon/types.js';

// ============================================================================
// CPL Types (referenced from other modules)
// ============================================================================

/**
 * CPL-Intent: High-level user intention.
 * 
 * The parsed and pragmatically-resolved representation of what the user
 * asked for, with all holes filled or marked as clarifications.
 */
export interface CPLIntent {
  /** CPL node type */
  readonly type: 'cpl:intent';
  
  /** Schema version for CPL */
  readonly schemaVersion: string;
  
  /** Goals (what to achieve) */
  readonly goals: readonly Goal[];
  
  /** Constraints (what must not change) */
  readonly constraints: readonly Constraint[];
  
  /** Scope (where to apply) */
  readonly scope: Scope;
  
  /** Dialogue context */
  readonly context?: DialogueContext;
  
  /** Provenance metadata */
  readonly provenance: CPLProvenance;
}

/**
 * CPL-Plan: Concrete execution plan.
 * 
 * The deterministic sequence of opcodes that will implement the user's
 * intention while respecting all constraints.
 */
export interface CPLPlan {
  /** CPL node type */
  readonly type: 'cpl:plan';
  
  /** Schema version */
  readonly schemaVersion: string;
  
  /** Sequence of operations to execute */
  readonly opcodes: readonly PlanOpcode[];
  
  /** Preconditions for safe execution */
  readonly preconditions: readonly Precondition[];
  
  /** Expected postconditions */
  readonly postconditions: readonly Postcondition[];
  
  /** Cost score (lower = cheaper) */
  readonly costScore: number;
  
  /** Goal satisfaction score (higher = better) */
  readonly satisfactionScore: number;
  
  /** Plan provenance (how was it generated) */
  readonly provenance: PlanProvenance;
  
  /** Human-readable explanation */
  readonly explanation: string;
}

/**
 * A goal in CPL-Intent.
 */
export interface Goal {
  readonly type: 'axis-change' | 'action' | 'query' | 'structure' | 'relative';
  readonly id: string;
  readonly data: unknown;
}

/**
 * A constraint in CPL-Intent.
 */
export interface Constraint {
  readonly type: 'preserve' | 'only-change' | 'within-range' | 'maintain';
  readonly id: string;
  readonly data: unknown;
}

/**
 * A scope specification.
 */
export interface Scope {
  readonly type: 'section' | 'range' | 'layer' | 'selection' | 'all';
  readonly data: unknown;
}

/**
 * Dialogue context for intent.
 */
export interface DialogueContext {
  readonly turnId: string;
  readonly priorTurns: readonly string[];
  readonly salientEntities: readonly string[];
}

/**
 * Provenance for CPL construction.
 */
export interface CPLProvenance {
  /** Original natural language utterance */
  readonly utterance: string;
  
  /** Lexical decisions */
  readonly lexicalMappings: readonly LexicalMapping[];
  
  /** Pragmatic resolutions */
  readonly pragmaticResolutions: readonly Resolution[];
  
  /** Timestamp when CPL was generated */
  readonly timestamp: number;
}

/**
 * A lexical mapping from word to meaning.
 */
export interface LexicalMapping {
  readonly wordSpan: { start: number; end: number };
  readonly word: string;
  readonly lexemeId: string;
  readonly meaningId: string;
}

/**
 * A pragmatic resolution.
 */
export interface Resolution {
  readonly type: 'anaphora' | 'scope' | 'amount' | 'referent';
  readonly resolvedValue: unknown;
  readonly candidates: readonly unknown[];
  readonly rule: string;
}

/**
 * Plan provenance information.
 */
export interface PlanProvenance {
  /** Compiler version that generated this plan */
  readonly compilerVersion: string;
  
  /** Planning strategy used */
  readonly strategy: string;
  
  /** Goal-to-lever mappings */
  readonly leverMappings: readonly LeverMapping[];
  
  /** Timestamp when plan was generated */
  readonly timestamp: number;
}

/**
 * Goal-to-lever mapping.
 */
export interface LeverMapping {
  readonly goalId: string;
  readonly leverIds: readonly string[];
  readonly opcodeIds: readonly string[];
  readonly reasoning: string;
}

/**
 * A plan opcode (edit operation).
 */
export interface PlanOpcode {
  /** Opcode ID */
  readonly id: string;
  
  /** Opcode type (namespaced) */
  readonly type: GofaiId;
  
  /** Operation parameters */
  readonly parameters: Record<string, unknown>;
  
  /** Scope for this opcode */
  readonly scope: Scope;
  
  /** Which goal this serves */
  readonly servesGoals: readonly string[];
  
  /** Estimated cost */
  readonly cost: number;
  
  /** Human-readable explanation */
  readonly explanation: string;
}

/**
 * A precondition for plan execution.
 */
export interface Precondition {
  readonly type: 'entity-exists' | 'property-holds' | 'capability-available';
  readonly condition: string;
  readonly data: unknown;
}

/**
 * A postcondition expected after execution.
 */
export interface Postcondition {
  readonly type: 'constraint-satisfied' | 'goal-achieved' | 'state-valid';
  readonly condition: string;
  readonly data: unknown;
}

// ============================================================================
// Diff Types
// ============================================================================

/**
 * A diff describing changes made during execution.
 * 
 * The diff is a structured, deterministic record of what changed when the
 * plan was applied to the project.
 */
export interface ExecutionDiff {
  /** Diff format version */
  readonly version: string;
  
  /** Before snapshot (affected entities only) */
  readonly before: StateSnapshot;
  
  /** After snapshot (affected entities only) */
  readonly after: StateSnapshot;
  
  /** Detailed change records */
  readonly changes: readonly DiffChange[];
  
  /** Constraint verification results */
  readonly verifications: readonly ConstraintVerification[];
  
  /** Human-readable summary */
  readonly summary: string;
  
  /** When the diff was computed */
  readonly timestamp: number;
}

/**
 * A snapshot of relevant project state.
 */
export interface StateSnapshot {
  /** Events snapshot */
  readonly events: readonly EventSnapshot[];
  
  /** Track state snapshot */
  readonly tracks: readonly TrackSnapshot[];
  
  /** Card state snapshot */
  readonly cards: readonly CardSnapshot[];
  
  /** Section markers snapshot */
  readonly sections: readonly SectionSnapshot[];
  
  /** Routing snapshot */
  readonly routing: readonly ConnectionSnapshot[];
}

/**
 * Event snapshot.
 */
export interface EventSnapshot {
  readonly id: string;
  readonly kind: string;
  readonly startTick: number;
  readonly durationTicks: number;
  readonly payload: unknown;
  readonly trackId: string;
}

/**
 * Track snapshot.
 */
export interface TrackSnapshot {
  readonly id: string;
  readonly name: string;
  readonly gain: number;
  readonly pan: number;
  readonly muted: boolean;
}

/**
 * Card snapshot.
 */
export interface CardSnapshot {
  readonly id: string;
  readonly type: string;
  readonly parameters: Record<string, unknown>;
  readonly bypassed: boolean;
  readonly trackId: string;
}

/**
 * Section marker snapshot.
 */
export interface SectionSnapshot {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly startTick: number;
  readonly endTick: number;
}

/**
 * Connection snapshot.
 */
export interface ConnectionSnapshot {
  readonly id: string;
  readonly source: { trackId: string; port: string };
  readonly target: { trackId: string; port: string };
}

/**
 * A single change in the diff.
 */
export interface DiffChange {
  /** Change type */
  readonly type: 'added' | 'removed' | 'modified';
  
  /** Entity type changed */
  readonly entityType: 'event' | 'track' | 'card' | 'section' | 'routing';
  
  /** Entity ID */
  readonly entityId: string;
  
  /** Path to changed property (for modifications) */
  readonly path?: string;
  
  /** Old value (for modifications/removals) */
  readonly oldValue?: unknown;
  
  /** New value (for modifications/additions) */
  readonly newValue?: unknown;
  
  /** Which opcode caused this change */
  readonly causedByOpcodeId: string;
}

/**
 * Constraint verification result.
 */
export interface ConstraintVerification {
  /** Which constraint was checked */
  readonly constraintId: string;
  
  /** Constraint type */
  readonly constraintType: string;
  
  /** Did it pass? */
  readonly passed: boolean;
  
  /** Violation details (if failed) */
  readonly violation?: ConstraintViolation;
}

/**
 * Details of a constraint violation.
 */
export interface ConstraintViolation {
  /** Human-readable explanation */
  readonly message: string;
  
  /** Counterexample showing violation */
  readonly counterexample: unknown;
  
  /** Which changes violated the constraint */
  readonly violatingChanges: readonly string[];
}

// ============================================================================
// Undo Token
// ============================================================================

/**
 * Undo token: A linear resource for reversing an edit.
 * 
 * Tokens are "consumed" when used, preventing accidental double-undo.
 * Each token encodes the complete inverse operation.
 */
export interface UndoToken {
  /** Token ID (unique) */
  readonly id: string;
  
  /** Which edit package this undoes */
  readonly editPackageId: string;
  
  /** Inverse operations */
  readonly inverseOpcodes: readonly PlanOpcode[];
  
  /** Expected pre-state for undo */
  readonly expectedState: StateFingerprint;
  
  /** Token creation time */
  readonly createdAt: number;
  
  /** Token expiration (if any) */
  readonly expiresAt?: number;
  
  /** Status */
  readonly status: 'valid' | 'consumed' | 'invalidated' | 'expired';
}

/**
 * Fingerprint of project state for validation.
 */
export interface StateFingerprint {
  /** Version or hash of affected entities */
  readonly entityVersions: Record<string, string>;
  
  /** Quick structural check */
  readonly structureHash: string;
}

// ============================================================================
// Edit Package
// ============================================================================

/**
 * Edit Package: The complete record of an applied edit.
 * 
 * This is the atomic unit stored in history, serialized for sharing,
 * and used for undo/redo.
 */
export interface EditPackage {
  /** Unique package ID */
  readonly id: string;
  
  /** Package format version */
  readonly version: string;
  
  /** Original user intention (CPL-Intent) */
  readonly intent: CPLIntent;
  
  /** Executed plan (CPL-Plan) */
  readonly plan: CPLPlan;
  
  /** What actually changed (diff) */
  readonly diff: ExecutionDiff;
  
  /** Undo token for reversal */
  readonly undoToken: UndoToken;
  
  /** Complete provenance chain */
  readonly provenance: EditPackageProvenance;
  
  /** Timestamps */
  readonly timestamps: {
    readonly intentCreated: number;
    readonly planGenerated: number;
    readonly executed: number;
    readonly diffComputed: number;
  };
  
  /** Compiler and extension versions */
  readonly environment: ExecutionEnvironment;
  
  /** Success/failure status */
  readonly status: ExecutionStatus;
  
  /** Any errors or warnings */
  readonly diagnostics: readonly Diagnostic[];
}

/**
 * Edit package provenance.
 */
export interface EditPackageProvenance {
  /** Session ID */
  readonly sessionId: string;
  
  /** Turn ID in dialogue */
  readonly turnId: string;
  
  /** User identifier (if available) */
  readonly userId?: string;
  
  /** Board context */
  readonly boardContext: {
    readonly boardType: string;
    readonly controlLevel: string;
  };
  
  /** Extension namespace contributions */
  readonly extensionContributions: readonly ExtensionContribution[];
}

/**
 * Extension contribution to an edit.
 */
export interface ExtensionContribution {
  readonly namespace: string;
  readonly version: string;
  readonly contributedOpcodes: readonly string[];
  readonly contributedMeanings: readonly string[];
}

/**
 * Execution environment.
 */
export interface ExecutionEnvironment {
  /** GOFAI compiler version */
  readonly compilerVersion: string;
  
  /** CardPlay version */
  readonly cardplayVersion: string;
  
  /** Schema versions */
  readonly schemaVersions: {
    readonly cpl: string;
    readonly plan: string;
    readonly diff: string;
  };
  
  /** Loaded extension namespaces */
  readonly loadedExtensions: readonly string[];
}

/**
 * Execution status.
 */
export type ExecutionStatus =
  | { readonly type: 'success' }
  | { readonly type: 'partial'; readonly reason: string }
  | { readonly type: 'failed'; readonly reason: string }
  | { readonly type: 'rolledback'; readonly reason: string };

/**
 * A diagnostic message.
 */
export interface Diagnostic {
  readonly severity: 'error' | 'warning' | 'info';
  readonly code: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

// ============================================================================
// Edit Package Operations
// ============================================================================

/**
 * Create an edit package from execution results.
 */
export function createEditPackage(options: {
  intent: CPLIntent;
  plan: CPLPlan;
  diff: ExecutionDiff;
  undoToken: UndoToken;
  sessionId: string;
  turnId: string;
  boardContext: { boardType: string; controlLevel: string };
  compilerVersion: string;
  cardplayVersion: string;
  status: ExecutionStatus;
  diagnostics?: readonly Diagnostic[];
}): EditPackage {
  const now = Date.now();
  
  return {
    id: generateEditPackageId(),
    version: '1.0.0',
    intent: options.intent,
    plan: options.plan,
    diff: options.diff,
    undoToken: options.undoToken,
    provenance: {
      sessionId: options.sessionId,
      turnId: options.turnId,
      boardContext: options.boardContext,
      extensionContributions: extractExtensionContributions(options.plan),
    },
    timestamps: {
      intentCreated: options.intent.provenance.timestamp,
      planGenerated: options.plan.provenance.timestamp,
      executed: now,
      diffComputed: options.diff.timestamp,
    },
    environment: {
      compilerVersion: options.compilerVersion,
      cardplayVersion: options.cardplayVersion,
      schemaVersions: {
        cpl: options.intent.schemaVersion,
        plan: options.plan.schemaVersion,
        diff: options.diff.version,
      },
      loadedExtensions: [],
    },
    status: options.status,
    diagnostics: options.diagnostics || [],
  };
}

/**
 * Generate a unique edit package ID.
 */
function generateEditPackageId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `edit:${timestamp}:${random}`;
}

/**
 * Extract extension contributions from a plan.
 */
function extractExtensionContributions(plan: CPLPlan): ExtensionContribution[] {
  const contributionsByNamespace = new Map<string, {
    opcodes: Set<string>;
    meanings: Set<string>;
    version: string;
  }>();
  
  // Scan opcodes for namespaced IDs
  for (const opcode of plan.opcodes) {
    const match = opcode.type.match(/^([^:]+):/);
    if (match && match[1] !== 'gofai' && match[1] !== 'core') {
      const namespace = match[1];
      if (!contributionsByNamespace.has(namespace)) {
        contributionsByNamespace.set(namespace, {
          opcodes: new Set(),
          meanings: new Set(),
          version: '1.0.0', // TODO: Get from registry
        });
      }
      contributionsByNamespace.get(namespace)!.opcodes.add(opcode.id);
    }
  }
  
  // Convert to array
  return Array.from(contributionsByNamespace.entries()).map(([namespace, contrib]) => ({
    namespace,
    version: contrib.version,
    contributedOpcodes: Array.from(contrib.opcodes),
    contributedMeanings: Array.from(contrib.meanings),
  }));
}

/**
 * Validate an edit package.
 */
export interface EditPackageValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Validate that an edit package is well-formed.
 */
export function validateEditPackage(pkg: EditPackage): EditPackageValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check version
  if (!pkg.version || pkg.version === '') {
    errors.push('Missing package version');
  }
  
  // Check intent exists
  if (!pkg.intent) {
    errors.push('Missing intent');
  }
  
  // Check plan exists
  if (!pkg.plan) {
    errors.push('Missing plan');
  }
  
  // Check diff exists
  if (!pkg.diff) {
    errors.push('Missing diff');
  }
  
  // Check undo token exists
  if (!pkg.undoToken) {
    errors.push('Missing undo token');
  }
  
  // Check timestamps are in order
  const ts = pkg.timestamps;
  if (ts.intentCreated > ts.planGenerated) {
    errors.push('Intent created after plan generated');
  }
  if (ts.planGenerated > ts.executed) {
    errors.push('Plan generated after execution');
  }
  if (ts.executed > ts.diffComputed) {
    warnings.push('Execution happened after diff computation (unusual)');
  }
  
  // Check status
  if (!pkg.status) {
    errors.push('Missing status');
  }
  
  // Check constraint verifications
  const failedVerifications = pkg.diff.verifications.filter(v => !v.passed);
  if (failedVerifications.length > 0) {
    if (pkg.status.type === 'success') {
      errors.push('Package marked as success but constraints failed');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Serialize an edit package to JSON.
 */
export function serializeEditPackage(pkg: EditPackage): string {
  return JSON.stringify(pkg, null, 2);
}

/**
 * Deserialize an edit package from JSON.
 */
export function deserializeEditPackage(json: string): EditPackage {
  const pkg = JSON.parse(json) as EditPackage;
  
  // Validate after deserialization
  const validation = validateEditPackage(pkg);
  if (!validation.valid) {
    throw new Error(`Invalid edit package: ${validation.errors.join(', ')}`);
  }
  
  return pkg;
}

/**
 * Check if an edit package can be replayed in the current context.
 */
export interface ReplayabilityCheck {
  readonly replayable: boolean;
  readonly reasons: readonly string[];
}

/**
 * Check if an edit package can be replayed.
 */
export function checkReplayability(
  pkg: EditPackage,
  currentCompilerVersion: string,
  currentExtensions: readonly string[]
): ReplayabilityCheck {
  const reasons: string[] = [];
  
  // Check compiler version compatibility
  if (pkg.environment.compilerVersion !== currentCompilerVersion) {
    reasons.push(`Compiler version mismatch: ${pkg.environment.compilerVersion} vs ${currentCompilerVersion}`);
  }
  
  // Check required extensions are loaded
  const requiredNamespaces = pkg.provenance.extensionContributions.map(c => c.namespace);
  const missingExtensions = requiredNamespaces.filter(ns => !currentExtensions.includes(ns));
  if (missingExtensions.length > 0) {
    reasons.push(`Missing extensions: ${missingExtensions.join(', ')}`);
  }
  
  // Check schema versions (major version must match)
  const intentMajor = parseInt(pkg.intent.schemaVersion.split('.')[0]);
  // TODO: Compare against current schema version
  
  return {
    replayable: reasons.length === 0,
    reasons,
  };
}

/**
 * Generate a human-readable summary of an edit package.
 */
export function summarizeEditPackage(pkg: EditPackage): string {
  const lines: string[] = [
    `Edit Package ${pkg.id}`,
    `Status: ${pkg.status.type}`,
    ``,
    `Intent: ${pkg.intent.provenance.utterance}`,
    `Plan: ${pkg.plan.opcodes.length} operations`,
    `Changes: ${pkg.diff.changes.length} modifications`,
    ``,
  ];
  
  // Constraint verifications
  const passed = pkg.diff.verifications.filter(v => v.passed).length;
  const failed = pkg.diff.verifications.filter(v => !v.passed).length;
  lines.push(`Constraints: ${passed} passed, ${failed} failed`);
  lines.push(``);
  
  // Diff summary
  lines.push(`Summary: ${pkg.diff.summary}`);
  
  return lines.join('\n');
}
