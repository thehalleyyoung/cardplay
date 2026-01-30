/**
 * GOFAI Canon Versioning Tests — Step 007 Complete Test Suite
 *
 * Tests CPL schema versioning strategy compatible with CardPlay canon
 * serialization/versioning conventions.
 *
 * Coverage:
 * - Semantic version parsing, formatting, comparison
 * - Version compatibility checking
 * - Migration registry and path finding
 * - Version envelope creation and validation
 * - Compiler version fingerprinting
 * - Edit package version compatibility
 * - Schema change tracking and changelog
 * - Serialization/deserialization with versioning
 * - Deprecated field handling
 * - Backward compatibility
 *
 * @module gofai/canon/__tests__/versioning
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Version types
  SemanticVersion,
  CompilerVersion,
  VersionEnvelope,
  MigrationRecord,
  Migration,
  SchemaChangeRecord,
  EditPackageVersion,

  // Current versions
  GOFAI_SCHEMA_VERSIONS,
  GOFAI_SCHEMA_IDS,
  CURRENT_COMPILER_VERSION,

  // Version utilities
  parseSemanticVersion,
  formatSemanticVersion,
  compareSemanticVersions,
  isVersionCompatible,
  requiresMigration,

  // Version envelope
  createVersionEnvelope,
  validateVersionEnvelope,
  getEnvelopeVersion,

  // Compiler version
  computeHash,
  formatCompilerVersion,
  areCompilerVersionsCompatible,

  // Migration registry
  gofaiMigrationRegistry,

  // Schema changes
  CPL_COMPATIBILITY_POLICY,
  CPL_SCHEMA_CHANGELOG,
  getSchemaChangelog,
  getChangesBetweenVersions,
  hasBreakingChanges,

  // Serialization
  serializeWithVersion,
  deserializeWithVersion,
  SerializationOptions,
  DeserializationOptions,

  // Edit package
  createEditPackageVersion,
  checkEditPackageCompatibility,

  // Deprecated fields
  registerDeprecatedField,
  checkForDeprecatedFields,
  DEPRECATED_FIELDS,

  // Fingerprinting
  computeCompilerFingerprint,
  doFingerprintsMatch,
} from '../versioning';

// =============================================================================
// Test Data
// =============================================================================

const V_1_0_0: SemanticVersion = { major: 1, minor: 0, patch: 0 };
const V_1_0_1: SemanticVersion = { major: 1, minor: 0, patch: 1 };
const V_1_1_0: SemanticVersion = { major: 1, minor: 1, patch: 0 };
const V_1_2_0: SemanticVersion = { major: 1, minor: 2, patch: 0 };
const V_2_0_0: SemanticVersion = { major: 2, minor: 0, patch: 0 };
const V_2_1_0: SemanticVersion = { major: 2, minor: 1, patch: 0 };

interface TestData {
  readonly id: number;
  readonly name: string;
  readonly value: string;
}

const SAMPLE_DATA: TestData = {
  id: 42,
  name: 'test',
  value: 'sample',
};

// =============================================================================
// Semantic Version Tests
// =============================================================================

describe('Semantic Version Parsing and Formatting', () => {
  it('should parse valid semantic version strings', () => {
    expect(parseSemanticVersion('1.0.0')).toEqual(V_1_0_0);
    expect(parseSemanticVersion('1.2.3')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
    });
    expect(parseSemanticVersion('10.20.30')).toEqual({
      major: 10,
      minor: 20,
      patch: 30,
    });
  });

  it('should return null for invalid version strings', () => {
    expect(parseSemanticVersion('1.0')).toBeNull();
    expect(parseSemanticVersion('1')).toBeNull();
    expect(parseSemanticVersion('v1.0.0')).toBeNull();
    expect(parseSemanticVersion('1.0.0-beta')).toBeNull();
    expect(parseSemanticVersion('1.0.0+build')).toBeNull();
    expect(parseSemanticVersion('abc')).toBeNull();
    expect(parseSemanticVersion('')).toBeNull();
  });

  it('should format semantic versions as strings', () => {
    expect(formatSemanticVersion(V_1_0_0)).toBe('1.0.0');
    expect(formatSemanticVersion(V_1_1_0)).toBe('1.1.0');
    expect(formatSemanticVersion(V_2_0_0)).toBe('2.0.0');
    expect(
      formatSemanticVersion({ major: 10, minor: 20, patch: 30 })
    ).toBe('10.20.30');
  });

  it('should round-trip parse and format', () => {
    const versions = ['1.0.0', '1.2.3', '10.20.30', '0.0.1'];
    for (const v of versions) {
      const parsed = parseSemanticVersion(v);
      expect(parsed).not.toBeNull();
      expect(formatSemanticVersion(parsed!)).toBe(v);
    }
  });
});

describe('Semantic Version Comparison', () => {
  it('should compare major versions', () => {
    expect(compareSemanticVersions(V_1_0_0, V_2_0_0)).toBe(-1);
    expect(compareSemanticVersions(V_2_0_0, V_1_0_0)).toBe(1);
    expect(compareSemanticVersions(V_1_0_0, V_1_0_0)).toBe(0);
  });

  it('should compare minor versions when majors equal', () => {
    expect(compareSemanticVersions(V_1_0_0, V_1_1_0)).toBe(-1);
    expect(compareSemanticVersions(V_1_1_0, V_1_0_0)).toBe(1);
    expect(compareSemanticVersions(V_1_1_0, V_1_1_0)).toBe(0);
  });

  it('should compare patch versions when major/minor equal', () => {
    expect(compareSemanticVersions(V_1_0_0, V_1_0_1)).toBe(-1);
    expect(compareSemanticVersions(V_1_0_1, V_1_0_0)).toBe(1);
    expect(compareSemanticVersions(V_1_0_1, V_1_0_1)).toBe(0);
  });

  it('should handle complex comparisons', () => {
    expect(compareSemanticVersions(V_1_0_0, V_1_2_0)).toBe(-1);
    expect(compareSemanticVersions(V_1_2_0, V_2_0_0)).toBe(-1);
    expect(compareSemanticVersions(V_2_0_0, V_2_1_0)).toBe(-1);
  });

  it('should be transitive', () => {
    const versions = [V_1_0_0, V_1_0_1, V_1_1_0, V_1_2_0, V_2_0_0];
    for (let i = 0; i < versions.length; i++) {
      for (let j = i + 1; j < versions.length; j++) {
        expect(compareSemanticVersions(versions[i], versions[j])).toBe(-1);
        expect(compareSemanticVersions(versions[j], versions[i])).toBe(1);
      }
    }
  });
});

describe('Version Compatibility', () => {
  it('should accept same version', () => {
    expect(isVersionCompatible(V_1_0_0, V_1_0_0)).toBe(true);
    expect(isVersionCompatible(V_1_1_0, V_1_1_0)).toBe(true);
  });

  it('should accept newer minor version (backward compatible)', () => {
    expect(isVersionCompatible(V_1_1_0, V_1_0_0)).toBe(true);
    expect(isVersionCompatible(V_1_2_0, V_1_0_0)).toBe(true);
    expect(isVersionCompatible(V_1_2_0, V_1_1_0)).toBe(true);
  });

  it('should accept newer patch version', () => {
    expect(isVersionCompatible(V_1_0_1, V_1_0_0)).toBe(true);
  });

  it('should reject different major version', () => {
    expect(isVersionCompatible(V_2_0_0, V_1_0_0)).toBe(false);
    expect(isVersionCompatible(V_1_0_0, V_2_0_0)).toBe(false);
  });

  it('should reject older minor version', () => {
    expect(isVersionCompatible(V_1_0_0, V_1_1_0)).toBe(false);
    expect(isVersionCompatible(V_1_1_0, V_1_2_0)).toBe(false);
  });
});

describe('Migration Requirements', () => {
  it('should not require migration for same version', () => {
    expect(requiresMigration(V_1_0_0, V_1_0_0)).toBe(false);
    expect(requiresMigration(V_1_1_0, V_1_1_0)).toBe(false);
  });

  it('should require migration for older version', () => {
    expect(requiresMigration(V_1_0_0, V_1_1_0)).toBe(true);
    expect(requiresMigration(V_1_0_0, V_2_0_0)).toBe(true);
  });

  it('should throw for newer version (cannot migrate forward)', () => {
    expect(() => requiresMigration(V_2_0_0, V_1_0_0)).toThrow(
      /newer than current/
    );
    expect(() => requiresMigration(V_1_1_0, V_1_0_0)).toThrow(
      /newer than current/
    );
  });
});

// =============================================================================
// Version Envelope Tests
// =============================================================================

describe('Version Envelope Creation', () => {
  it('should create version envelope with data', () => {
    const envelope = createVersionEnvelope(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      V_1_0_0,
      SAMPLE_DATA
    );

    expect(envelope.schema).toBe(GOFAI_SCHEMA_IDS.CPL_INTENT);
    expect(envelope.version).toEqual(V_1_0_0);
    expect(envelope.data).toEqual(SAMPLE_DATA);
    expect(envelope.migrations).toBeUndefined();
  });

  it('should create envelope for different schemas', () => {
    const schemas = [
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      GOFAI_SCHEMA_IDS.CPL_PLAN,
      GOFAI_SCHEMA_IDS.EDIT_PACKAGE,
    ];

    for (const schema of schemas) {
      const envelope = createVersionEnvelope(schema, V_1_0_0, SAMPLE_DATA);
      expect(envelope.schema).toBe(schema);
    }
  });
});

describe('Version Envelope Validation', () => {
  it('should validate correct envelope', () => {
    const envelope = createVersionEnvelope(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      V_1_0_0,
      SAMPLE_DATA
    );

    expect(
      validateVersionEnvelope(envelope, GOFAI_SCHEMA_IDS.CPL_INTENT)
    ).toBe(true);
  });

  it('should reject null or undefined', () => {
    expect(validateVersionEnvelope(null, GOFAI_SCHEMA_IDS.CPL_INTENT)).toBe(
      false
    );
    expect(
      validateVersionEnvelope(undefined, GOFAI_SCHEMA_IDS.CPL_INTENT)
    ).toBe(false);
  });

  it('should reject non-objects', () => {
    expect(
      validateVersionEnvelope('string', GOFAI_SCHEMA_IDS.CPL_INTENT)
    ).toBe(false);
    expect(validateVersionEnvelope(42, GOFAI_SCHEMA_IDS.CPL_INTENT)).toBe(
      false
    );
    expect(
      validateVersionEnvelope(true, GOFAI_SCHEMA_IDS.CPL_INTENT)
    ).toBe(false);
  });

  it('should reject wrong schema ID', () => {
    const envelope = createVersionEnvelope(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      V_1_0_0,
      SAMPLE_DATA
    );

    expect(validateVersionEnvelope(envelope, GOFAI_SCHEMA_IDS.CPL_PLAN)).toBe(
      false
    );
  });

  it('should reject missing fields', () => {
    expect(
      validateVersionEnvelope(
        { schema: GOFAI_SCHEMA_IDS.CPL_INTENT },
        GOFAI_SCHEMA_IDS.CPL_INTENT
      )
    ).toBe(false);

    expect(
      validateVersionEnvelope(
        { schema: GOFAI_SCHEMA_IDS.CPL_INTENT, version: V_1_0_0 },
        GOFAI_SCHEMA_IDS.CPL_INTENT
      )
    ).toBe(false);
  });

  it('should reject invalid version format', () => {
    const envelope = {
      schema: GOFAI_SCHEMA_IDS.CPL_INTENT,
      version: { major: 1, minor: 0 }, // missing patch
      data: SAMPLE_DATA,
    };

    expect(
      validateVersionEnvelope(envelope, GOFAI_SCHEMA_IDS.CPL_INTENT)
    ).toBe(false);
  });
});

describe('Version Envelope Extraction', () => {
  it('should extract version from envelope', () => {
    const envelope = createVersionEnvelope(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      V_1_1_0,
      SAMPLE_DATA
    );

    const version = getEnvelopeVersion(envelope);
    expect(version).toEqual(V_1_1_0);
  });
});

// =============================================================================
// Compiler Version Tests
// =============================================================================

describe('Hash Computation', () => {
  it('should compute hash for strings', () => {
    const hash1 = computeHash('test');
    const hash2 = computeHash('test');
    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBe(8);
  });

  it('should produce different hashes for different strings', () => {
    const hash1 = computeHash('test1');
    const hash2 = computeHash('test2');
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty string', () => {
    const hash = computeHash('');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(8);
  });
});

describe('Compiler Version Formatting', () => {
  it('should format compiler version', () => {
    const version: CompilerVersion = {
      version: V_1_0_0,
      lexiconHash: 'abc12345',
      grammarHash: 'def67890',
      prologHash: 'ghi11111',
      buildDate: '2024-01-01T00:00:00Z',
    };

    const formatted = formatCompilerVersion(version);
    expect(formatted).toBe('GOFAI Music+ v1.0.0');
  });

  it('should include commit hash if present', () => {
    const version: CompilerVersion = {
      version: V_1_0_0,
      lexiconHash: 'abc12345',
      grammarHash: 'def67890',
      prologHash: 'ghi11111',
      buildDate: '2024-01-01T00:00:00Z',
      commitHash: 'abcdef1234567890',
    };

    const formatted = formatCompilerVersion(version);
    expect(formatted).toContain('v1.0.0');
    expect(formatted).toContain('abcdef1');
  });
});

describe('Compiler Version Compatibility', () => {
  const baseVersion: CompilerVersion = {
    version: V_1_0_0,
    lexiconHash: 'abc12345',
    grammarHash: 'def67890',
    prologHash: 'ghi11111',
    buildDate: '2024-01-01T00:00:00Z',
  };

  it('should accept same compiler version', () => {
    const result = areCompilerVersionsCompatible(baseVersion, baseVersion);
    expect(result.compatible).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('should accept same major with lexicon changes (with warning)', () => {
    const newVersion: CompilerVersion = {
      ...baseVersion,
      lexiconHash: 'different',
    };

    const result = areCompilerVersionsCompatible(baseVersion, newVersion);
    expect(result.compatible).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Lexicon has changed');
  });

  it('should accept same major with grammar changes (with warning)', () => {
    const newVersion: CompilerVersion = {
      ...baseVersion,
      grammarHash: 'different',
    };

    const result = areCompilerVersionsCompatible(baseVersion, newVersion);
    expect(result.compatible).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Grammar has changed');
  });

  it('should reject different major version', () => {
    const newVersion: CompilerVersion = {
      ...baseVersion,
      version: V_2_0_0,
    };

    const result = areCompilerVersionsCompatible(baseVersion, newVersion);
    expect(result.compatible).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Major version mismatch');
  });

  it('should warn about multiple changes', () => {
    const newVersion: CompilerVersion = {
      ...baseVersion,
      lexiconHash: 'different1',
      grammarHash: 'different2',
    };

    const result = areCompilerVersionsCompatible(baseVersion, newVersion);
    expect(result.compatible).toBe(true);
    expect(result.warnings).toHaveLength(2);
  });
});

// =============================================================================
// Migration Registry Tests
// =============================================================================

describe('Migration Registry', () => {
  const TEST_SCHEMA = 'test:schema';

  beforeEach(() => {
    // Clear registry (use internal API carefully)
    (gofaiMigrationRegistry as any).migrations.clear();
  });

  it('should register migrations', () => {
    const migration: Migration<TestData, TestData> = {
      schema: TEST_SCHEMA,
      from: V_1_0_0,
      to: V_1_1_0,
      description: 'Test migration',
      migrate: data => ({ ...data, value: 'migrated' }),
    };

    gofaiMigrationRegistry.register(migration);

    const migrations = gofaiMigrationRegistry.getMigrations(TEST_SCHEMA);
    expect(migrations).toHaveLength(1);
    expect(migrations[0]).toBe(migration);
  });

  it('should find migration path (single step)', () => {
    const migration: Migration = {
      schema: TEST_SCHEMA,
      from: V_1_0_0,
      to: V_1_1_0,
      description: 'Test migration',
      migrate: data => data,
    };

    gofaiMigrationRegistry.register(migration);

    const path = gofaiMigrationRegistry.findMigrationPath(
      TEST_SCHEMA,
      V_1_0_0,
      V_1_1_0
    );
    expect(path).toHaveLength(1);
    expect(path![0]).toBe(migration);
  });

  it('should find migration path (multiple steps)', () => {
    const migration1: Migration = {
      schema: TEST_SCHEMA,
      from: V_1_0_0,
      to: V_1_1_0,
      description: 'Step 1',
      migrate: data => data,
    };

    const migration2: Migration = {
      schema: TEST_SCHEMA,
      from: V_1_1_0,
      to: V_1_2_0,
      description: 'Step 2',
      migrate: data => data,
    };

    gofaiMigrationRegistry.register(migration1);
    gofaiMigrationRegistry.register(migration2);

    const path = gofaiMigrationRegistry.findMigrationPath(
      TEST_SCHEMA,
      V_1_0_0,
      V_1_2_0
    );
    expect(path).toHaveLength(2);
    expect(path![0]).toBe(migration1);
    expect(path![1]).toBe(migration2);
  });

  it('should return null if no path exists', () => {
    const path = gofaiMigrationRegistry.findMigrationPath(
      TEST_SCHEMA,
      V_1_0_0,
      V_2_0_0
    );
    expect(path).toBeNull();
  });

  it('should apply migrations to data', () => {
    interface V1Data {
      readonly value: string;
    }

    interface V2Data {
      readonly value: string;
      readonly newField: boolean;
    }

    const migration: Migration<V1Data, V2Data> = {
      schema: TEST_SCHEMA,
      from: V_1_0_0,
      to: V_1_1_0,
      description: 'Add newField',
      migrate: data => ({ ...data, newField: true }),
    };

    gofaiMigrationRegistry.register(migration);

    const result = gofaiMigrationRegistry.applyMigrations<V2Data>(
      TEST_SCHEMA,
      { value: 'original' },
      V_1_0_0,
      V_1_1_0
    );

    expect(result).not.toBeNull();
    expect(result!.data).toEqual({ value: 'original', newField: true });
    expect(result!.records).toHaveLength(1);
    expect(result!.records[0].migration).toBe('Add newField');
  });

  it('should apply multiple migrations in sequence', () => {
    interface V1Data {
      readonly value: number;
    }
    interface V2Data {
      readonly value: number;
      readonly doubled: number;
    }
    interface V3Data {
      readonly value: number;
      readonly doubled: number;
      readonly tripled: number;
    }

    const migration1: Migration<V1Data, V2Data> = {
      schema: TEST_SCHEMA,
      from: V_1_0_0,
      to: V_1_1_0,
      description: 'Add doubled',
      migrate: data => ({ ...data, doubled: data.value * 2 }),
    };

    const migration2: Migration<V2Data, V3Data> = {
      schema: TEST_SCHEMA,
      from: V_1_1_0,
      to: V_1_2_0,
      description: 'Add tripled',
      migrate: data => ({ ...data, tripled: data.value * 3 }),
    };

    gofaiMigrationRegistry.register(migration1);
    gofaiMigrationRegistry.register(migration2);

    const result = gofaiMigrationRegistry.applyMigrations<V3Data>(
      TEST_SCHEMA,
      { value: 10 },
      V_1_0_0,
      V_1_2_0
    );

    expect(result).not.toBeNull();
    expect(result!.data).toEqual({ value: 10, doubled: 20, tripled: 30 });
    expect(result!.records).toHaveLength(2);
  });
});

// =============================================================================
// Schema Changelog Tests
// =============================================================================

describe('Schema Changelog', () => {
  it('should have initial version in changelog', () => {
    expect(CPL_SCHEMA_CHANGELOG).toHaveLength(1);
    expect(CPL_SCHEMA_CHANGELOG[0].version).toEqual(V_1_0_0);
  });

  it('should get changelog for schema', () => {
    const changelog = getSchemaChangelog(GOFAI_SCHEMA_IDS.CPL_INTENT);
    expect(changelog).toBe(CPL_SCHEMA_CHANGELOG);
  });

  it('should get changes between versions (empty range)', () => {
    const changes = getChangesBetweenVersions(V_1_0_0, V_1_0_0);
    expect(changes).toHaveLength(0);
  });

  it('should detect no breaking changes in initial version', () => {
    expect(hasBreakingChanges(V_1_0_0, V_1_0_0)).toBe(false);
  });

  it('should categorize change types', () => {
    expect(CPL_COMPATIBILITY_POLICY.MAJOR_BREAKING).toContain(
      'field-removal'
    );
    expect(CPL_COMPATIBILITY_POLICY.MINOR_ADDITIVE).toContain(
      'field-addition'
    );
    expect(CPL_COMPATIBILITY_POLICY.PATCH_COMPATIBLE).toContain(
      'documentation'
    );
  });
});

// =============================================================================
// Serialization/Deserialization Tests
// =============================================================================

describe('Serialization with Versioning', () => {
  it('should serialize data with version', () => {
    const result = serializeWithVersion(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      V_1_0_0,
      SAMPLE_DATA
    );

    expect(result.version).toEqual(V_1_0_0);
    expect(result.schema).toBe(GOFAI_SCHEMA_IDS.CPL_INTENT);
    expect(result.warnings).toHaveLength(0);

    const parsed = JSON.parse(result.json);
    expect(parsed.schema).toBe(GOFAI_SCHEMA_IDS.CPL_INTENT);
    expect(parsed.version).toEqual(V_1_0_0);
    expect(parsed.data).toEqual(SAMPLE_DATA);
  });

  it('should serialize in compact format', () => {
    const compact = serializeWithVersion(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      V_1_0_0,
      SAMPLE_DATA,
      { compact: true }
    );

    const pretty = serializeWithVersion(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      V_1_0_0,
      SAMPLE_DATA,
      { compact: false }
    );

    expect(compact.json.length).toBeLessThan(pretty.json.length);
    expect(compact.json).not.toContain('\n');
    expect(pretty.json).toContain('\n');
  });
});

describe('Deserialization with Versioning', () => {
  it('should deserialize current version', () => {
    const serialized = serializeWithVersion(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      V_1_0_0,
      SAMPLE_DATA
    );

    const result = deserializeWithVersion<TestData>(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      serialized.json,
      V_1_0_0
    );

    expect(result.data).toEqual(SAMPLE_DATA);
    expect(result.originalVersion).toEqual(V_1_0_0);
    expect(result.currentVersion).toEqual(V_1_0_0);
    expect(result.wasMigrated).toBe(false);
    expect(result.migrations).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should throw on invalid JSON', () => {
    expect(() =>
      deserializeWithVersion(
        GOFAI_SCHEMA_IDS.CPL_INTENT,
        'invalid json',
        V_1_0_0
      )
    ).toThrow(/Failed to parse JSON/);
  });

  it('should throw on wrong schema', () => {
    const serialized = serializeWithVersion(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      V_1_0_0,
      SAMPLE_DATA
    );

    expect(() =>
      deserializeWithVersion(
        GOFAI_SCHEMA_IDS.CPL_PLAN,
        serialized.json,
        V_1_0_0
      )
    ).toThrow(/Invalid version envelope/);
  });

  it('should warn about old version without auto-migrate', () => {
    const serialized = serializeWithVersion(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      V_1_0_0,
      SAMPLE_DATA
    );

    const result = deserializeWithVersion<TestData>(
      GOFAI_SCHEMA_IDS.CPL_INTENT,
      serialized.json,
      V_1_1_0,
      { autoMigrate: false }
    );

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('autoMigrate');
  });
});

// =============================================================================
// Edit Package Version Tests
// =============================================================================

describe('Edit Package Version Creation', () => {
  it('should create edit package version', () => {
    const extensions = [
      { namespace: 'mypack', version: V_1_0_0 },
      { namespace: 'other', version: V_2_0_0 },
    ];
    const prologModules = ['theory', 'harmony'];

    const version = createEditPackageVersion(extensions, prologModules);

    expect(version.cplVersions.intent).toEqual(
      GOFAI_SCHEMA_VERSIONS.CPL_INTENT
    );
    expect(version.cplVersions.plan).toEqual(GOFAI_SCHEMA_VERSIONS.CPL_PLAN);
    expect(version.compiler).toBe(CURRENT_COMPILER_VERSION);
    expect(version.extensions).toEqual(extensions);
    expect(version.prologModules).toEqual(prologModules);
    expect(version.timestamp).toBeTruthy();
  });

  it('should handle empty extensions', () => {
    const version = createEditPackageVersion([], []);
    expect(version.extensions).toHaveLength(0);
    expect(version.prologModules).toHaveLength(0);
  });
});

describe('Edit Package Compatibility', () => {
  it('should accept compatible package version', () => {
    const packageVersion = createEditPackageVersion([], []);

    const result = checkEditPackageCompatibility(
      packageVersion,
      CURRENT_COMPILER_VERSION
    );

    expect(result.compatible).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it('should reject incompatible major version', () => {
    const oldCompiler: CompilerVersion = {
      version: V_2_0_0, // Different major
      lexiconHash: '00000000',
      grammarHash: '00000000',
      prologHash: '00000000',
      buildDate: '2024-01-01T00:00:00Z',
    };

    const packageVersion: EditPackageVersion = {
      cplVersions: {
        intent: V_1_0_0,
        plan: V_1_0_0,
        host: V_1_0_0,
      },
      compiler: oldCompiler,
      extensions: [],
      prologModules: [],
      timestamp: '2024-01-01T00:00:00Z',
    };

    const result = checkEditPackageCompatibility(
      packageVersion,
      CURRENT_COMPILER_VERSION
    );

    expect(result.compatible).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it('should warn about required extensions', () => {
    const packageVersion = createEditPackageVersion(
      [{ namespace: 'custom-pack', version: V_1_0_0 }],
      []
    );

    const result = checkEditPackageCompatibility(
      packageVersion,
      CURRENT_COMPILER_VERSION
    );

    expect(result.warnings.some(w => w.includes('custom-pack'))).toBe(true);
  });
});

// =============================================================================
// Deprecated Fields Tests
// =============================================================================

describe('Deprecated Field Handling', () => {
  const TEST_SCHEMA = 'test:schema:deprecated';

  beforeEach(() => {
    DEPRECATED_FIELDS.clear();
  });

  it('should register deprecated field', () => {
    registerDeprecatedField(TEST_SCHEMA, {
      oldName: 'oldField',
      newName: 'newField',
      deprecatedIn: V_1_1_0,
    });

    expect(DEPRECATED_FIELDS.has(TEST_SCHEMA)).toBe(true);
    expect(DEPRECATED_FIELDS.get(TEST_SCHEMA)).toHaveLength(1);
  });

  it('should detect deprecated fields in data', () => {
    registerDeprecatedField(TEST_SCHEMA, {
      oldName: 'oldField',
      newName: 'newField',
      deprecatedIn: V_1_1_0,
    });

    const warnings = checkForDeprecatedFields(TEST_SCHEMA, {
      oldField: 'value',
      otherField: 'other',
    });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('oldField');
    expect(warnings[0]).toContain('deprecated');
    expect(warnings[0]).toContain('newField');
  });

  it('should not warn for non-deprecated fields', () => {
    registerDeprecatedField(TEST_SCHEMA, {
      oldName: 'oldField',
      newName: 'newField',
      deprecatedIn: V_1_1_0,
    });

    const warnings = checkForDeprecatedFields(TEST_SCHEMA, {
      newField: 'value',
      otherField: 'other',
    });

    expect(warnings).toHaveLength(0);
  });

  it('should mention removal version if present', () => {
    registerDeprecatedField(TEST_SCHEMA, {
      oldName: 'oldField',
      newName: 'newField',
      deprecatedIn: V_1_1_0,
      removedIn: V_2_0_0,
    });

    const warnings = checkForDeprecatedFields(TEST_SCHEMA, {
      oldField: 'value',
    });

    expect(warnings[0]).toContain('2.0.0');
    expect(warnings[0]).toContain('removed');
  });
});

// =============================================================================
// Fingerprinting Tests
// =============================================================================

describe('Compiler Fingerprinting', () => {
  it('should compute fingerprint from compiler version', () => {
    const fingerprint = computeCompilerFingerprint(CURRENT_COMPILER_VERSION);

    expect(typeof fingerprint).toBe('string');
    expect(fingerprint.length).toBe(8);
  });

  it('should produce same fingerprint for same version', () => {
    const fp1 = computeCompilerFingerprint(CURRENT_COMPILER_VERSION);
    const fp2 = computeCompilerFingerprint(CURRENT_COMPILER_VERSION);

    expect(fp1).toBe(fp2);
  });

  it('should produce different fingerprints for different versions', () => {
    const version1: CompilerVersion = {
      version: V_1_0_0,
      lexiconHash: 'hash1',
      grammarHash: 'hash1',
      prologHash: 'hash1',
      buildDate: '2024-01-01T00:00:00Z',
    };

    const version2: CompilerVersion = {
      version: V_1_0_0,
      lexiconHash: 'hash2',
      grammarHash: 'hash1',
      prologHash: 'hash1',
      buildDate: '2024-01-01T00:00:00Z',
    };

    const fp1 = computeCompilerFingerprint(version1);
    const fp2 = computeCompilerFingerprint(version2);

    expect(fp1).not.toBe(fp2);
  });

  it('should match identical fingerprints', () => {
    const fp1 = 'abcd1234';
    const fp2 = 'abcd1234';
    const fp3 = 'different';

    expect(doFingerprintsMatch(fp1, fp2)).toBe(true);
    expect(doFingerprintsMatch(fp1, fp3)).toBe(false);
  });
});

// =============================================================================
// Current Version Constants Tests
// =============================================================================

describe('Current Version Constants', () => {
  it('should have defined schema versions', () => {
    expect(GOFAI_SCHEMA_VERSIONS.CPL_INTENT).toBeDefined();
    expect(GOFAI_SCHEMA_VERSIONS.CPL_PLAN).toBeDefined();
    expect(GOFAI_SCHEMA_VERSIONS.CPL_HOST).toBeDefined();
    expect(GOFAI_SCHEMA_VERSIONS.EDIT_PACKAGE).toBeDefined();
    expect(GOFAI_SCHEMA_VERSIONS.DIALOGUE_STATE).toBeDefined();
    expect(GOFAI_SCHEMA_VERSIONS.LEXICON).toBeDefined();
    expect(GOFAI_SCHEMA_VERSIONS.GRAMMAR).toBeDefined();
    expect(GOFAI_SCHEMA_VERSIONS.EXTENSION).toBeDefined();
  });

  it('should have defined schema IDs', () => {
    expect(GOFAI_SCHEMA_IDS.CPL_INTENT).toBe('gofai:schema:cpl-intent');
    expect(GOFAI_SCHEMA_IDS.CPL_PLAN).toBe('gofai:schema:cpl-plan');
    expect(GOFAI_SCHEMA_IDS.CPL_HOST).toBe('gofai:schema:cpl-host');
  });

  it('should have valid current compiler version', () => {
    expect(CURRENT_COMPILER_VERSION.version).toBeDefined();
    expect(CURRENT_COMPILER_VERSION.lexiconHash).toBeDefined();
    expect(CURRENT_COMPILER_VERSION.grammarHash).toBeDefined();
    expect(CURRENT_COMPILER_VERSION.prologHash).toBeDefined();
    expect(CURRENT_COMPILER_VERSION.buildDate).toBeDefined();
  });

  it('all schema versions should be valid', () => {
    const versions = Object.values(GOFAI_SCHEMA_VERSIONS);
    for (const version of versions) {
      expect(version.major).toBeGreaterThanOrEqual(0);
      expect(version.minor).toBeGreaterThanOrEqual(0);
      expect(version.patch).toBeGreaterThanOrEqual(0);
    }
  });
});
