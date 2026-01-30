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
// CPL Schema Definitions (following CardPlay canon discipline)
// =============================================================================

/**
 * CPL schema compatibility policy.
 *
 * Aligned with CardPlay's canon serialization/versioning:
 * - MAJOR: Breaking changes to core semantics
 * - MINOR: Additive changes (new node types, new fields with defaults)
 * - PATCH: Bug fixes, clarifications, internal refactoring
 */
export const CPL_COMPATIBILITY_POLICY = {
  /**
   * Breaking changes requiring major version bump:
   * - Remove or rename required fields
   * - Change type of existing fields
   * - Change semantics of existing constructs
   * - Remove support for previously valid CPL
   */
  MAJOR_BREAKING: [
    'field-removal',
    'field-rename',
    'type-change',
    'semantic-change',
    'construct-removal',
  ] as const,

  /**
   * Additive changes requiring minor version bump:
   * - Add new optional fields (with defaults)
   * - Add new node types
   * - Add new constraint types
   * - Add new opcodes
   * - Extend enums with new values
   */
  MINOR_ADDITIVE: [
    'field-addition',
    'node-type-addition',
    'constraint-addition',
    'opcode-addition',
    'enum-extension',
  ] as const,

  /**
   * Non-breaking changes requiring patch version bump:
   * - Documentation improvements
   * - Internal implementation changes
   * - Performance improvements
   * - Bug fixes that don't change CPL interpretation
   */
  PATCH_COMPATIBLE: [
    'documentation',
    'implementation',
    'performance',
    'bugfix-nonbreaking',
  ] as const,
} as const;

/**
 * Schema change record for audit trail.
 */
export interface SchemaChangeRecord {
  /** Version after the change */
  readonly version: SemanticVersion;

  /** Type of change */
  readonly changeType:
    | (typeof CPL_COMPATIBILITY_POLICY.MAJOR_BREAKING)[number]
    | (typeof CPL_COMPATIBILITY_POLICY.MINOR_ADDITIVE)[number]
    | (typeof CPL_COMPATIBILITY_POLICY.PATCH_COMPATIBLE)[number];

  /** Human-readable description */
  readonly description: string;

  /** Date of change */
  readonly date: string;

  /** Migration function name (if applicable) */
  readonly migrationFunction?: string;

  /** Deprecation warnings (if applicable) */
  readonly deprecations?: readonly string[];
}

/**
 * CPL schema changelog.
 *
 * This is the SSOT for CPL version history and migration paths.
 */
export const CPL_SCHEMA_CHANGELOG: readonly SchemaChangeRecord[] = [
  {
    version: { major: 1, minor: 0, patch: 0 },
    changeType: 'documentation',
    description: 'Initial CPL schema definition',
    date: '2024-01-01',
  },
] as const;

/**
 * Get changelog for a specific schema.
 */
export function getSchemaChangelog(
  schemaId: string
): readonly SchemaChangeRecord[] {
  // For now, all schemas share the same changelog
  // In the future, this could be schema-specific
  return CPL_SCHEMA_CHANGELOG;
}

/**
 * Get changes between two versions.
 */
export function getChangesBetweenVersions(
  from: SemanticVersion,
  to: SemanticVersion
): readonly SchemaChangeRecord[] {
  return CPL_SCHEMA_CHANGELOG.filter(record => {
    const recordVersion = record.version;
    return (
      compareSemanticVersions(recordVersion, from) > 0 &&
      compareSemanticVersions(recordVersion, to) <= 0
    );
  });
}

/**
 * Check if changes between versions are breaking.
 */
export function hasBreakingChanges(
  from: SemanticVersion,
  to: SemanticVersion
): boolean {
  const changes = getChangesBetweenVersions(from, to);
  return changes.some(change =>
    CPL_COMPATIBILITY_POLICY.MAJOR_BREAKING.includes(change.changeType as any)
  );
}

// =============================================================================
// Serialization/Deserialization with Versioning
// =============================================================================

/**
 * Serialization options.
 */
export interface SerializationOptions {
  /** Include migration history */
  readonly includeMigrations?: boolean;

  /** Include provenance metadata */
  readonly includeProvenance?: boolean;

  /** Compact format (no pretty-printing) */
  readonly compact?: boolean;

  /** Schema version to target (for backward compatibility) */
  readonly targetVersion?: SemanticVersion;
}

/**
 * Deserialization options.
 */
export interface DeserializationOptions {
  /** Auto-migrate to current version */
  readonly autoMigrate?: boolean;

  /** Strict mode (fail on unknown fields) */
  readonly strict?: boolean;

  /** Allow deprecated constructs */
  readonly allowDeprecated?: boolean;
}

/**
 * Serialization result.
 */
export interface SerializationResult {
  /** Serialized JSON string */
  readonly json: string;

  /** Version used */
  readonly version: SemanticVersion;

  /** Schema ID */
  readonly schema: string;

  /** Warnings (if any) */
  readonly warnings: readonly string[];
}

/**
 * Deserialization result.
 */
export interface DeserializationResult<T> {
  /** Deserialized data */
  readonly data: T;

  /** Original version */
  readonly originalVersion: SemanticVersion;

  /** Current version (after migration if applicable) */
  readonly currentVersion: SemanticVersion;

  /** Migrations applied (if any) */
  readonly migrations: readonly MigrationRecord[];

  /** Warnings (if any) */
  readonly warnings: readonly string[];

  /** Was migration required? */
  readonly wasMigrated: boolean;
}

/**
 * Serialize data with version envelope.
 */
export function serializeWithVersion<T>(
  schemaId: string,
  version: SemanticVersion,
  data: T,
  options: SerializationOptions = {}
): SerializationResult {
  const warnings: string[] = [];

  // Create envelope
  const envelope = createVersionEnvelope(schemaId, version, data);

  // Serialize
  const json = options.compact
    ? JSON.stringify(envelope)
    : JSON.stringify(envelope, null, 2);

  return {
    json,
    version,
    schema: schemaId,
    warnings,
  };
}

/**
 * Deserialize data with version checking and migration.
 */
export function deserializeWithVersion<T>(
  schemaId: string,
  json: string,
  currentVersion: SemanticVersion,
  options: DeserializationOptions = {}
): DeserializationResult<T> {
  const warnings: string[] = [];

  // Parse JSON
  let envelope: unknown;
  try {
    envelope = JSON.parse(json);
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Validate envelope
  if (!validateVersionEnvelope(envelope, schemaId)) {
    throw new Error(`Invalid version envelope for schema ${schemaId}`);
  }

  const typedEnvelope = envelope as VersionEnvelope<T>;
  const originalVersion = typedEnvelope.version;
  let data = typedEnvelope.data;
  let migrations = typedEnvelope.migrations ?? [];
  let wasMigrated = false;

  // Check if migration is needed
  if (requiresMigration(originalVersion, currentVersion)) {
    if (!options.autoMigrate) {
      warnings.push(
        `Data is version ${formatSemanticVersion(originalVersion)}, ` +
          `current version is ${formatSemanticVersion(currentVersion)}. ` +
          `Consider enabling autoMigrate.`
      );
    } else {
      // Apply migrations
      const result = gofaiMigrationRegistry.applyMigrations<T>(
        schemaId,
        data,
        originalVersion,
        currentVersion
      );

      if (!result) {
        throw new Error(
          `No migration path found from ${formatSemanticVersion(originalVersion)} ` +
            `to ${formatSemanticVersion(currentVersion)} for schema ${schemaId}`
        );
      }

      data = result.data;
      migrations = [...migrations, ...result.records];
      wasMigrated = true;

      warnings.push(
        `Migrated from ${formatSemanticVersion(originalVersion)} ` +
          `to ${formatSemanticVersion(currentVersion)}`
      );
    }
  }

  // Check for breaking changes
  if (hasBreakingChanges(originalVersion, currentVersion)) {
    warnings.push(
      `Breaking changes exist between ${formatSemanticVersion(originalVersion)} ` +
        `and ${formatSemanticVersion(currentVersion)}. Verify behavior.`
    );
  }

  return {
    data,
    originalVersion,
    currentVersion,
    migrations,
    warnings,
    wasMigrated,
  };
}

// =============================================================================
// Edit Package Versioning
// =============================================================================

/**
 * Edit package version metadata.
 *
 * Stored with every applied edit to enable reproducibility.
 */
export interface EditPackageVersion {
  /** CPL schema versions used */
  readonly cplVersions: {
    readonly intent: SemanticVersion;
    readonly plan: SemanticVersion;
    readonly host: SemanticVersion;
  };

  /** Compiler version that produced this edit */
  readonly compiler: CompilerVersion;

  /** Extension namespaces and versions used */
  readonly extensions: readonly {
    readonly namespace: string;
    readonly version: SemanticVersion;
  }[];

  /** Prolog KB modules used */
  readonly prologModules: readonly string[];

  /** Creation timestamp */
  readonly timestamp: string;
}

/**
 * Create edit package version metadata.
 */
export function createEditPackageVersion(
  extensions: readonly { namespace: string; version: SemanticVersion }[],
  prologModules: readonly string[]
): EditPackageVersion {
  return {
    cplVersions: {
      intent: GOFAI_SCHEMA_VERSIONS.CPL_INTENT,
      plan: GOFAI_SCHEMA_VERSIONS.CPL_PLAN,
      host: GOFAI_SCHEMA_VERSIONS.CPL_HOST,
    },
    compiler: CURRENT_COMPILER_VERSION,
    extensions,
    prologModules,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check edit package version compatibility.
 */
export function checkEditPackageCompatibility(
  packageVersion: EditPackageVersion,
  currentCompilerVersion: CompilerVersion
): {
  compatible: boolean;
  warnings: readonly string[];
  blockers: readonly string[];
} {
  const warnings: string[] = [];
  const blockers: string[] = [];

  // Check compiler version
  const compilerCheck = areCompilerVersionsCompatible(
    packageVersion.compiler,
    currentCompilerVersion
  );
  if (!compilerCheck.compatible) {
    blockers.push(
      `Compiler version incompatible: ${formatSemanticVersion(packageVersion.compiler.version)} ` +
        `vs ${formatSemanticVersion(currentCompilerVersion.version)}`
    );
  }
  warnings.push(...compilerCheck.warnings);

  // Check CPL schema versions
  if (
    !isVersionCompatible(
      packageVersion.cplVersions.intent,
      GOFAI_SCHEMA_VERSIONS.CPL_INTENT
    )
  ) {
    blockers.push(
      `CPL-Intent schema incompatible: ${formatSemanticVersion(packageVersion.cplVersions.intent)} ` +
        `vs ${formatSemanticVersion(GOFAI_SCHEMA_VERSIONS.CPL_INTENT)}`
    );
  }

  if (
    !isVersionCompatible(
      packageVersion.cplVersions.plan,
      GOFAI_SCHEMA_VERSIONS.CPL_PLAN
    )
  ) {
    blockers.push(
      `CPL-Plan schema incompatible: ${formatSemanticVersion(packageVersion.cplVersions.plan)} ` +
        `vs ${formatSemanticVersion(GOFAI_SCHEMA_VERSIONS.CPL_PLAN)}`
    );
  }

  // Check for missing extensions
  for (const ext of packageVersion.extensions) {
    warnings.push(
      `Edit package requires extension: ${ext.namespace}@${formatSemanticVersion(ext.version)}`
    );
  }

  return {
    compatible: blockers.length === 0,
    warnings,
    blockers,
  };
}

// =============================================================================
// Backward Compatibility Helpers
// =============================================================================

/**
 * Deprecated field mapping for backward compatibility.
 */
export interface DeprecatedFieldMapping {
  /** Old field name */
  readonly oldName: string;

  /** New field name */
  readonly newName: string;

  /** Version when deprecated */
  readonly deprecatedIn: SemanticVersion;

  /** Version when removed (if planned) */
  readonly removedIn?: SemanticVersion;

  /** Migration function (if field transformation is needed) */
  readonly transform?: (oldValue: unknown) => unknown;
}

/**
 * Registry of deprecated fields for backward compatibility warnings.
 */
export const DEPRECATED_FIELDS = new Map<string, DeprecatedFieldMapping[]>();

/**
 * Register a deprecated field.
 */
export function registerDeprecatedField(
  schemaId: string,
  mapping: DeprecatedFieldMapping
): void {
  if (!DEPRECATED_FIELDS.has(schemaId)) {
    DEPRECATED_FIELDS.set(schemaId, []);
  }
  DEPRECATED_FIELDS.get(schemaId)!.push(mapping);
}

/**
 * Check for deprecated fields in data.
 */
export function checkForDeprecatedFields(
  schemaId: string,
  data: Record<string, unknown>
): readonly string[] {
  const warnings: string[] = [];
  const mappings = DEPRECATED_FIELDS.get(schemaId) ?? [];

  for (const mapping of mappings) {
    if (mapping.oldName in data) {
      const msg = `Field '${mapping.oldName}' is deprecated (since ${formatSemanticVersion(mapping.deprecatedIn)})`;
      const replacement = mapping.removedIn
        ? ` and will be removed in ${formatSemanticVersion(mapping.removedIn)}. Use '${mapping.newName}' instead.`
        : `. Use '${mapping.newName}' instead.`;
      warnings.push(msg + replacement);
    }
  }

  return warnings;
}

// =============================================================================
// Version Fingerprinting for Reproducibility
// =============================================================================

/**
 * Compute a fingerprint of the entire compiler state.
 *
 * This is used to ensure exact reproducibility of edit packages.
 */
export function computeCompilerFingerprint(
  compilerVersion: CompilerVersion
): string {
  const components = [
    formatSemanticVersion(compilerVersion.version),
    compilerVersion.lexiconHash,
    compilerVersion.grammarHash,
    compilerVersion.prologHash,
  ];
  return computeHash(components.join('|'));
}

/**
 * Check if two compiler fingerprints match (exact reproducibility).
 */
export function doFingerprintsMatch(a: string, b: string): boolean {
  return a === b;
}

// =============================================================================
// Initial Migrations (placeholders for future versions)
// =============================================================================

// Example migration registration (when needed):
//
// gofaiMigrationRegistry.register({
//   schema: GOFAI_SCHEMA_IDS.CPL_INTENT,
//   from: { major: 1, minor: 0, patch: 0 },
//   to: { major: 1, minor: 1, patch: 0 },
//   description: 'Add support for multi-objective goals',
//   migrate: (data: CPLIntentV1_0_0) => {
//     // Add new optional field with default
//     return { ...data, multiObjective: false } as CPLIntentV1_1_0;
//   },
// });
