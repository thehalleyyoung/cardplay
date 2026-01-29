/**
 * @fileoverview Query Profiling Tools (Dev-Only)
 *
 * N163: Add query profiling tools (dev-only)
 *
 * Comprehensive developer tools for profiling, analyzing, and optimizing
 * AI query performance. Includes:
 * - Interactive profiling sessions
 * - Comparison benchmarks
 * - Optimization recommendations
 * - Memory analysis integration
 *
 * @module @cardplay/ai/engine/profiling-tools
 */

import { 
  getQueryProfiler, 
  type SlowQueryReport,
  type PredicateHeatEntry,
  type OptimizationSuggestion,
} from './query-profiler';
import { getSlowQueryLogger } from './slow-query-logger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Benchmark result comparing before/after optimization.
 */
export interface BenchmarkComparison {
  readonly name: string;
  readonly iterations: number;
  readonly before: BenchmarkMetrics;
  readonly after: BenchmarkMetrics;
  readonly improvement: {
    readonly avgMs: number;
    readonly p95Ms: number;
    readonly throughput: number;
  };
}

/**
 * Metrics from a benchmark run.
 */
export interface BenchmarkMetrics {
  readonly avgMs: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly stdDevMs: number;
  readonly throughputQps: number;
}

/**
 * Comprehensive optimization report.
 */
export interface OptimizationReport {
  readonly generatedAt: string;
  readonly sessionDuration: number;
  readonly queryCount: number;
  readonly slowQueryCount: number;
  readonly budgetStatus: 'passed' | 'warning' | 'failed';
  readonly topSlowQueries: SlowQueryReport[];
  readonly hotPredicates: PredicateHeatEntry[];
  readonly allSuggestions: RankedSuggestion[];
  readonly estimatedTimeToFix: string;
}

/**
 * Suggestion with priority ranking.
 */
export interface RankedSuggestion {
  readonly rank: number;
  readonly suggestion: OptimizationSuggestion;
  readonly affectedQueries: number;
  readonly potentialGain: string;
}

/**
 * Query comparison result.
 */
export interface QueryComparison {
  readonly query: string;
  readonly runCount: number;
  readonly durations: number[];
  readonly avgMs: number;
  readonly stdDevMs: number;
  readonly isConsistent: boolean;
}

/**
 * Regression detection result.
 */
export interface RegressionResult {
  readonly hasRegressions: boolean;
  readonly regressions: QueryRegression[];
}

/**
 * A detected performance regression.
 */
export interface QueryRegression {
  readonly query: string;
  readonly baselineAvgMs: number;
  readonly currentAvgMs: number;
  readonly degradationPercent: number;
  readonly severity: 'minor' | 'moderate' | 'severe';
}

/**
 * Memory usage snapshot.
 */
export interface MemorySnapshot {
  readonly timestamp: number;
  readonly heapUsed: number;
  readonly heapTotal: number;
  readonly external: number;
  readonly arrayBuffers: number;
  readonly queryCount: number;
}

// ============================================================================
// PROFILING TOOLS
// ============================================================================

/**
 * Developer profiling tools for AI queries.
 * N163: Query profiling tools (dev-only).
 */
class ProfilingTools {
  private baselines: Map<string, BenchmarkMetrics> = new Map();
  private memorySnapshots: MemorySnapshot[] = [];
  private maxSnapshots = 1000;

  /**
   * Run a benchmark comparing before/after performance.
   */
  async runBenchmarkComparison(
    name: string,
    beforeFn: () => Promise<void>,
    afterFn: () => Promise<void>,
    iterations = 100
  ): Promise<BenchmarkComparison> {
    // Run before benchmark
    const beforeMetrics = await this.runBenchmark(beforeFn, iterations);

    // Run after benchmark
    const afterMetrics = await this.runBenchmark(afterFn, iterations);

    return {
      name,
      iterations,
      before: beforeMetrics,
      after: afterMetrics,
      improvement: {
        avgMs: ((beforeMetrics.avgMs - afterMetrics.avgMs) / beforeMetrics.avgMs) * 100,
        p95Ms: ((beforeMetrics.p95Ms - afterMetrics.p95Ms) / beforeMetrics.p95Ms) * 100,
        throughput: ((afterMetrics.throughputQps - beforeMetrics.throughputQps) / beforeMetrics.throughputQps) * 100,
      },
    };
  }

  /**
   * Run a simple benchmark.
   */
  async runBenchmark(fn: () => Promise<void>, iterations = 100): Promise<BenchmarkMetrics> {
    const durations: number[] = [];
    const startTotal = performance.now();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      durations.push(performance.now() - start);
    }

    const totalTime = performance.now() - startTotal;

    return this.calculateMetrics(durations, totalTime);
  }

  /**
   * Calculate benchmark metrics from durations.
   */
  private calculateMetrics(durations: number[], totalTimeMs: number): BenchmarkMetrics {
    if (durations.length === 0) {
      return {
        avgMs: 0,
        minMs: 0,
        maxMs: 0,
        p50Ms: 0,
        p95Ms: 0,
        p99Ms: 0,
        stdDevMs: 0,
        throughputQps: 0,
      };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const sum = sorted.reduce((s, d) => s + d, 0);
    const avg = sum / sorted.length;

    // Calculate standard deviation
    const sqDiffs = sorted.map(d => (d - avg) ** 2);
    const avgSqDiff = sqDiffs.reduce((s, d) => s + d, 0) / sqDiffs.length;
    const stdDev = Math.sqrt(avgSqDiff);

    const percentile = (p: number) => sorted[Math.floor(sorted.length * p)] ?? 0;

    return {
      avgMs: avg,
      minMs: sorted[0] ?? 0,
      maxMs: sorted[sorted.length - 1] ?? 0,
      p50Ms: percentile(0.5),
      p95Ms: percentile(0.95),
      p99Ms: percentile(0.99),
      stdDevMs: stdDev,
      throughputQps: (durations.length / totalTimeMs) * 1000,
    };
  }

  /**
   * Save current metrics as a baseline for regression detection.
   */
  saveBaseline(name: string): void {
    const profiler = getQueryProfiler();
    const summary = profiler.getSummary();

    this.baselines.set(name, {
      avgMs: summary.avgMs,
      minMs: summary.p50Ms, // Use p50 as proxy for min
      maxMs: summary.p99Ms, // Use p99 as proxy for max
      p50Ms: summary.p50Ms,
      p95Ms: summary.p95Ms,
      p99Ms: summary.p99Ms,
      stdDevMs: 0, // Not tracked in summary
      throughputQps: 1000 / summary.avgMs, // Estimate
    });
  }

  /**
   * Get baseline by name.
   */
  getBaseline(name: string): BenchmarkMetrics | undefined {
    return this.baselines.get(name);
  }

  /**
   * Detect performance regressions against baseline.
   * N165: No performance regressions test support.
   */
  detectRegressions(baselineName: string, thresholdPercent = 20): RegressionResult {
    const baseline = this.baselines.get(baselineName);
    if (!baseline) {
      return { hasRegressions: false, regressions: [] };
    }

    const profiler = getQueryProfiler();
    const summary = profiler.getSummary();
    const regressions: QueryRegression[] = [];

    // Check average time
    const avgDegradation = ((summary.avgMs - baseline.avgMs) / baseline.avgMs) * 100;
    if (avgDegradation > thresholdPercent) {
      regressions.push({
        query: 'overall_average',
        baselineAvgMs: baseline.avgMs,
        currentAvgMs: summary.avgMs,
        degradationPercent: avgDegradation,
        severity: avgDegradation > 50 ? 'severe' : avgDegradation > 30 ? 'moderate' : 'minor',
      });
    }

    // Check P95
    const p95Degradation = ((summary.p95Ms - baseline.p95Ms) / baseline.p95Ms) * 100;
    if (p95Degradation > thresholdPercent) {
      regressions.push({
        query: 'p95_latency',
        baselineAvgMs: baseline.p95Ms,
        currentAvgMs: summary.p95Ms,
        degradationPercent: p95Degradation,
        severity: p95Degradation > 50 ? 'severe' : p95Degradation > 30 ? 'moderate' : 'minor',
      });
    }

    return {
      hasRegressions: regressions.length > 0,
      regressions,
    };
  }

  /**
   * Generate comprehensive optimization report.
   */
  generateOptimizationReport(): OptimizationReport {
    const profiler = getQueryProfiler();
    const summary = profiler.getSummary();
    const slowQueries = profiler.getSlowQueries();
    const heatMap = profiler.getPredicateHeatMap();
    const budgetCheck = profiler.checkPerformanceBudget();

    // Rank all suggestions by impact
    const suggestionMap = new Map<string, { suggestion: OptimizationSuggestion; count: number }>();
    for (const report of slowQueries) {
      for (const suggestion of report.suggestions) {
        const key = `${suggestion.type}:${suggestion.description}`;
        const existing = suggestionMap.get(key);
        if (existing) {
          suggestionMap.set(key, { ...existing, count: existing.count + 1 });
        } else {
          suggestionMap.set(key, { suggestion, count: 1 });
        }
      }
    }

    const rankedSuggestions: RankedSuggestion[] = [...suggestionMap.values()]
      .map((s, idx) => ({
        rank: idx + 1,
        suggestion: s.suggestion,
        affectedQueries: s.count,
        potentialGain: s.suggestion.estimatedGain ?? 'Unknown',
      }))
      .sort((a, b) => {
        // Sort by priority then by affected count
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.suggestion.priority] - priorityOrder[b.suggestion.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.affectedQueries - a.affectedQueries;
      })
      .map((s, idx) => ({ ...s, rank: idx + 1 }));

    // Estimate time to fix
    const highPriority = rankedSuggestions.filter(s => s.suggestion.priority === 'high').length;
    const mediumPriority = rankedSuggestions.filter(s => s.suggestion.priority === 'medium').length;
    const estimatedMinutes = highPriority * 30 + mediumPriority * 15;
    const estimatedTime = estimatedMinutes < 60
      ? `${estimatedMinutes} minutes`
      : `${Math.round(estimatedMinutes / 60)} hours`;

    return {
      generatedAt: new Date().toISOString(),
      sessionDuration: Date.now() - (profiler.getActiveSession()?.startTime ?? Date.now()),
      queryCount: summary.totalQueries,
      slowQueryCount: summary.slowQueries,
      budgetStatus: budgetCheck.passed ? 'passed' : slowQueries.length > 10 ? 'failed' : 'warning',
      topSlowQueries: slowQueries.slice(0, 10),
      hotPredicates: heatMap.filter(h => h.isHot).slice(0, 10),
      allSuggestions: rankedSuggestions,
      estimatedTimeToFix: estimatedTime,
    };
  }

  /**
   * Compare query consistency (variance over multiple runs).
   */
  async analyzeQueryConsistency(
    queryFn: () => Promise<void>,
    iterations = 50
  ): Promise<QueryComparison> {
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await queryFn();
      durations.push(performance.now() - start);
    }

    const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
    const sqDiffs = durations.map(d => (d - avg) ** 2);
    const stdDev = Math.sqrt(sqDiffs.reduce((s, d) => s + d, 0) / sqDiffs.length);

    // Query is consistent if std dev is less than 20% of average
    const isConsistent = stdDev < avg * 0.2;

    return {
      query: 'manual_benchmark',
      runCount: iterations,
      durations,
      avgMs: avg,
      stdDevMs: stdDev,
      isConsistent,
    };
  }

  /**
   * Take a memory snapshot.
   * N166-N174: Memory profiling support.
   */
  takeMemorySnapshot(): MemorySnapshot | null {
    // Check if we're in Node.js environment with process.memoryUsage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      const profiler = getQueryProfiler();
      const summary = profiler.getSummary();

      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external,
        arrayBuffers: mem.arrayBuffers ?? 0,
        queryCount: summary.totalQueries,
      };

      this.memorySnapshots.push(snapshot);
      if (this.memorySnapshots.length > this.maxSnapshots) {
        this.memorySnapshots = this.memorySnapshots.slice(-this.maxSnapshots);
      }

      return snapshot;
    }

    // Browser environment - use performance.memory if available
    const perf = performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } };
    if (perf.memory) {
      const profiler = getQueryProfiler();
      const summary = profiler.getSummary();

      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        heapUsed: perf.memory.usedJSHeapSize,
        heapTotal: perf.memory.totalJSHeapSize,
        external: 0,
        arrayBuffers: 0,
        queryCount: summary.totalQueries,
      };

      this.memorySnapshots.push(snapshot);
      if (this.memorySnapshots.length > this.maxSnapshots) {
        this.memorySnapshots = this.memorySnapshots.slice(-this.maxSnapshots);
      }

      return snapshot;
    }

    return null;
  }

  /**
   * Get memory usage trend.
   */
  getMemoryTrend(): {
    snapshots: MemorySnapshot[];
    trend: 'stable' | 'growing' | 'shrinking';
    avgGrowthPerQuery: number;
  } {
    if (this.memorySnapshots.length < 2) {
      return { snapshots: [...this.memorySnapshots], trend: 'stable', avgGrowthPerQuery: 0 };
    }

    const first = this.memorySnapshots[0]!;
    const last = this.memorySnapshots[this.memorySnapshots.length - 1]!;
    const heapDiff = last.heapUsed - first.heapUsed;
    const queryDiff = last.queryCount - first.queryCount;

    const avgGrowth = queryDiff > 0 ? heapDiff / queryDiff : 0;

    let trend: 'stable' | 'growing' | 'shrinking';
    if (heapDiff > 1024 * 1024) {
      trend = 'growing';
    } else if (heapDiff < -1024 * 1024) {
      trend = 'shrinking';
    } else {
      trend = 'stable';
    }

    return {
      snapshots: [...this.memorySnapshots],
      trend,
      avgGrowthPerQuery: avgGrowth,
    };
  }

  /**
   * Check memory budget.
   * N172: Ensure KB uses <20MB total.
   */
  checkMemoryBudget(budgetBytes = 20 * 1024 * 1024): {
    passed: boolean;
    currentBytes: number;
    budgetBytes: number;
    percentUsed: number;
  } {
    const snapshot = this.takeMemorySnapshot();
    const currentBytes = snapshot?.heapUsed ?? 0;

    return {
      passed: currentBytes < budgetBytes,
      currentBytes,
      budgetBytes,
      percentUsed: (currentBytes / budgetBytes) * 100,
    };
  }

  /**
   * Format a human-readable profiling report.
   */
  formatReport(): string {
    const report = this.generateOptimizationReport();
    const lines: string[] = [];

    lines.push('=== AI Query Profiling Report ===');
    lines.push(`Generated: ${report.generatedAt}`);
    lines.push(`Budget status: ${report.budgetStatus.toUpperCase()}`);
    lines.push(`Total queries: ${report.queryCount}`);
    lines.push(`Slow queries: ${report.slowQueryCount}`);
    lines.push('');

    if (report.topSlowQueries.length > 0) {
      lines.push('Top Slow Queries:');
      for (const sq of report.topSlowQueries.slice(0, 5)) {
        lines.push(`  ${sq.query.durationMs.toFixed(1)}ms: ${sq.query.queryString.slice(0, 60)}...`);
      }
      lines.push('');
    }

    if (report.hotPredicates.length > 0) {
      lines.push('Hot Predicates:');
      for (const hp of report.hotPredicates.slice(0, 5)) {
        lines.push(`  ${hp.predicate}: ${hp.callCount} calls, ${hp.totalTimeMs.toFixed(1)}ms total`);
      }
      lines.push('');
    }

    if (report.allSuggestions.length > 0) {
      lines.push('Optimization Suggestions:');
      for (const s of report.allSuggestions.slice(0, 5)) {
        lines.push(`  [${s.suggestion.priority}] ${s.suggestion.description} (affects ${s.affectedQueries} queries)`);
      }
      lines.push('');
    }

    lines.push(`Estimated time to fix: ${report.estimatedTimeToFix}`);

    // Memory info
    const memCheck = this.checkMemoryBudget();
    lines.push('');
    lines.push('Memory Usage:');
    lines.push(`  Current: ${(memCheck.currentBytes / 1024 / 1024).toFixed(2)}MB`);
    lines.push(`  Budget: ${(memCheck.budgetBytes / 1024 / 1024).toFixed(2)}MB`);
    lines.push(`  Status: ${memCheck.passed ? 'OK' : 'OVER BUDGET'}`);

    return lines.join('\n');
  }

  /**
   * Export all profiling data as JSON.
   */
  exportJSON(): string {
    const report = this.generateOptimizationReport();
    const memoryTrend = this.getMemoryTrend();
    const slowLogger = getSlowQueryLogger();

    return JSON.stringify({
      report,
      memoryTrend,
      slowQueryLog: slowLogger.getEntries(),
      baselines: Object.fromEntries(this.baselines),
    }, null, 2);
  }

  /**
   * Clear all profiling data.
   */
  clear(): void {
    this.baselines.clear();
    this.memorySnapshots = [];
  }

  /**
   * Reset tools (for testing).
   */
  reset(): void {
    this.clear();
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let toolsInstance: ProfilingTools | null = null;

/**
 * Get the singleton profiling tools.
 */
export function getProfilingTools(): ProfilingTools {
  if (!toolsInstance) {
    toolsInstance = new ProfilingTools();
  }
  return toolsInstance;
}

/**
 * Reset the profiling tools (for testing).
 */
export function resetProfilingTools(): void {
  toolsInstance?.reset();
  toolsInstance = null;
}

export { ProfilingTools };
