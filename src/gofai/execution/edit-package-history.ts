/**
 * GOFAI Edit Package History — Typed References to Historical Edits
 *
 * This module implements Step 091 [Type] from gofai_goalB.md:
 * "Define a typed 'reference to historical edit package' to support
 * 'undo that', 'redo the chorus widening'."
 *
 * It provides:
 * 1. Strongly typed references to past edit packages
 * 2. History indexing and lookup by various criteria
 * 3. Temporal and scope-based queries ("that chorus edit", "the last change")
 * 4. Integration with dialogue state for anaphoric resolution
 *
 * @module gofai/execution/edit-package-history
 */

import type { EditPackage } from './edit-package';
import type { CPLScope } from '../canon/cpl-types';

// =============================================================================
// Types for Historical References
// =============================================================================

/**
 * A unique identifier for an edit package.
 * Format: `edit:${timestamp}_${uuid}`
 */
export type EditPackageId = `edit:${string}`;

/**
 * A reference to a historical edit package that can be resolved.
 * This is the primary type for anaphoric references like "that", "the chorus edit".
 */
export interface EditPackageRef {
  /** Type discriminator */
  readonly type: 'edit_package_ref';

  /** The kind of reference */
  readonly refKind: EditPackageRefKind;

  /** The specific ID if directly referenced */
  readonly id?: EditPackageId;

  /** Index in history (0 = most recent, 1 = second most recent, etc.) */
  readonly historyIndex?: number;

  /** Filter by scope if specified */
  readonly scopeFilter?: CPLScope;

  /** Filter by description/summary keywords */
  readonly descriptionFilter?: string;

  /** Whether this is an undo or redo reference */
  readonly temporalRelation?: 'undo' | 'redo' | 'same';

  /** Confidence score for resolution (0-1) */
  readonly confidence: number;
}

/**
 * Kind of edit package reference.
 */
export type EditPackageRefKind =
  /** Direct ID reference */
  | 'direct_id'
  /** Most recent edit */
  | 'most_recent'
  /** Edit at specific history index */
  | 'indexed'
  /** Edit matching scope */
  | 'by_scope'
  /** Edit matching description */
  | 'by_description'
  /** Anaphoric "that" reference */
  | 'anaphoric'
  /** "The X edit" where X is a description */
  | 'descriptive';

/**
 * Result of resolving an EditPackageRef to actual package(s).
 */
export interface EditPackageResolution {
  /** Whether resolution succeeded */
  readonly resolved: boolean;

  /** The resolved edit package(s) */
  readonly packages: readonly EditPackage[];

  /** If resolution failed, why */
  readonly failureReason?: string;

  /** Confidence of resolution (0-1) */
  readonly confidence: number;

  /** Alternatives if ambiguous */
  readonly alternatives?: readonly EditPackage[];
}

// =============================================================================
// History Entry with Metadata
// =============================================================================

/**
 * A historical edit package entry with additional metadata for queries.
 */
export interface HistoricalEditEntry {
  /** The edit package */
  readonly package: EditPackage;

  /** When it was applied (milliseconds since epoch) */
  readonly appliedAt: number;

  /** The scope it affected */
  readonly scope?: CPLScope;

  /** A human-readable summary */
  readonly summary: string;

  /** Keywords extracted from the edit for matching */
  readonly keywords: readonly string[];

  /** Whether this edit is currently in the undo stack */
  readonly inUndoStack: boolean;

  /** Whether this edit has been undone */
  readonly undone: boolean;

  /** If undone, when */
  readonly undoneAt?: number;
}

// =============================================================================
// History Store Interface
// =============================================================================

/**
 * Interface for storing and querying edit package history.
 */
export interface EditPackageHistory {
  /**
   * Add a new edit package to history.
   */
  add(entry: HistoricalEditEntry): void;

  /**
   * Get edit by direct ID.
   */
  getById(id: EditPackageId): HistoricalEditEntry | undefined;

  /**
   * Get most recent N edits.
   */
  getMostRecent(count: number, filter?: HistoryFilter): readonly HistoricalEditEntry[];

  /**
   * Get edit by history index (0 = most recent).
   */
  getByIndex(index: number, filter?: HistoryFilter): HistoricalEditEntry | undefined;

  /**
   * Find edits matching a scope.
   */
  findByScope(scope: CPLScope, limit?: number): readonly HistoricalEditEntry[];

  /**
   * Find edits matching keywords in summary/description.
   */
  findByKeywords(keywords: string[], limit?: number): readonly HistoricalEditEntry[];

  /**
   * Mark an edit as undone.
   */
  markUndone(id: EditPackageId): void;

  /**
   * Get all edits in current undo stack.
   */
  getUndoStack(): readonly HistoricalEditEntry[];

  /**
   * Resolve an EditPackageRef to actual packages.
   */
  resolve(ref: EditPackageRef): EditPackageResolution;

  /**
   * Clear all history.
   */
  clear(): void;

  /**
   * Get total number of edits in history.
   */
  size(): number;
}

/**
 * Filter for history queries.
 */
export interface HistoryFilter {
  /** Only include undone/not undone edits */
  readonly undoneOnly?: boolean;
  readonly notUndone?: boolean;

  /** Only include edits in/out of undo stack */
  readonly inUndoStack?: boolean;

  /** Only include edits after this timestamp */
  readonly afterTimestamp?: number;

  /** Only include edits before this timestamp */
  readonly beforeTimestamp?: number;

  /** Only include edits affecting this scope */
  readonly scope?: CPLScope;

  /** Only include edits matching these keywords */
  readonly keywords?: readonly string[];
}

// =============================================================================
// In-Memory Implementation
// =============================================================================

/**
 * In-memory implementation of EditPackageHistory.
 */
export class InMemoryEditPackageHistory implements EditPackageHistory {
  private entries: HistoricalEditEntry[] = [];
  private readonly byId = new Map<EditPackageId, HistoricalEditEntry>();

  add(entry: HistoricalEditEntry): void {
    this.entries.push(entry);
    
    // Extract ID from package
    const id = (entry.package as any).id as EditPackageId;
    if (id) {
      this.byId.set(id, entry);
    }
  }

  getById(id: EditPackageId): HistoricalEditEntry | undefined {
    return this.byId.get(id);
  }

  getMostRecent(count: number, filter?: HistoryFilter): readonly HistoricalEditEntry[] {
    const filtered = this.applyFilter(this.entries, filter);
    
    // Sort by appliedAt descending (most recent first)
    const sorted = [...filtered].sort((a, b) => b.appliedAt - a.appliedAt);
    
    return sorted.slice(0, count);
  }

  getByIndex(index: number, filter?: HistoryFilter): HistoricalEditEntry | undefined {
    const filtered = this.applyFilter(this.entries, filter);
    const sorted = [...filtered].sort((a, b) => b.appliedAt - a.appliedAt);
    return sorted[index];
  }

  findByScope(scope: CPLScope, limit: number = 10): readonly HistoricalEditEntry[] {
    return this.applyFilter(this.entries, { scope }).slice(0, limit);
  }

  findByKeywords(keywords: string[], limit: number = 10): readonly HistoricalEditEntry[] {
    const matches: Array<{ entry: HistoricalEditEntry; score: number }> = [];

    for (const entry of this.entries) {
      let score = 0;
      
      for (const keyword of keywords) {
        const lowerKeyword = keyword.toLowerCase();
        
        // Check summary
        if (entry.summary.toLowerCase().includes(lowerKeyword)) {
          score += 10;
        }
        
        // Check keywords array
        if (entry.keywords.some(k => k.toLowerCase().includes(lowerKeyword))) {
          score += 5;
        }
      }
      
      if (score > 0) {
        matches.push({ entry, score });
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);
    
    return matches.slice(0, limit).map(m => m.entry);
  }

  markUndone(id: EditPackageId): void {
    const entry = this.byId.get(id);
    if (entry) {
      // Create updated entry (immutable update)
      const updated: HistoricalEditEntry = {
        ...entry,
        undone: true,
        undoneAt: Date.now(),
        inUndoStack: false,
      };
      
      // Replace in arrays
      const index = this.entries.indexOf(entry);
      if (index !== -1) {
        this.entries[index] = updated;
      }
      this.byId.set(id, updated);
    }
  }

  getUndoStack(): readonly HistoricalEditEntry[] {
    return this.applyFilter(this.entries, { inUndoStack: true });
  }

  resolve(ref: EditPackageRef): EditPackageResolution {
    switch (ref.refKind) {
      case 'direct_id':
        if (ref.id) {
          const entry = this.getById(ref.id);
          if (entry) {
            return {
              resolved: true,
              packages: [entry.package],
              confidence: 1.0,
            };
          }
        }
        return {
          resolved: false,
          packages: [],
          failureReason: 'Edit package ID not found',
          confidence: 0,
        };

      case 'most_recent':
        const recent = this.getMostRecent(1, ref.scopeFilter ? { scope: ref.scopeFilter } : undefined);
        if (recent.length > 0 && recent[0]) {
          return {
            resolved: true,
            packages: [recent[0].package],
            confidence: 0.9,
          };
        }
        return {
          resolved: false,
          packages: [],
          failureReason: 'No recent edits found',
          confidence: 0,
        };

      case 'indexed':
        if (ref.historyIndex !== undefined) {
          const entry = this.getByIndex(ref.historyIndex, ref.scopeFilter ? { scope: ref.scopeFilter } : undefined);
          if (entry) {
            return {
              resolved: true,
              packages: [entry.package],
              confidence: 0.85,
            };
          }
        }
        return {
          resolved: false,
          packages: [],
          failureReason: 'No edit at specified history index',
          confidence: 0,
        };

      case 'by_scope':
        if (ref.scopeFilter) {
          const entries = this.findByScope(ref.scopeFilter, 3);
          if (entries.length > 0) {
            return {
              resolved: true,
              packages: [entries[0]!.package],
              alternatives: entries.slice(1).map(e => e.package),
              confidence: entries.length === 1 ? 0.8 : 0.6,
            };
          }
        }
        return {
          resolved: false,
          packages: [],
          failureReason: 'No edits found for specified scope',
          confidence: 0,
        };

      case 'by_description':
      case 'descriptive':
        if (ref.descriptionFilter) {
          const keywords = ref.descriptionFilter.split(/\s+/).filter(k => k.length > 2);
          const entries = this.findByKeywords(keywords, 3);
          if (entries.length > 0) {
            return {
              resolved: true,
              packages: [entries[0]!.package],
              alternatives: entries.slice(1).map(e => e.package),
              confidence: entries.length === 1 ? 0.75 : 0.5,
            };
          }
        }
        return {
          resolved: false,
          packages: [],
          failureReason: 'No edits found matching description',
          confidence: 0,
        };

      case 'anaphoric':
        // Fallback to most recent
        const anaphoricRecent = this.getMostRecent(1);
        if (anaphoricRecent.length > 0 && anaphoricRecent[0]) {
          return {
            resolved: true,
            packages: [anaphoricRecent[0].package],
            confidence: ref.confidence,
          };
        }
        return {
          resolved: false,
          packages: [],
          failureReason: 'Cannot resolve anaphoric reference',
          confidence: 0,
        };

      default:
        return {
          resolved: false,
          packages: [],
          failureReason: 'Unknown reference kind',
          confidence: 0,
        };
    }
  }

  clear(): void {
    this.entries = [];
    this.byId.clear();
  }

  size(): number {
    return this.entries.length;
  }

  // Private helper to apply filters
  private applyFilter(
    entries: readonly HistoricalEditEntry[],
    filter?: HistoryFilter
  ): readonly HistoricalEditEntry[] {
    if (!filter) {
      return entries;
    }

    let filtered = entries;

    if (filter.undoneOnly !== undefined) {
      filtered = filtered.filter(e => e.undone === filter.undoneOnly);
    }

    if (filter.notUndone !== undefined) {
      filtered = filtered.filter(e => !e.undone === filter.notUndone);
    }

    if (filter.inUndoStack !== undefined) {
      filtered = filtered.filter(e => e.inUndoStack === filter.inUndoStack);
    }

    if (filter.afterTimestamp !== undefined) {
      filtered = filtered.filter(e => e.appliedAt > filter.afterTimestamp!);
    }

    if (filter.beforeTimestamp !== undefined) {
      filtered = filtered.filter(e => e.appliedAt < filter.beforeTimestamp!);
    }

    if (filter.scope !== undefined) {
      filtered = filtered.filter(e => e.scope && scopesMatch(e.scope, filter.scope!));
    }

    if (filter.keywords && filter.keywords.length > 0) {
      filtered = filtered.filter(e =>
        filter.keywords!.some(keyword =>
          e.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
        )
      );
    }

    return filtered;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if two scopes match (simplified - real implementation would be more sophisticated).
 */
function scopesMatch(a: CPLScope, b: CPLScope): boolean {
  // Simple equality check - real implementation would handle overlaps, contains, etc.
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Create a direct ID reference.
 */
export function createDirectIdRef(id: EditPackageId): EditPackageRef {
  return {
    type: 'edit_package_ref',
    refKind: 'direct_id',
    id,
    confidence: 1.0,
  };
}

/**
 * Create a "most recent edit" reference.
 */
export function createMostRecentRef(scopeFilter?: CPLScope): EditPackageRef {
  return {
    type: 'edit_package_ref',
    refKind: 'most_recent',
    scopeFilter,
    confidence: 0.9,
  };
}

/**
 * Create a history index reference.
 */
export function createIndexedRef(index: number, scopeFilter?: CPLScope): EditPackageRef {
  return {
    type: 'edit_package_ref',
    refKind: 'indexed',
    historyIndex: index,
    scopeFilter,
    confidence: 0.85,
  };
}

/**
 * Create a scope-based reference.
 */
export function createScopeRef(scope: CPLScope, confidence: number = 0.8): EditPackageRef {
  return {
    type: 'edit_package_ref',
    refKind: 'by_scope',
    scopeFilter: scope,
    confidence,
  };
}

/**
 * Create a description-based reference.
 */
export function createDescriptiveRef(description: string, confidence: number = 0.75): EditPackageRef {
  return {
    type: 'edit_package_ref',
    refKind: 'descriptive',
    descriptionFilter: description,
    confidence,
  };
}

/**
 * Create an anaphoric "that" reference.
 */
export function createAnaphoricRef(confidence: number = 0.7): EditPackageRef {
  return {
    type: 'edit_package_ref',
    refKind: 'anaphoric',
    confidence,
  };
}

// =============================================================================
// Global History Instance (for convenience)
// =============================================================================

/**
 * Global edit package history instance.
 * In production, this would be managed by the application store.
 */
export const globalEditPackageHistory = new InMemoryEditPackageHistory();
