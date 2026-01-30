/**
 * @fileoverview Registry V2 Schema and Migrations
 * 
 * Defines versioned snapshot envelope format and migration system
 * for registry persistence and evolution.
 * 
 * References:
 * - docs/registry-migration-format.md
 * - docs/registry-api.md
 * 
 * @module registry/v2/schema
 */

import type { RegistrySnapshot, TypedRegistryEntry } from './types';

/**
 * Current registry schema version.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Minimum supported schema version (for backwards compatibility).
 */
export const MIN_SUPPORTED_SCHEMA_VERSION = 1;

/**
 * Migration function signature.
 * Takes a snapshot at version N and returns a snapshot at version N+1.
 */
export type MigrationFunction = (snapshot: RegistrySnapshot) => RegistrySnapshot;

/**
 * Registry of migration functions.
 * Key is the target version (version after migration).
 */
const migrations = new Map<number, MigrationFunction>();

/**
 * Registers a migration function.
 * 
 * @param targetVersion Version that this migration produces
 * @param migrate Migration function
 */
export function registerMigration(targetVersion: number, migrate: MigrationFunction): void {
  if (migrations.has(targetVersion)) {
    console.warn(`Migration to version ${targetVersion} already registered, overwriting`);
  }
  migrations.set(targetVersion, migrate);
}

/**
 * Creates a new empty registry snapshot.
 */
export function createEmptySnapshot(cardplayVersion: string): RegistrySnapshot {
  return {
    version: CURRENT_SCHEMA_VERSION,
    cardplayVersion,
    createdAt: new Date(),
    entries: {},
  };
}

/**
 * Validates a registry snapshot structure.
 */
export interface SnapshotValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSnapshot(snapshot: unknown): SnapshotValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!snapshot || typeof snapshot !== 'object') {
    errors.push('Snapshot must be an object');
    return { valid: false, errors, warnings };
  }
  
  const snap = snapshot as Partial<RegistrySnapshot>;
  
  // Check version
  if (typeof snap.version !== 'number') {
    errors.push('Snapshot version must be a number');
  } else if (snap.version < MIN_SUPPORTED_SCHEMA_VERSION) {
    errors.push(`Snapshot version ${snap.version} is too old (minimum ${MIN_SUPPORTED_SCHEMA_VERSION})`);
  } else if (snap.version > CURRENT_SCHEMA_VERSION) {
    warnings.push(`Snapshot version ${snap.version} is newer than current ${CURRENT_SCHEMA_VERSION}, may need migration`);
  }
  
  // Check cardplayVersion
  if (typeof snap.cardplayVersion !== 'string') {
    errors.push('Snapshot cardplayVersion must be a string');
  }
  
  // Check createdAt
  if (!(snap.createdAt instanceof Date) && typeof snap.createdAt !== 'string') {
    warnings.push('Snapshot createdAt should be a Date or ISO string');
  }
  
  // Check entries
  if (!snap.entries || typeof snap.entries !== 'object') {
    errors.push('Snapshot entries must be an object');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Migrates a snapshot from its current version to the latest version.
 * 
 * @param snapshot Snapshot to migrate
 * @returns Migrated snapshot at current version
 */
export function migrateSnapshot(snapshot: RegistrySnapshot): RegistrySnapshot {
  let current = { ...snapshot };
  
  // If already at current version, return as-is
  if (current.version === CURRENT_SCHEMA_VERSION) {
    return current;
  }
  
  // If newer than current, we can't migrate forward
  if (current.version > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Cannot migrate snapshot from version ${current.version} to ${CURRENT_SCHEMA_VERSION} (forward migration not supported)`
    );
  }
  
  // Apply migrations sequentially
  for (let targetVersion = current.version + 1; targetVersion <= CURRENT_SCHEMA_VERSION; targetVersion++) {
    const migrate = migrations.get(targetVersion);
    if (!migrate) {
      throw new Error(`No migration found for version ${targetVersion}`);
    }
    
    console.log(`Migrating snapshot from version ${current.version} to ${targetVersion}`);
    current = migrate(current);
    current.version = targetVersion;
  }
  
  return current;
}

/**
 * Serializes a registry snapshot to JSON.
 */
export function serializeSnapshot(snapshot: RegistrySnapshot): string {
  // Convert Date to ISO string for serialization
  const serializable = {
    ...snapshot,
    createdAt: snapshot.createdAt.toISOString(),
  };
  
  return JSON.stringify(serializable, null, 2);
}

/**
 * Deserializes a registry snapshot from JSON.
 */
export function deserializeSnapshot(json: string): RegistrySnapshot {
  const parsed = JSON.parse(json);
  
  // Validate structure
  const validation = validateSnapshot(parsed);
  if (!validation.valid) {
    throw new Error(`Invalid snapshot: ${validation.errors.join(', ')}`);
  }
  
  // Convert ISO string back to Date
  if (typeof parsed.createdAt === 'string') {
    parsed.createdAt = new Date(parsed.createdAt);
  }
  
  // Migrate if needed
  if (parsed.version < CURRENT_SCHEMA_VERSION) {
    return migrateSnapshot(parsed as RegistrySnapshot);
  }
  
  return parsed as RegistrySnapshot;
}

/**
 * Creates a snapshot diff-friendly hash for an entry.
 * Used to detect changes when comparing snapshots.
 */
export function hashEntry(entry: TypedRegistryEntry): string {
  // Create a stable JSON representation for hashing
  const stable = JSON.stringify({
    type: entry.type,
    id: entry.provenance.id,
    version: entry.provenance.source.version,
    // Exclude timestamp and active status from hash
    entity: entry.entity,
  });
  
  // Simple hash (in production, use a proper hash function)
  let hash = 0;
  for (let i = 0; i < stable.length; i++) {
    const char = stable.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString(36);
}

/**
 * Clones a snapshot (deep copy).
 */
export function cloneSnapshot(snapshot: RegistrySnapshot): RegistrySnapshot {
  return JSON.parse(JSON.stringify({
    ...snapshot,
    createdAt: snapshot.createdAt.toISOString(),
  })) as RegistrySnapshot;
}

// ============================================================================
// EXAMPLE MIGRATIONS
// ============================================================================

/**
 * Example migration from version 1 to version 2 (placeholder).
 * This would be uncommented and implemented when schema v2 is defined.
 */
// registerMigration(2, (snapshot) => {
//   // Add new fields, transform data, etc.
//   return {
//     ...snapshot,
//     // ... migrations here
//   };
// });
