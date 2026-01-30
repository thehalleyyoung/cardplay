/**
 * @fileoverview Registry V2 Merge Utilities
 * 
 * Merges multiple registry snapshots with conflict detection and resolution.
 * 
 * References:
 * - docs/registry-api.md
 * 
 * @module registry/v2/merge
 */

import type { RegistrySnapshot, TypedRegistryEntry, RegistryEntryType } from './types';
import { hashEntry } from './schema';

/**
 * Merge strategy for handling conflicts.
 */
export enum MergeStrategy {
  /** Prefer entries from the base snapshot */
  PREFER_BASE = 'prefer-base',
  
  /** Prefer entries from overlaid snapshots */
  PREFER_OVERLAY = 'prefer-overlay',
  
  /** Keep both versions and mark as conflict */
  KEEP_BOTH = 'keep-both',
  
  /** Fail on conflict (requires manual resolution) */
  FAIL_ON_CONFLICT = 'fail-on-conflict',
}

/**
 * Conflict detected during merge.
 */
export interface MergeConflict {
  /** Entry type */
  entryType: RegistryEntryType;
  
  /** Entry ID */
  id: string;
  
  /** Entry from base snapshot */
  baseEntry: TypedRegistryEntry;
  
  /** Entry from overlay snapshot */
  overlayEntry: TypedRegistryEntry;
  
  /** Reason for conflict */
  reason: string;
}

/**
 * Result of a merge operation.
 */
export interface MergeResult {
  /** Merged snapshot */
  snapshot: RegistrySnapshot;
  
  /** Conflicts detected during merge */
  conflicts: MergeConflict[];
  
  /** Statistics about the merge */
  stats: {
    /** Entries from base */
    fromBase: number;
    /** Entries from overlay */
    fromOverlay: number;
    /** Entries that conflicted */
    conflicted: number;
    /** Total entries in result */
    total: number;
  };
}

/**
 * Merges two registry snapshots using the specified strategy.
 * 
 * The overlay snapshot is merged onto the base snapshot. For entries that
 * exist in both snapshots, the merge strategy determines which version wins.
 * 
 * @param base Base snapshot
 * @param overlay Overlay snapshot to merge onto base
 * @param strategy Merge strategy
 * @returns Merge result with merged snapshot and any conflicts
 */
export function mergeSnapshots(
  base: RegistrySnapshot,
  overlay: RegistrySnapshot,
  strategy: MergeStrategy = MergeStrategy.PREFER_OVERLAY
): MergeResult {
  const conflicts: MergeConflict[] = [];
  let fromBase = 0;
  let fromOverlay = 0;
  let conflicted = 0;
  
  // Start with base snapshot
  const merged: RegistrySnapshot = {
    ...base,
    createdAt: new Date(),
    entries: { ...base.entries },
  };
  
  // Get all entry types from both snapshots
  const allTypes = new Set<RegistryEntryType>();
  Object.keys(base.entries).forEach(type => allTypes.add(type as RegistryEntryType));
  Object.keys(overlay.entries).forEach(type => allTypes.add(type as RegistryEntryType));
  
  // Process each entry type
  for (const entryType of allTypes) {
    const baseEntries = base.entries[entryType] ?? [];
    const overlayEntries = overlay.entries[entryType] ?? [];
    
    // Build maps for efficient lookup
    const baseMap = new Map(baseEntries.map(e => [e.provenance.id, e]));
    const overlayMap = new Map(overlayEntries.map(e => [e.provenance.id, e]));
    
    const mergedEntries: TypedRegistryEntry[] = [];
    const processedIds = new Set<string>();
    
    // Process entries from base
    for (const [id, baseEntry] of baseMap) {
      processedIds.add(id);
      const overlayEntry = overlayMap.get(id);
      
      if (!overlayEntry) {
        // Only in base - keep it
        mergedEntries.push(baseEntry);
        fromBase++;
      } else {
        // In both - handle conflict
        const baseHash = hashEntry(baseEntry);
        const overlayHash = hashEntry(overlayEntry);
        
        if (baseHash === overlayHash) {
          // Identical - keep one copy
          mergedEntries.push(baseEntry);
          fromBase++;
        } else {
          // Conflict - apply strategy
          const conflict: MergeConflict = {
            entryType,
            id,
            baseEntry,
            overlayEntry,
            reason: 'Entry exists in both snapshots with different content',
          };
          
          switch (strategy) {
            case MergeStrategy.PREFER_BASE:
              mergedEntries.push(baseEntry);
              fromBase++;
              break;
              
            case MergeStrategy.PREFER_OVERLAY:
              mergedEntries.push(overlayEntry);
              fromOverlay++;
              break;
              
            case MergeStrategy.KEEP_BOTH:
              // Add both with modified IDs
              mergedEntries.push(baseEntry);
              mergedEntries.push(overlayEntry);
              fromBase++;
              fromOverlay++;
              conflicts.push(conflict);
              conflicted++;
              break;
              
            case MergeStrategy.FAIL_ON_CONFLICT:
              conflicts.push(conflict);
              conflicted++;
              // Don't add either entry
              break;
          }
        }
      }
    }
    
    // Process entries only in overlay
    for (const [id, overlayEntry] of overlayMap) {
      if (!processedIds.has(id)) {
        mergedEntries.push(overlayEntry);
        fromOverlay++;
      }
    }
    
    merged.entries[entryType] = mergedEntries;
  }
  
  return {
    snapshot: merged,
    conflicts,
    stats: {
      fromBase,
      fromOverlay,
      conflicted,
      total: fromBase + fromOverlay,
    },
  };
}

/**
 * Overlays multiple snapshots in sequence.
 * Later snapshots override earlier ones.
 */
export function overlaySnapshots(
  base: RegistrySnapshot,
  overlays: RegistrySnapshot[],
  strategy: MergeStrategy = MergeStrategy.PREFER_OVERLAY
): MergeResult {
  let current = base;
  const allConflicts: MergeConflict[] = [];
  let totalFromBase = 0;
  let totalFromOverlay = 0;
  let totalConflicted = 0;
  
  for (const overlay of overlays) {
    const result = mergeSnapshots(current, overlay, strategy);
    current = result.snapshot;
    allConflicts.push(...result.conflicts);
    totalFromBase += result.stats.fromBase;
    totalFromOverlay += result.stats.fromOverlay;
    totalConflicted += result.stats.conflicted;
  }
  
  return {
    snapshot: current,
    conflicts: allConflicts,
    stats: {
      fromBase: totalFromBase,
      fromOverlay: totalFromOverlay,
      conflicted: totalConflicted,
      total: totalFromBase + totalFromOverlay,
    },
  };
}
