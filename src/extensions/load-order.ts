/**
 * @fileoverview Pack Load Order and Conflict Resolution
 * 
 * Change 439: Deterministic pack load order + conflict resolution.
 * - Builtin packs always win
 * - Conflicts logged
 * - Dependency-based ordering
 * 
 * @module @cardplay/extensions/load-order
 */

import type { CardManifest } from '../user-cards/manifest';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Pack dependency.
 */
export interface PackDependency {
  readonly name: string;
  readonly version?: string;
  readonly optional?: boolean;
}

/**
 * Pack with load metadata.
 */
export interface LoadablePack {
  readonly manifest: CardManifest;
  readonly isBuiltin: boolean;
  readonly loadPriority: number;
  readonly dependencies: readonly PackDependency[];
}

/**
 * Load order conflict.
 */
export interface LoadConflict {
  readonly type: 'id-collision' | 'version-mismatch' | 'dependency-missing' | 'circular-dependency';
  readonly packName: string;
  readonly conflictingPack?: string;
  readonly detail: string;
  readonly resolution: 'skip' | 'override' | 'error';
}

/**
 * Load order result.
 */
export interface LoadOrderResult {
  readonly orderedPacks: readonly LoadablePack[];
  readonly conflicts: readonly LoadConflict[];
  readonly skipped: readonly string[];
}

// ============================================================================
// LOAD PRIORITY
// ============================================================================

/**
 * Load priority tiers.
 */
export enum LoadPriority {
  /** Core builtin packs - always loaded first */
  CORE = 0,
  /** Builtin extension packs */
  BUILTIN = 100,
  /** System-wide user packs */
  SYSTEM = 200,
  /** Project-local packs */
  PROJECT = 300,
  /** Development/test packs */
  DEV = 400,
}

// ============================================================================
// DEPENDENCY RESOLUTION
// ============================================================================

/**
 * Resolve pack load order based on dependencies.
 * Uses topological sort to ensure dependencies load before dependents.
 */
export function resolveLoadOrder(packs: readonly LoadablePack[]): LoadOrderResult {
  const conflicts: LoadConflict[] = [];
  const skipped = new Set<string>();
  const loaded = new Set<string>();
  const orderedPacks: LoadablePack[] = [];
  
  // Build dependency graph
  const packMap = new Map<string, LoadablePack>();
  for (const pack of packs) {
    packMap.set(pack.manifest.name, pack);
  }
  
  // Sort by priority first (builtins always first)
  const sortedByPriority = [...packs].sort((a, b) => {
    if (a.loadPriority !== b.loadPriority) {
      return a.loadPriority - b.loadPriority;
    }
    // Within same priority, sort by name for determinism
    return a.manifest.name.localeCompare(b.manifest.name);
  });
  
  // Check for ID collisions (placeholder for future implementation)
  
  function checkCollisions(pack: LoadablePack): boolean {
    // Check for collisions in exported entities
    // (This would need to be extended to check actual exported IDs)
    
    // For now, just check pack name collision
    if (loaded.has(pack.manifest.name)) {
      const existing = packMap.get(pack.manifest.name);
      if (existing && existing.isBuiltin && !pack.isBuiltin) {
        // Builtin wins
        conflicts.push({
          type: 'id-collision',
          packName: pack.manifest.name,
          conflictingPack: existing.manifest.name,
          detail: `Pack name collision with builtin pack. Builtin pack takes precedence.`,
          resolution: 'skip',
        });
        return false;
      }
    }
    
    return true;
  }
  
  // Topological sort with cycle detection
  const visiting = new Set<string>();
  const visited = new Set<string>();
  
  function visit(packName: string): boolean {
    if (visited.has(packName)) {
      return true;
    }
    
    if (visiting.has(packName)) {
      // Circular dependency detected
      conflicts.push({
        type: 'circular-dependency',
        packName,
        detail: `Circular dependency detected in pack dependency chain`,
        resolution: 'error',
      });
      return false;
    }
    
    const pack = packMap.get(packName);
    if (!pack) {
      return false;
    }
    
    visiting.add(packName);
    
    // Visit dependencies first
    for (const dep of pack.dependencies) {
      if (!visited.has(dep.name)) {
        const depPack = packMap.get(dep.name);
        
        if (!depPack) {
          if (!dep.optional) {
            conflicts.push({
              type: 'dependency-missing',
              packName,
              conflictingPack: dep.name,
              detail: `Required dependency '${dep.name}' not found`,
              resolution: 'skip',
            });
            visiting.delete(packName);
            skipped.add(packName);
            return false;
          }
          // Optional dependency missing - continue
          continue;
        }
        
        if (!visit(dep.name)) {
          // Dependency failed to load
          if (!dep.optional) {
            visiting.delete(packName);
            skipped.add(packName);
            return false;
          }
        }
      }
    }
    
    visiting.delete(packName);
    visited.add(packName);
    
    // Check for collisions
    if (!checkCollisions(pack)) {
      skipped.add(packName);
      return false;
    }
    
    loaded.add(packName);
    orderedPacks.push(pack);
    return true;
  }
  
  // Visit all packs in priority order
  for (const pack of sortedByPriority) {
    if (!visited.has(pack.manifest.name)) {
      visit(pack.manifest.name);
    }
  }
  
  return {
    orderedPacks,
    conflicts,
    skipped: Array.from(skipped),
  };
}

// ============================================================================
// ID CONFLICT RESOLUTION
// ============================================================================

/**
 * Resolve ID conflicts between packs.
 * Builtins always win; conflicts are logged.
 */
export function resolveIDConflict(
  _id: string,
  packA: LoadablePack,
  packB: LoadablePack
): LoadablePack {
  // Builtin always wins
  if (packA.isBuiltin && !packB.isBuiltin) {
    return packA;
  }
  if (packB.isBuiltin && !packA.isBuiltin) {
    return packB;
  }
  
  // Both builtin or both non-builtin: higher priority wins
  if (packA.loadPriority !== packB.loadPriority) {
    return packA.loadPriority < packB.loadPriority ? packA : packB;
  }
  
  // Same priority: first alphabetically (deterministic)
  return packA.manifest.name.localeCompare(packB.manifest.name) < 0 ? packA : packB;
}

// ============================================================================
// CONFLICT REPORTING
// ============================================================================

/**
 * Format conflicts for logging.
 */
export function formatConflicts(conflicts: readonly LoadConflict[]): string {
  if (conflicts.length === 0) {
    return 'No conflicts detected.';
  }
  
  const lines: string[] = [`Found ${conflicts.length} load conflict(s):`];
  
  for (const conflict of conflicts) {
    const packInfo = conflict.conflictingPack
      ? `${conflict.packName} <-> ${conflict.conflictingPack}`
      : conflict.packName;
    
    lines.push(
      `  [${conflict.type}] ${packInfo}`,
      `    ${conflict.detail}`,
      `    Resolution: ${conflict.resolution}`
    );
  }
  
  return lines.join('\n');
}

/**
 * Check if conflicts contain any errors (vs warnings).
 */
export function hasErrorConflicts(conflicts: readonly LoadConflict[]): boolean {
  return conflicts.some(c => c.resolution === 'error');
}
