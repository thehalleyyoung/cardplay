/**
 * @fileoverview KB Migration System for Schema Changes
 *
 * L367: Provides a migration registry and executor so that knowledge bases
 * can evolve their schema across versions without losing user data.
 *
 * Migrations are registered as linear version chains per KB name.
 * The executor walks the chain and applies each step's Prolog code
 * via the adapter.
 *
 * @module @cardplay/ai/engine/kb-migration
 */

import type { PrologAdapter } from './prolog-adapter';

// ============================================================================
// TYPES
// ============================================================================

/** A single migration step between two adjacent KB versions. */
export interface KBMigration {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly kbName: string;
  /** Prolog code to execute for migration (retract old facts, assert new ones). */
  readonly migrationCode: string;
  readonly description: string;
}

/** An ordered plan of migration steps for a single KB. */
export interface MigrationPlan {
  readonly kbName: string;
  readonly currentVersion: string;
  readonly targetVersion: string;
  readonly steps: KBMigration[];
}

/** Result of executing a migration plan. */
export interface MigrationResult {
  readonly success: boolean;
  readonly appliedSteps: number;
  readonly error?: string;
}

/** Registry for storing and querying KB migrations. */
export interface KBMigrationRegistry {
  register(migration: KBMigration): void;
  getMigrationsFor(kbName: string, fromVersion: string, toVersion: string): KBMigration[];
  planMigration(kbName: string, currentVersion: string, targetVersion: string): MigrationPlan | null;
}

// ============================================================================
// REGISTRY IMPLEMENTATION
// ============================================================================

/**
 * Create a new migration registry.
 *
 * L367: Migrations are stored per KB name and looked up as a linear chain
 * from one version to the next.
 */
export function createMigrationRegistry(): KBMigrationRegistry {
  const migrations = new Map<string, KBMigration[]>();

  function register(migration: KBMigration): void {
    const existing = migrations.get(migration.kbName) ?? [];
    existing.push(migration);
    migrations.set(migration.kbName, existing);
  }

  function getMigrationsFor(kbName: string, fromVersion: string, toVersion: string): KBMigration[] {
    return buildChain(kbName, fromVersion, toVersion);
  }

  function planMigration(
    kbName: string,
    currentVersion: string,
    targetVersion: string
  ): MigrationPlan | null {
    const steps = buildChain(kbName, currentVersion, targetVersion);
    if (steps.length === 0 && currentVersion !== targetVersion) {
      return null;
    }
    return { kbName, currentVersion, targetVersion, steps };
  }

  /**
   * Walk the linear migration chain from `from` to `to`.
   * Returns an empty array if no complete path exists.
   */
  function buildChain(kbName: string, from: string, to: string): KBMigration[] {
    if (from === to) {
      return [];
    }

    const kbMigrations = migrations.get(kbName);
    if (!kbMigrations || kbMigrations.length === 0) {
      return [];
    }

    const chain: KBMigration[] = [];
    let current = from;
    const visited = new Set<string>();

    while (current !== to) {
      if (visited.has(current)) {
        return []; // cycle detected
      }
      visited.add(current);

      const next = kbMigrations.find((m) => m.fromVersion === current);
      if (!next) {
        return []; // no path
      }
      chain.push(next);
      current = next.toVersion;
    }

    return chain;
  }

  return { register, getMigrationsFor, planMigration };
}

// ============================================================================
// GLOBAL SINGLETON
// ============================================================================

let globalRegistry: KBMigrationRegistry | null = null;

/**
 * Get the global migration registry singleton.
 *
 * L367: Single shared registry used across the application.
 */
export function getGlobalMigrationRegistry(): KBMigrationRegistry {
  if (!globalRegistry) {
    globalRegistry = createMigrationRegistry();
  }
  return globalRegistry;
}

// ============================================================================
// EXECUTION
// ============================================================================

/**
 * Execute a migration plan by applying each step's Prolog code in order.
 *
 * L367: Steps are applied sequentially; execution stops on the first failure.
 */
export async function executeMigration(
  plan: MigrationPlan,
  adapter: PrologAdapter
): Promise<MigrationResult> {
  let appliedSteps = 0;

  for (const step of plan.steps) {
    try {
      const ok = await adapter.loadProgram(
        step.migrationCode,
        `migration_${step.kbName}_${step.fromVersion}_to_${step.toVersion}`
      );
      if (!ok) {
        return {
          success: false,
          appliedSteps,
          error: `Migration step failed: ${step.description} (${step.fromVersion} -> ${step.toVersion})`,
        };
      }
      appliedSteps++;
    } catch (err) {
      return {
        success: false,
        appliedSteps,
        error: `Migration step threw: ${step.description} — ${String(err)}`,
      };
    }
  }

  return { success: true, appliedSteps };
}

// ============================================================================
// VERSION CHECK
// ============================================================================

/**
 * Check whether a KB needs migration by comparing cached and current versions.
 *
 * L367: Simple string comparison — any difference means migration is needed.
 */
export function needsMigration(
  _kbName: string,
  cachedVersion: string,
  currentVersion: string
): boolean {
  return cachedVersion !== currentVersion;
}
