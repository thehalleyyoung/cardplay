/**
 * @fileoverview AI Query Path Profiler
 *
 * N151: Profile all AI query paths for performance
 * N152: Identify slow queries (>50ms)
 * N160: Ensure 95th percentile < 50ms for common queries
 *
 * Provides detailed profiling of AI query execution paths,
 * identifying bottlenecks and optimization opportunities.
 *
 * @module @cardplay/ai/engine/query-profiler
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Profiling session for a batch of queries.
 */
export interface ProfilingSession {
  readonly id: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly queries: QueryPathProfile[];
}

/**
 * Profile of a single query's execution path.
 */
export interface QueryPathProfile {
  readonly queryString: string;
  readonly source: string;
  readonly timestamp: number;
  readonly durationMs: number;
  readonly cached: boolean;
  readonly phases: QueryPhase[];
  readonly warnings: string[];
}

/**
 * Individual phase of query execution.
 */
export interface QueryPhase {
  readonly name: 'parse' | 'compile' | 'execute' | 'collect' | 'convert' | 'cache';
  readonly durationMs: number;
  readonly details?: Record<string, unknown>;
}

/**
 * Slow query report with optimization suggestions.
 */
export interface SlowQueryReport {
  readonly query: QueryPathProfile;
  readonly exceededBudgetBy: number;
  readonly suggestions: OptimizationSuggestion[];
}

/**
 * An optimization suggestion.
 */
export interface OptimizationSuggestion {
  readonly type: 'indexing' | 'cut' | 'memoization' | 'batching' | 'caching' | 'rewrite';
  readonly priority: 'high' | 'medium' | 'low';
  readonly description: string;
  readonly estimatedGain?: string;
}

/**
 * Query heat map entry (which predicates are called most).
 */
export interface PredicateHeatEntry {
  readonly predicate: string;
  readonly callCount: number;
  readonly totalTimeMs: number;
  readonly avgTimeMs: number;
  readonly isHot: boolean;
}

/**
 * Profiling configuration.
 */
export interface ProfilerConfig {
  /** Slow query threshold in ms (default 50) */
  readonly slowThresholdMs: number;
  /** Hot predicate threshold (call count) */
  readonly hotPredicateThreshold: number;
  /** Max profiles to keep per session */
  readonly maxProfiles: number;
  /** Whether to track phases */
  readonly trackPhases: boolean;
}

const DEFAULT_CONFIG: ProfilerConfig = {
  slowThresholdMs: 50,
  hotPredicateThreshold: 100,
  maxProfiles: 5000,
  trackPhases: true,
};

// ============================================================================
// QUERY PROFILER
// ============================================================================

/**
 * Query profiler for deep analysis of AI query performance.
 * N151: Profiles all AI query paths.
 */
class QueryProfiler {
  private config: ProfilerConfig = DEFAULT_CONFIG;
  private sessions: Map<string, ProfilingSession> = new Map();
  private activeSessionId: string | null = null;
  private profiles: QueryPathProfile[] = [];

  /**
   * Configure the profiler.
   */
  configure(config: Partial<ProfilerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Start a new profiling session.
   */
  startSession(id?: string): string {
    const sessionId = id ?? `session_${Date.now()}`;
    this.sessions.set(sessionId, {
      id: sessionId,
      startTime: Date.now(),
      queries: [],
    });
    this.activeSessionId = sessionId;
    return sessionId;
  }

  /**
   * End the current profiling session.
   */
  endSession(id?: string): ProfilingSession | null {
    const sessionId = id ?? this.activeSessionId;
    if (!sessionId) return null;

    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const completedSession: ProfilingSession = {
      ...session,
      endTime: Date.now(),
    };

    this.sessions.set(sessionId, completedSession);

    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }

    return completedSession;
  }

  /**
   * Record a query profile.
   * Called during query execution with phase timings.
   */
  recordProfile(profile: QueryPathProfile): void {
    this.profiles.push(profile);

    // Add to active session if one exists
    if (this.activeSessionId) {
      const session = this.sessions.get(this.activeSessionId);
      if (session) {
        this.sessions.set(this.activeSessionId, {
          ...session,
          queries: [...session.queries, profile],
        });
      }
    }

    // Limit stored profiles
    if (this.profiles.length > this.config.maxProfiles) {
      this.profiles = this.profiles.slice(-this.config.maxProfiles);
    }
  }

  /**
   * Create a profile from a query execution.
   * Helper for instrumented code to call.
   */
  createProfile(
    queryString: string,
    source: string,
    durationMs: number,
    cached: boolean,
    phases?: QueryPhase[]
  ): QueryPathProfile {
    const warnings: string[] = [];

    // Check for slow query
    if (durationMs > this.config.slowThresholdMs) {
      warnings.push(`Query exceeded ${this.config.slowThresholdMs}ms threshold`);
    }

    // Check for uncached repeated query
    if (!cached && this.hasRecentDuplicate(queryString)) {
      warnings.push('Uncached duplicate query detected');
    }

    return {
      queryString,
      source,
      timestamp: Date.now(),
      durationMs,
      cached,
      phases: phases ?? [],
      warnings,
    };
  }

  /**
   * Check if this query was recently executed (potential caching opportunity).
   */
  private hasRecentDuplicate(queryString: string): boolean {
    const recentWindow = 5000; // 5 seconds
    const cutoff = Date.now() - recentWindow;
    
    return this.profiles.some(
      p => p.queryString === queryString && p.timestamp > cutoff
    );
  }

  /**
   * Identify slow queries with optimization suggestions.
   * N152: Identify slow queries (>50ms).
   */
  getSlowQueries(thresholdMs?: number): SlowQueryReport[] {
    const threshold = thresholdMs ?? this.config.slowThresholdMs;
    const slowProfiles = this.profiles.filter(p => p.durationMs > threshold);

    return slowProfiles.map(query => ({
      query,
      exceededBudgetBy: query.durationMs - threshold,
      suggestions: this.generateSuggestions(query),
    }));
  }

  /**
   * Generate optimization suggestions for a slow query.
   * N153-N155: Optimization suggestions.
   */
  private generateSuggestions(profile: QueryPathProfile): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for caching opportunity
    if (!profile.cached) {
      suggestions.push({
        type: 'caching',
        priority: 'high',
        description: 'Enable query caching for this frequently-used query',
        estimatedGain: '50-90% reduction on repeated calls',
      });
    }

    // Check execution phase for optimization opportunities
    const executePhase = profile.phases.find(p => p.name === 'execute');
    if (executePhase && executePhase.durationMs > 30) {
      suggestions.push({
        type: 'indexing',
        priority: 'high',
        description: 'Add first-argument indexing to main predicate',
        estimatedGain: '30-70% faster lookups',
      });

      suggestions.push({
        type: 'cut',
        priority: 'medium',
        description: 'Add cuts after deterministic clauses to prevent backtracking',
        estimatedGain: '10-40% on deterministic queries',
      });
    }

    // Check for potential batching
    if (this.countSimilarQueries(profile.queryString) > 3) {
      suggestions.push({
        type: 'batching',
        priority: 'medium',
        description: 'Batch similar queries into a single findall/3 call',
        estimatedGain: '60-80% reduction in overhead',
      });
    }

    // Check for complex query that might benefit from rewrite
    if (profile.queryString.length > 200) {
      suggestions.push({
        type: 'rewrite',
        priority: 'low',
        description: 'Consider breaking complex query into simpler sub-queries',
        estimatedGain: 'Improved maintainability and potential speedup',
      });
    }

    // Check for memoization opportunity on pure predicates
    const predicateName = this.extractPredicate(profile.queryString);
    if (predicateName && this.isPureComputation(predicateName)) {
      suggestions.push({
        type: 'memoization',
        priority: 'medium',
        description: `Add memoization for pure predicate ${predicateName}`,
        estimatedGain: '70-95% on repeated computations',
      });
    }

    return suggestions;
  }

  /**
   * Count similar queries (same predicate) in recent history.
   */
  private countSimilarQueries(queryString: string): number {
    const predicate = this.extractPredicate(queryString);
    if (!predicate) return 0;

    const recentWindow = 1000; // 1 second
    const cutoff = Date.now() - recentWindow;

    return this.profiles.filter(p => {
      if (p.timestamp < cutoff) return false;
      return this.extractPredicate(p.queryString) === predicate;
    }).length;
  }

  /**
   * Extract predicate name from query string.
   */
  private extractPredicate(queryString: string): string | null {
    const match = queryString.match(/^(\w+)\(/);
    return match?.[1] ?? null;
  }

  /**
   * Check if a predicate is likely a pure computation (no side effects).
   */
  private isPureComputation(predicateName: string): boolean {
    // Predicates that typically are pure computations
    const purePatterns = [
      /^calculate_/,
      /^compute_/,
      /^derive_/,
      /^analyze_/,
      /^check_/,
      /^validate_/,
      /^measure_/,
      /^score_/,
    ];
    return purePatterns.some(p => p.test(predicateName));
  }

  /**
   * Get predicate heat map (which predicates are called most).
   */
  getPredicateHeatMap(): PredicateHeatEntry[] {
    const predicateMap = new Map<string, { count: number; totalMs: number }>();

    for (const profile of this.profiles) {
      const predicate = this.extractPredicate(profile.queryString);
      if (!predicate) continue;

      const existing = predicateMap.get(predicate) ?? { count: 0, totalMs: 0 };
      predicateMap.set(predicate, {
        count: existing.count + 1,
        totalMs: existing.totalMs + profile.durationMs,
      });
    }

    const entries: PredicateHeatEntry[] = [];
    for (const [predicate, stats] of predicateMap) {
      entries.push({
        predicate,
        callCount: stats.count,
        totalTimeMs: stats.totalMs,
        avgTimeMs: stats.totalMs / stats.count,
        isHot: stats.count >= this.config.hotPredicateThreshold,
      });
    }

    // Sort by total time (hottest first)
    entries.sort((a, b) => b.totalTimeMs - a.totalTimeMs);

    return entries;
  }

  /**
   * Get all profiles.
   */
  getProfiles(): QueryPathProfile[] {
    return [...this.profiles];
  }

  /**
   * Get session by ID.
   */
  getSession(id: string): ProfilingSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Get active session.
   */
  getActiveSession(): ProfilingSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) ?? null;
  }

  /**
   * Check if profiling meets performance budget.
   * N160: Ensure 95th percentile < 50ms.
   */
  checkPerformanceBudget(): { passed: boolean; p95Ms: number; violations: string[] } {
    if (this.profiles.length === 0) {
      return { passed: true, p95Ms: 0, violations: [] };
    }

    const durations = this.profiles.map(p => p.durationMs).sort((a, b) => a - b);
    const p95Index = Math.floor(durations.length * 0.95);
    const p95Ms = durations[p95Index] ?? 0;

    const violations: string[] = [];

    if (p95Ms > this.config.slowThresholdMs) {
      violations.push(
        `P95 latency (${p95Ms.toFixed(1)}ms) exceeds budget (${this.config.slowThresholdMs}ms)`
      );
    }

    // Also check for any extremely slow queries
    const extremelySlow = this.profiles.filter(p => p.durationMs > 200);
    if (extremelySlow.length > 0) {
      violations.push(`${extremelySlow.length} queries exceeded 200ms`);
    }

    return {
      passed: violations.length === 0,
      p95Ms,
      violations,
    };
  }

  /**
   * Get summary statistics.
   */
  getSummary(): {
    totalQueries: number;
    slowQueries: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    avgMs: number;
    cacheHitRate: number;
  } {
    if (this.profiles.length === 0) {
      return {
        totalQueries: 0,
        slowQueries: 0,
        p50Ms: 0,
        p95Ms: 0,
        p99Ms: 0,
        avgMs: 0,
        cacheHitRate: 0,
      };
    }

    const durations = this.profiles.map(p => p.durationMs).sort((a, b) => a - b);
    const cached = this.profiles.filter(p => p.cached).length;
    const total = durations.reduce((s, d) => s + d, 0);

    const percentile = (p: number) => durations[Math.floor(durations.length * p)] ?? 0;

    return {
      totalQueries: this.profiles.length,
      slowQueries: this.profiles.filter(p => p.durationMs > this.config.slowThresholdMs).length,
      p50Ms: percentile(0.5),
      p95Ms: percentile(0.95),
      p99Ms: percentile(0.99),
      avgMs: total / this.profiles.length,
      cacheHitRate: cached / this.profiles.length,
    };
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.profiles = [];
    this.sessions.clear();
    this.activeSessionId = null;
  }

  /**
   * Reset profiler (for testing).
   */
  reset(): void {
    this.clear();
    this.config = DEFAULT_CONFIG;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let profilerInstance: QueryProfiler | null = null;

/**
 * Get the singleton query profiler.
 */
export function getQueryProfiler(): QueryProfiler {
  if (!profilerInstance) {
    profilerInstance = new QueryProfiler();
  }
  return profilerInstance;
}

/**
 * Reset the query profiler (for testing).
 */
export function resetQueryProfiler(): void {
  profilerInstance?.reset();
  profilerInstance = null;
}

export { QueryProfiler };
