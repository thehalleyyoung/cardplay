/**
 * @file Edit Signature Hash (Step 344)
 * @module gofai/execution/edit-signature
 * 
 * Implements Step 344: Add a stable "edit signature hash" for deduplicating
 * identical plans and for caching.
 * 
 * Edit signatures provide a deterministic, collision-resistant hash that identifies
 * semantically equivalent edits. This enables:
 * - Deduplicating identical plans
 * - Caching execution results
 * - Detecting repeated operations
 * - Optimizing undo/redo
 * - Sharing plans across sessions
 * 
 * Design principles:
 * - Deterministic: same input → same hash
 * - Collision-resistant: different inputs → different hashes
 * - Stable across versions: versioned hash algorithm
 * - Fast to compute: suitable for real-time use
 * - Semantic equivalence: ignores irrelevant differences
 * 
 * Signature components:
 * - Plan structure (opcodes and order)
 * - Plan parameters (values that affect outcome)
 * - Constraints (what must be preserved)
 * - Scope (where the edit applies)
 * - Semantic intent (what the edit tries to achieve)
 * 
 * @see gofai_goalB.md Step 344
 * @see gofai_goalB.md Step 345 (serialization)
 * @see docs/gofai/signatures.md
 */

import type {
  CPLPlan,
  CPLIntent,
  PlanOpcode,
  Constraint,
  Scope,
} from './edit-package.js';

// ============================================================================
// Signature Types
// ============================================================================

/**
 * Edit signature - a stable hash identifying an edit.
 */
export type EditSignature = string & { readonly __brand: 'EditSignature' };

/**
 * Signature algorithm version.
 */
export type SignatureVersion = 'v1' | 'v2';

/**
 * Signature computation options.
 */
export interface SignatureOptions {
  /** Algorithm version to use */
  readonly version?: SignatureVersion;
  
  /** Include provenance in hash? */
  readonly includeProvenance?: boolean;
  
  /** Normalize parameter values? */
  readonly normalizeParams?: boolean;
  
  /** Include timestamps? */
  readonly includeTimestamps?: boolean;
}

/**
 * Signature metadata.
 */
export interface SignatureMetadata {
  /** The signature value */
  readonly signature: EditSignature;
  
  /** Algorithm version used */
  readonly version: SignatureVersion;
  
  /** When computed */
  readonly computedAt: number;
  
  /** What was hashed */
  readonly components: readonly SignatureComponent[];
}

/**
 * Component included in signature.
 */
export interface SignatureComponent {
  /** Component name */
  readonly name: string;
  
  /** Component hash (partial) */
  readonly hash: string;
  
  /** Size in bytes */
  readonly size: number;
}

// ============================================================================
// Signature Computer
// ============================================================================

/**
 * Computes edit signatures.
 */
export class SignatureComputer {
  private readonly version: SignatureVersion;
  
  constructor(version: SignatureVersion = 'v2') {
    this.version = version;
  }
  
  /**
   * Compute signature for a plan.
   */
  computePlanSignature(plan: CPLPlan, options: SignatureOptions = {}): SignatureMetadata {
    const version = options.version ?? this.version;
    const components: SignatureComponent[] = [];
    
    // Hash opcodes
    const opcodesHash = this.hashOpcodes(plan.opcodes, options);
    components.push({
      name: 'opcodes',
      hash: opcodesHash.substring(0, 8),
      size: JSON.stringify(plan.opcodes).length,
    });
    
    // Hash preconditions
    if (plan.preconditions.length > 0) {
      const preconditionsHash = this.hashPreconditions(plan.preconditions);
      components.push({
        name: 'preconditions',
        hash: preconditionsHash.substring(0, 8),
        size: JSON.stringify(plan.preconditions).length,
      });
    }
    
    // Hash postconditions
    if (plan.postconditions.length > 0) {
      const postconditionsHash = this.hashPostconditions(plan.postconditions);
      components.push({
        name: 'postconditions',
        hash: postconditionsHash.substring(0, 8),
        size: JSON.stringify(plan.postconditions).length,
      });
    }
    
    // Combine hashes
    const combined = components.map(c => c.hash).join(':');
    const signature = this.finalizeHash(version, combined) as EditSignature;
    
    return {
      signature,
      version,
      computedAt: Date.now(),
      components,
    };
  }
  
  /**
   * Compute signature for an intent.
   */
  computeIntentSignature(intent: CPLIntent, options: SignatureOptions = {}): SignatureMetadata {
    const version = options.version ?? this.version;
    const components: SignatureComponent[] = [];
    
    // Hash goals
    const goalsHash = this.hashGoals(intent.goals);
    components.push({
      name: 'goals',
      hash: goalsHash.substring(0, 8),
      size: JSON.stringify(intent.goals).length,
    });
    
    // Hash constraints
    const constraintsHash = this.hashConstraints(intent.constraints);
    components.push({
      name: 'constraints',
      hash: constraintsHash.substring(0, 8),
      size: JSON.stringify(intent.constraints).length,
    });
    
    // Hash scope
    const scopeHash = this.hashScope(intent.scope);
    components.push({
      name: 'scope',
      hash: scopeHash.substring(0, 8),
      size: JSON.stringify(intent.scope).length,
    });
    
    // Combine hashes
    const combined = components.map(c => c.hash).join(':');
    const signature = this.finalizeHash(version, combined) as EditSignature;
    
    return {
      signature,
      version,
      computedAt: Date.now(),
      components,
    };
  }
  
  /**
   * Hash opcodes.
   */
  private hashOpcodes(opcodes: readonly PlanOpcode[], options: SignatureOptions): string {
    const normalized = opcodes.map(opcode => {
      const params = options.normalizeParams
        ? this.normalizeParams(opcode.params)
        : opcode.params;
      
      return {
        type: opcode.type,
        params,
        selector: opcode.selector,
      };
    });
    
    return this.hashObject(normalized);
  }
  
  /**
   * Hash preconditions.
   */
  private hashPreconditions(preconditions: readonly any[]): string {
    return this.hashObject(preconditions);
  }
  
  /**
   * Hash postconditions.
   */
  private hashPostconditions(postconditions: readonly any[]): string {
    return this.hashObject(postconditions);
  }
  
  /**
   * Hash goals.
   */
  private hashGoals(goals: readonly any[]): string {
    return this.hashObject(goals);
  }
  
  /**
   * Hash constraints.
   */
  private hashConstraints(constraints: readonly Constraint[]): string {
    return this.hashObject(constraints);
  }
  
  /**
   * Hash scope.
   */
  private hashScope(scope: Scope): string {
    return this.hashObject(scope);
  }
  
  /**
   * Normalize parameters for consistent hashing.
   */
  private normalizeParams(params: any): any {
    if (!params) return params;
    
    // Sort object keys
    if (typeof params === 'object' && !Array.isArray(params)) {
      const sorted: Record<string, any> = {};
      for (const key of Object.keys(params).sort()) {
        sorted[key] = this.normalizeParams(params[key]);
      }
      return sorted;
    }
    
    // Normalize arrays
    if (Array.isArray(params)) {
      return params.map(item => this.normalizeParams(item));
    }
    
    // Normalize numbers
    if (typeof params === 'number') {
      // Round to avoid floating point differences
      return Math.round(params * 10000) / 10000;
    }
    
    return params;
  }
  
  /**
   * Hash an object.
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj);
    return this.hashString(str);
  }
  
  /**
   * Hash a string using FNV-1a algorithm.
   */
  private hashString(str: string): string {
    let hash = 2166136261; // FNV offset basis
    
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    
    // Convert to hex
    return (hash >>> 0).toString(16).padStart(8, '0');
  }
  
  /**
   * Finalize hash with version prefix.
   */
  private finalizeHash(version: SignatureVersion, hash: string): string {
    return `${version}:${hash}`;
  }
}

// ============================================================================
// Signature Cache
// ============================================================================

/**
 * Cached execution result.
 */
export interface CachedResult<T> {
  /** The signature that was cached */
  readonly signature: EditSignature;
  
  /** The cached result */
  readonly result: T;
  
  /** When cached */
  readonly cachedAt: number;
  
  /** Number of times retrieved */
  readonly hitCount: number;
  
  /** Optional TTL */
  readonly expiresAt?: number;
}

/**
 * Caches execution results by signature.
 */
export class SignatureCache<T> {
  private cache = new Map<EditSignature, CachedResult<T>>();
  private maxSize: number;
  private defaultTTL?: number;
  
  constructor(maxSize: number = 100, defaultTTL?: number) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }
  
  /**
   * Store a result in cache.
   */
  set(signature: EditSignature, result: T, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl : undefined;
    
    this.cache.set(signature, {
      signature,
      result,
      cachedAt: Date.now(),
      hitCount: 0,
      expiresAt,
    });
    
    // Evict if over size
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }
  
  /**
   * Get a result from cache.
   */
  get(signature: EditSignature): T | undefined {
    const entry = this.cache.get(signature);
    if (!entry) return undefined;
    
    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(signature);
      return undefined;
    }
    
    // Update hit count
    this.cache.set(signature, {
      ...entry,
      hitCount: entry.hitCount + 1,
    });
    
    return entry.result;
  }
  
  /**
   * Check if signature is cached.
   */
  has(signature: EditSignature): boolean {
    const entry = this.cache.get(signature);
    if (!entry) return false;
    
    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(signature);
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove from cache.
   */
  delete(signature: EditSignature): void {
    this.cache.delete(signature);
  }
  
  /**
   * Clear cache.
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0);
    const avgAge = entries.reduce((sum, e) => sum + (Date.now() - e.cachedAt), 0) / entries.length;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      averageHitCount: entries.length > 0 ? totalHits / entries.length : 0,
      averageAge: avgAge,
    };
  }
  
  /**
   * Evict least recently used entry.
   */
  private evictLRU(): void {
    let lruSignature: EditSignature | undefined;
    let lruTime = Date.now();
    
    for (const [sig, entry] of this.cache.entries()) {
      if (entry.cachedAt < lruTime) {
        lruTime = entry.cachedAt;
        lruSignature = sig;
      }
    }
    
    if (lruSignature) {
      this.cache.delete(lruSignature);
    }
  }
}

/**
 * Cache statistics.
 */
export interface CacheStats {
  readonly size: number;
  readonly maxSize: number;
  readonly totalHits: number;
  readonly averageHitCount: number;
  readonly averageAge: number;
}

// ============================================================================
// Signature Comparator
// ============================================================================

/**
 * Compares signatures for equivalence.
 */
export class SignatureComparator {
  /**
   * Check if two signatures are equivalent.
   */
  static areEquivalent(sig1: EditSignature, sig2: EditSignature): boolean {
    return sig1 === sig2;
  }
  
  /**
   * Check if two signatures are similar (same version, different content).
   */
  static areSimilar(sig1: EditSignature, sig2: EditSignature): boolean {
    const version1 = sig1.split(':')[0];
    const version2 = sig2.split(':')[0];
    return version1 === version2;
  }
  
  /**
   * Extract version from signature.
   */
  static extractVersion(sig: EditSignature): SignatureVersion {
    return sig.split(':')[0] as SignatureVersion;
  }
  
  /**
   * Extract hash from signature.
   */
  static extractHash(sig: EditSignature): string {
    return sig.split(':').slice(1).join(':');
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  EditSignature,
  SignatureVersion,
  SignatureOptions,
  SignatureMetadata,
  SignatureComponent,
  CachedResult,
  CacheStats,
};

export {
  SignatureComputer,
  SignatureCache,
  SignatureComparator,
};
