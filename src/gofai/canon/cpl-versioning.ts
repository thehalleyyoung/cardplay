/**
 * GOFAI Canon — CPL Schema Versioning
 *
 * Step 007 from gofai_goalB.md: "Define a stable 'CPL schema versioning'
 * strategy compatible with CardPlay canon serialization/versioning conventions."
 *
 * This module implements a comprehensive versioning strategy for CPL (Cardplay
 * Programming Language) schemas that mirrors and extends the existing CardPlay
 * versioning approach.
 *
 * Key principles:
 * 1. Semantic versioning (MAJOR.MINOR.PATCH)
 * 2. Schema backward compatibility rules
 * 3. Migration functions for schema evolution
 * 4. Version negotiation between compiler versions
 * 5. Edit history compatibility
 *
 * @module gofai/canon/cpl-versioning
 */

import type { CPLIntent } from './cpl-types';

// =============================================================================
// Version Types
// =============================================================================

/**
 * A semantic version number for CPL schemas.
 *
 * Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes (incompatible API changes)
 * - MINOR: Backward-compatible new features
 * - PATCH: Backward-compatible bug fixes
 */
export interface SchemaVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

/**
 * String representation of a schema version.
 *
 * Format: "v{major}.{minor}.{patch}"
 * Examples: "v1.0.0", "v1.2.5"
 */
export type SchemaVersionString = `v${number}.${number}.${number}`;

/**
 * The current CPL schema version.
 *
 * This should be bumped according to the schema evolution rules:
 * - MAJOR: Breaking changes to CPL-Intent structure or semantics
 * - MINOR: New fields added (with defaults for old data)
 * - PATCH: Bug fixes, clarifications, documentation
 */
export const CURRENT_CPL_SCHEMA_VERSION: SchemaVersion = {
  major: 1,
  minor: 0,
  patch: 0,
};

/**
 * Minimum supported CPL schema version.
 *
 * Schemas older than this cannot be loaded and must be migrated offline.
 */
export const MINIMUM_SUPPORTED_CPL_VERSION: SchemaVersion = {
  major: 1,
  minor: 0,
  patch: 0,
};

/**
 * Schema version embedded in serialized CPL.
 */
export interface VersionedCPL {
  /** Schema version used */
  readonly version: SchemaVersionString;

  /** The CPL-Intent data */
  readonly cpl: CPLIntent;

  /** Compiler version that produced this */
  readonly compilerVersion?: string;

  /** Timestamp of creation */
  readonly createdAt?: number;

  /** Extension versions active when created */
  readonly extensionVersions?: ReadonlyMap<string, string>;
}

// =============================================================================
// Version Comparison
// =============================================================================

/**
 * Parse a version string into a SchemaVersion.
 *
 * @param versionString - String like "v1.2.3" or "1.2.3"
 * @returns Parsed version or undefined if invalid
 */
export function parseVersion(versionString: string): SchemaVersion | undefined {
  const cleaned = versionString.startsWith('v')
    ? versionString.slice(1)
    : versionString;

  const parts = cleaned.split('.');
  if (parts.length !== 3) return undefined;

  const [majorStr, minorStr, patchStr] = parts;
  if (!majorStr || !minorStr || !patchStr) return undefined;

  const major = parseInt(majorStr, 10);
  const minor = parseInt(minorStr, 10);
  const patch = parseInt(patchStr, 10);

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) return undefined;

  return { major, minor, patch };
}

/**
 * Format a SchemaVersion as a string.
 */
export function formatVersion(version: SchemaVersion): SchemaVersionString {
  return `v${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Compare two schema versions.
 *
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: SchemaVersion, b: SchemaVersion): -1 | 0 | 1 {
  if (a.major < b.major) return -1;
  if (a.major > b.major) return 1;

  if (a.minor < b.minor) return -1;
  if (a.minor > b.minor) return 1;

  if (a.patch < b.patch) return -1;
  if (a.patch > b.patch) return 1;

  return 0;
}

/**
 * Check if version a is compatible with version b.
 *
 * Compatible means:
 * - Same major version (no breaking changes)
 * - a.minor <= b.minor (can read newer minor versions)
 */
export function isCompatible(a: SchemaVersion, b: SchemaVersion): boolean {
  if (a.major !== b.major) return false;
  return a.minor <= b.minor;
}

/**
 * Check if a version is supported by the current runtime.
 */
export function isSupported(version: SchemaVersion): boolean {
  return (
    compareVersions(version, MINIMUM_SUPPORTED_CPL_VERSION) >= 0 &&
    isCompatible(version, CURRENT_CPL_SCHEMA_VERSION)
  );
}

// =============================================================================
// Schema Evolution Rules
// =============================================================================

/**
 * Rules for evolving the CPL schema without breaking compatibility.
 */
export const SCHEMA_EVOLUTION_RULES = {
  /**
   * MAJOR version bump (breaking change)
   *
   * Required when:
   * - Removing required fields
   * - Changing field types incompatibly
   * - Changing field semantics incompatibly
   * - Reordering discriminated union cases
   * - Removing enum values that old code relies on
   *
   * Examples:
   * - Removing CPLIntent.scope field
   * - Changing AxisId from string to enum
   * - Renaming fields without aliases
   */
  major: [
    'Removing required fields from CPL types',
    'Incompatible type changes (e.g., string → number)',
    'Semantic changes to existing operations',
    'Removing enum variants still in use',
    'Changing discriminated union discriminators',
  ] as const,

  /**
   * MINOR version bump (backward-compatible addition)
   *
   * Allowed:
   * - Adding optional fields with defaults
   * - Adding new discriminated union cases
   * - Adding new enum values
   * - Extending existing types with optional properties
   * - Adding new top-level types
   *
   * Examples:
   * - Adding CPLIntent.metadata?: Metadata
   * - Adding new OpcodeId enum value
   * - Adding new ConstraintType variant
   */
  minor: [
    'Adding optional fields with sensible defaults',
    'Adding new discriminated union cases',
    'Adding new enum values',
    'Extending types with optional properties',
    'Adding new top-level types or interfaces',
  ] as const,

  /**
   * PATCH version bump (bug fix, no schema change)
   *
   * Allowed:
   * - Fixing typos in documentation
   * - Clarifying field semantics in comments
   * - Tightening validation rules (stricter, not looser)
   * - Internal implementation changes with no schema impact
   *
   * Examples:
   * - Fixing doc comment for a field
   * - Improving error messages
   * - Optimizing serialization (same format)
   */
  patch: [
    'Documentation improvements',
    'Comment clarifications',
    'Tighter validation rules',
    'Internal optimizations (no format changes)',
  ] as const,
};

/**
 * Check if a proposed schema change requires a version bump.
 *
 * @param changeDescription - Description of the change
 * @returns Required version bump level or undefined if no bump needed
 */
export function determineVersionBump(
  changeDescription: string
): 'major' | 'minor' | 'patch' | undefined {
  const lower = changeDescription.toLowerCase();

  // Check for major changes (breaking)
  if (
    lower.includes('remove') &&
    (lower.includes('field') || lower.includes('property'))
  ) {
    return 'major';
  }
  if (lower.includes('incompatible') || lower.includes('breaking')) {
    return 'major';
  }
  if (lower.includes('rename') && !lower.includes('alias')) {
    return 'major';
  }

  // Check for minor changes (additions)
  if (lower.includes('add') || lower.includes('new')) {
    return 'minor';
  }
  if (lower.includes('extend') || lower.includes('optional')) {
    return 'minor';
  }

  // Check for patch changes (fixes)
  if (
    lower.includes('fix') ||
    lower.includes('typo') ||
    lower.includes('clarif')
  ) {
    return 'patch';
  }
  if (lower.includes('doc') || lower.includes('comment')) {
    return 'patch';
  }

  // Unknown change - require explicit categorization
  return undefined;
}

// =============================================================================
// Migration System
// =============================================================================

/**
 * A migration function that transforms CPL from one version to another.
 */
export interface SchemaMigration {
  /** Migration identifier */
  readonly id: string;

  /** Source version (before migration) */
  readonly from: SchemaVersion;

  /** Target version (after migration) */
  readonly to: SchemaVersion;

  /** Human-readable description */
  readonly description: string;

  /** The migration function */
  readonly migrate: (cpl: unknown) => MigrationResult;

  /** Whether this migration is lossy (data may be discarded) */
  readonly lossy: boolean;

  /** Test cases for this migration */
  readonly testCases?: readonly MigrationTestCase[];
}

/**
 * Result of a migration.
 */
export type MigrationResult =
  | { readonly ok: true; readonly cpl: CPLIntent; readonly warnings?: readonly string[] }
  | { readonly ok: false; readonly error: string };

/**
 * A test case for a migration.
 */
export interface MigrationTestCase {
  /** Test name */
  readonly name: string;

  /** Input CPL (old version) */
  readonly input: unknown;

  /** Expected output CPL (new version) */
  readonly expectedOutput: CPLIntent;

  /** Expected warnings (if any) */
  readonly expectedWarnings?: readonly string[];
}

/**
 * Registry of all schema migrations.
 *
 * Migrations are stored in topological order (dependency-ordered).
 * To migrate from version A to version C, apply migrations A→B then B→C.
 */
export const SCHEMA_MIGRATIONS: readonly SchemaMigration[] = [
  // Example migration (template for future migrations)
  // {
  //   id: 'v1.0.0-to-v1.1.0',
  //   from: { major: 1, minor: 0, patch: 0 },
  //   to: { major: 1, minor: 1, patch: 0 },
  //   description: 'Add optional metadata field to CPLIntent',
  //   lossy: false,
  //   migrate: (cpl: unknown) => {
  //     // Add default metadata field if missing
  //     return {
  //       ok: true,
  //       cpl: {
  //         ...(cpl as CPLIntent),
  //         metadata: {},
  //       },
  //     };
  //   },
  // },
];

/**
 * Find a migration path from one version to another.
 *
 * @returns Array of migrations to apply, or undefined if no path exists
 */
export function findMigrationPath(
  from: SchemaVersion,
  to: SchemaVersion
): readonly SchemaMigration[] | undefined {
  if (compareVersions(from, to) === 0) {
    return []; // No migration needed
  }

  if (compareVersions(from, to) > 0) {
    // Downgrade not supported
    return undefined;
  }

  const path: SchemaMigration[] = [];
  let currentVersion = from;

  while (compareVersions(currentVersion, to) < 0) {
    const nextMigration = SCHEMA_MIGRATIONS.find(
      (m) => compareVersions(m.from, currentVersion) === 0
    );

    if (!nextMigration) {
      // No migration available
      return undefined;
    }

    path.push(nextMigration);
    currentVersion = nextMigration.to;
  }

  return path;
}

/**
 * Apply a migration path to CPL data.
 */
export function applyMigrationPath(
  cpl: unknown,
  path: readonly SchemaMigration[]
): MigrationResult {
  let current: unknown = cpl;
  const allWarnings: string[] = [];

  for (const migration of path) {
    const result = migration.migrate(current);
    if (!result.ok) {
      return result;
    }
    current = result.cpl;
    if (result.warnings) {
      allWarnings.push(...result.warnings);
    }
  }

  return {
    ok: true,
    cpl: current as CPLIntent,
    ...(allWarnings.length > 0 ? { warnings: allWarnings as readonly string[] } : {}),
  };
}

/**
 * Migrate CPL from an arbitrary version to the current version.
 */
export function migrateToCurrent(
  versionedCpl: VersionedCPL
): MigrationResult {
  const version = parseVersion(versionedCpl.version);
  if (!version) {
    return {
      ok: false,
      error: `Invalid schema version string: ${versionedCpl.version}`,
    };
  }

  if (compareVersions(version, CURRENT_CPL_SCHEMA_VERSION) === 0) {
    // Already current version
    return { ok: true, cpl: versionedCpl.cpl };
  }

  if (!isSupported(version)) {
    return {
      ok: false,
      error: `Schema version ${formatVersion(version)} is not supported. ` +
        `Minimum: ${formatVersion(MINIMUM_SUPPORTED_CPL_VERSION)}, ` +
        `Current: ${formatVersion(CURRENT_CPL_SCHEMA_VERSION)}`,
    };
  }

  const path = findMigrationPath(version, CURRENT_CPL_SCHEMA_VERSION);
  if (!path) {
    return {
      ok: false,
      error: `No migration path found from ${formatVersion(version)} to ${formatVersion(CURRENT_CPL_SCHEMA_VERSION)}`,
    };
  }

  return applyMigrationPath(versionedCpl.cpl, path);
}

// =============================================================================
// Version Negotiation
// =============================================================================

/**
 * Compiler capability descriptor.
 */
export interface CompilerCapabilities {
  /** Compiler version string */
  readonly version: string;

  /** CPL schema version this compiler produces */
  readonly producesVersion: SchemaVersion;

  /** CPL schema versions this compiler can read */
  readonly canRead: readonly SchemaVersion[];

  /** Extensions supported */
  readonly extensions: readonly string[];
}

/**
 * Check if the current compiler can read a given versioned CPL.
 */
export function canRead(versionedCpl: VersionedCPL): boolean {
  const version = parseVersion(versionedCpl.version);
  if (!version) return false;

  return isSupported(version);
}

/**
 * Check if the current compiler can write a CPL that another compiler can read.
 */
export function canInteroperate(
  other: CompilerCapabilities
): boolean {
  // Check if the other compiler can read our output
  const ourVersion = CURRENT_CPL_SCHEMA_VERSION;
  for (const readableVersion of other.canRead) {
    if (isCompatible(readableVersion, ourVersion)) {
      return true;
    }
  }
  return false;
}

// =============================================================================
// Edit History Compatibility
// =============================================================================

/**
 * An edit package with schema version.
 */
export interface VersionedEditPackage {
  /** Package ID */
  readonly id: string;

  /** CPL-Intent for this edit */
  readonly cpl: VersionedCPL;

  /** Plan produced */
  readonly plan?: unknown;

  /** Diff generated */
  readonly diff?: unknown;

  /** Provenance */
  readonly provenance: EditProvenance;

  /** When created */
  readonly createdAt: number;
}

/**
 * Provenance for an edit.
 */
export interface EditProvenance {
  /** User utterance */
  readonly utterance: string;

  /** Compiler version */
  readonly compilerVersion: string;

  /** Schema version */
  readonly schemaVersion: SchemaVersionString;

  /** Extension versions */
  readonly extensionVersions?: ReadonlyMap<string, string>;

  /** Session ID */
  readonly sessionId?: string;
}

/**
 * Check if an edit package can be replayed in the current environment.
 */
export function canReplayEdit(pkg: VersionedEditPackage): ReplayCompatibility {
  const cplVersion = parseVersion(pkg.cpl.version);
  if (!cplVersion) {
    return {
      compatible: false,
      reason: 'Invalid CPL schema version',
    };
  }

  if (!isSupported(cplVersion)) {
    return {
      compatible: false,
      reason: `CPL schema version ${formatVersion(cplVersion)} is not supported`,
    };
  }

  // Check extension compatibility
  if (pkg.provenance.extensionVersions) {
    // TODO: Check if required extensions are available and compatible
    // For now, assume compatible if we can read the CPL
  }

  return { compatible: true };
}

/**
 * Result of replay compatibility check.
 */
export type ReplayCompatibility =
  | { readonly compatible: true }
  | { readonly compatible: false; readonly reason: string };

// =============================================================================
// Validation & Diagnostics
// =============================================================================

/**
 * Validate that a versioned CPL is well-formed.
 */
export function validateVersionedCPL(
  versionedCpl: unknown
): ValidationResult {
  const errors: string[] = [];

  if (typeof versionedCpl !== 'object' || versionedCpl === null) {
    errors.push('VersionedCPL must be an object');
    return { valid: false, errors };
  }

  const obj = versionedCpl as Record<string, unknown>;

  // Check version field
  if (typeof obj.version !== 'string') {
    errors.push('Missing or invalid version field');
  } else {
    const parsed = parseVersion(obj.version);
    if (!parsed) {
      errors.push(`Invalid version string: ${obj.version}`);
    }
  }

  // Check cpl field
  if (!obj.cpl) {
    errors.push('Missing cpl field');
  }

  // Check optional fields
  if (obj.compilerVersion !== undefined && typeof obj.compilerVersion !== 'string') {
    errors.push('compilerVersion must be a string');
  }

  if (obj.createdAt !== undefined && typeof obj.createdAt !== 'number') {
    errors.push('createdAt must be a number (timestamp)');
  }

  return {
    valid: errors.length === 0,
    ...(errors.length > 0 ? { errors: errors as readonly string[] } : {}),
  };
}

/**
 * Validation result.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors?: readonly string[];
}

/**
 * Get a summary of schema versioning status.
 */
export function getVersioningSummary(): string {
  const lines: string[] = [
    'CPL Schema Versioning Status',
    '='.repeat(60),
    '',
    `Current Version:  ${formatVersion(CURRENT_CPL_SCHEMA_VERSION)}`,
    `Minimum Supported: ${formatVersion(MINIMUM_SUPPORTED_CPL_VERSION)}`,
    '',
    `Registered Migrations: ${SCHEMA_MIGRATIONS.length}`,
    '',
  ];

  if (SCHEMA_MIGRATIONS.length > 0) {
    lines.push('Migration Path:');
    for (const migration of SCHEMA_MIGRATIONS) {
      const lossyFlag = migration.lossy ? ' [LOSSY]' : '';
      lines.push(
        `  ${formatVersion(migration.from)} → ${formatVersion(migration.to)}${lossyFlag}`
      );
      lines.push(`    ${migration.description}`);
    }
    lines.push('');
  }

  lines.push('Schema Evolution Rules:');
  lines.push('  MAJOR (breaking):');
  for (const rule of SCHEMA_EVOLUTION_RULES.major) {
    lines.push(`    - ${rule}`);
  }
  lines.push('  MINOR (compatible addition):');
  for (const rule of SCHEMA_EVOLUTION_RULES.minor) {
    lines.push(`    - ${rule}`);
  }
  lines.push('  PATCH (bug fix):');
  for (const rule of SCHEMA_EVOLUTION_RULES.patch) {
    lines.push(`    - ${rule}`);
  }

  return lines.join('\n');
}

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Assert that two versions are equal.
 * Throws if not equal.
 */
export function assertVersionEquals(
  actual: SchemaVersion,
  expected: SchemaVersion,
  message?: string
): void {
  if (compareVersions(actual, expected) !== 0) {
    throw new Error(
      `${message ?? 'Version mismatch'}: expected ${formatVersion(expected)}, got ${formatVersion(actual)}`
    );
  }
}

/**
 * Assert that a version is supported.
 * Throws if not supported.
 */
export function assertVersionSupported(
  version: SchemaVersion,
  message?: string
): void {
  if (!isSupported(version)) {
    throw new Error(
      `${message ?? 'Unsupported version'}: ${formatVersion(version)} is not supported (min: ${formatVersion(MINIMUM_SUPPORTED_CPL_VERSION)}, current: ${formatVersion(CURRENT_CPL_SCHEMA_VERSION)})`
    );
  }
}

/**
 * Create a versioned CPL for testing.
 */
export function createVersionedCPL(
  cpl: CPLIntent,
  version: SchemaVersion = CURRENT_CPL_SCHEMA_VERSION
): VersionedCPL {
  return {
    version: formatVersion(version),
    cpl,
    compilerVersion: `gofai-v${formatVersion(version)}`,
    createdAt: Date.now(),
  };
}
