/**
 * @fileoverview AI Query Performance Monitor
 *
 * L371-L382: Performance monitoring, profiling, and budget enforcement
 * for all AI/Prolog queries. Dev-only features for debugging.
 *
 * @module @cardplay/ai/engine/perf-monitor
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * A single query performance sample.
 */
export interface QuerySample {
  readonly queryString: string;
  readonly durationMs: number;
  readonly timestamp: number;
  readonly source: string; // module that issued the query
  readonly cached: boolean;
}

/**
 * Aggregate statistics for a query pattern.
 */
export interface QueryStats {
  readonly pattern: string;
  readonly count: number;
  readonly totalMs: number;
  readonly avgMs: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly p95Ms: number;
  readonly cacheHitRate: number;
}

/**
 * Performance budget check result.
 */
export interface BudgetCheckResult {
  readonly passed: boolean;
  readonly violations: BudgetViolation[];
}

/**
 * A single budget violation.
 */
export interface BudgetViolation {
  readonly metric: string;
  readonly budget: number;
  readonly actual: number;
  readonly severity: 'warning' | 'error';
}

/**
 * Performance budgets.
 * L374: 95th percentile < 50ms for queries.
 * L377: Prolog engine < 20MB total.
 */
export interface PerformanceBudgets {
  /** Max 95th percentile query time in ms */
  readonly queryP95Ms: number;
  /** Max single query time in ms */
  readonly querySingleMaxMs: number;
  /** Max memory usage in bytes */
  readonly memoryMaxBytes: number;
}

const DEFAULT_BUDGETS: PerformanceBudgets = {
  queryP95Ms: 50,
  querySingleMaxMs: 200,
  memoryMaxBytes: 20 * 1024 * 1024, // 20MB
};

// ============================================================================
// PERFORMANCE MONITOR
// ============================================================================

/**
 * Performance monitor for AI queries.
 * L373: Performance monitoring for all AI queries.
 */
class PerfMonitor {
  private samples: QuerySample[] = [];
  private enabled = false;
  private maxSamples = 10000;
  private budgets: PerformanceBudgets = DEFAULT_BUDGETS;

  /**
   * Enable performance monitoring (dev-only).
   * L379: Developer tools for KB debugging.
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable performance monitoring.
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if monitoring is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Record a query execution.
   * L373: Performance monitoring entry point.
   */
  record(sample: QuerySample): void {
    if (!this.enabled) return;

    this.samples.push(sample);

    // Evict oldest samples if over limit
    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }

    // L380: Log slow queries (dev-only)
    if (sample.durationMs > this.budgets.querySingleMaxMs) {
      console.warn(
        `[PerfMonitor] Slow query (${sample.durationMs.toFixed(1)}ms): ${sample.queryString.slice(0, 80)}`
      );
    }
  }

  /**
   * Get aggregate statistics grouped by query pattern.
   * L371: Profile all AI query paths.
   */
  getStats(): QueryStats[] {
    const groups = new Map<string, QuerySample[]>();

    for (const sample of this.samples) {
      // Normalize query to a pattern (strip numbers and specific atoms)
      const pattern = sample.queryString
        .replace(/\d+/g, 'N')
        .replace(/'[^']*'/g, "'...'")
        .slice(0, 100);

      const group = groups.get(pattern) ?? [];
      group.push(sample);
      groups.set(pattern, group);
    }

    const stats: QueryStats[] = [];

    for (const [pattern, group] of groups) {
      const durations = group.map((s) => s.durationMs).sort((a, b) => a - b);
      const cacheHits = group.filter((s) => s.cached).length;

      stats.push({
        pattern,
        count: group.length,
        totalMs: durations.reduce((s, d) => s + d, 0),
        avgMs: durations.reduce((s, d) => s + d, 0) / durations.length,
        minMs: durations[0] ?? 0,
        maxMs: durations[durations.length - 1] ?? 0,
        p95Ms: durations[Math.floor(durations.length * 0.95)] ?? 0,
        cacheHitRate: group.length > 0 ? cacheHits / group.length : 0,
      });
    }

    // Sort by total time descending (hottest queries first)
    stats.sort((a, b) => b.totalMs - a.totalMs);

    return stats;
  }

  /**
   * Get slow queries (above budget).
   * L372: Identify slow predicates.
   */
  getSlowQueries(thresholdMs?: number): QuerySample[] {
    const threshold = thresholdMs ?? this.budgets.querySingleMaxMs;
    return this.samples.filter((s) => s.durationMs > threshold);
  }

  /**
   * Check all performance budgets.
   * L374: Performance budget enforcement.
   */
  checkBudgets(): BudgetCheckResult {
    const violations: BudgetViolation[] = [];

    // Check p95 query time
    if (this.samples.length > 0) {
      const sorted = [...this.samples].sort((a, b) => a.durationMs - b.durationMs);
      const p95 = sorted[Math.floor(sorted.length * 0.95)]?.durationMs ?? 0;

      if (p95 > this.budgets.queryP95Ms) {
        violations.push({
          metric: 'query_p95',
          budget: this.budgets.queryP95Ms,
          actual: p95,
          severity: p95 > this.budgets.queryP95Ms * 2 ? 'error' : 'warning',
        });
      }
    }

    // Check single query max
    const maxQuery = this.samples.reduce(
      (max, s) => (s.durationMs > max ? s.durationMs : max),
      0
    );
    if (maxQuery > this.budgets.querySingleMaxMs) {
      violations.push({
        metric: 'query_single_max',
        budget: this.budgets.querySingleMaxMs,
        actual: maxQuery,
        severity: 'warning',
      });
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  /**
   * Get which KB rules are actually being queried (coverage).
   * L381: KB coverage reporting.
   */
  getPredicateCoverage(): Map<string, number> {
    const coverage = new Map<string, number>();

    for (const sample of this.samples) {
      // Extract predicate name from query
      const match = sample.queryString.match(/^(\w+)\(/);
      if (match?.[1]) {
        coverage.set(match[1], (coverage.get(match[1]) ?? 0) + 1);
      }
    }

    return coverage;
  }

  /**
   * Get total sample count.
   */
  getSampleCount(): number {
    return this.samples.length;
  }

  /**
   * Set custom budgets.
   */
  setBudgets(budgets: Partial<PerformanceBudgets>): void {
    this.budgets = { ...this.budgets, ...budgets };
  }

  /**
   * Clear all recorded samples.
   */
  clear(): void {
    this.samples = [];
  }

  /**
   * Reset monitor (for testing).
   */
  reset(): void {
    this.samples = [];
    this.enabled = false;
    this.budgets = DEFAULT_BUDGETS;
  }

  /**
   * Format a human-readable performance report.
   * L379: Developer tools for KB debugging.
   */
  formatReport(): string {
    const lines: string[] = [];
    lines.push('=== AI Performance Report ===');
    lines.push(`Total queries: ${this.samples.length}`);

    if (this.samples.length === 0) {
      lines.push('No queries recorded.');
      return lines.join('\n');
    }

    const stats = this.getStats();
    const budget = this.checkBudgets();

    lines.push(`Unique patterns: ${stats.length}`);
    lines.push(`Budget: ${budget.passed ? 'PASSED' : 'FAILED'}`);

    if (!budget.passed) {
      for (const v of budget.violations) {
        lines.push(`  [${v.severity}] ${v.metric}: ${v.actual.toFixed(1)}ms (budget: ${v.budget}ms)`);
      }
    }

    lines.push('');
    lines.push('Top queries by total time:');
    for (const stat of stats.slice(0, 10)) {
      lines.push(
        `  ${stat.pattern.slice(0, 60).padEnd(60)} ` +
          `count=${stat.count} avg=${stat.avgMs.toFixed(1)}ms p95=${stat.p95Ms.toFixed(1)}ms`
      );
    }

    const slow = this.getSlowQueries();
    if (slow.length > 0) {
      lines.push('');
      lines.push(`Slow queries (>${this.budgets.querySingleMaxMs}ms): ${slow.length}`);
      for (const s of slow.slice(0, 5)) {
        lines.push(`  ${s.durationMs.toFixed(1)}ms: ${s.queryString.slice(0, 80)}`);
      }
    }

    return lines.join('\n');
  }
}

// Singleton
let monitorInstance: PerfMonitor | null = null;

/**
 * Get the singleton performance monitor.
 */
export function getPerfMonitor(): PerfMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerfMonitor();
  }
  return monitorInstance;
}

/**
 * Reset the performance monitor (for testing).
 */
export function resetPerfMonitor(): void {
  monitorInstance?.reset();
  monitorInstance = null;
}

export { PerfMonitor };
