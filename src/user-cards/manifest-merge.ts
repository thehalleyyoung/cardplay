/**
 * @fileoverview Manifest Merge Utility.
 * 
 * Provides utilities for merging card manifests:
 * - Three-way merge with conflict detection
 * - Automatic merge strategies
 * - Manual conflict resolution
 * 
 * @module @cardplay/user-cards/manifest-merge
 */

import type { CardManifest } from './manifest';
import { diffManifests } from './manifest-diff';

// ============================================================================
// MERGE TYPES
// ============================================================================

/**
 * Merge strategy for conflicts.
 */
export type MergeStrategy = 'ours' | 'theirs' | 'union' | 'manual';

/**
 * Merge conflict.
 */
export interface MergeConflict {
  /** Field path */
  path: string;
  /** Base value */
  baseValue: unknown;
  /** Our value */
  oursValue: unknown;
  /** Their value */
  theirsValue: unknown;
  /** Conflict description */
  description: string;
  /** Can auto-merge */
  autoMergeable: boolean;
  /** Suggested resolution */
  suggestion?: unknown;
}

/**
 * Merge result.
 */
export interface MergeResult {
  /** Merged manifest (if successful) */
  manifest?: CardManifest;
  /** List of conflicts */
  conflicts: MergeConflict[];
  /** Was merge successful */
  success: boolean;
  /** Merge strategy used */
  strategy: MergeStrategy;
  /** Warnings */
  warnings: string[];
}

/**
 * Merge options.
 */
export interface MergeOptions {
  /** Merge strategy */
  strategy?: MergeStrategy;
  /** Conflict resolution map */
  resolutions?: Map<string, unknown>;
  /** Allow auto-merge of non-conflicting changes */
  autoMerge?: boolean;
  /** Prefer newer values */
  preferNewer?: boolean;
}

// ============================================================================
// MERGE FUNCTIONS
// ============================================================================

/**
 * Performs three-way merge of manifests.
 * 
 * @param base - Common ancestor manifest
 * @param ours - Our version of manifest
 * @param theirs - Their version of manifest
 * @param options - Merge options
 */
export function mergeManifests(
  base: CardManifest,
  ours: CardManifest,
  theirs: CardManifest,
  options: MergeOptions = {}
): MergeResult {
  const {
    strategy = 'manual',
    resolutions = new Map(),
    autoMerge = true,
    preferNewer = false,
  } = options;
  
  const conflicts: MergeConflict[] = [];
  const warnings: string[] = [];
  
  // Compare base→ours and base→theirs
  const ourDiff = diffManifests(base, ours);
  const theirDiff = diffManifests(base, theirs);
  
  // Identify conflicts
  const ourChanges = new Map(ourDiff.changes.map(c => [c.path, c]));
  const theirChanges = new Map(theirDiff.changes.map(c => [c.path, c]));
  
  const allPaths = new Set([...ourChanges.keys(), ...theirChanges.keys()]);
  
  for (const path of allPaths) {
    const ourChange = ourChanges.get(path);
    const theirChange = theirChanges.get(path);
    
    // Both changed the same field
    if (ourChange && theirChange) {
      if (JSON.stringify(ourChange.newValue) !== JSON.stringify(theirChange.newValue)) {
        const conflict: MergeConflict = {
          path,
          baseValue: ourChange.oldValue ?? theirChange.oldValue,
          oursValue: ourChange.newValue,
          theirsValue: theirChange.newValue,
          description: `Both modified ${path}`,
          autoMergeable: canAutoMerge(path, ourChange.newValue, theirChange.newValue),
          suggestion: suggestResolution(path, ourChange.newValue, theirChange.newValue, preferNewer),
        };
        conflicts.push(conflict);
      }
    }
  }
  
  // Try to merge
  let manifest: CardManifest | undefined;
  let success = false;
  
  if (conflicts.length === 0) {
    // No conflicts, merge directly
    manifest = applyMerge(base, ours, theirs);
    success = true;
  } else if (strategy === 'ours') {
    manifest = ours;
    success = true;
    warnings.push('Used "ours" strategy - ignored all their changes');
  } else if (strategy === 'theirs') {
    manifest = theirs;
    success = true;
    warnings.push('Used "theirs" strategy - ignored all our changes');
  } else if (strategy === 'union') {
    manifest = unionMerge(base, ours, theirs);
    success = true;
    warnings.push('Used "union" strategy - combined both sides (may have duplicates)');
  } else if (strategy === 'manual') {
    if (autoMerge && conflicts.every(c => c.autoMergeable)) {
      manifest = autoMergeWithConflicts(base, ours, theirs, conflicts);
      success = true;
      warnings.push('Auto-merged all conflicts using suggestions');
    } else if (resolutions.size > 0) {
      manifest = manualMerge(base, ours, theirs, conflicts, resolutions);
      success = conflicts.every(c => resolutions.has(c.path));
      if (!success) {
        warnings.push('Manual resolutions incomplete - some conflicts remain');
      }
    } else {
      warnings.push('Manual resolution required - no resolutions provided');
    }
  }
  
  const result: MergeResult = {
    conflicts,
    success,
    strategy,
    warnings,
  };
  
  if (manifest !== undefined) {
    result.manifest = manifest;
  }
  
  return result;
}

/**
 * Applies a direct merge (no conflicts).
 */
function applyMerge(
  base: CardManifest,
  ours: CardManifest,
  theirs: CardManifest
): CardManifest {
  const result = { ...base };
  
  // Apply our changes
  applyChangesTo(result, base, ours);
  
  // Apply their changes (non-conflicting)
  applyChangesTo(result, base, theirs);
  
  return result;
}

/**
 * Applies changes from source to target.
 */
function applyChangesTo(target: CardManifest, base: CardManifest, source: CardManifest): void {
  for (const [key, value] of Object.entries(source)) {
    if (JSON.stringify(base[key as keyof CardManifest]) !== JSON.stringify(value)) {
      (target as unknown as Record<string, unknown>)[key] = value;
    }
  }
}

/**
 * Union merge strategy (combine both sides).
 */
function unionMerge(
  _base: CardManifest,
  ours: CardManifest,
  theirs: CardManifest
): CardManifest {
  const result = { ...ours };
  
  // Merge arrays by union
  if (ours.keywords || theirs.keywords) {
    result.keywords = [...new Set([...(ours.keywords ?? []), ...(theirs.keywords ?? [])])];
  }
  
  if (ours.cards || theirs.cards) {
    const cardMap = new Map();
    for (const card of [...(ours.cards ?? []), ...(theirs.cards ?? [])]) {
      cardMap.set(card.id, card);
    }
    result.cards = Array.from(cardMap.values());
  }
  
  if (ours.samples || theirs.samples) {
    result.samples = [...new Set([...(ours.samples ?? []), ...(theirs.samples ?? [])])];
  }
  
  // Merge dependencies
  result.dependencies = { ...(ours.dependencies ?? {}), ...(theirs.dependencies ?? {}) };
  result.devDependencies = { ...(ours.devDependencies ?? {}), ...(theirs.devDependencies ?? {}) };
  
  return result;
}

/**
 * Auto-merge with conflict suggestions.
 */
function autoMergeWithConflicts(
  base: CardManifest,
  ours: CardManifest,
  theirs: CardManifest,
  conflicts: MergeConflict[]
): CardManifest {
  const result = applyMerge(base, ours, theirs);
  
  // Apply suggestions
  for (const conflict of conflicts) {
    if (conflict.suggestion !== undefined) {
      setNestedValue(result as unknown as Record<string, unknown>, conflict.path, conflict.suggestion);
    }
  }
  
  return result;
}

/**
 * Manual merge with resolutions.
 */
function manualMerge(
  base: CardManifest,
  ours: CardManifest,
  theirs: CardManifest,
  conflicts: MergeConflict[],
  resolutions: Map<string, unknown>
): CardManifest {
  const result = applyMerge(base, ours, theirs);
  
  // Apply manual resolutions
  for (const conflict of conflicts) {
    const resolution = resolutions.get(conflict.path);
    if (resolution !== undefined) {
      setNestedValue(result as unknown as Record<string, unknown>, conflict.path, resolution);
    } else {
      // Default to suggestion if available
      if (conflict.suggestion !== undefined) {
        setNestedValue(result as unknown as Record<string, unknown>, conflict.path, conflict.suggestion);
      }
    }
  }
  
  return result;
}

/**
 * Checks if a field can be auto-merged.
 */
function canAutoMerge(path: string, _oursValue: unknown, _theirsValue: unknown): boolean {
  // Arrays can often be unioned
  if (path.includes('keywords') || path.includes('samples') || path.includes('files')) {
    return true;
  }
  
  // Dependencies can be merged
  if (path.includes('dependencies')) {
    return true;
  }
  
  // Version fields are tricky
  if (path === 'version') {
    return false;
  }
  
  // Description/display name conflicts need manual resolution
  if (['description', 'displayName'].includes(path)) {
    return false;
  }
  
  return false;
}

/**
 * Suggests a resolution for a conflict.
 */
function suggestResolution(
  path: string,
  oursValue: unknown,
  theirsValue: unknown,
  preferNewer: boolean
): unknown | undefined {
  // For arrays, union them
  if (Array.isArray(oursValue) && Array.isArray(theirsValue)) {
    return [...new Set([...oursValue, ...theirsValue])];
  }
  
  // For objects, merge them
  if (isObject(oursValue) && isObject(theirsValue)) {
    return { ...oursValue, ...theirsValue };
  }
  
  // For version, pick higher
  if (path === 'version' && typeof oursValue === 'string' && typeof theirsValue === 'string') {
    return compareVersions(oursValue, theirsValue) > 0 ? oursValue : theirsValue;
  }
  
  // For other scalars, prefer newer if requested
  if (preferNewer) {
    return theirsValue;
  }
  
  return undefined;
}

/**
 * Sets a nested value in an object.
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  
  current[parts[parts.length - 1]!] = value;
}

/**
 * Checks if a value is a plain object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Compares two semver strings.
 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] ?? 0;
    const bPart = bParts[i] ?? 0;
    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }
  
  return 0;
}

// ============================================================================
// MERGE UTILITIES
// ============================================================================

/**
 * Validates a merge result.
 */
export function validateMerge(result: MergeResult): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!result.success) {
    errors.push('Merge was not successful');
  }
  
  if (!result.manifest) {
    errors.push('No merged manifest produced');
    return { valid: false, errors };
  }
  
  if (result.conflicts.length > 0 && result.strategy === 'manual') {
    const unresolvedCount = result.conflicts.filter(c => !c.autoMergeable).length;
    if (unresolvedCount > 0) {
      errors.push(`${unresolvedCount} unresolved conflict(s)`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formats conflicts as human-readable text.
 */
export function formatConflicts(conflicts: MergeConflict[]): string {
  const lines: string[] = [];
  
  lines.push(`Found ${conflicts.length} conflict(s):\n`);
  
  for (let i = 0; i < conflicts.length; i++) {
    const conflict = conflicts[i]!;
    lines.push(`${i + 1}. ${conflict.description}`);
    lines.push(`   Path: ${conflict.path}`);
    lines.push(`   Base:   ${JSON.stringify(conflict.baseValue)}`);
    lines.push(`   Ours:   ${JSON.stringify(conflict.oursValue)}`);
    lines.push(`   Theirs: ${JSON.stringify(conflict.theirsValue)}`);
    if (conflict.suggestion !== undefined) {
      lines.push(`   Suggested: ${JSON.stringify(conflict.suggestion)}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Creates a resolution map from conflict indices.
 */
export function createResolutionMap(
  conflicts: MergeConflict[],
  choices: ('ours' | 'theirs' | 'suggestion' | unknown)[]
): Map<string, unknown> {
  const resolutions = new Map<string, unknown>();
  
  for (let i = 0; i < conflicts.length; i++) {
    const conflict = conflicts[i]!;
    const choice = choices[i];
    
    if (choice === 'ours') {
      resolutions.set(conflict.path, conflict.oursValue);
    } else if (choice === 'theirs') {
      resolutions.set(conflict.path, conflict.theirsValue);
    } else if (choice === 'suggestion') {
      if (conflict.suggestion !== undefined) {
        resolutions.set(conflict.path, conflict.suggestion);
      }
    } else if (choice !== undefined) {
      resolutions.set(conflict.path, choice);
    }
  }
  
  return resolutions;
}
