/**
 * GOFAI Invariants Module — Entry Point
 *
 * This module provides the semantic safety invariants system for GOFAI Music+.
 * All invariants are executable checks, not just documentation.
 *
 * @module gofai/invariants
 */

// =============================================================================
// Re-exports
// =============================================================================

// Core types and utilities
export {
  // ID and builder
  invariantId,
  InvariantBuilder,

  // Result helpers
  ok,
  violation,
  hasViolations,
  getViolations,
  getViolationsBySeverity,
  assertNoCriticalViolations,
  assertNoViolations,

  // Constraint helpers
  constraintSatisfied,
  constraintViolated,

  // Effect helpers
  requiresApproval,
  isReadOnly,

  // Undo token helpers
  createUndoTokenFactory,

  // Presupposition helpers
  presuppositionHolds,
  presuppositionFailed,

  // Ambiguity helpers
  noAmbiguity,
  hasAmbiguity,

  // Determinism helpers
  verifyDeterminism,
  assertDeterministic,

  // Report generation
  generateInvariantReport,

  // Error type
  InvariantViolationError,

  // Config
  DEFAULT_SANDBOX_CONFIG,

  // Types
  type InvariantId,
  type InvariantSeverity,
  type InvariantCategory,
  type ViolationEvidence,
  type InvariantCheckResult,
  type InvariantDefinition,
  type InvariantRegistry,
  type VerifiableConstraint,
  type ConstraintVerificationResult,
  type EffectType,
  type EffectMetadata,
  type UndoToken,
  type UndoTokenFactory,
  type OperationScope,
  type ScopeCalculator,
  type Presupposition,
  type PresuppositionResult,
  type AmbiguityType,
  type DetectedAmbiguity,
  type AmbiguityDetectionResult,
  type ExtensionSandboxConfig,
  type SandboxResult,
  type SandboxError,
} from './types';

// Constraint verifiers
export {
  // Individual verifiers
  verifyMelodyPreserved,
  verifyHarmonyPreserved,
  verifyRhythmPreserved,
  verifyStructurePreserved,
  verifyTempoConstraint,
  verifyKeyConstraint,
  verifyMeterConstraint,
  verifyRangeLimit,
  verifyNoNewLayers,
  verifyNoNewChords,
  verifyOnlyChange,
  verifyExclude,
  verifyLeastChange,
  verifyPreserve,

  // Registry
  createConstraintVerifierRegistry,
  CONSTRAINT_VERIFIERS,

  // Types
  type NoteEvent,
  type ChordEvent,
  type SectionMarker,
  type LayerSnapshot,
  type ProjectStateSnapshot,
  type ConstraintVerifierRegistry,
  type ConstraintVerifierFunction,
} from './constraint-verifiers';

// Core invariants
export {
  CORE_INVARIANTS,
  checkCoreInvariants,
  checkCriticalInvariants,

  // Types
  type CPLOperation,
  type InvariantContext,
} from './core-invariants';
