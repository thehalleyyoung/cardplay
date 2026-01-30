/**
 * @file Migration Policy for Language Behavior Changes
 * @gofai_goalB Step 048 [Infra]
 * 
 * This module defines policies and utilities for handling migration when the
 * GOFAI compiler's language behavior changes. This includes:
 * 
 * - CPL schema evolution
 * - Lexicon updates (new meanings, deprecated terms)
 * - Grammar rule changes
 * - Opcode semantic changes
 * - Constraint definition changes
 * 
 * **Core challenge:** Users may have edit history containing old CPL. When the
 * compiler upgrades, we need to either:
 * 1. Preserve old CPL as-is (display only, no re-execution)
 * 2. Migrate old CPL to new schema (best effort)
 * 3. Mark old CPL as incompatible (with clear explanation)
 * 
 * **Design principle:** Never silently change the meaning of old CPL. Always
 * preserve or fail loudly.
 */

/**
 * =============================================================================
 * MIGRATION POLICY PRINCIPLES
 * =============================================================================
 */

/**
 * Core migration policy principles.
 */
export const MIGRATION_PRINCIPLES = {
  /**
   * Principle 1: Preserve old CPL semantics.
   * When possible, preserve the exact meaning of old CPL, even if the current
   * compiler would parse the same utterance differently.
   */
  PRESERVE_SEMANTICS: 'preserve_semantics' as const,

  /**
   * Principle 2: Never silent reinterpretation.
   * If old CPL cannot be preserved exactly, warn the user. Do not silently
   * change meaning.
   */
  NO_SILENT_REINTERPRETATION: 'no_silent_reinterpretation' as const,

  /**
   * Principle 3: Forward compatibility where possible.
   * Schema changes should be additive (new fields) rather than breaking
   * (changing field types).
   */
  FORWARD_COMPATIBLE: 'forward_compatible' as const,

  /**
   * Principle 4: Explicit deprecation.
   * When features are deprecated, provide clear timeline and migration paths.
   * Support deprecated features for at least one major version.
   */
  EXPLICIT_DEPRECATION: 'explicit_deprecation' as const,

  /**
   * Principle 5: Reproducible history.
   * Users should be able to replay old edits for debugging and audit purposes,
   * even if the current compiler would behave differently.
   */
  REPRODUCIBLE_HISTORY: 'reproducible_history' as const,

  /**
   * Principle 6: Clear migration paths.
   * When breaking changes are necessary, provide automated migration tools
   * and clear documentation.
   */
  CLEAR_MIGRATION_PATHS: 'clear_migration_paths' as const,
} as const;

/**
 * =============================================================================
 * CHANGE TYPES AND IMPACT
 * =============================================================================
 */

/**
 * Type of language change.
 */
export type ChangeType =
  | 'schema' // CPL schema structure change
  | 'lexicon' // Vocabulary change (new/changed/removed meanings)
  | 'grammar' // Grammar rule change
  | 'semantics' // Semantic composition logic change
  | 'pragmatics' // Pragmatic resolution logic change
  | 'planning' // Planning algorithm change
  | 'opcode'; // Opcode definition or behavior change

/**
 * Impact level of a change.
 */
export type ImpactLevel =
  | 'patch' // Backward compatible fix (e.g., bug fix)
  | 'minor' // Additive change (new features, backward compatible)
  | 'major'; // Breaking change (requires migration)

/**
 * Change descriptor.
 */
export interface LanguageChange {
  /** Change ID */
  readonly id: string;
  /** Change type */
  readonly type: ChangeType;
  /** Impact level */
  readonly impact: ImpactLevel;
  /** Affected version (from → to) */
  readonly versionRange: { from: string; to: string };
  /** Human-readable description */
  readonly description: string;
  /** Migration strategy */
  readonly migrationStrategy: MigrationStrategy;
  /** Deprecation notice (if applicable) */
  readonly deprecation?: DeprecationNotice;
}

/**
 * Migration strategy for a change.
 */
export type MigrationStrategy =
  | { type: 'preserve'; description: string } // Keep old CPL as-is
  | { type: 'automatic'; description: string; migrateFn: (old: unknown) => unknown } // Auto-migrate
  | { type: 'manual'; description: string; guidance: string } // Requires user action
  | { type: 'incompatible'; description: string; reason: string }; // Cannot migrate

/**
 * Deprecation notice.
 */
export interface DeprecationNotice {
  /** Version when deprecated */
  readonly deprecatedIn: string;
  /** Version when removed */
  readonly removedIn: string;
  /** Reason for deprecation */
  readonly reason: string;
  /** Recommended alternative */
  readonly alternative: string;
}

/**
 * =============================================================================
 * CHANGE REGISTRY
 * =============================================================================
 */

/**
 * Registry of all language changes.
 */
export class ChangeRegistry {
  private changes: Map<string, LanguageChange> = new Map();

  /**
   * Register a change.
   */
  public register(change: LanguageChange): void {
    if (this.changes.has(change.id)) {
      throw new Error(`Change ${change.id} already registered`);
    }
    this.changes.set(change.id, change);
  }

  /**
   * Get all changes.
   */
  public getAll(): readonly LanguageChange[] {
    return Array.from(this.changes.values());
  }

  /**
   * Get changes between versions.
   */
  public getChangesBetween(fromVersion: string, toVersion: string): readonly LanguageChange[] {
    return this.getAll().filter((change) => {
      return (
        this.versionCompare(change.versionRange.from, toVersion) <= 0 &&
        this.versionCompare(change.versionRange.to, fromVersion) > 0
      );
    });
  }

  /**
   * Get breaking changes between versions.
   */
  public getBreakingChanges(fromVersion: string, toVersion: string): readonly LanguageChange[] {
    return this.getChangesBetween(fromVersion, toVersion).filter(
      (change) => change.impact === 'major'
    );
  }

  /**
   * Check if versions are compatible (no breaking changes).
   */
  public areVersionsCompatible(fromVersion: string, toVersion: string): boolean {
    return this.getBreakingChanges(fromVersion, toVersion).length === 0;
  }

  /**
   * Get deprecation notices between versions.
   */
  public getDeprecations(fromVersion: string, toVersion: string): readonly DeprecationNotice[] {
    return this.getChangesBetween(fromVersion, toVersion)
      .filter((change) => change.deprecation !== undefined)
      .map((change) => change.deprecation!);
  }

  /**
   * Simple version comparison (major.minor.patch).
   */
  private versionCompare(a: string, b: string): number {
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);

    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  }
}

/**
 * Global change registry.
 */
export const LANGUAGE_CHANGES = new ChangeRegistry();

/**
 * =============================================================================
 * CPL VERSION HANDLING
 * =============================================================================
 */

/**
 * CPL with version metadata.
 */
export interface VersionedCPL {
  /** CPL content */
  readonly cpl: unknown;
  /** Compiler version that produced this CPL */
  readonly compilerVersion: string;
  /** CPL schema version */
  readonly schemaVersion: string;
  /** Extension versions (if any) */
  readonly extensions?: ReadonlyMap<string, string>;
}

/**
 * Result of CPL version compatibility check.
 */
export interface CompatibilityResult {
  /** Whether CPL is compatible with current compiler */
  readonly compatible: boolean;
  /** Reason if incompatible */
  readonly reason?: string;
  /** Required migrations (if any) */
  readonly requiredMigrations: readonly LanguageChange[];
  /** Deprecation warnings */
  readonly warnings: readonly string[];
}

/**
 * Check CPL compatibility with current compiler.
 */
export function checkCPLCompatibility(
  versionedCPL: VersionedCPL,
  currentVersion: string
): CompatibilityResult {
  const changes = LANGUAGE_CHANGES.getChangesBetween(
    versionedCPL.compilerVersion,
    currentVersion
  );

  const breakingChanges = changes.filter((c) => c.impact === 'major');
  const warnings: string[] = [];

  // Check deprecations
  for (const change of changes) {
    if (change.deprecation) {
      warnings.push(
        `Deprecated in ${change.deprecation.deprecatedIn}: ${change.description}. ` +
          `Use ${change.deprecation.alternative} instead.`
      );
    }
  }

  // Check for incompatible changes
  const incompatibleChanges = breakingChanges.filter(
    (c) => c.migrationStrategy.type === 'incompatible'
  );

  if (incompatibleChanges.length > 0) {
    return {
      compatible: false,
      reason: `Incompatible changes: ${incompatibleChanges.map((c) => c.description).join(', ')}`,
      requiredMigrations: breakingChanges,
      warnings,
    };
  }

  return {
    compatible: true,
    requiredMigrations: breakingChanges,
    warnings,
  };
}

/**
 * =============================================================================
 * MIGRATION EXECUTION
 * =============================================================================
 */

/**
 * Migration result.
 */
export interface MigrationResult {
  /** Whether migration succeeded */
  readonly success: boolean;
  /** Migrated CPL (if successful) */
  readonly migratedCPL?: unknown;
  /** Error message (if failed) */
  readonly error?: string;
  /** Warnings */
  readonly warnings: readonly string[];
  /** Applied migrations */
  readonly appliedMigrations: readonly string[];
}

/**
 * Migrate CPL from old version to current version.
 */
export function migrateCPL(
  versionedCPL: VersionedCPL,
  currentVersion: string
): MigrationResult {
  const compat = checkCPLCompatibility(versionedCPL, currentVersion);

  if (!compat.compatible) {
    return {
      success: false,
      error: compat.reason,
      warnings: compat.warnings,
      appliedMigrations: [],
    };
  }

  let currentCPL = versionedCPL.cpl;
  const appliedMigrations: string[] = [];
  const warnings: string[] = [...compat.warnings];

  for (const change of compat.requiredMigrations) {
    const strategy = change.migrationStrategy;

    if (strategy.type === 'preserve') {
      // No migration needed, preserve as-is
      warnings.push(`Preserving old CPL: ${strategy.description}`);
    } else if (strategy.type === 'automatic') {
      // Apply automatic migration
      try {
        currentCPL = strategy.migrateFn(currentCPL);
        appliedMigrations.push(change.id);
      } catch (error) {
        return {
          success: false,
          error: `Migration ${change.id} failed: ${error instanceof Error ? error.message : String(error)}`,
          warnings,
          appliedMigrations,
        };
      }
    } else if (strategy.type === 'manual') {
      // Requires manual migration
      return {
        success: false,
        error: `Manual migration required: ${strategy.description}. ${strategy.guidance}`,
        warnings,
        appliedMigrations,
      };
    } else if (strategy.type === 'incompatible') {
      // Cannot migrate
      return {
        success: false,
        error: `Incompatible change: ${strategy.description}. Reason: ${strategy.reason}`,
        warnings,
        appliedMigrations,
      };
    }
  }

  return {
    success: true,
    migratedCPL: currentCPL,
    warnings,
    appliedMigrations,
  };
}

/**
 * =============================================================================
 * EDIT HISTORY HANDLING
 * =============================================================================
 */

/**
 * Edit package with version metadata.
 */
export interface VersionedEditPackage {
  /** Edit package ID */
  readonly id: string;
  /** CPL (with version metadata) */
  readonly cpl: VersionedCPL;
  /** Applied timestamp */
  readonly appliedAt: number;
  /** User description (optional) */
  readonly description?: string;
}

/**
 * Edit history status.
 */
export interface EditHistoryStatus {
  /** Total edits */
  readonly totalEdits: number;
  /** Compatible edits (can replay) */
  readonly compatibleEdits: number;
  /** Edits requiring migration */
  readonly requiresMigration: number;
  /** Incompatible edits (cannot replay) */
  readonly incompatibleEdits: number;
  /** Deprecated features used */
  readonly deprecationWarnings: readonly string[];
}

/**
 * Analyze edit history for compatibility.
 */
export function analyzeEditHistory(
  history: readonly VersionedEditPackage[],
  currentVersion: string
): EditHistoryStatus {
  let compatibleEdits = 0;
  let requiresMigration = 0;
  let incompatibleEdits = 0;
  const deprecationWarnings = new Set<string>();

  for (const edit of history) {
    const compat = checkCPLCompatibility(edit.cpl, currentVersion);

    if (compat.compatible) {
      if (compat.requiredMigrations.length === 0) {
        compatibleEdits++;
      } else {
        requiresMigration++;
      }
    } else {
      incompatibleEdits++;
    }

    for (const warning of compat.warnings) {
      deprecationWarnings.add(warning);
    }
  }

  return {
    totalEdits: history.length,
    compatibleEdits,
    requiresMigration,
    incompatibleEdits,
    deprecationWarnings: Array.from(deprecationWarnings),
  };
}

/**
 * =============================================================================
 * EXAMPLE MIGRATIONS (FOR REFERENCE)
 * =============================================================================
 */

/**
 * Example: Adding a new field to CPL schema (minor version change).
 */
LANGUAGE_CHANGES.register({
  id: 'add-provenance-field',
  type: 'schema',
  impact: 'minor',
  versionRange: { from: '1.0.0', to: '1.1.0' },
  description: 'Added provenance field to CPL nodes',
  migrationStrategy: {
    type: 'automatic',
    description: 'Add empty provenance field to old CPL nodes',
    migrateFn: (oldCPL: unknown) => {
      // Add provenance field recursively
      function addProvenance(obj: unknown): unknown {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
          return obj.map(addProvenance);
        }
        return {
          ...obj,
          provenance: {},
        };
      }
      return addProvenance(oldCPL);
    },
  },
});

/**
 * Example: Renaming a constraint type (major version change).
 */
LANGUAGE_CHANGES.register({
  id: 'rename-preserve-constraint',
  type: 'schema',
  impact: 'major',
  versionRange: { from: '1.5.0', to: '2.0.0' },
  description: 'Renamed "keep" constraint to "preserve"',
  migrationStrategy: {
    type: 'automatic',
    description: 'Rename constraint type in old CPL',
    migrateFn: (oldCPL: unknown) => {
      function renameConstraint(obj: unknown): unknown {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
          return obj.map(renameConstraint);
        }
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'constraintType' && value === 'keep') {
            result[key] = 'preserve';
          } else {
            result[key] = renameConstraint(value);
          }
        }
        return result;
      }
      return renameConstraint(oldCPL);
    },
  },
});

/**
 * Example: Deprecating a lexeme (with migration path).
 */
LANGUAGE_CHANGES.register({
  id: 'deprecate-darken-lexeme',
  type: 'lexicon',
  impact: 'minor',
  versionRange: { from: '1.3.0', to: '1.4.0' },
  description: 'Deprecated "darken" in favor of "reduce brightness"',
  migrationStrategy: {
    type: 'preserve',
    description: 'Old CPL using "darken" will continue to work',
  },
  deprecation: {
    deprecatedIn: '1.3.0',
    removedIn: '2.0.0',
    reason: 'Ambiguous whether it affects harmonic darkness or brightness',
    alternative: 'Use "reduce brightness" or "make darker tonally"',
  },
});

/**
 * =============================================================================
 * MIGRATION UI SUPPORT
 * =============================================================================
 */

/**
 * Generate user-facing migration report.
 */
export function generateMigrationReport(
  oldVersion: string,
  newVersion: string
): string {
  const changes = LANGUAGE_CHANGES.getChangesBetween(oldVersion, newVersion);
  const breakingChanges = changes.filter((c) => c.impact === 'major');
  const deprecations = changes.filter((c) => c.deprecation !== undefined);

  const lines: string[] = [];
  lines.push(`# Migration Report: ${oldVersion} → ${newVersion}`);
  lines.push('');

  if (breakingChanges.length > 0) {
    lines.push('## Breaking Changes');
    lines.push('');
    for (const change of breakingChanges) {
      lines.push(`- **${change.description}**`);
      const strategy = change.migrationStrategy;
      if (strategy.type === 'automatic') {
        lines.push(`  - Migration: Automatic`);
      } else if (strategy.type === 'manual') {
        lines.push(`  - Migration: Manual required`);
        lines.push(`  - Guidance: ${strategy.guidance}`);
      } else if (strategy.type === 'incompatible') {
        lines.push(`  - Migration: Not possible`);
        lines.push(`  - Reason: ${strategy.reason}`);
      }
      lines.push('');
    }
  }

  if (deprecations.length > 0) {
    lines.push('## Deprecation Warnings');
    lines.push('');
    for (const change of deprecations) {
      const dep = change.deprecation!;
      lines.push(`- **${change.description}**`);
      lines.push(`  - Deprecated in: ${dep.deprecatedIn}`);
      lines.push(`  - Will be removed in: ${dep.removedIn}`);
      lines.push(`  - Reason: ${dep.reason}`);
      lines.push(`  - Alternative: ${dep.alternative}`);
      lines.push('');
    }
  }

  if (changes.length === 0) {
    lines.push('No breaking changes or deprecations.');
  }

  return lines.join('\n');
}

/**
 * =============================================================================
 * SUMMARY
 * =============================================================================
 * 
 * This module defines comprehensive migration policies for GOFAI language changes:
 * 
 * **Principles:**
 * - Preserve old CPL semantics
 * - Never silent reinterpretation
 * - Forward compatibility where possible
 * - Explicit deprecation with migration paths
 * - Reproducible history
 * - Clear migration guidance
 * 
 * **Change types:**
 * - Schema (structure changes)
 * - Lexicon (vocabulary changes)
 * - Grammar (rule changes)
 * - Semantics (composition logic)
 * - Pragmatics (resolution logic)
 * - Planning (algorithm changes)
 * - Opcodes (behavior changes)
 * 
 * **Impact levels:**
 * - Patch (backward compatible fixes)
 * - Minor (additive, backward compatible)
 * - Major (breaking, requires migration)
 * 
 * **Migration strategies:**
 * - Preserve (keep old CPL as-is)
 * - Automatic (auto-migrate)
 * - Manual (requires user action)
 * - Incompatible (cannot migrate)
 * 
 * **Features:**
 * - Change registry
 * - Compatibility checking
 * - Automatic migration execution
 * - Edit history analysis
 * - Deprecation tracking
 * - Migration reports
 * 
 * **Usage:**
 * 1. Register all language changes with migration strategies
 * 2. Check CPL compatibility before replay
 * 3. Migrate CPL if required
 * 4. Warn user about deprecations
 * 5. Generate migration reports for major upgrades
 * 
 * **Benefits:**
 * - Safe compiler upgrades
 * - Preserved edit history
 * - Clear upgrade paths
 * - Reproducible debugging
 * - User-friendly migration
 * 
 * **Cross-references:**
 * - Step 007: CPL schema versioning (version management)
 * - Step 032: CPL as public interface (stable schema)
 * - Step 033: Compiler determinism (reproducibility)
 * - Step 301: Edit package (versioned edits)
 * - Step 432: Extension migration (extension versioning)
 * - Step 489: Backward compatibility (saved histories)
 */
