/**
 * GOFAI Canon Versioning — Schema Versions and Compatibility
 *
 * This module defines versioning for all GOFAI schemas, following CardPlay's
 * canon serialization/versioning conventions.
 *
 * @module gofai/canon/versioning
 */

// =============================================================================
// Version Types
// =============================================================================

/**
 * Semantic version for GOFAI components.
 */
export interface SemanticVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

/**
 * Complete compiler version fingerprint.
 *
 * This is stored in edit packages to enable reproducibility
 * and compatibility checking.
 */
export interface CompilerVersion {
  /** Semantic version of the compiler */
  readonly version: SemanticVersion;

  /** Hash of the lexicon (all lexeme entries) */
  readonly lexiconHash: string;

  /** Hash of the grammar (all rules) */
  readonly grammarHash: string;

  /** Hash of the Prolog KB */
  readonly prologHash: string;

  /** Build timestamp (ISO 8601) */
  readonly buildDate: string;

  /** Git commit hash (if available) */
  readonly commitHash?: string;
}

/**
 * Schema version envelope for serialized data.
 */
export interface VersionEnvelope<T> {
  /** Schema identifier */
  readonly schema: string;

  /** Schema version */
  readonly version: SemanticVersion;

  /** The actual data */
  readonly data: T;

  /** Migration history (if migrated from older versions) */
  readonly migrations?: readonly MigrationRecord[];
}

/**
 * Record of a migration that was applied.
 */
export interface MigrationRecord {
  /** From version */
  readonly from: SemanticVersion;

  /** To version */
  readonly to: SemanticVersion;

  /** Migration function name */
  readonly migration: string;

  /** Timestamp of migration */
  readonly timestamp: string;
}

// =============================================================================
// Current Versions
// =============================================================================

/**
 * Current GOFAI schema versions.
 *
 * These are bumped when incompatible changes are made.
 * Migration functions must be provided for each version bump.
 */
export const GOFAI_SCHEMA_VERSIONS = {
  /** CPL-Intent schema version */
  CPL_INTENT: { major: 1, minor: 0, patch: 0 } as SemanticVersion,

  /** CPL-Plan schema version */
  CPL_PLAN: { major: 1, minor: 0, patch: 0 } as SemanticVersion,

  /** CPL-Host schema version */
  CPL_HOST: { major: 1, minor: 0, patch: 0 } as SemanticVersion,

  /** Edit package schema version */
  EDIT_PACKAGE: { major: 1, minor: 0, patch: 0 } as SemanticVersion,

  /** Dialogue state schema version */
  DIALOGUE_STATE: { major: 1, minor: 0, patch: 0 } as SemanticVersion,

  /** Lexicon schema version */
  LEXICON: { major: 1, minor: 0, patch: 0 } as SemanticVersion,

  /** Grammar schema version */
  GRAMMAR: { major: 1, minor: 0, patch: 0 } as SemanticVersion,

  /** Extension manifest schema version */
  EXTENSION: { major: 1, minor: 0, patch: 0 } as SemanticVersion,
} as const;

/**
 * Schema identifiers for GOFAI data types.
 */
export const GOFAI_SCHEMA_IDS = {
  CPL_INTENT: 'gofai:schema:cpl-intent',
  CPL_PLAN: 'gofai:schema:cpl-plan',
  CPL_HOST: 'gofai:schema:cpl-host',
  EDIT_PACKAGE: 'gofai:schema:edit-package',
  DIALOGUE_STATE: 'gofai:schema:dialogue-state',
  LEXICON: 'gofai:schema:lexicon',
  GRAMMAR: 'gofai:schema:grammar',
  EXTENSION: 'gofai:schema:extension',
} as const;

// =============================================================================
// Version Utilities
// =============================================================================

/**
 * Parse a semantic version string.
 */
export function parseSemanticVersion(str: string): SemanticVersion | null {
  const match = str.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match || !match[1] || !match[2] || !match[3]) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Format a semantic version as a string.
 */
export function formatSemanticVersion(version: SemanticVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Compare two semantic versions.
 *
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareSemanticVersions(
  a: SemanticVersion,
  b: SemanticVersion
): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return 0;
}

/**
 * Check if version a is compatible with version b.
 *
 * Compatibility rules:
 * - Major versions must match (breaking changes)
 * - Minor version of a can be >= b (new features are ok)
 * - Patch versions don't matter for compatibility
 */
export function isVersionCompatible(
  a: SemanticVersion,
  b: SemanticVersion
): boolean {
  return a.major === b.major && a.minor >= b.minor;
}

/**
 * Check if data version requires migration.
 */
export function requiresMigration(
  dataVersion: SemanticVersion,
  currentVersion: SemanticVersion
): boolean {
  // Same version — no migration
  if (compareSemanticVersions(dataVersion, currentVersion) === 0) {
    return false;
  }

  // Data is newer than current — cannot migrate forward
  if (compareSemanticVersions(dataVersion, currentVersion) > 0) {
    throw new Error(
      `Data version ${formatSemanticVersion(dataVersion)} is newer than ` +
        `current version ${formatSemanticVersion(currentVersion)}. ` +
        `Cannot migrate forward.`
    );
  }

  // Data is older — needs migration
  return true;
}

// =============================================================================
// Version Envelope Utilities
// =============================================================================

/**
 * Create a version envelope for data.
 */
export function createVersionEnvelope<T>(
  schemaId: string,
  version: SemanticVersion,
  data: T
): VersionEnvelope<T> {
  return {
    schema: schemaId,
    version,
    data,
  };
}

/**
 * Validate a version envelope.
 */
export function validateVersionEnvelope(
  envelope: unknown,
  expectedSchemaId: string
): envelope is VersionEnvelope<unknown> {
  if (typeof envelope !== 'object' || envelope === null) {
    return false;
  }

  const obj = envelope as Record<string, unknown>;

  if (obj.schema !== expectedSchemaId) {
    return false;
  }

  if (
    typeof obj.version !== 'object' ||
    obj.version === null ||
    typeof (obj.version as SemanticVersion).major !== 'number' ||
    typeof (obj.version as SemanticVersion).minor !== 'number' ||
    typeof (obj.version as SemanticVersion).patch !== 'number'
  ) {
    return false;
  }

  return 'data' in obj;
}

/**
 * Extract version from envelope.
 */
export function getEnvelopeVersion(
  envelope: VersionEnvelope<unknown>
): SemanticVersion {
  return envelope.version;
}

// =============================================================================
// Compiler Version Utilities
// =============================================================================

/**
 * Compute a hash of a string (simple djb2 hash).
 *
 * Note: This is not cryptographic, just for fingerprinting.
 */
export function computeHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Current compiler version.
 *
 * This is updated at build time and used for edit package fingerprinting.
 */
export const CURRENT_COMPILER_VERSION: CompilerVersion = {
  version: { major: 0, minor: 1, patch: 0 },
  lexiconHash: '00000000', // Will be computed at build time
  grammarHash: '00000000', // Will be computed at build time
  prologHash: '00000000', // Will be computed at build time
  buildDate: new Date().toISOString(),
  // commitHash is optional and will be added at build time if available
};

/**
 * Format compiler version for display.
 */
export function formatCompilerVersion(version: CompilerVersion): string {
  const v = formatSemanticVersion(version.version);
  const commit = version.commitHash
    ? ` (${version.commitHash.slice(0, 7)})`
    : '';
  return `GOFAI Music+ v${v}${commit}`;
}

/**
 * Check if two compiler versions are compatible.
 *
 * For edit packages, we require:
 * - Same major version
 * - Lexicon hash may differ (with warnings)
 * - Grammar hash may differ (with warnings)
 */
export function areCompilerVersionsCompatible(
  a: CompilerVersion,
  b: CompilerVersion
): { compatible: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Major version must match
  if (a.version.major !== b.version.major) {
    return {
      compatible: false,
      warnings: [
        `Major version mismatch: ${a.version.major} vs ${b.version.major}`,
      ],
    };
  }

  // Warn about lexicon changes
  if (a.lexiconHash !== b.lexiconHash) {
    warnings.push('Lexicon has changed; some terms may behave differently');
  }

  // Warn about grammar changes
  if (a.grammarHash !== b.grammarHash) {
    warnings.push('Grammar has changed; some parses may differ');
  }

  return { compatible: true, warnings };
}

// =============================================================================
// Migration Registry
// =============================================================================

/**
 * Type for a migration function.
 */
export type MigrationFunction<TFrom, TTo> = (data: TFrom) => TTo;

/**
 * Migration definition.
 */
export interface Migration<TFrom = unknown, TTo = unknown> {
  /** Schema being migrated */
  readonly schema: string;

  /** From version */
  readonly from: SemanticVersion;

  /** To version */
  readonly to: SemanticVersion;

  /** Migration function */
  readonly migrate: MigrationFunction<TFrom, TTo>;

  /** Description of what changed */
  readonly description: string;
}

/**
 * Migration registry.
 */
class MigrationRegistry {
  private migrations = new Map<string, Migration[]>();

  /**
   * Register a migration.
   */
  register<TFrom, TTo>(migration: Migration<TFrom, TTo>): void {
    const key = migration.schema;
    if (!this.migrations.has(key)) {
      this.migrations.set(key, []);
    }
    this.migrations.get(key)!.push(migration as Migration);
  }

  /**
   * Get migrations for a schema.
   */
  getMigrations(schema: string): readonly Migration[] {
    return this.migrations.get(schema) ?? [];
  }

  /**
   * Find migration path from one version to another.
   */
  findMigrationPath(
    schema: string,
    from: SemanticVersion,
    to: SemanticVersion
  ): readonly Migration[] | null {
    const migrations = this.getMigrations(schema);
    const path: Migration[] = [];
    let current = from;

    while (compareSemanticVersions(current, to) < 0) {
      const next = migrations.find(
        m =>
          compareSemanticVersions(m.from, current) === 0 &&
          compareSemanticVersions(m.to, to) <= 0
      );

      if (!next) {
        // No migration found for this step
        return null;
      }

      path.push(next);
      current = next.to;
    }

    return path;
  }

  /**
   * Apply migrations to data.
   */
  applyMigrations<T>(
    schema: string,
    data: unknown,
    from: SemanticVersion,
    to: SemanticVersion
  ): { data: T; records: MigrationRecord[] } | null {
    const path = this.findMigrationPath(schema, from, to);
    if (!path) return null;

    let current = data;
    const records: MigrationRecord[] = [];

    for (const migration of path) {
      current = migration.migrate(current);
      records.push({
        from: migration.from,
        to: migration.to,
        migration: migration.description,
        timestamp: new Date().toISOString(),
      });
    }

    return { data: current as T, records };
  }
}

/**
 * Global migration registry for GOFAI schemas.
 */
export const gofaiMigrationRegistry = new MigrationRegistry();

// =============================================================================
// Initial Migrations (placeholders for future versions)
// =============================================================================

// Example migration registration (when needed):
//
// gofaiMigrationRegistry.register({
//   schema: GOFAI_SCHEMA_IDS.CPL_INTENT,
//   from: { major: 1, minor: 0, patch: 0 },
//   to: { major: 1, minor: 1, patch: 0 },
//   description: 'Add support for X',
//   migrate: (data: CPLIntentV1_0_0) => {
//     return { ...data, newField: defaultValue } as CPLIntentV1_1_0;
//   },
// });
