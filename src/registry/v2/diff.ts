/**
 * @fileoverview Registry V2 Diff Generation
 * 
 * Generates stable, human-readable diffs between registry snapshots.
 * Used for version control, collaboration, and debugging.
 * 
 * References:
 * - docs/registry-diff-format.md
 * - docs/registry-api.md
 * 
 * @module registry/v2/diff
 */

import type { RegistrySnapshot, TypedRegistryEntry, RegistryEntryType } from './types';
import { hashEntry } from './schema';

/**
 * Type of change in a diff.
 */
export enum DiffChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
  UNCHANGED = 'unchanged',
}

/**
 * A single change in a registry diff.
 */
export interface DiffChange<T = unknown> {
  /** Type of change */
  type: DiffChangeType;
  
  /** Entry type */
  entryType: RegistryEntryType;
  
  /** Entry ID */
  id: string;
  
  /** Old entry (for removed/modified) */
  oldEntry?: TypedRegistryEntry<T>;
  
  /** New entry (for added/modified) */
  newEntry?: TypedRegistryEntry<T>;
  
  /** Field-level changes for modified entries */
  fieldChanges?: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
}

/**
 * Complete diff between two snapshots.
 */
export interface RegistryDiff {
  /** Snapshot metadata */
  fromVersion: {
    version: number;
    cardplayVersion: string;
    createdAt: Date;
  };
  
  toVersion: {
    version: number;
    cardplayVersion: string;
    createdAt: Date;
  };
  
  /** All changes grouped by type */
  changes: {
    [K in RegistryEntryType]?: DiffChange[];
  };
  
  /** Summary statistics */
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
    total: number;
  };
}

/**
 * Computes a diff between two registry snapshots.
 */
export function computeDiff(from: RegistrySnapshot, to: RegistrySnapshot): RegistryDiff {
  const changes: { [K in RegistryEntryType]?: DiffChange[] } = {};
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let unchangedCount = 0;
  
  // Get all entry types from both snapshots
  const allTypes = new Set<RegistryEntryType>();
  Object.keys(from.entries).forEach(type => allTypes.add(type as RegistryEntryType));
  Object.keys(to.entries).forEach(type => allTypes.add(type as RegistryEntryType));
  
  // Process each entry type
  for (const entryType of allTypes) {
    const fromEntries = from.entries[entryType] ?? [];
    const toEntries = to.entries[entryType] ?? [];
    
    // Build maps for efficient lookup
    const fromMap = new Map(fromEntries.map(e => [e.provenance.id, e]));
    const toMap = new Map(toEntries.map(e => [e.provenance.id, e]));
    
    const typeChanges: DiffChange[] = [];
    
    // Find added and modified entries
    for (const [id, newEntry] of toMap) {
      const oldEntry = fromMap.get(id);
      
      if (!oldEntry) {
        // Added
        typeChanges.push({
          type: DiffChangeType.ADDED,
          entryType,
          id,
          newEntry,
        });
        addedCount++;
      } else {
        // Check if modified
        const oldHash = hashEntry(oldEntry);
        const newHash = hashEntry(newEntry);
        
        if (oldHash !== newHash) {
          // Modified
          typeChanges.push({
            type: DiffChangeType.MODIFIED,
            entryType,
            id,
            oldEntry,
            newEntry,
            fieldChanges: computeFieldChanges(oldEntry, newEntry),
          });
          modifiedCount++;
        } else {
          // Unchanged
          unchangedCount++;
        }
      }
    }
    
    // Find removed entries
    for (const [id, oldEntry] of fromMap) {
      if (!toMap.has(id)) {
        typeChanges.push({
          type: DiffChangeType.REMOVED,
          entryType,
          id,
          oldEntry,
        });
        removedCount++;
      }
    }
    
    if (typeChanges.length > 0) {
      changes[entryType] = typeChanges;
    }
  }
  
  return {
    fromVersion: {
      version: from.version,
      cardplayVersion: from.cardplayVersion,
      createdAt: from.createdAt,
    },
    toVersion: {
      version: to.version,
      cardplayVersion: to.cardplayVersion,
      createdAt: to.createdAt,
    },
    changes,
    summary: {
      added: addedCount,
      removed: removedCount,
      modified: modifiedCount,
      unchanged: unchangedCount,
      total: addedCount + removedCount + modifiedCount + unchangedCount,
    },
  };
}

/**
 * Computes field-level changes between two entries.
 */
function computeFieldChanges(
  oldEntry: TypedRegistryEntry,
  newEntry: TypedRegistryEntry
): Array<{ field: string; oldValue: unknown; newValue: unknown }> {
  const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];
  
  // Compare provenance fields
  if (oldEntry.provenance.source.version !== newEntry.provenance.source.version) {
    changes.push({
      field: 'version',
      oldValue: oldEntry.provenance.source.version,
      newValue: newEntry.provenance.source.version,
    });
  }
  
  if (oldEntry.provenance.active !== newEntry.provenance.active) {
    changes.push({
      field: 'active',
      oldValue: oldEntry.provenance.active,
      newValue: newEntry.provenance.active,
    });
  }
  
  // For entity changes, we currently just note that the entity changed
  // A more sophisticated implementation would do deep field comparison
  const oldEntityHash = JSON.stringify(oldEntry.entity);
  const newEntityHash = JSON.stringify(newEntry.entity);
  
  if (oldEntityHash !== newEntityHash) {
    changes.push({
      field: 'entity',
      oldValue: oldEntry.entity,
      newValue: newEntry.entity,
    });
  }
  
  return changes;
}

/**
 * Formats a diff as human-readable text.
 */
export function formatDiff(diff: RegistryDiff): string {
  const lines: string[] = [];
  
  lines.push('# Registry Diff');
  lines.push('');
  lines.push(`From: version ${diff.fromVersion.version} (CardPlay ${diff.fromVersion.cardplayVersion})`);
  lines.push(`To:   version ${diff.toVersion.version} (CardPlay ${diff.toVersion.cardplayVersion})`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`  Added:    ${diff.summary.added}`);
  lines.push(`  Removed:  ${diff.summary.removed}`);
  lines.push(`  Modified: ${diff.summary.modified}`);
  lines.push(`  Unchanged: ${diff.summary.unchanged}`);
  lines.push(`  Total:    ${diff.summary.total}`);
  lines.push('');
  
  // Format changes by type
  for (const [entryType, changes] of Object.entries(diff.changes)) {
    if (!changes || changes.length === 0) continue;
    
    lines.push(`## ${entryType}`);
    lines.push('');
    
    for (const change of changes) {
      switch (change.type) {
        case DiffChangeType.ADDED:
          lines.push(`+ ${change.id}`);
          if (change.newEntry) {
            lines.push(`  Pack: ${change.newEntry.provenance.source.packId}`);
            lines.push(`  Version: ${change.newEntry.provenance.source.version}`);
          }
          break;
          
        case DiffChangeType.REMOVED:
          lines.push(`- ${change.id}`);
          if (change.oldEntry) {
            lines.push(`  Was from: ${change.oldEntry.provenance.source.packId}`);
          }
          break;
          
        case DiffChangeType.MODIFIED:
          lines.push(`~ ${change.id}`);
          if (change.fieldChanges && change.fieldChanges.length > 0) {
            for (const fieldChange of change.fieldChanges) {
              lines.push(`  ${fieldChange.field}: ${JSON.stringify(fieldChange.oldValue)} → ${JSON.stringify(fieldChange.newValue)}`);
            }
          }
          break;
      }
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Applies a diff to a snapshot (forward application).
 * 
 * @param snapshot Base snapshot
 * @param diff Diff to apply
 * @returns New snapshot with diff applied
 */
export function applyDiff(snapshot: RegistrySnapshot, diff: RegistryDiff): RegistrySnapshot {
  const result: RegistrySnapshot = {
    ...snapshot,
    version: diff.toVersion.version,
    cardplayVersion: diff.toVersion.cardplayVersion,
    createdAt: new Date(),
    entries: { ...snapshot.entries },
  };
  
  // Apply changes for each entry type
  for (const [entryType, changes] of Object.entries(diff.changes)) {
    if (!changes) continue;
    
    const typeKey = entryType as RegistryEntryType;
    const currentEntries = [...(result.entries[typeKey] ?? [])];
    
    for (const change of changes) {
      const index = currentEntries.findIndex(e => e.provenance.id === change.id);
      
      switch (change.type) {
        case DiffChangeType.ADDED:
          if (change.newEntry) {
            currentEntries.push(change.newEntry);
          }
          break;
          
        case DiffChangeType.REMOVED:
          if (index >= 0) {
            currentEntries.splice(index, 1);
          }
          break;
          
        case DiffChangeType.MODIFIED:
          if (index >= 0 && change.newEntry) {
            currentEntries[index] = change.newEntry;
          }
          break;
      }
    }
    
    result.entries[typeKey] = currentEntries;
  }
  
  return result;
}
