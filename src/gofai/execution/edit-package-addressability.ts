/**
 * @file Edit Package Addressability (Step 318)
 * @module gofai/execution/edit-package-addressability
 * 
 * Implements Step 318: Implement "edit package addressability": users can undo
 * by package ID, by scope, or by turn index.
 * 
 * This module provides multiple ways to reference and address edit packages in
 * the history, enabling flexible undo/redo operations:
 * - By package ID (direct reference)
 * - By turn index (sequential position)
 * - By scope (all edits in a section/layer)
 * - By description (fuzzy matching)
 * - By time range (all edits in a window)
 * 
 * Design principles:
 * - Multiple addressing modes for different UX patterns
 * - Deterministic resolution (same query → same package)
 * - Clear error messages when address is ambiguous
 * - Support for bulk operations (undo multiple packages)
 * - Integration with dialogue system ("undo that chorus change")
 * 
 * Use cases:
 * - "Undo the last edit" → by turn index
 * - "Undo the chorus widening" → by description/scope
 * - "Undo package abc123" → by ID
 * - "Undo all drum edits" → by scope
 * - "Undo the last 3 edits" → by turn range
 * 
 * @see gofai_goalB.md Step 318
 * @see gofai_goalB.md Step 348 (UI affordances for history references)
 * @see docs/gofai/edit-package-addressing.md
 */

import type { EditPackage, CPLIntent, CPLPlan, Scope } from './edit-package.js';
import type { UndoEntry, UndoStack } from './undo-integration.js';
import type { GofaiId } from '../canon/types.js';

// ============================================================================
// Address Types
// ============================================================================

/**
 * Edit package address.
 * 
 * Multiple ways to refer to an edit package or set of packages.
 */
export type EditPackageAddress =
  | PackageIdAddress
  | TurnIndexAddress
  | TurnRangeAddress
  | ScopeAddress
  | DescriptionAddress
  | TimeRangeAddress
  | RelativeAddress
  | CompositeAddress;

/**
 * Address by package ID (direct, unambiguous).
 */
export interface PackageIdAddress {
  readonly type: 'package-id';
  readonly packageId: string;
}

/**
 * Address by turn index (sequential position in history).
 */
export interface TurnIndexAddress {
  readonly type: 'turn-index';
  readonly index: number; // 0 = first, -1 = last
}

/**
 * Address by turn range (multiple sequential edits).
 */
export interface TurnRangeAddress {
  readonly type: 'turn-range';
  readonly start: number; // Inclusive
  readonly end: number; // Inclusive
}

/**
 * Address by scope (all edits affecting a scope).
 */
export interface ScopeAddress {
  readonly type: 'scope';
  readonly scope: Scope;
  readonly matchMode: 'exact' | 'overlapping' | 'contained';
}

/**
 * Address by description (fuzzy text matching).
 */
export interface DescriptionAddress {
  readonly type: 'description';
  readonly query: string;
  readonly matchMode: 'exact' | 'contains' | 'fuzzy';
  readonly maxResults?: number;
}

/**
 * Address by time range (edits within time window).
 */
export interface TimeRangeAddress {
  readonly type: 'time-range';
  readonly start: number; // Unix timestamp
  readonly end: number; // Unix timestamp
}

/**
 * Relative address (relative to current position).
 */
export interface RelativeAddress {
  readonly type: 'relative';
  readonly offset: number; // -1 = previous, +1 = next
  readonly from?: 'current' | 'latest' | 'specific-id';
  readonly fromId?: string; // If from === 'specific-id'
}

/**
 * Composite address (combine multiple criteria).
 */
export interface CompositeAddress {
  readonly type: 'composite';
  readonly criteria: readonly EditPackageAddress[];
  readonly mode: 'intersection' | 'union'; // How to combine results
}

/**
 * Address resolution result.
 */
export type AddressResolutionResult =
  | { readonly status: 'success'; readonly packages: readonly EditPackage[]; readonly entries: readonly UndoEntry[] }
  | { readonly status: 'empty'; readonly reason: string }
  | { readonly status: 'ambiguous'; readonly reason: string; readonly candidates: readonly EditPackage[] }
  | { readonly status: 'error'; readonly reason: string };

// ============================================================================
// Address Resolver
// ============================================================================

/**
 * Edit package address resolver.
 * 
 * Resolves addresses to concrete edit packages from the history.
 */
export class EditPackageAddressResolver {
  constructor(
    private readonly undoStack: UndoStack
  ) {}
  
  /**
   * Resolve an address to edit packages.
   */
  resolve(address: EditPackageAddress): AddressResolutionResult {
    switch (address.type) {
      case 'package-id':
        return this.resolveById(address);
      case 'turn-index':
        return this.resolveByTurnIndex(address);
      case 'turn-range':
        return this.resolveByTurnRange(address);
      case 'scope':
        return this.resolveByScope(address);
      case 'description':
        return this.resolveByDescription(address);
      case 'time-range':
        return this.resolveByTimeRange(address);
      case 'relative':
        return this.resolveRelative(address);
      case 'composite':
        return this.resolveComposite(address);
    }
  }
  
  /**
   * Resolve by package ID.
   */
  private resolveById(address: PackageIdAddress): AddressResolutionResult {
    for (const entry of this.undoStack.entries) {
      const pkg = entry.packages.find(p => p.id === address.packageId);
      if (pkg) {
        return {
          status: 'success',
          packages: [pkg],
          entries: [entry],
        };
      }
    }
    
    return {
      status: 'empty',
      reason: `Package ${address.packageId} not found in history`,
    };
  }
  
  /**
   * Resolve by turn index.
   */
  private resolveByTurnIndex(address: TurnIndexAddress): AddressResolutionResult {
    const entries = this.undoStack.entries;
    let index = address.index;
    
    // Handle negative indices (from end)
    if (index < 0) {
      index = entries.length + index;
    }
    
    // Bounds check
    if (index < 0 || index >= entries.length) {
      return {
        status: 'empty',
        reason: `Turn index ${address.index} out of bounds (0 to ${entries.length - 1})`,
      };
    }
    
    const entry = entries[index];
    return {
      status: 'success',
      packages: [...entry.packages],
      entries: [entry],
    };
  }
  
  /**
   * Resolve by turn range.
   */
  private resolveByTurnRange(address: TurnRangeAddress): AddressResolutionResult {
    const entries = this.undoStack.entries;
    let start = address.start;
    let end = address.end;
    
    // Handle negative indices
    if (start < 0) start = entries.length + start;
    if (end < 0) end = entries.length + end;
    
    // Bounds check
    start = Math.max(0, Math.min(start, entries.length - 1));
    end = Math.max(0, Math.min(end, entries.length - 1));
    
    if (start > end) {
      return {
        status: 'empty',
        reason: `Invalid range: start ${start} > end ${end}`,
      };
    }
    
    const rangeEntries = entries.slice(start, end + 1);
    const packages = rangeEntries.flatMap(e => e.packages);
    
    return {
      status: 'success',
      packages,
      entries: rangeEntries,
    };
  }
  
  /**
   * Resolve by scope.
   */
  private resolveByScope(address: ScopeAddress): AddressResolutionResult {
    const matchingPackages: EditPackage[] = [];
    const matchingEntries: UndoEntry[] = [];
    
    for (const entry of this.undoStack.entries) {
      const entryMatches = entry.packages.filter(pkg => 
        this.scopeMatches(pkg.intent.scope, address.scope, address.matchMode)
      );
      
      if (entryMatches.length > 0) {
        matchingPackages.push(...entryMatches);
        matchingEntries.push(entry);
      }
    }
    
    if (matchingPackages.length === 0) {
      return {
        status: 'empty',
        reason: `No edits found for scope ${JSON.stringify(address.scope)}`,
      };
    }
    
    return {
      status: 'success',
      packages: matchingPackages,
      entries: matchingEntries,
    };
  }
  
  /**
   * Resolve by description.
   */
  private resolveByDescription(address: DescriptionAddress): AddressResolutionResult {
    const matchingPackages: EditPackage[] = [];
    const matchingEntries: UndoEntry[] = [];
    
    for (const entry of this.undoStack.entries) {
      if (this.descriptionMatches(entry.description, address.query, address.matchMode)) {
        matchingPackages.push(...entry.packages);
        matchingEntries.push(entry);
      }
    }
    
    if (matchingPackages.length === 0) {
      return {
        status: 'empty',
        reason: `No edits found matching "${address.query}"`,
      };
    }
    
    // Limit results if requested
    if (address.maxResults && matchingPackages.length > address.maxResults) {
      return {
        status: 'ambiguous',
        reason: `Found ${matchingPackages.length} matches for "${address.query}", which exceeds maxResults ${address.maxResults}`,
        candidates: matchingPackages.slice(0, address.maxResults),
      };
    }
    
    return {
      status: 'success',
      packages: matchingPackages,
      entries: matchingEntries,
    };
  }
  
  /**
   * Resolve by time range.
   */
  private resolveByTimeRange(address: TimeRangeAddress): AddressResolutionResult {
    const matchingPackages: EditPackage[] = [];
    const matchingEntries: UndoEntry[] = [];
    
    for (const entry of this.undoStack.entries) {
      if (entry.timestamp >= address.start && entry.timestamp <= address.end) {
        matchingPackages.push(...entry.packages);
        matchingEntries.push(entry);
      }
    }
    
    if (matchingPackages.length === 0) {
      return {
        status: 'empty',
        reason: `No edits found in time range ${new Date(address.start).toISOString()} to ${new Date(address.end).toISOString()}`,
      };
    }
    
    return {
      status: 'success',
      packages: matchingPackages,
      entries: matchingEntries,
    };
  }
  
  /**
   * Resolve relative address.
   */
  private resolveRelative(address: RelativeAddress): AddressResolutionResult {
    const entries = this.undoStack.entries;
    let baseIndex: number;
    
    // Determine base index
    switch (address.from) {
      case 'latest':
        baseIndex = entries.length - 1;
        break;
      case 'current':
        baseIndex = this.undoStack.position - 1;
        break;
      case 'specific-id':
        if (!address.fromId) {
          return {
            status: 'error',
            reason: 'fromId required when from === "specific-id"',
          };
        }
        baseIndex = entries.findIndex(e => e.id === address.fromId);
        if (baseIndex === -1) {
          return {
            status: 'error',
            reason: `Entry ${address.fromId} not found`,
          };
        }
        break;
      default:
        baseIndex = this.undoStack.position - 1;
    }
    
    // Apply offset
    const targetIndex = baseIndex + address.offset;
    
    if (targetIndex < 0 || targetIndex >= entries.length) {
      return {
        status: 'empty',
        reason: `Relative offset ${address.offset} from index ${baseIndex} is out of bounds`,
      };
    }
    
    const entry = entries[targetIndex];
    return {
      status: 'success',
      packages: [...entry.packages],
      entries: [entry],
    };
  }
  
  /**
   * Resolve composite address.
   */
  private resolveComposite(address: CompositeAddress): AddressResolutionResult {
    if (address.criteria.length === 0) {
      return {
        status: 'empty',
        reason: 'Composite address has no criteria',
      };
    }
    
    // Resolve each criterion
    const results = address.criteria.map(c => this.resolve(c));
    
    // Check for errors
    const firstError = results.find(r => r.status === 'error');
    if (firstError && firstError.status === 'error') {
      return firstError;
    }
    
    // Combine results
    const successResults = results.filter(r => r.status === 'success') as Array<{ status: 'success'; packages: readonly EditPackage[]; entries: readonly UndoEntry[] }>;
    
    if (successResults.length === 0) {
      return {
        status: 'empty',
        reason: 'No criteria matched any packages',
      };
    }
    
    if (address.mode === 'union') {
      // Union: all packages from any criterion
      const allPackages = new Set<EditPackage>();
      const allEntries = new Set<UndoEntry>();
      
      for (const result of successResults) {
        result.packages.forEach(p => allPackages.add(p));
        result.entries.forEach(e => allEntries.add(e));
      }
      
      return {
        status: 'success',
        packages: Array.from(allPackages),
        entries: Array.from(allEntries),
      };
    } else {
      // Intersection: only packages that match all criteria
      const firstResult = successResults[0];
      let packages = new Set(firstResult.packages);
      let entries = new Set(firstResult.entries);
      
      for (let i = 1; i < successResults.length; i++) {
        const result = successResults[i];
        const resultPackages = new Set(result.packages);
        const resultEntries = new Set(result.entries);
        
        packages = new Set([...packages].filter(p => resultPackages.has(p)));
        entries = new Set([...entries].filter(e => resultEntries.has(e)));
      }
      
      if (packages.size === 0) {
        return {
          status: 'empty',
          reason: 'No packages matched all criteria (intersection)',
        };
      }
      
      return {
        status: 'success',
        packages: Array.from(packages),
        entries: Array.from(entries),
      };
    }
  }
  
  // Helper methods
  
  private scopeMatches(packageScope: Scope, targetScope: Scope, mode: 'exact' | 'overlapping' | 'contained'): boolean {
    // Type-level match
    const pkgType = (packageScope as any).type;
    const targetType = (targetScope as any).type;
    
    if (mode === 'exact') {
      return JSON.stringify(packageScope) === JSON.stringify(targetScope);
    }
    
    if (pkgType !== targetType) {
      return false; // Different scope types never match
    }
    
    // For overlapping/contained, implement scope inclusion logic
    // This would need proper scope comparison based on actual scope types
    // Placeholder implementation:
    return pkgType === targetType;
  }
  
  private descriptionMatches(description: string, query: string, mode: 'exact' | 'contains' | 'fuzzy'): boolean {
    const desc = description.toLowerCase();
    const q = query.toLowerCase();
    
    switch (mode) {
      case 'exact':
        return desc === q;
      case 'contains':
        return desc.includes(q);
      case 'fuzzy':
        return this.fuzzyMatch(desc, q);
    }
  }
  
  private fuzzyMatch(text: string, pattern: string): boolean {
    // Simple fuzzy matching: all characters of pattern must appear in order in text
    let textIndex = 0;
    let patternIndex = 0;
    
    while (textIndex < text.length && patternIndex < pattern.length) {
      if (text[textIndex] === pattern[patternIndex]) {
        patternIndex++;
      }
      textIndex++;
    }
    
    return patternIndex === pattern.length;
  }
}

// ============================================================================
// Address Builders (Convenience Functions)
// ============================================================================

/**
 * Create address by package ID.
 */
export function addressByPackageId(packageId: string): PackageIdAddress {
  return {
    type: 'package-id',
    packageId,
  };
}

/**
 * Create address by turn index.
 */
export function addressByTurnIndex(index: number): TurnIndexAddress {
  return {
    type: 'turn-index',
    index,
  };
}

/**
 * Create address for last N turns.
 */
export function addressLastNTurns(n: number): TurnRangeAddress {
  return {
    type: 'turn-range',
    start: -n,
    end: -1,
  };
}

/**
 * Create address by scope.
 */
export function addressByScope(scope: Scope, matchMode: 'exact' | 'overlapping' | 'contained' = 'exact'): ScopeAddress {
  return {
    type: 'scope',
    scope,
    matchMode,
  };
}

/**
 * Create address by description.
 */
export function addressByDescription(query: string, matchMode: 'exact' | 'contains' | 'fuzzy' = 'contains'): DescriptionAddress {
  return {
    type: 'description',
    query,
    matchMode,
  };
}

/**
 * Create address for recent edits (last N minutes).
 */
export function addressRecentEdits(minutes: number): TimeRangeAddress {
  const now = Date.now();
  const start = now - (minutes * 60 * 1000);
  
  return {
    type: 'time-range',
    start,
    end: now,
  };
}

/**
 * Create relative address.
 */
export function addressRelative(offset: number, from: 'current' | 'latest' = 'current'): RelativeAddress {
  return {
    type: 'relative',
    offset,
    from,
  };
}

/**
 * Create composite address (intersection).
 */
export function addressIntersection(...criteria: EditPackageAddress[]): CompositeAddress {
  return {
    type: 'composite',
    criteria,
    mode: 'intersection',
  };
}

/**
 * Create composite address (union).
 */
export function addressUnion(...criteria: EditPackageAddress[]): CompositeAddress {
  return {
    type: 'composite',
    criteria,
    mode: 'union',
  };
}

// ============================================================================
// Natural Language Address Parsing
// ============================================================================

/**
 * Parse natural language query to address.
 * 
 * Examples:
 * - "the last edit" → addressByTurnIndex(-1)
 * - "the last 3 edits" → addressLastNTurns(3)
 * - "the chorus widening" → addressByDescription("chorus widening", "fuzzy")
 * - "all drum edits" → addressByDescription("drum", "contains")
 * 
 * This would integrate with the NL parser for full implementation.
 */
export function parseAddressFromNaturalLanguage(query: string): EditPackageAddress | null {
  const q = query.toLowerCase().trim();
  
  // "the last edit"
  if (q === 'the last edit' || q === 'last edit' || q === 'that') {
    return addressByTurnIndex(-1);
  }
  
  // "the last N edits"
  const lastNMatch = q.match(/(?:the )?last (\d+) edits?/);
  if (lastNMatch) {
    const n = parseInt(lastNMatch[1], 10);
    return addressLastNTurns(n);
  }
  
  // "recent edits"
  if (q === 'recent edits' || q === 'recent changes') {
    return addressRecentEdits(5); // Last 5 minutes
  }
  
  // Default: fuzzy description match
  return addressByDescription(query, 'fuzzy');
}

// ============================================================================
// Exports
// ============================================================================

export type {
  EditPackageAddress,
  PackageIdAddress,
  TurnIndexAddress,
  TurnRangeAddress,
  ScopeAddress,
  DescriptionAddress,
  TimeRangeAddress,
  RelativeAddress,
  CompositeAddress,
  AddressResolutionResult,
};

export {
  EditPackageAddressResolver,
  addressByPackageId,
  addressByTurnIndex,
  addressLastNTurns,
  addressByScope,
  addressByDescription,
  addressRecentEdits,
  addressRelative,
  addressIntersection,
  addressUnion,
  parseAddressFromNaturalLanguage,
};
