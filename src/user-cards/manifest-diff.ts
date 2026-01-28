/**
 * @fileoverview Manifest Diff Tool.
 * 
 * Provides utilities for comparing and diffing card manifests:
 * - Structural diff generation
 * - Human-readable diff reports
 * - Patch generation
 * - Conflict detection
 * 
 * @module @cardplay/user-cards/manifest-diff
 */

import type { CardManifest } from './manifest';

// ============================================================================
// DIFF TYPES
// ============================================================================

/**
 * Diff operation type.
 */
export type DiffOperation = 'add' | 'remove' | 'change';

/**
 * Diff entry for a single field.
 */
export interface DiffEntry {
  /** JSON path to field */
  path: string;
  /** Operation type */
  operation: DiffOperation;
  /** Old value (for remove/change) */
  oldValue?: unknown;
  /** New value (for add/change) */
  newValue?: unknown;
  /** Human-readable description */
  description: string;
}

/**
 * Complete manifest diff.
 */
export interface ManifestDiff {
  /** Old manifest version */
  oldVersion: string;
  /** New manifest version */
  newVersion: string;
  /** List of changes */
  changes: DiffEntry[];
  /** Is this a breaking change */
  isBreaking: boolean;
  /** Conflict warnings */
  conflicts: string[];
  /** Diff summary */
  summary: DiffSummary;
}

/**
 * Diff summary statistics.
 */
export interface DiffSummary {
  addCount: number;
  removeCount: number;
  changeCount: number;
  totalChanges: number;
  hasIdentityChange: boolean;
  hasDependencyChange: boolean;
  hasResourceChange: boolean;
  hasCompatibilityChange: boolean;
}

// ============================================================================
// DIFF GENERATION
// ============================================================================

/**
 * Generates a diff between two manifests.
 */
export function diffManifests(
  oldManifest: CardManifest,
  newManifest: CardManifest
): ManifestDiff {
  const changes: DiffEntry[] = [];
  
  // Compare identity fields
  diffField(changes, 'name', oldManifest.name, newManifest.name, 'Package name');
  diffField(changes, 'version', oldManifest.version, newManifest.version, 'Version');
  diffField(changes, 'displayName', oldManifest.displayName, newManifest.displayName, 'Display name');
  diffField(changes, 'description', oldManifest.description, newManifest.description, 'Description');
  diffField(changes, 'category', oldManifest.category, newManifest.category, 'Category');
  
  // Compare keywords
  diffArray(changes, 'keywords', oldManifest.keywords ?? [], newManifest.keywords ?? [], 'Keywords');
  
  // Compare dependencies
  diffObject(changes, 'dependencies', oldManifest.dependencies ?? {}, newManifest.dependencies ?? {}, 'Runtime dependency');
  diffObject(changes, 'peerDependencies', oldManifest.peerDependencies ?? {}, newManifest.peerDependencies ?? {}, 'Peer dependency');
  diffObject(changes, 'optionalDependencies', oldManifest.optionalDependencies ?? {}, newManifest.optionalDependencies ?? {}, 'Optional dependency');
  diffObject(changes, 'devDependencies', oldManifest.devDependencies ?? {}, newManifest.devDependencies ?? {}, 'Dev dependency');
  
  // Compare cards
  diffCards(changes, oldManifest.cards ?? [], newManifest.cards ?? []);
  
  // Compare other resources
  diffArray(changes, 'decks', oldManifest.decks ?? [], newManifest.decks ?? [], 'Deck templates');
  diffArray(changes, 'presets', oldManifest.presets ?? [], newManifest.presets ?? [], 'Presets');
  diffArray(changes, 'samples', oldManifest.samples ?? [], newManifest.samples ?? [], 'Samples');
  
  // Compare platform requirements
  if (oldManifest.platform || newManifest.platform) {
    const oldPlatform = oldManifest.platform ?? {};
    const newPlatform = newManifest.platform ?? {};
    
    diffArray(changes, 'platform.os', oldPlatform.os ?? [], newPlatform.os ?? [], 'Supported OS');
    diffArray(changes, 'platform.browserFeatures', oldPlatform.browserFeatures ?? [], newPlatform.browserFeatures ?? [], 'Browser features');
    diffArray(changes, 'platform.webApis', oldPlatform.webApis ?? [], newPlatform.webApis ?? [], 'Web APIs');
    diffArray(changes, 'platform.audioFeatures', oldPlatform.audioFeatures ?? [], newPlatform.audioFeatures ?? [], 'Audio features');
    diffField(changes, 'platform.cardplayVersion', oldPlatform.cardplayVersion, newPlatform.cardplayVersion, 'Minimum Cardplay version');
  }
  
  // Detect breaking changes
  const isBreaking = detectBreakingChanges(changes);
  
  // Detect conflicts
  const conflicts = detectConflicts(oldManifest, newManifest, changes);
  
  // Generate summary
  const summary = generateSummary(changes);
  
  return {
    oldVersion: oldManifest.version,
    newVersion: newManifest.version,
    changes,
    isBreaking,
    conflicts,
    summary,
  };
}

/**
 * Diffs a single field.
 */
function diffField(
  changes: DiffEntry[],
  path: string,
  oldValue: unknown,
  newValue: unknown,
  description: string
): void {
  if (oldValue === newValue) return;
  
  if (oldValue === undefined && newValue !== undefined) {
    changes.push({
      path,
      operation: 'add',
      newValue,
      description: `Added ${description}: ${JSON.stringify(newValue)}`,
    });
  } else if (oldValue !== undefined && newValue === undefined) {
    changes.push({
      path,
      operation: 'remove',
      oldValue,
      description: `Removed ${description}: ${JSON.stringify(oldValue)}`,
    });
  } else {
    changes.push({
      path,
      operation: 'change',
      oldValue,
      newValue,
      description: `Changed ${description} from ${JSON.stringify(oldValue)} to ${JSON.stringify(newValue)}`,
    });
  }
}

/**
 * Diffs an array field.
 */
function diffArray(
  changes: DiffEntry[],
  path: string,
  oldArray: unknown[],
  newArray: unknown[],
  description: string
): void {
  const oldSet = new Set(oldArray.map(v => JSON.stringify(v)));
  const newSet = new Set(newArray.map(v => JSON.stringify(v)));
  
  for (const item of newArray) {
    const itemStr = JSON.stringify(item);
    if (!oldSet.has(itemStr)) {
      changes.push({
        path: `${path}[]`,
        operation: 'add',
        newValue: item,
        description: `Added ${description}: ${itemStr}`,
      });
    }
  }
  
  for (const item of oldArray) {
    const itemStr = JSON.stringify(item);
    if (!newSet.has(itemStr)) {
      changes.push({
        path: `${path}[]`,
        operation: 'remove',
        oldValue: item,
        description: `Removed ${description}: ${itemStr}`,
      });
    }
  }
}

/**
 * Diffs an object field.
 */
function diffObject(
  changes: DiffEntry[],
  path: string,
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  description: string
): void {
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  
  for (const key of allKeys) {
    const oldValue = oldObj[key];
    const newValue = newObj[key];
    const fieldPath = `${path}.${key}`;
    
    if (oldValue === undefined && newValue !== undefined) {
      changes.push({
        path: fieldPath,
        operation: 'add',
        newValue,
        description: `Added ${description} "${key}": ${JSON.stringify(newValue)}`,
      });
    } else if (oldValue !== undefined && newValue === undefined) {
      changes.push({
        path: fieldPath,
        operation: 'remove',
        oldValue,
        description: `Removed ${description} "${key}": ${JSON.stringify(oldValue)}`,
      });
    } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        path: fieldPath,
        operation: 'change',
        oldValue,
        newValue,
        description: `Changed ${description} "${key}" from ${JSON.stringify(oldValue)} to ${JSON.stringify(newValue)}`,
      });
    }
  }
}

/**
 * Diffs cards array.
 */
function diffCards(
  changes: DiffEntry[],
  oldCards: Array<{ id: string; file: string; deprecated?: boolean | string }>,
  newCards: Array<{ id: string; file: string; deprecated?: boolean | string }>
): void {
  const oldMap = new Map(oldCards.map(c => [c.id, c]));
  const newMap = new Map(newCards.map(c => [c.id, c]));
  
  for (const card of newCards) {
    if (!oldMap.has(card.id)) {
      changes.push({
        path: `cards[${card.id}]`,
        operation: 'add',
        newValue: card,
        description: `Added card "${card.id}"`,
      });
    } else {
      const oldCard = oldMap.get(card.id)!;
      if (oldCard.file !== card.file) {
        changes.push({
          path: `cards[${card.id}].file`,
          operation: 'change',
          oldValue: oldCard.file,
          newValue: card.file,
          description: `Changed card "${card.id}" file from "${oldCard.file}" to "${card.file}"`,
        });
      }
      if (oldCard.deprecated !== card.deprecated) {
        if (card.deprecated && !oldCard.deprecated) {
          changes.push({
            path: `cards[${card.id}].deprecated`,
            operation: 'add',
            newValue: card.deprecated,
            description: `Deprecated card "${card.id}"`,
          });
        } else if (!card.deprecated && oldCard.deprecated) {
          changes.push({
            path: `cards[${card.id}].deprecated`,
            operation: 'remove',
            oldValue: oldCard.deprecated,
            description: `Un-deprecated card "${card.id}"`,
          });
        }
      }
    }
  }
  
  for (const card of oldCards) {
    if (!newMap.has(card.id)) {
      changes.push({
        path: `cards[${card.id}]`,
        operation: 'remove',
        oldValue: card,
        description: `Removed card "${card.id}"`,
      });
    }
  }
}

/**
 * Detects breaking changes.
 */
function detectBreakingChanges(changes: DiffEntry[]): boolean {
  for (const change of changes) {
    // Major version bump
    if (change.path === 'version' && change.operation === 'change') {
      const oldVer = String(change.oldValue ?? '').split('.')[0];
      const newVer = String(change.newValue ?? '').split('.')[0];
      if (oldVer !== newVer) {
        return true;
      }
    }
    
    // Removed cards
    if (change.path.startsWith('cards[') && change.operation === 'remove') {
      return true;
    }
    
    // Removed dependencies
    if (change.path.startsWith('dependencies.') && change.operation === 'remove') {
      return true;
    }
    
    // Changed minimum version requirement
    if (change.path === 'platform.cardplayVersion' && change.operation === 'change') {
      return true;
    }
    
    // Added required platform features
    if (change.path.includes('platform.') && change.operation === 'add') {
      return true;
    }
  }
  
  return false;
}

/**
 * Detects potential conflicts.
 */
function detectConflicts(
  _oldManifest: CardManifest,
  _newManifest: CardManifest,
  changes: DiffEntry[]
): string[] {
  const conflicts: string[] = [];
  
  // Check for dependency version conflicts
  const depUpdates = changes.filter(c => 
    c.path.startsWith('dependencies.') && c.operation === 'change'
  );
  
  for (const change of depUpdates) {
    const depName = change.path.split('.')[1];
    conflicts.push(`Dependency "${depName}" version changed - may require lock file update`);
  }
  
  // Check for file path changes
  const fileChanges = changes.filter(c =>
    c.path.includes('.file') && c.operation === 'change'
  );
  
  for (const change of fileChanges) {
    conflicts.push(`File path changed: ${change.description} - projects may need update`);
  }
  
  return conflicts;
}

/**
 * Generates diff summary.
 */
function generateSummary(changes: DiffEntry[]): DiffSummary {
  const addCount = changes.filter(c => c.operation === 'add').length;
  const removeCount = changes.filter(c => c.operation === 'remove').length;
  const changeCount = changes.filter(c => c.operation === 'change').length;
  
  const hasIdentityChange = changes.some(c => 
    ['name', 'version', 'displayName', 'description'].includes(c.path)
  );
  
  const hasDependencyChange = changes.some(c =>
    c.path.includes('dependencies')
  );
  
  const hasResourceChange = changes.some(c =>
    ['cards', 'decks', 'presets', 'samples'].some(r => c.path.startsWith(r))
  );
  
  const hasCompatibilityChange = changes.some(c =>
    c.path.startsWith('platform.')
  );
  
  return {
    addCount,
    removeCount,
    changeCount,
    totalChanges: changes.length,
    hasIdentityChange,
    hasDependencyChange,
    hasResourceChange,
    hasCompatibilityChange,
  };
}

// ============================================================================
// DIFF FORMATTING
// ============================================================================

/**
 * Formats a diff as human-readable text.
 */
export function formatDiff(diff: ManifestDiff, options: {
  verbose?: boolean;
  colors?: boolean;
} = {}): string {
  const { verbose = true } = options;
  const lines: string[] = [];
  
  lines.push(`Manifest diff: ${diff.oldVersion} → ${diff.newVersion}`);
  lines.push('');
  
  if (diff.isBreaking) {
    lines.push('⚠️  BREAKING CHANGE DETECTED');
    lines.push('');
  }
  
  lines.push(`Summary: ${diff.summary.totalChanges} change(s)`);
  lines.push(`  +${diff.summary.addCount} additions`);
  lines.push(`  -${diff.summary.removeCount} removals`);
  lines.push(`  ~${diff.summary.changeCount} modifications`);
  lines.push('');
  
  if (diff.conflicts.length > 0) {
    lines.push('Conflicts:');
    for (const conflict of diff.conflicts) {
      lines.push(`  ⚠️  ${conflict}`);
    }
    lines.push('');
  }
  
  if (verbose && diff.changes.length > 0) {
    lines.push('Changes:');
    
    const grouped = groupChanges(diff.changes);
    
    for (const [category, entries] of Object.entries(grouped)) {
      if (entries.length > 0) {
        lines.push(`  ${category}:`);
        for (const entry of entries) {
          const symbol = entry.operation === 'add' ? '+' : entry.operation === 'remove' ? '-' : '~';
          lines.push(`    ${symbol} ${entry.description}`);
        }
        lines.push('');
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Groups changes by category.
 */
function groupChanges(changes: DiffEntry[]): Record<string, DiffEntry[]> {
  const groups: Record<string, DiffEntry[]> = {
    'Identity': [],
    'Dependencies': [],
    'Resources': [],
    'Platform': [],
    'Other': [],
  };
  
  for (const change of changes) {
    if (['name', 'version', 'displayName', 'description', 'keywords'].some(f => change.path.startsWith(f))) {
      groups['Identity']!.push(change);
    } else if (change.path.includes('dependencies')) {
      groups['Dependencies']!.push(change);
    } else if (['cards', 'decks', 'presets', 'samples'].some(r => change.path.startsWith(r))) {
      groups['Resources']!.push(change);
    } else if (change.path.startsWith('platform')) {
      groups['Platform']!.push(change);
    } else {
      groups['Other']!.push(change);
    }
  }
  
  return groups;
}

/**
 * Formats diff as JSON.
 */
export function formatDiffJSON(diff: ManifestDiff, pretty = true): string {
  return JSON.stringify(diff, null, pretty ? 2 : undefined);
}

/**
 * Formats diff as Markdown.
 */
export function formatDiffMarkdown(diff: ManifestDiff): string {
  const lines: string[] = [];
  
  lines.push(`# Manifest Diff: ${diff.oldVersion} → ${diff.newVersion}`);
  lines.push('');
  
  if (diff.isBreaking) {
    lines.push('> ⚠️ **BREAKING CHANGE DETECTED**');
    lines.push('');
  }
  
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total changes: **${diff.summary.totalChanges}**`);
  lines.push(`  - Additions: ${diff.summary.addCount}`);
  lines.push(`  - Removals: ${diff.summary.removeCount}`);
  lines.push(`  - Modifications: ${diff.summary.changeCount}`);
  lines.push('');
  
  if (diff.conflicts.length > 0) {
    lines.push('## Conflicts');
    lines.push('');
    for (const conflict of diff.conflicts) {
      lines.push(`- ⚠️ ${conflict}`);
    }
    lines.push('');
  }
  
  if (diff.changes.length > 0) {
    lines.push('## Changes');
    lines.push('');
    
    const grouped = groupChanges(diff.changes);
    
    for (const [category, entries] of Object.entries(grouped)) {
      if (entries.length > 0) {
        lines.push(`### ${category}`);
        lines.push('');
        for (const entry of entries) {
          const symbol = entry.operation === 'add' ? '✅' : entry.operation === 'remove' ? '❌' : '🔄';
          lines.push(`- ${symbol} ${entry.description}`);
        }
        lines.push('');
      }
    }
  }
  
  return lines.join('\n');
}
