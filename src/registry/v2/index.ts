/**
 * @fileoverview Registry V2 - Unified Extension Registry System
 * 
 * The registry v2 system provides a unified approach to managing all
 * extension points in CardPlay:
 * - Cards
 * - Port types
 * - Event kinds
 * - Deck templates
 * - Boards
 * - Themes
 * - Ontology packs
 * - Constraint types
 * - Host action handlers
 * 
 * Key features:
 * - Provenance tracking for all registered entities
 * - Capability-based security with risk classification
 * - Versioned snapshot format with migrations
 * - Stable diff generation for version control
 * - Validation rules and health reports
 * 
 * References:
 * - docs/registry-api.md
 * - docs/registry-diff-format.md
 * - docs/registry-migration-format.md
 * - docs/validator-rules.md
 * 
 * @module registry/v2
 */

// Types
export type {
  RegistryEntryProvenance,
  RegistryEntry,
  RegistryEntryType,
  TypedRegistryEntry,
  RegistrySnapshot,
  RegistryQueryFilter,
  RegistryQueryResult,
} from './types';

// Policy
export {
  RiskLevel,
  CAPABILITY_METADATA,
  getCapabilityMetadata,
  calculateRiskLevel,
  requiresInstallConsent,
  requiresRuntimeConsent,
  validateCapabilityDependencies,
  validateCapabilityConflicts,
  evaluateEntryPolicy,
} from './policy';
export type { CapabilityMetadata, PolicyDecision } from './policy';

// Schema
export {
  CURRENT_SCHEMA_VERSION,
  MIN_SUPPORTED_SCHEMA_VERSION,
  registerMigration,
  createEmptySnapshot,
  validateSnapshot as validateSnapshotStructure,
  migrateSnapshot,
  serializeSnapshot,
  deserializeSnapshot,
  hashEntry,
  cloneSnapshot,
} from './schema';
export type { MigrationFunction, SnapshotValidationResult } from './schema';

// Diff
export {
  DiffChangeType,
  computeDiff,
  formatDiff,
  applyDiff,
} from './diff';
export type { DiffChange, RegistryDiff } from './diff';

// Validation
export {
  ValidationSeverity,
  registerValidator,
  validateEntry,
  validateSnapshot,
} from './validate';
export type { ValidationMessage, ValidationResult, ValidatorFunction } from './validate';

// Merge
export {
  MergeStrategy,
  mergeSnapshots,
  overlaySnapshots,
} from './merge';
export type { MergeConflict, MergeResult } from './merge';

// Reports
export {
  generateHealthReport,
  formatHealthReport,
  generateCoverageMatrix,
} from './reports';
export type { HealthReport, CoverageMatrix } from './reports';
