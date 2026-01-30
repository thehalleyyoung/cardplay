/**
 * @fileoverview Schema Versioning for Persisted State
 * 
 * Defines version strategy for persisted CardPlay state:
 * - Board definitions (layout, panels, decks)
 * - Deck state (current cards, playback position)
 * - Routing state (port connections)
 * - Event history (for undo/replay)
 * 
 * Version Format: major.minor.patch
 * - Major: Breaking changes requiring migration
 * - Minor: New optional fields, backward compatible
 * - Patch: Bug fixes, no schema change
 * 
 * @module @cardplay/canon/versioning
 */

// ============================================================================
// VERSION TYPES
// ============================================================================

/**
 * Schema version in semver format.
 */
export interface SchemaVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

/**
 * Create a SchemaVersion from components.
 */
export function createSchemaVersion(major: number, minor: number, patch: number): SchemaVersion {
  return { major, minor, patch };
}

/**
 * Parse a version string into a SchemaVersion.
 */
export function parseSchemaVersion(version: string): SchemaVersion | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match || !match[1] || !match[2] || !match[3]) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Format a SchemaVersion as a string.
 */
export function formatSchemaVersion(version: SchemaVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Compare two versions.
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: SchemaVersion, b: SchemaVersion): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return 0;
}

/**
 * Check if source version is compatible with target version.
 * Compatible if same major version and source <= target.
 */
export function isVersionCompatible(source: SchemaVersion, target: SchemaVersion): boolean {
  if (source.major !== target.major) return false;
  return compareVersions(source, target) <= 0;
}

// ============================================================================
// CURRENT SCHEMA VERSIONS
// ============================================================================

/**
 * Current schema versions for each persisted state type.
 */
export const CURRENT_SCHEMA_VERSIONS = {
  /** Board definition schema (layout, panels, decks) */
  board: createSchemaVersion(2, 0, 0), // v2: Added panelId to BoardDeck
  
  /** Deck state schema (current cards, playback state) */
  deck: createSchemaVersion(1, 1, 0), // v1.1: Added PPQ-based timing
  
  /** Routing state schema (port connections) */
  routing: createSchemaVersion(1, 2, 0), // v1.2: Normalized connection ports + dedup (Changes 225-226)
  
  /** Event history schema (for undo/replay) */
  events: createSchemaVersion(1, 1, 0), // v1.1: Normalized EventKind names
  
  /** Card manifest schema */
  cardManifest: createSchemaVersion(1, 0, 0),
  
  /** Pack manifest schema */
  packManifest: createSchemaVersion(1, 0, 0),
} as const;

export type SchemaType = keyof typeof CURRENT_SCHEMA_VERSIONS;

// ============================================================================
// VERSIONED STATE WRAPPER
// ============================================================================

/**
 * Wrapper for any persisted state that includes schema version.
 */
export interface VersionedState<T> {
  /** Schema type identifier */
  readonly schemaType: SchemaType;
  /** Schema version of this state */
  readonly schemaVersion: string;
  /** The actual state data */
  readonly data: T;
  /** ISO timestamp when this state was created/modified */
  readonly timestamp?: string;
}

/**
 * Create a versioned state wrapper.
 */
export function createVersionedState<T>(
  schemaType: SchemaType,
  data: T
): VersionedState<T> {
  return {
    schemaType,
    schemaVersion: formatSchemaVersion(CURRENT_SCHEMA_VERSIONS[schemaType]),
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if a versioned state needs migration.
 */
export function needsMigration<T>(state: VersionedState<T>): boolean {
  const sourceVersion = parseSchemaVersion(state.schemaVersion);
  if (!sourceVersion) return true; // Invalid version, needs migration
  
  const targetVersion = CURRENT_SCHEMA_VERSIONS[state.schemaType];
  return compareVersions(sourceVersion, targetVersion) < 0;
}

/**
 * Get the version of a versioned state.
 */
export function getStateVersion<T>(state: VersionedState<T>): SchemaVersion | null {
  return parseSchemaVersion(state.schemaVersion);
}

// ============================================================================
// MIGRATION REGISTRY
// ============================================================================

/**
 * Migration function type.
 */
export type MigrationFn<T = unknown> = (data: T, fromVersion: SchemaVersion) => T;

/**
 * Migration path definition.
 */
export interface MigrationPath {
  /** Source version (migrate FROM) */
  readonly from: SchemaVersion;
  /** Target version (migrate TO) */
  readonly to: SchemaVersion;
  /** Migration function */
  readonly migrate: MigrationFn;
}

/**
 * Registry of migrations for each schema type.
 */
const migrationRegistry: Map<SchemaType, MigrationPath[]> = new Map();

/**
 * Register a migration path.
 */
export function registerMigration(
  schemaType: SchemaType,
  from: SchemaVersion,
  to: SchemaVersion,
  migrate: MigrationFn
): void {
  const paths = migrationRegistry.get(schemaType) ?? [];
  paths.push({ from, to, migrate });
  migrationRegistry.set(schemaType, paths);
}

/**
 * Get all migrations for a schema type.
 */
export function getMigrations(schemaType: SchemaType): MigrationPath[] {
  return migrationRegistry.get(schemaType) ?? [];
}

/**
 * Clear all registered migrations (for testing).
 */
export function clearMigrations(): void {
  migrationRegistry.clear();
}
