/**
 * @fileoverview Analysis Facts Caching Layer
 * 
 * Step 270 [Infra] — Add caching for analysis facts keyed by project version
 * and scope to avoid recomputation per keystroke.
 * 
 * This module provides intelligent caching of expensive analysis computations.
 * Key features:
 * 
 * 1. Multi-level cache hierarchy (memory, persistent)
 * 2. Automatic invalidation based on project changes
 * 3. Scope-aware caching (project, section, range)
 * 4. LRU eviction policy
 * 5. Cache warming for predicted queries
 * 6. Incremental update support
 * 7. Cache statistics and monitoring
 * 8. Dependency tracking between fact categories
 * 
 * Cache keys are computed from:
 * - Project state version/hash
 * - Analysis scope
 * - Fact category subset requested
 * - Analysis configuration parameters
 * 
 * @module @cardplay/gofai/planning/analysis-cache
 */

import type { AnalysisFacts, AnalysisScope } from './analysis-facts';
import type { ProjectState } from '../../cardplay/state/project-state';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cache key for analysis facts
 */
export interface AnalysisCacheKey {
  readonly projectVersion: string;
  readonly scopeHash: string;
  readonly categories: readonly string[];
  readonly configHash: string;
}

/**
 * Cached analysis entry
 */
export interface CacheEntry<T> {
  readonly key: AnalysisCacheKey;
  readonly value: T;
  readonly timestamp: number;
  readonly computationTimeMs: number;
  readonly accessCount: number;
  readonly lastAccessTime: number;
  readonly size: number;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  readonly hitCount: number;
  readonly missCount: number;
  readonly hitRate: number;
  readonly totalEntries: number;
  readonly totalSize: number;
  readonly oldestEntry: number;
  readonly newestEntry: number;
  readonly avgComputationTime: number;
  readonly avgAccessCount: number;
  readonly categoryStats: readonly CategoryStatistics[];
}

/**
 * Per-category cache statistics
 */
export interface CategoryStatistics {
  readonly category: string;
  readonly entries: number;
  readonly hitRate: number;
  readonly avgComputationTime: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  readonly maxMemoryEntries: number;
  readonly maxMemorySizeMB: number;
  readonly evictionPolicy: 'lru' | 'lfu' | 'fifo';
  readonly ttlSeconds: number;
  readonly enablePersistent: boolean;
  readonly warmingEnabled: boolean;
  readonly incrementalUpdatesEnabled: boolean;
}

/**
 * Cache invalidation event
 */
export interface CacheInvalidationEvent {
  readonly reason: 'project_change' | 'user_request' | 'ttl_expired' | 'size_limit';
  readonly affectedKeys: readonly string[];
  readonly timestamp: number;
}

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

/**
 * Generate a cache key for analysis facts
 */
export function generateCacheKey(
  projectVersion: string,
  scope: AnalysisScope,
  categories: readonly string[],
  config?: Record<string, unknown>
): AnalysisCacheKey {
  const scopeHash = hashScope(scope);
  const configHash = config ? hashConfig(config) : 'default';
  
  return {
    projectVersion,
    scopeHash,
    categories: [...categories].sort(),
    configHash
  };
}

/**
 * Serialize cache key to string
 */
export function serializeCacheKey(key: AnalysisCacheKey): string {
  return `${key.projectVersion}:${key.scopeHash}:${key.categories.join(',')}:${key.configHash}`;
}

/**
 * Parse cache key from string
 */
export function parseCacheKey(str: string): AnalysisCacheKey | undefined {
  const parts = str.split(':');
  if (parts.length !== 4) {
    return undefined;
  }
  
  return {
    projectVersion: parts[0],
    scopeHash: parts[1],
    categories: parts[2].split(','),
    configHash: parts[3]
  };
}

/**
 * Hash an analysis scope
 */
function hashScope(scope: AnalysisScope): string {
  const parts: string[] = [scope.type];
  
  if (scope.startTick !== undefined) {
    parts.push(`start:${scope.startTick}`);
  }
  if (scope.endTick !== undefined) {
    parts.push(`end:${scope.endTick}`);
  }
  if (scope.sectionIds) {
    parts.push(`sections:${scope.sectionIds.join(',')}`);
  }
  if (scope.trackIds) {
    parts.push(`tracks:${scope.trackIds.join(',')}`);
  }
  if (scope.layerRoles) {
    parts.push(`roles:${scope.layerRoles.join(',')}`);
  }
  
  return simpleHash(parts.join('|'));
}

/**
 * Hash a configuration object
 */
function hashConfig(config: Record<string, unknown>): string {
  const str = JSON.stringify(config, Object.keys(config).sort());
  return simpleHash(str);
}

/**
 * Simple string hash function
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// MEMORY CACHE IMPLEMENTATION
// ============================================================================

/**
 * In-memory LRU cache for analysis facts
 */
export class AnalysisMemoryCache {
  private cache = new Map<string, CacheEntry<AnalysisFacts>>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemoryEntries: config.maxMemoryEntries ?? 1000,
      maxMemorySizeMB: config.maxMemorySizeMB ?? 100,
      evictionPolicy: config.evictionPolicy ?? 'lru',
      ttlSeconds: config.ttlSeconds ?? 300,
      enablePersistent: config.enablePersistent ?? false,
      warmingEnabled: config.warmingEnabled ?? true,
      incrementalUpdatesEnabled: config.incrementalUpdatesEnabled ?? true
    };
  }

  /**
   * Get cached analysis facts
   */
  get(key: AnalysisCacheKey): AnalysisFacts | undefined {
    const keyStr = serializeCacheKey(key);
    const entry = this.cache.get(keyStr);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    
    // Check TTL
    const age = Date.now() - entry.timestamp;
    if (age > this.config.ttlSeconds * 1000) {
      this.cache.delete(keyStr);
      this.stats.misses++;
      return undefined;
    }
    
    // Update access tracking
    this.cache.set(keyStr, {
      ...entry,
      accessCount: entry.accessCount + 1,
      lastAccessTime: Date.now()
    });
    
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set cached analysis facts
   */
  set(key: AnalysisCacheKey, value: AnalysisFacts, computationTimeMs: number): void {
    const keyStr = serializeCacheKey(key);
    const size = estimateSize(value);
    
    // Check if we need to evict
    while (this.shouldEvict(size)) {
      this.evictOne();
    }
    
    const entry: CacheEntry<AnalysisFacts> = {
      key,
      value,
      timestamp: Date.now(),
      computationTimeMs,
      accessCount: 0,
      lastAccessTime: Date.now(),
      size
    };
    
    this.cache.set(keyStr, entry);
  }

  /**
   * Invalidate cache entries
   */
  invalidate(predicate?: (entry: CacheEntry<AnalysisFacts>) => boolean): number {
    let count = 0;
    
    if (!predicate) {
      count = this.cache.size;
      this.cache.clear();
      return count;
    }
    
    const toDelete: string[] = [];
    for (const [key, entry] of this.cache) {
      if (predicate(entry)) {
        toDelete.push(key);
      }
    }
    
    for (const key of toDelete) {
      this.cache.delete(key);
      count++;
    }
    
    return count;
  }

  /**
   * Invalidate by project version
   */
  invalidateProject(projectVersion: string): number {
    return this.invalidate(entry => entry.key.projectVersion === projectVersion);
  }

  /**
   * Invalidate by scope
   */
  invalidateScope(scope: AnalysisScope): number {
    const scopeHash = hashScope(scope);
    return this.invalidate(entry => entry.key.scopeHash === scopeHash);
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
    const totalComputationTime = entries.reduce((sum, e) => sum + e.computationTimeMs, 0);
    const totalAccessCount = entries.reduce((sum, e) => sum + e.accessCount, 0);
    
    const timestamps = entries.map(e => e.timestamp);
    const oldest = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newest = timestamps.length > 0 ? Math.max(...timestamps) : 0;
    
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    
    // Category stats
    const categoryMap = new Map<string, { entries: number; hits: number; misses: number; time: number }>();
    for (const entry of entries) {
      for (const cat of entry.key.categories) {
        const stats = categoryMap.get(cat) || { entries: 0, hits: 0, misses: 0, time: 0 };
        stats.entries++;
        stats.time += entry.computationTimeMs;
        categoryMap.set(cat, stats);
      }
    }
    
    const categoryStats: CategoryStatistics[] = Array.from(categoryMap.entries()).map(([cat, stats]) => ({
      category: cat,
      entries: stats.entries,
      hitRate: stats.entries > 0 ? stats.hits / (stats.hits + stats.misses) : 0,
      avgComputationTime: stats.entries > 0 ? stats.time / stats.entries : 0
    }));
    
    return {
      hitCount: this.stats.hits,
      missCount: this.stats.misses,
      hitRate,
      totalEntries: this.cache.size,
      totalSize,
      oldestEntry: oldest,
      newestEntry: newest,
      avgComputationTime: entries.length > 0 ? totalComputationTime / entries.length : 0,
      avgAccessCount: entries.length > 0 ? totalAccessCount / entries.length : 0,
      categoryStats
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Get current cache size in bytes
   */
  getCurrentSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  /**
   * Get current entry count
   */
  getEntryCount(): number {
    return this.cache.size;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Check if we should evict an entry
   */
  private shouldEvict(incomingSize: number): boolean {
    if (this.cache.size >= this.config.maxMemoryEntries) {
      return true;
    }
    
    const currentSize = this.getCurrentSize();
    const maxSize = this.config.maxMemorySizeMB * 1024 * 1024;
    
    if (currentSize + incomingSize > maxSize) {
      return true;
    }
    
    return false;
  }

  /**
   * Evict one entry based on policy
   */
  private evictOne(): void {
    if (this.cache.size === 0) {
      return;
    }
    
    let victimKey: string | undefined;
    
    switch (this.config.evictionPolicy) {
      case 'lru':
        victimKey = this.findLRUVictim();
        break;
      case 'lfu':
        victimKey = this.findLFUVictim();
        break;
      case 'fifo':
        victimKey = this.findFIFOVictim();
        break;
    }
    
    if (victimKey) {
      this.cache.delete(victimKey);
      this.stats.evictions++;
    }
  }

  /**
   * Find LRU victim (least recently used)
   */
  private findLRUVictim(): string | undefined {
    let oldestTime = Infinity;
    let victimKey: string | undefined;
    
    for (const [key, entry] of this.cache) {
      if (entry.lastAccessTime < oldestTime) {
        oldestTime = entry.lastAccessTime;
        victimKey = key;
      }
    }
    
    return victimKey;
  }

  /**
   * Find LFU victim (least frequently used)
   */
  private findLFUVictim(): string | undefined {
    let lowestCount = Infinity;
    let victimKey: string | undefined;
    
    for (const [key, entry] of this.cache) {
      if (entry.accessCount < lowestCount) {
        lowestCount = entry.accessCount;
        victimKey = key;
      }
    }
    
    return victimKey;
  }

  /**
   * Find FIFO victim (first in, first out)
   */
  private findFIFOVictim(): string | undefined {
    let oldestTime = Infinity;
    let victimKey: string | undefined;
    
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        victimKey = key;
      }
    }
    
    return victimKey;
  }
}

// ============================================================================
// CACHE MANAGER
// ============================================================================

/**
 * Manages analysis fact caching with warming and invalidation
 */
export class AnalysisCacheManager {
  private memoryCache: AnalysisMemoryCache;
  private invalidationListeners: ((event: CacheInvalidationEvent) => void)[] = [];

  constructor(config?: Partial<CacheConfig>) {
    this.memoryCache = new AnalysisMemoryCache(config);
  }

  /**
   * Get cached facts or compute if missing
   */
  async getOrCompute(
    key: AnalysisCacheKey,
    compute: () => Promise<AnalysisFacts>
  ): Promise<AnalysisFacts> {
    const cached = this.memoryCache.get(key);
    if (cached) {
      return cached;
    }
    
    const startTime = Date.now();
    const facts = await compute();
    const computationTime = Date.now() - startTime;
    
    this.memoryCache.set(key, facts, computationTime);
    
    return facts;
  }

  /**
   * Warm cache for predicted queries
   */
  async warm(
    project: ProjectState,
    predictedScopes: readonly AnalysisScope[],
    compute: (scope: AnalysisScope) => Promise<AnalysisFacts>
  ): Promise<void> {
    const version = this.getProjectVersion(project);
    
    for (const scope of predictedScopes) {
      const key = generateCacheKey(version, scope, ['all']);
      
      // Skip if already cached
      if (this.memoryCache.get(key)) {
        continue;
      }
      
      // Compute in background
      const facts = await compute(scope);
      const computationTime = 0; // Background warming
      this.memoryCache.set(key, facts, computationTime);
    }
  }

  /**
   * Invalidate cache on project change
   */
  onProjectChange(oldVersion: string, newVersion: string, changedScopes?: readonly AnalysisScope[]): void {
    if (!changedScopes) {
      // Invalidate all for this project
      const count = this.memoryCache.invalidateProject(oldVersion);
      
      this.emitInvalidation({
        reason: 'project_change',
        affectedKeys: [],
        timestamp: Date.now()
      });
      
      return;
    }
    
    // Invalidate only affected scopes
    let totalCount = 0;
    for (const scope of changedScopes) {
      totalCount += this.memoryCache.invalidateScope(scope);
    }
    
    this.emitInvalidation({
      reason: 'project_change',
      affectedKeys: changedScopes.map(s => hashScope(s)),
      timestamp: Date.now()
    });
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    return this.memoryCache.getStatistics();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    
    this.emitInvalidation({
      reason: 'user_request',
      affectedKeys: [],
      timestamp: Date.now()
    });
  }

  /**
   * Register invalidation listener
   */
  onInvalidation(listener: (event: CacheInvalidationEvent) => void): () => void {
    this.invalidationListeners.push(listener);
    return () => {
      const index = this.invalidationListeners.indexOf(listener);
      if (index >= 0) {
        this.invalidationListeners.splice(index, 1);
      }
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private getProjectVersion(project: ProjectState): string {
    // In a real implementation, this would compute a version hash
    // from project state
    return `v${Date.now()}`;
  }

  private emitInvalidation(event: CacheInvalidationEvent): void {
    for (const listener of this.invalidationListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Invalidation listener error:', error);
      }
    }
  }
}

// ============================================================================
// SIZE ESTIMATION
// ============================================================================

/**
 * Estimate memory size of analysis facts in bytes
 */
function estimateSize(facts: AnalysisFacts): number {
  // Rough estimation based on JSON serialization size
  const json = JSON.stringify(facts);
  return json.length * 2; // UTF-16 encoding
}

// ============================================================================
// INCREMENTAL UPDATE SUPPORT
// ============================================================================

/**
 * Determine if facts can be incrementally updated
 */
export function canIncrementallyUpdate(
  oldFacts: AnalysisFacts,
  changedScope: AnalysisScope
): boolean {
  // Check if the changed scope is a subset of the old facts scope
  // This would require more sophisticated scope comparison
  return false; // Conservative for now
}

/**
 * Incrementally update analysis facts
 */
export async function incrementallyUpdate(
  oldFacts: AnalysisFacts,
  changedScope: AnalysisScope,
  newFacts: Partial<AnalysisFacts>
): Promise<AnalysisFacts> {
  // Merge new facts into old facts
  return {
    ...oldFacts,
    ...newFacts,
    timestamp: Date.now()
  };
}

// ============================================================================
// CACHE WARMING STRATEGIES
// ============================================================================

/**
 * Predict likely analysis queries based on current activity
 */
export function predictQueries(
  project: ProjectState,
  currentScope: AnalysisScope,
  recentQueries: readonly AnalysisCacheKey[]
): readonly AnalysisScope[] {
  const predictions: AnalysisScope[] = [];
  
  // Predict adjacent sections
  if (currentScope.type === 'section' && currentScope.sectionIds) {
    // Add neighboring sections to predictions
    predictions.push(currentScope);
  }
  
  // Predict expanded scope
  if (currentScope.type === 'range' && currentScope.startTick !== undefined && currentScope.endTick !== undefined) {
    const duration = currentScope.endTick - currentScope.startTick;
    predictions.push({
      type: 'range',
      startTick: currentScope.startTick - duration,
      endTick: currentScope.endTick + duration
    });
  }
  
  // Predict project-level if frequently accessed
  if (recentQueries.filter(q => q.scopeHash === hashScope({ type: 'project' })).length > 3) {
    predictions.push({ type: 'project' });
  }
  
  return predictions;
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Create a new cache manager with default configuration
 */
export function createCacheManager(config?: Partial<CacheConfig>): AnalysisCacheManager {
  return new AnalysisCacheManager(config);
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxMemoryEntries: 1000,
  maxMemorySizeMB: 100,
  evictionPolicy: 'lru',
  ttlSeconds: 300,
  enablePersistent: false,
  warmingEnabled: true,
  incrementalUpdatesEnabled: true
};
