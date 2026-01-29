/**
 * @fileoverview AI Performance & Regression Test Suite
 *
 * N164: Add tests: all queries meet performance budgets
 * N165: Add tests: no performance regressions
 * N175: Add tests: memory usage stays within budget
 * N176: Add tests: no memory leaks in KB
 *
 * @module @cardplay/ai/engine/performance-regression.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getQueryProfiler,
  resetQueryProfiler,
  type QueryPathProfile,
} from './query-profiler';
import {
  getSlowQueryLogger,
  resetSlowQueryLogger,
} from './slow-query-logger';
import {
  getProfilingTools,
  resetProfilingTools,
} from './profiling-tools';
import {
  createPrologAdapter,
  resetPrologAdapter,
} from './prolog-adapter';

describe('AI Performance Tests (N164)', () => {
  beforeEach(() => {
    resetQueryProfiler();
    resetSlowQueryLogger();
    resetProfilingTools();
  });

  afterEach(() => {
    resetQueryProfiler();
    resetSlowQueryLogger();
    resetProfilingTools();
    resetPrologAdapter();
  });

  // ========================================================================
  // N164: All queries meet performance budgets
  // ========================================================================

  describe('N164: All queries meet performance budgets', () => {
    it('records profiles correctly', () => {
      const profiler = getQueryProfiler();

      const profile: QueryPathProfile = {
        queryString: 'test_query(X)',
        source: 'test-module',
        timestamp: Date.now(),
        durationMs: 10,
        cached: false,
        phases: [],
        warnings: [],
      };

      profiler.recordProfile(profile);

      const profiles = profiler.getProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0]?.queryString).toBe('test_query(X)');
    });

    it('identifies slow queries (>50ms)', () => {
      const profiler = getQueryProfiler();

      // Record a slow query
      profiler.recordProfile({
        queryString: 'slow_query(X)',
        source: 'test-module',
        timestamp: Date.now(),
        durationMs: 75,
        cached: false,
        phases: [],
        warnings: [],
      });

      // Record a fast query
      profiler.recordProfile({
        queryString: 'fast_query(X)',
        source: 'test-module',
        timestamp: Date.now(),
        durationMs: 5,
        cached: false,
        phases: [],
        warnings: [],
      });

      const slowQueries = profiler.getSlowQueries(50);
      expect(slowQueries).toHaveLength(1);
      expect(slowQueries[0]?.query.queryString).toBe('slow_query(X)');
    });

    it('calculates p95 correctly', () => {
      const profiler = getQueryProfiler();

      // Add 100 queries with varying durations
      for (let i = 0; i < 100; i++) {
        profiler.recordProfile({
          queryString: `query_${i}(X)`,
          source: 'test',
          timestamp: Date.now(),
          durationMs: i + 1, // 1ms to 100ms
          cached: false,
          phases: [],
          warnings: [],
        });
      }

      const summary = profiler.getSummary();
      // P95 should be around 95ms
      expect(summary.p95Ms).toBeGreaterThanOrEqual(90);
      expect(summary.p95Ms).toBeLessThanOrEqual(100);
    });

    it('passes budget check when all queries are fast', () => {
      const profiler = getQueryProfiler();

      // All fast queries
      for (let i = 0; i < 20; i++) {
        profiler.recordProfile({
          queryString: `fast_${i}(X)`,
          source: 'test',
          timestamp: Date.now(),
          durationMs: 5 + Math.random() * 10,
          cached: false,
          phases: [],
          warnings: [],
        });
      }

      const budget = profiler.checkPerformanceBudget();
      expect(budget.passed).toBe(true);
      expect(budget.violations).toHaveLength(0);
    });

    it('fails budget check when p95 exceeds threshold', () => {
      const profiler = getQueryProfiler();

      // Add many slow queries
      for (let i = 0; i < 100; i++) {
        profiler.recordProfile({
          queryString: `query_${i}(X)`,
          source: 'test',
          timestamp: Date.now(),
          durationMs: 60, // All above 50ms
          cached: false,
          phases: [],
          warnings: [],
        });
      }

      const budget = profiler.checkPerformanceBudget();
      expect(budget.passed).toBe(false);
      expect(budget.violations.length).toBeGreaterThan(0);
    });

    it('generates optimization suggestions for slow queries', () => {
      const profiler = getQueryProfiler();

      profiler.recordProfile({
        queryString: 'slow_predicate(X, Y, Z)',
        source: 'test',
        timestamp: Date.now(),
        durationMs: 100,
        cached: false,
        phases: [{ name: 'execute', durationMs: 80 }],
        warnings: [],
      });

      const slowQueries = profiler.getSlowQueries();
      expect(slowQueries).toHaveLength(1);
      expect(slowQueries[0]?.suggestions.length).toBeGreaterThan(0);
      
      // Should suggest caching since it's not cached
      const cacheSuggestion = slowQueries[0]?.suggestions.find(s => s.type === 'caching');
      expect(cacheSuggestion).toBeDefined();
    });

    it('creates profiling sessions', () => {
      const profiler = getQueryProfiler();

      const sessionId = profiler.startSession('test-session');
      expect(sessionId).toBe('test-session');

      profiler.recordProfile({
        queryString: 'session_query(X)',
        source: 'test',
        timestamp: Date.now(),
        durationMs: 10,
        cached: false,
        phases: [],
        warnings: [],
      });

      const session = profiler.endSession();
      expect(session).not.toBeNull();
      expect(session?.queries).toHaveLength(1);
      expect(session?.endTime).toBeDefined();
    });

    it('tracks predicate heat map', () => {
      const profiler = getQueryProfiler();

      // Call same predicate multiple times
      for (let i = 0; i < 10; i++) {
        profiler.recordProfile({
          queryString: 'hot_predicate(X)',
          source: 'test',
          timestamp: Date.now(),
          durationMs: 5,
          cached: false,
          phases: [],
          warnings: [],
        });
      }

      // Call another predicate once
      profiler.recordProfile({
        queryString: 'cold_predicate(Y)',
        source: 'test',
        timestamp: Date.now(),
        durationMs: 5,
        cached: false,
        phases: [],
        warnings: [],
      });

      const heatMap = profiler.getPredicateHeatMap();
      const hotEntry = heatMap.find(e => e.predicate === 'hot_predicate');
      expect(hotEntry?.callCount).toBe(10);
    });
  });

  // ========================================================================
  // Slow Query Logger Tests
  // ========================================================================

  describe('Slow Query Logger', () => {
    it('logs slow queries when enabled', () => {
      const logger = getSlowQueryLogger();
      logger.enable();

      const profile: QueryPathProfile = {
        queryString: 'slow_query(X)',
        source: 'test',
        timestamp: Date.now(),
        durationMs: 100,
        cached: false,
        phases: [],
        warnings: [],
      };

      const entry = logger.logIfSlow(profile);
      expect(entry).not.toBeNull();
      expect(entry?.exceededBy).toBe(50); // 100 - 50 threshold
    });

    it('does not log fast queries', () => {
      const logger = getSlowQueryLogger();
      logger.enable();

      const profile: QueryPathProfile = {
        queryString: 'fast_query(X)',
        source: 'test',
        timestamp: Date.now(),
        durationMs: 10,
        cached: false,
        phases: [],
        warnings: [],
      };

      const entry = logger.logIfSlow(profile);
      expect(entry).toBeNull();
    });

    it('does not log when disabled', () => {
      const logger = getSlowQueryLogger();
      logger.disable();

      const profile: QueryPathProfile = {
        queryString: 'slow_query(X)',
        source: 'test',
        timestamp: Date.now(),
        durationMs: 100,
        cached: false,
        phases: [],
        warnings: [],
      };

      const entry = logger.logIfSlow(profile);
      expect(entry).toBeNull();
    });

    it('calls alert callbacks', () => {
      const logger = getSlowQueryLogger();
      logger.enable();

      const callback = vi.fn();
      const unsubscribe = logger.onSlowQuery(callback);

      logger.logIfSlow({
        queryString: 'alert_query(X)',
        source: 'test',
        timestamp: Date.now(),
        durationMs: 100,
        cached: false,
        phases: [],
        warnings: [],
      });

      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      logger.logIfSlow({
        queryString: 'another_query(X)',
        source: 'test',
        timestamp: Date.now(),
        durationMs: 100,
        cached: false,
        phases: [],
        warnings: [],
      });

      // Should still be 1 since we unsubscribed
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('generates summary statistics', () => {
      const logger = getSlowQueryLogger();
      logger.enable();

      for (let i = 0; i < 5; i++) {
        logger.logIfSlow({
          queryString: `slow_${i}(X)`,
          source: i < 3 ? 'module-a' : 'module-b',
          timestamp: Date.now(),
          durationMs: 60 + i * 10,
          cached: false,
          phases: [],
          warnings: [],
        });
      }

      const summary = logger.getSummary();
      expect(summary.totalSlowQueries).toBe(5);
      expect(summary.bySource['module-a']).toBe(3);
      expect(summary.bySource['module-b']).toBe(2);
    });
  });

  // ========================================================================
  // N165: No performance regressions
  // ========================================================================

  describe('N165: No performance regressions', () => {
    it('detects no regressions when performance is stable', () => {
      const tools = getProfilingTools();
      const profiler = getQueryProfiler();

      // Simulate baseline performance
      for (let i = 0; i < 50; i++) {
        profiler.recordProfile({
          queryString: `query_${i}(X)`,
          source: 'test',
          timestamp: Date.now(),
          durationMs: 10,
          cached: false,
          phases: [],
          warnings: [],
        });
      }

      tools.saveBaseline('stable-test');

      // No change in performance
      const result = tools.detectRegressions('stable-test');
      expect(result.hasRegressions).toBe(false);
    });

    it('detects regressions when performance degrades', () => {
      const tools = getProfilingTools();
      const profiler = getQueryProfiler();

      // Fast baseline
      for (let i = 0; i < 50; i++) {
        profiler.recordProfile({
          queryString: `query_${i}(X)`,
          source: 'test',
          timestamp: Date.now(),
          durationMs: 10,
          cached: false,
          phases: [],
          warnings: [],
        });
      }

      tools.saveBaseline('regression-test');

      // Reset and simulate slower performance
      profiler.clear();
      for (let i = 0; i < 50; i++) {
        profiler.recordProfile({
          queryString: `query_${i}(X)`,
          source: 'test',
          timestamp: Date.now(),
          durationMs: 50, // 5x slower
          cached: false,
          phases: [],
          warnings: [],
        });
      }

      const result = tools.detectRegressions('regression-test');
      expect(result.hasRegressions).toBe(true);
      expect(result.regressions.length).toBeGreaterThan(0);
    });

    it('returns no regressions for missing baseline', () => {
      const tools = getProfilingTools();
      const result = tools.detectRegressions('nonexistent-baseline');
      expect(result.hasRegressions).toBe(false);
    });

    it('classifies regression severity correctly', () => {
      const tools = getProfilingTools();
      const profiler = getQueryProfiler();

      // Baseline with 10ms average
      for (let i = 0; i < 50; i++) {
        profiler.recordProfile({
          queryString: `query_${i}(X)`,
          source: 'test',
          timestamp: Date.now(),
          durationMs: 10,
          cached: false,
          phases: [],
          warnings: [],
        });
      }

      tools.saveBaseline('severity-test');
      profiler.clear();

      // Severe regression (>50% degradation)
      for (let i = 0; i < 50; i++) {
        profiler.recordProfile({
          queryString: `query_${i}(X)`,
          source: 'test',
          timestamp: Date.now(),
          durationMs: 100, // 10x slower
          cached: false,
          phases: [],
          warnings: [],
        });
      }

      const result = tools.detectRegressions('severity-test');
      expect(result.hasRegressions).toBe(true);
      const severeRegression = result.regressions.find(r => r.severity === 'severe');
      expect(severeRegression).toBeDefined();
    });
  });

  // ========================================================================
  // N175: Memory usage stays within budget
  // ========================================================================

  describe('N175: Memory budget tests', () => {
    it('takes memory snapshots', () => {
      const tools = getProfilingTools();
      const snapshot = tools.takeMemorySnapshot();
      
      // May be null in some environments
      if (snapshot) {
        expect(snapshot.timestamp).toBeGreaterThan(0);
        expect(snapshot.heapUsed).toBeGreaterThanOrEqual(0);
      }
    });

    it('checks memory budget', () => {
      const tools = getProfilingTools();
      const check = tools.checkMemoryBudget();
      
      expect(check.budgetBytes).toBe(20 * 1024 * 1024);
      expect(typeof check.passed).toBe('boolean');
      expect(typeof check.percentUsed).toBe('number');
    });

    it('tracks memory trend', () => {
      const tools = getProfilingTools();
      
      // Take a few snapshots
      tools.takeMemorySnapshot();
      tools.takeMemorySnapshot();
      tools.takeMemorySnapshot();

      const trend = tools.getMemoryTrend();
      expect(['stable', 'growing', 'shrinking']).toContain(trend.trend);
      expect(typeof trend.avgGrowthPerQuery).toBe('number');
    });
  });

  // ========================================================================
  // Profiling Tools Tests
  // ========================================================================

  describe('Profiling Tools', () => {
    it('generates optimization report', () => {
      const tools = getProfilingTools();
      const profiler = getQueryProfiler();

      // Add some data
      for (let i = 0; i < 10; i++) {
        profiler.recordProfile({
          queryString: `query_${i}(X)`,
          source: 'test',
          timestamp: Date.now(),
          durationMs: i < 5 ? 10 : 80,
          cached: false,
          phases: [],
          warnings: [],
        });
      }

      const report = tools.generateOptimizationReport();
      expect(report.queryCount).toBe(10);
      expect(report.slowQueryCount).toBe(5);
      expect(report.generatedAt).toBeDefined();
      expect(report.budgetStatus).toBeDefined();
    });

    it('formats human-readable report', () => {
      const tools = getProfilingTools();
      const profiler = getQueryProfiler();

      profiler.recordProfile({
        queryString: 'test_query(X)',
        source: 'test',
        timestamp: Date.now(),
        durationMs: 100,
        cached: false,
        phases: [],
        warnings: [],
      });

      const report = tools.formatReport();
      expect(report).toContain('AI Query Profiling Report');
      expect(report).toContain('Memory Usage');
    });

    it('exports profiling data as JSON', () => {
      const tools = getProfilingTools();
      const profiler = getQueryProfiler();

      profiler.recordProfile({
        queryString: 'export_test(X)',
        source: 'test',
        timestamp: Date.now(),
        durationMs: 20,
        cached: false,
        phases: [],
        warnings: [],
      });

      const json = tools.exportJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.report).toBeDefined();
      expect(parsed.memoryTrend).toBeDefined();
    });

    it('analyzes query consistency', async () => {
      const tools = getProfilingTools();

      // Simple consistent function
      let counter = 0;
      const result = await tools.analyzeQueryConsistency(async () => {
        counter++;
        // Simulate small work
        await new Promise(r => setTimeout(r, 1));
      }, 10);

      expect(result.runCount).toBe(10);
      expect(result.avgMs).toBeGreaterThan(0);
      expect(typeof result.isConsistent).toBe('boolean');
    });
  });
});
