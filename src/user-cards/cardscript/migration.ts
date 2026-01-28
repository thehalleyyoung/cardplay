/**
 * CardScript Version Migration
 * 
 * Handles migration of CardScript source code between versions.
 * Provides automatic upgrades for syntax changes and deprecations.
 * 
 * @module cardscript/migration
 */



// ============================================================================
// TYPES
// ============================================================================

/**
 * Version identifier (semver-like).
 */
export interface Version {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Migration function type.
 */
export type MigrationFn = (source: string) => MigrationResult;

/**
 * Migration result.
 */
export interface MigrationResult {
  /** Migrated source code */
  source: string;
  /** Whether any changes were made */
  changed: boolean;
  /** List of changes applied */
  changes: MigrationChange[];
  /** Warnings about manual review needed */
  warnings: MigrationWarning[];
}

/**
 * A single migration change.
 */
export interface MigrationChange {
  /** Line number where change occurred */
  line: number;
  /** Column number */
  column: number;
  /** Description of the change */
  description: string;
  /** Original text */
  original: string;
  /** Replacement text */
  replacement: string;
}

/**
 * Warning about migration.
 */
export interface MigrationWarning {
  /** Line number */
  line: number;
  /** Warning message */
  message: string;
  /** Suggestion for manual fix */
  suggestion?: string;
}

/**
 * Migration registration.
 */
export interface Migration {
  /** Source version */
  from: Version;
  /** Target version */
  to: Version;
  /** Migration function */
  migrate: MigrationFn;
  /** Description of changes */
  description: string;
}

// ============================================================================
// VERSION UTILITIES
// ============================================================================

/**
 * Parses a version string (e.g., "1.2.3").
 */
export function parseVersion(str: string): Version {
  const match = str.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version string: ${str}`);
  }
  return {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
  };
}

/**
 * Formats a version to string.
 */
export function formatVersion(version: Version): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Compares two versions.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareVersions(a: Version, b: Version): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

/**
 * Checks if a version is between two versions (inclusive).
 */
export function versionInRange(version: Version, from: Version, to: Version): boolean {
  return compareVersions(version, from) >= 0 && compareVersions(version, to) <= 0;
}

// ============================================================================
// CURRENT VERSION
// ============================================================================

/**
 * Current CardScript version.
 */
export const CURRENT_VERSION: Version = {
  major: 1,
  minor: 0,
  patch: 0,
};

/**
 * Current version as string.
 */
export const CURRENT_VERSION_STRING = formatVersion(CURRENT_VERSION);

// ============================================================================
// MIGRATION REGISTRY
// ============================================================================

/**
 * All registered migrations.
 */
const migrations: Migration[] = [];

/**
 * Registers a migration.
 */
export function registerMigration(migration: Migration): void {
  migrations.push(migration);
  // Sort by version
  migrations.sort((a, b) => compareVersions(a.from, b.from));
}

/**
 * Gets all migrations needed to go from one version to another.
 */
export function getMigrationPath(from: Version, to: Version): Migration[] {
  if (compareVersions(from, to) >= 0) {
    return []; // Already at or past target version
  }
  
  const path: Migration[] = [];
  let current = from;
  
  while (compareVersions(current, to) < 0) {
    // Find next migration
    const next = migrations.find(m =>
      compareVersions(m.from, current) === 0 &&
      compareVersions(m.to, to) <= 0
    );
    
    if (!next) {
      // Try to find any migration that advances us
      const anyNext = migrations.find(m =>
        compareVersions(m.from, current) >= 0 &&
        compareVersions(m.to, current) > 0 &&
        compareVersions(m.to, to) <= 0
      );
      
      if (!anyNext) break;
      path.push(anyNext);
      current = anyNext.to;
    } else {
      path.push(next);
      current = next.to;
    }
  }
  
  return path;
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Migrates source code from one version to another.
 */
export function migrate(
  source: string,
  fromVersion: Version | string,
  toVersion: Version | string = CURRENT_VERSION
): MigrationResult {
  const from = typeof fromVersion === 'string' ? parseVersion(fromVersion) : fromVersion;
  const to = typeof toVersion === 'string' ? parseVersion(toVersion) : toVersion;
  
  const path = getMigrationPath(from, to);
  
  if (path.length === 0) {
    return {
      source,
      changed: false,
      changes: [],
      warnings: [],
    };
  }
  
  let result: MigrationResult = {
    source,
    changed: false,
    changes: [],
    warnings: [],
  };
  
  for (const migration of path) {
    const stepResult = migration.migrate(result.source);
    
    result = {
      source: stepResult.source,
      changed: result.changed || stepResult.changed,
      changes: [...result.changes, ...stepResult.changes],
      warnings: [...result.warnings, ...stepResult.warnings],
    };
  }
  
  return result;
}

/**
 * Detects the version of CardScript source code.
 */
export function detectVersion(source: string): Version | null {
  // Look for version pragma: // @cardscript-version 1.0.0
  const pragmaMatch = source.match(/@cardscript-version\s+(\d+\.\d+\.\d+)/);
  if (pragmaMatch) {
    return parseVersion(pragmaMatch[1]!);
  }
  
  // Heuristic detection based on syntax
  // Check for old syntax patterns
  
  // v0.x: used 'def' instead of 'card'
  if (/\bdef\s+\w+\s*\{/.test(source)) {
    return { major: 0, minor: 1, patch: 0 };
  }
  
  // v0.x: used 'func' instead of 'fn'
  if (/\bfunc\s+\w+\s*\(/.test(source)) {
    return { major: 0, minor: 2, patch: 0 };
  }
  
  // v0.x: used 'int' instead of 'Number'
  if (/:\s*int\b/.test(source)) {
    return { major: 0, minor: 3, patch: 0 };
  }
  
  // v0.x: used 'float' instead of 'Number'
  if (/:\s*float\b/.test(source)) {
    return { major: 0, minor: 3, patch: 0 };
  }
  
  // v0.9.x: old parameter syntax
  if (/param\s+\w+\s*=/.test(source)) {
    return { major: 0, minor: 9, patch: 0 };
  }
  
  // Assume current version if no old patterns found
  return CURRENT_VERSION;
}

/**
 * Adds version pragma to source code.
 */
export function addVersionPragma(source: string, version: Version = CURRENT_VERSION): string {
  // Check if pragma already exists
  if (/@cardscript-version/.test(source)) {
    // Update existing pragma
    return source.replace(
      /@cardscript-version\s+\d+\.\d+\.\d+/,
      `@cardscript-version ${formatVersion(version)}`
    );
  }
  
  // Add pragma at the beginning
  return `// @cardscript-version ${formatVersion(version)}\n\n${source}`;
}

// ============================================================================
// BUILT-IN MIGRATIONS
// ============================================================================

// Migration from v0.1.x: 'def' → 'card'
registerMigration({
  from: { major: 0, minor: 1, patch: 0 },
  to: { major: 0, minor: 2, patch: 0 },
  description: "Renames 'def' keyword to 'card'",
  migrate(source) {
    const changes: MigrationChange[] = [];
    const lines = source.split('\n');
    
    const migrated = lines.map((line, i) => {
      const match = line.match(/\bdef\s+(\w+)\s*\{/);
      if (match) {
        changes.push({
          line: i + 1,
          column: line.indexOf('def') + 1,
          description: "Renamed 'def' to 'card'",
          original: `def ${match[1]}`,
          replacement: `card ${match[1]}`,
        });
        return line.replace(/\bdef\b/, 'card');
      }
      return line;
    }).join('\n');
    
    return {
      source: migrated,
      changed: changes.length > 0,
      changes,
      warnings: [],
    };
  },
});

// Migration from v0.2.x: 'func' → 'fn'
registerMigration({
  from: { major: 0, minor: 2, patch: 0 },
  to: { major: 0, minor: 3, patch: 0 },
  description: "Renames 'func' keyword to 'fn'",
  migrate(source) {
    const changes: MigrationChange[] = [];
    const lines = source.split('\n');
    
    const migrated = lines.map((line, i) => {
      if (/\bfunc\s+\w+\s*\(/.test(line)) {
        changes.push({
          line: i + 1,
          column: line.indexOf('func') + 1,
          description: "Renamed 'func' to 'fn'",
          original: 'func',
          replacement: 'fn',
        });
        return line.replace(/\bfunc\b/, 'fn');
      }
      return line;
    }).join('\n');
    
    return {
      source: migrated,
      changed: changes.length > 0,
      changes,
      warnings: [],
    };
  },
});

// Migration from v0.3.x: 'int'/'float' → 'Number'
registerMigration({
  from: { major: 0, minor: 3, patch: 0 },
  to: { major: 0, minor: 4, patch: 0 },
  description: "Unifies 'int' and 'float' types to 'Number'",
  migrate(source) {
    const changes: MigrationChange[] = [];
    const warnings: MigrationWarning[] = [];
    const lines = source.split('\n');
    
    const migrated = lines.map((line, i) => {
      let modified = line;
      
      // Replace :int with :Number
      if (/:\s*int\b/.test(line)) {
        changes.push({
          line: i + 1,
          column: line.search(/:\s*int\b/) + 1,
          description: "Replaced 'int' with 'Number'",
          original: 'int',
          replacement: 'Number',
        });
        modified = modified.replace(/:\s*int\b/g, ': Number');
        
        warnings.push({
          line: i + 1,
          message: "Converted 'int' to 'Number'. If integer behavior is required, use Math.floor().",
          suggestion: "Consider adding Math.floor() calls where integer semantics are needed.",
        });
      }
      
      // Replace :float with :Number
      if (/:\s*float\b/.test(modified)) {
        changes.push({
          line: i + 1,
          column: modified.search(/:\s*float\b/) + 1,
          description: "Replaced 'float' with 'Number'",
          original: 'float',
          replacement: 'Number',
        });
        modified = modified.replace(/:\s*float\b/g, ': Number');
      }
      
      return modified;
    }).join('\n');
    
    return {
      source: migrated,
      changed: changes.length > 0,
      changes,
      warnings,
    };
  },
});

// Migration from v0.9.x: old param syntax → new param block syntax
registerMigration({
  from: { major: 0, minor: 9, patch: 0 },
  to: { major: 1, minor: 0, patch: 0 },
  description: "Migrates old parameter syntax to params block",
  migrate(source) {
    const changes: MigrationChange[] = [];
    const warnings: MigrationWarning[] = [];
    const lines = source.split('\n');
    
    // Find standalone param declarations and collect them
    const paramLines: { index: number; name: string; type: string; defaultValue: string }[] = [];
    const newLines: string[] = [];
    let inCard = false;
    let cardIndent = '';
    let skipNextLine = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (skipNextLine) {
        skipNextLine = false;
        continue;
      }
      
      const line = lines[i];
      if (line === undefined) continue;
      
      // Detect card start
      const cardMatch = line.match(/^(\s*)card\s+\w+\s*\{/);
      if (cardMatch) {
        inCard = true;
        cardIndent = cardMatch[1] || '';
        newLines.push(line);
        continue;
      }
      
      // Detect card end
      if (inCard && line.trim() === '}' && !line.startsWith(cardIndent + '  ')) {
        // If we collected params, insert params block before closing brace
        if (paramLines.length > 0) {
          newLines.push(`${cardIndent}  params {`);
          for (const param of paramLines) {
            newLines.push(`${cardIndent}    ${param.name}: ${param.type} = ${param.defaultValue}`);
            changes.push({
              line: param.index + 1,
              column: 1,
              description: 'Moved parameter to params block',
              original: `param ${param.name} = ${param.defaultValue}`,
              replacement: `${param.name}: ${param.type} = ${param.defaultValue}`,
            });
          }
          newLines.push(`${cardIndent}  }`);
          newLines.push('');
          paramLines.length = 0;
        }
        inCard = false;
        newLines.push(line);
        continue;
      }
      
      // Detect old param syntax: param name = value
      const paramMatch = line.match(/^\s*param\s+(\w+)\s*=\s*(.+)$/);
      if (inCard && paramMatch && paramMatch[1] && paramMatch[2]) {
        const name = paramMatch[1];
        const defaultValue = paramMatch[2].trim();
        
        // Infer type from default value
        let type = 'Number';
        if (defaultValue.startsWith('"') || defaultValue.startsWith("'")) {
          type = 'String';
        } else if (defaultValue === 'true' || defaultValue === 'false') {
          type = 'Boolean';
        }
        
        paramLines.push({ index: i, name, type, defaultValue });
        continue; // Skip this line
      }
      
      newLines.push(line);
    }
    
    // Add warning about type inference
    if (changes.length > 0) {
      warnings.push({
        line: 1,
        message: 'Parameter types were inferred from default values. Please verify the types are correct.',
        suggestion: 'Review the params block and adjust types if needed.',
      });
    }
    
    return {
      source: newLines.join('\n'),
      changed: changes.length > 0,
      changes,
      warnings,
    };
  },
});

// ============================================================================
// DEPRECATION WARNINGS
// ============================================================================

/**
 * Deprecated syntax patterns.
 */
const DEPRECATED_PATTERNS: Array<{
  pattern: RegExp;
  message: string;
  suggestion: string;
  sinceVersion: Version;
  removedVersion?: Version;
}> = [
  {
    pattern: /\bemit\s+\w+\s*\(/,
    message: "The 'emit' keyword for outputs is deprecated",
    suggestion: "Use direct assignment: 'outputs.name = value'",
    sinceVersion: { major: 1, minor: 0, patch: 0 },
  },
  {
    pattern: /\bthis\.params\./,
    message: "Accessing params via 'this.params' is deprecated",
    suggestion: "Access params directly: 'params.name'",
    sinceVersion: { major: 0, minor: 9, patch: 0 },
  },
  {
    pattern: /\bctx\.input\./,
    message: "Accessing inputs via 'ctx.input' is deprecated",
    suggestion: "Use 'inputs.name' directly",
    sinceVersion: { major: 1, minor: 0, patch: 0 },
  },
];

/**
 * Checks for deprecated syntax usage.
 */
export function checkDeprecations(source: string): MigrationWarning[] {
  const warnings: MigrationWarning[] = [];
  const lines = source.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    
    for (const dep of DEPRECATED_PATTERNS) {
      if (dep.pattern.test(line)) {
        warnings.push({
          line: i + 1,
          message: `${dep.message} (deprecated since v${formatVersion(dep.sinceVersion)})`,
          suggestion: dep.suggestion,
        });
      }
    }
  }
  
  return warnings;
}

// ============================================================================
// MIGRATION REPORT
// ============================================================================

/**
 * Generates a human-readable migration report.
 */
export function formatMigrationReport(result: MigrationResult): string {
  const lines: string[] = [];
  
  lines.push('CardScript Migration Report');
  lines.push('='.repeat(40));
  lines.push('');
  
  if (!result.changed) {
    lines.push('No changes were needed.');
    return lines.join('\n');
  }
  
  lines.push(`${result.changes.length} change(s) applied:`);
  lines.push('');
  
  for (const change of result.changes) {
    lines.push(`  Line ${change.line}: ${change.description}`);
    lines.push(`    - ${change.original}`);
    lines.push(`    + ${change.replacement}`);
    lines.push('');
  }
  
  if (result.warnings.length > 0) {
    lines.push('-'.repeat(40));
    lines.push(`${result.warnings.length} warning(s):`);
    lines.push('');
    
    for (const warning of result.warnings) {
      lines.push(`  Line ${warning.line}: ${warning.message}`);
      if (warning.suggestion) {
        lines.push(`    → ${warning.suggestion}`);
      }
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

// ============================================================================
// AUTO-MIGRATE
// ============================================================================

/**
 * Automatically migrates source code to the current version.
 */
export function autoMigrate(source: string): MigrationResult {
  const detectedVersion = detectVersion(source);
  
  if (!detectedVersion) {
    return {
      source,
      changed: false,
      changes: [],
      warnings: [{
        line: 1,
        message: 'Could not detect CardScript version',
        suggestion: 'Add a version pragma: // @cardscript-version 1.0.0',
      }],
    };
  }
  
  const result = migrate(source, detectedVersion, CURRENT_VERSION);
  
  // Add version pragma if migration was successful
  if (result.changed) {
    result.source = addVersionPragma(result.source, CURRENT_VERSION);
  }
  
  // Check for deprecations
  const deprecationWarnings = checkDeprecations(result.source);
  result.warnings.push(...deprecationWarnings);
  
  return result;
}

// ============================================================================
// CLI HELPER
// ============================================================================

/**
 * Migrates a file (for CLI usage).
 */
export async function migrateFile(
  _inputPath: string,
  _outputPath?: string,
  _options: { dryRun?: boolean; verbose?: boolean } = {}
): Promise<MigrationResult> {
  // This is a stub - actual file I/O would be handled by the CLI
  // In a browser/bundled environment, this returns a result
  // indicating file operations are not supported
  
  return {
    source: '',
    changed: false,
    changes: [],
    warnings: [{
      line: 0,
      message: 'File operations require Node.js runtime',
      suggestion: 'Use migrate() or autoMigrate() with source strings',
    }],
  };
}
