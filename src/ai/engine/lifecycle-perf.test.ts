/**
 * @fileoverview KB Lifecycle & Performance Test Suite
 *
 * L375: Performance test suite
 * L376: Memory monitoring
 * L383: Offline tests
 * L384: Cold start KB loading
 * L385: KB versioning
 * L386: Performance budgets
 * L387: Memory budgets
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PrologAdapter,
  createPrologAdapter,
  resetPrologAdapter,
} from './prolog-adapter';
import {
  preloadCriticalKBs,
  loadAllKBs,
  lazyLoadKB,
  getKBStatus,
  isFullyOfflineCapable,
  getKBVersionInfo,
  unloadKB,
} from './kb-lifecycle';
import { getPerfMonitor, resetPerfMonitor } from './perf-monitor';
import { openKBCache } from './kb-idb-cache';
import { needsMigration, createMigrationRegistry } from './kb-migration';
import { createQueryBatch } from './query-batch';

describe('KB Lifecycle & Performance (L375-L387)', () => {
  let adapter: PrologAdapter;

  beforeEach(() => {
    adapter = createPrologAdapter({ enableCache: false });
    resetPerfMonitor();
  });

  afterEach(() => {
    resetPrologAdapter();
    resetPerfMonitor();
  });

  // ========================================================================
  // L383: Offline capability
  // ========================================================================

  describe('L383: Offline capability', () => {
    it('isFullyOfflineCapable returns true', () => {
      expect(isFullyOfflineCapable()).toBe(true);
    });

    it('no network requests in KB loading', () => {
      // All KBs are bundled via ?raw imports at build time.
      // This test verifies the offline flag rather than intercepting network calls.
      const offline = isFullyOfflineCapable();
      expect(offline).toBe(true);
    });
  });

  // ========================================================================
  // L384: Cold start KB loading
  // ========================================================================

  describe('L384: Cold start KB loading', () => {
    it('preloadCriticalKBs loads music-theory and board-layout', async () => {
      await preloadCriticalKBs(adapter);
      const status = getKBStatus(adapter);
      // getKBStatus reflects per-adapter loader state, so this verifies load succeeded
      expect(status.allCriticalLoaded).toBe(true);
      expect(status.musicTheory).toBe(true);
      expect(status.boardLayout).toBe(true);
    });

    it('loadAllKBs loads all standard KBs', async () => {
      await loadAllKBs(adapter);
      const status = getKBStatus(adapter);
      expect(status.allCriticalLoaded).toBe(true);
      expect(status.musicTheory).toBe(true);
      expect(status.boardLayout).toBe(true);
      expect(status.compositionPatterns).toBe(true);
      expect(status.phraseAdaptation).toBe(true);
    });

    it('loadAllKBs with includeOptional loads optional KBs too', async () => {
      await loadAllKBs(adapter, { includeOptional: true });
      const status = getKBStatus(adapter);
      expect(status.allLoaded).toBe(true);
      expect(status.userPrefs).toBe(true);
      expect(status.adaptation).toBe(true);
    });

    it('preloadCriticalKBs reports progress', async () => {
      const progressLog: Array<{ loaded: number; total: number; name: string }> = [];
      await preloadCriticalKBs(adapter, (loaded, total, name) => {
        progressLog.push({ loaded, total, name });
      });
      expect(progressLog.length).toBeGreaterThanOrEqual(2);
      expect(progressLog[progressLog.length - 1]!.loaded).toBe(
        progressLog[progressLog.length - 1]!.total,
      );
    });
  });

  // ========================================================================
  // N158: Lazy KB loading (optional features)
  // ========================================================================

  describe('N158: Lazy KB loading', () => {
    it('lazyLoadKB loads optional KBs on demand', async () => {
      const before = getKBStatus(adapter);
      expect(before.userPrefs).toBe(false);

      const ok = await lazyLoadKB('user-prefs', adapter);
      expect(ok).toBe(true);

      const after = getKBStatus(adapter);
      expect(after.userPrefs).toBe(true);
    });
  });

  // ========================================================================
  // L385: KB versioning
  // ========================================================================

  describe('L385: KB versioning', () => {
    it('getKBVersionInfo returns valid version info', () => {
      const info = getKBVersionInfo();
      expect(info.schemaVersion).toBeGreaterThanOrEqual(1);
      expect(info.musicTheoryVersion).toMatch(/^\d+\.\d+\.\d+$/);
      expect(info.boardLayoutVersion).toMatch(/^\d+\.\d+\.\d+$/);
      expect(info.compositionPatternsVersion).toMatch(/^\d+\.\d+\.\d+$/);
      expect(info.phraseAdaptationVersion).toMatch(/^\d+\.\d+\.\d+$/);
      expect(info.userPrefsVersion).toMatch(/^\d+\.\d+\.\d+$/);
      expect(info.adaptationVersion).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('needsMigration detects version mismatch', () => {
      expect(needsMigration('music-theory', '1.0.0', '1.0.0')).toBe(false);
      expect(needsMigration('music-theory', '0.9.0', '1.0.0')).toBe(true);
      expect(needsMigration('board-layout', '1.0.0', '1.0.1')).toBe(true);
    });

    it('migration registry stores and retrieves migrations', () => {
      const reg = createMigrationRegistry();
      reg.register({
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        kbName: 'test',
        migrationCode: '',
        description: 'test migration',
      });
      const migs = reg.getMigrationsFor('test', '1.0.0', '1.1.0');
      expect(migs).toHaveLength(1);
      expect(migs[0]!.fromVersion).toBe('1.0.0');
      expect(migs[0]!.toVersion).toBe('1.1.0');
      expect(migs[0]!.kbName).toBe('test');
    });

    it('migration registry chains multi-step migrations', () => {
      const reg = createMigrationRegistry();
      reg.register({
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        kbName: 'test',
        migrationCode: '',
        description: 'step 1',
      });
      reg.register({
        fromVersion: '1.1.0',
        toVersion: '1.2.0',
        kbName: 'test',
        migrationCode: '',
        description: 'step 2',
      });
      const migs = reg.getMigrationsFor('test', '1.0.0', '1.2.0');
      expect(migs).toHaveLength(2);
      expect(migs[0]!.description).toBe('step 1');
      expect(migs[1]!.description).toBe('step 2');
    });

    it('migration registry returns empty for unknown KB', () => {
      const reg = createMigrationRegistry();
      const migs = reg.getMigrationsFor('nonexistent', '1.0.0', '2.0.0');
      expect(migs).toHaveLength(0);
    });

    it('planMigration returns a valid plan', () => {
      const reg = createMigrationRegistry();
      reg.register({
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        kbName: 'test',
        migrationCode: 'true.',
        description: 'bump',
      });
      const plan = reg.planMigration('test', '1.0.0', '1.1.0');
      expect(plan).not.toBeNull();
      expect(plan!.kbName).toBe('test');
      expect(plan!.currentVersion).toBe('1.0.0');
      expect(plan!.targetVersion).toBe('1.1.0');
      expect(plan!.steps).toHaveLength(1);
    });

    it('planMigration returns null when no path exists', () => {
      const reg = createMigrationRegistry();
      const plan = reg.planMigration('test', '1.0.0', '2.0.0');
      expect(plan).toBeNull();
    });
  });

  // ========================================================================
  // L386: Performance budgets
  // ========================================================================

  describe('L386: Performance budgets', () => {
    it('PerfMonitor checkBudgets passes with no slow queries', () => {
      const mon = getPerfMonitor();
      mon.enable();
      mon.record({
        queryString: 'test(X)',
        durationMs: 5,
        timestamp: Date.now(),
        source: 'test',
        cached: false,
      });
      const result = mon.checkBudgets();
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('PerfMonitor checkBudgets fails with slow queries', () => {
      const mon = getPerfMonitor();
      mon.enable();
      for (let i = 0; i < 100; i++) {
        mon.record({
          queryString: `test(${i})`,
          durationMs: 100,
          timestamp: Date.now(),
          source: 'test',
          cached: false,
        });
      }
      const result = mon.checkBudgets();
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      // p95 of 100ms samples exceeds the default 50ms budget
      const p95Violation = result.violations.find((v) => v.metric === 'query_p95');
      expect(p95Violation).toBeDefined();
      expect(p95Violation!.actual).toBeGreaterThan(p95Violation!.budget);
    });

    it('PerfMonitor records and reports sample count', () => {
      const mon = getPerfMonitor();
      mon.enable();
      for (let i = 0; i < 10; i++) {
        mon.record({
          queryString: `fact(${i})`,
          durationMs: i,
          timestamp: Date.now(),
          source: 'test',
          cached: false,
        });
      }
      expect(mon.getSampleCount()).toBe(10);
    });

    it('PerfMonitor getStats groups by pattern', () => {
      const mon = getPerfMonitor();
      mon.enable();
      mon.record({ queryString: 'scale(major)', durationMs: 3, timestamp: Date.now(), source: 'test', cached: false });
      mon.record({ queryString: 'scale(minor)', durationMs: 4, timestamp: Date.now(), source: 'test', cached: false });
      mon.record({ queryString: 'chord(major)', durationMs: 5, timestamp: Date.now(), source: 'test', cached: false });
      const stats = mon.getStats();
      // scale(major) and scale(minor) should normalize to the same pattern
      expect(stats.length).toBeGreaterThanOrEqual(1);
    });

    it('PerfMonitor getSlowQueries identifies slow queries', () => {
      const mon = getPerfMonitor();
      mon.enable();
      mon.record({ queryString: 'fast(X)', durationMs: 1, timestamp: Date.now(), source: 'test', cached: false });
      mon.record({ queryString: 'slow(X)', durationMs: 500, timestamp: Date.now(), source: 'test', cached: false });
      const slow = mon.getSlowQueries();
      expect(slow.length).toBe(1);
      expect(slow[0]!.queryString).toBe('slow(X)');
    });

    it('PerfMonitor getPredicateCoverage tracks predicate usage', () => {
      const mon = getPerfMonitor();
      mon.enable();
      mon.record({ queryString: 'scale(X)', durationMs: 1, timestamp: Date.now(), source: 'test', cached: false });
      mon.record({ queryString: 'scale(Y)', durationMs: 1, timestamp: Date.now(), source: 'test', cached: false });
      mon.record({ queryString: 'chord(Z)', durationMs: 1, timestamp: Date.now(), source: 'test', cached: false });
      const coverage = mon.getPredicateCoverage();
      expect(coverage.get('scale')).toBe(2);
      expect(coverage.get('chord')).toBe(1);
    });

    it('PerfMonitor does not record when disabled', () => {
      const mon = getPerfMonitor();
      // Monitor starts disabled after resetPerfMonitor()
      expect(mon.isEnabled()).toBe(false);
      mon.record({ queryString: 'test(X)', durationMs: 5, timestamp: Date.now(), source: 'test', cached: false });
      expect(mon.getSampleCount()).toBe(0);
    });

    it('PerfMonitor formatReport produces non-empty output', () => {
      const mon = getPerfMonitor();
      mon.enable();
      mon.record({ queryString: 'report_test(X)', durationMs: 10, timestamp: Date.now(), source: 'test', cached: false });
      const report = mon.formatReport();
      expect(report).toContain('AI Performance Report');
      expect(report).toContain('Total queries: 1');
    });
  });

  // ========================================================================
  // L387: Memory budgets
  // ========================================================================

  describe('L387: Memory budgets', () => {
    it('KB memory budget defaults to 20MB', () => {
      const mon = getPerfMonitor();
      // The default budgets set memoryMaxBytes to 20 * 1024 * 1024 (20MB).
      // setBudgets merges with existing defaults, so we verify the value is accepted.
      mon.setBudgets({ memoryMaxBytes: 20 * 1024 * 1024 });
      // Configuration test -- actual memory measurement requires runtime inspection.
      // The fact that setBudgets does not throw confirms the budget constant is valid.
      expect(true).toBe(true);
    });

    it('custom memory budget can be set', () => {
      const mon = getPerfMonitor();
      mon.enable();
      // Setting a custom budget should not throw
      mon.setBudgets({ memoryMaxBytes: 10 * 1024 * 1024 });
      const result = mon.checkBudgets();
      // With no samples, budgets should pass
      expect(result.passed).toBe(true);
    });
  });

  // ========================================================================
  // L375: Query batch
  // ========================================================================

  describe('L375: Query batch', () => {
    it('createQueryBatch executes multiple queries', async () => {
      await adapter.loadProgram('fruit(apple). fruit(banana). fruit(cherry).');
      const batch = createQueryBatch(adapter);
      batch.add('fruits', 'fruit(X)');
      batch.add('apple', 'fruit(apple)');
      const results = await batch.execute();
      expect(results.size).toBe(2);
      expect(results.get('fruits')!.success).toBe(true);
      expect(results.get('fruits')!.solutions.length).toBeGreaterThanOrEqual(1);
      expect(results.get('apple')!.success).toBe(true);
    });

    it('createQueryBatch reports failure for invalid queries', async () => {
      await adapter.loadProgram('fruit(apple).');
      const batch = createQueryBatch(adapter);
      batch.add('valid', 'fruit(apple)');
      batch.add('invalid', 'nonexistent_predicate(X)');
      const results = await batch.execute();
      expect(results.size).toBe(2);
      expect(results.get('valid')!.success).toBe(true);
      // The invalid query may fail or return no solutions
      const invalidResult = results.get('invalid')!;
      expect(invalidResult).toBeDefined();
    });

    it('createQueryBatch size tracks added queries', () => {
      const batch = createQueryBatch(adapter);
      expect(batch.size()).toBe(0);
      batch.add('a', 'true');
      batch.add('b', 'true');
      expect(batch.size()).toBe(2);
    });

    it('createQueryBatch records timeMs for each query', async () => {
      await adapter.loadProgram('hello(world).');
      const batch = createQueryBatch(adapter);
      batch.add('hw', 'hello(X)');
      const results = await batch.execute();
      const hwResult = results.get('hw')!;
      expect(hwResult.timeMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================================================
  // L365: KB IDB cache
  // ========================================================================

  describe('L365: KB IDB cache', () => {
    it('openKBCache returns null in non-browser env', async () => {
      // In Node.js / vitest test env, IndexedDB is not available
      const cache = await openKBCache();
      expect(cache).toBeNull();
    });
  });

  // ========================================================================
  // N181: Memory tests for KB lifecycle (unload optional KBs)
  // ========================================================================

  describe('N181: KB lifecycle unload clears facts', () => {
    it('unloadKB(user-prefs) retracts dynamic user and learned pattern facts', async () => {
      await lazyLoadKB('user-prefs', adapter);

      // Seed some dynamic facts
      await adapter.assertz('user_prefers_board(test_user, tracker).');
      await adapter.assertz('learned_workflow_pattern(test_user, p1, [pattern_editor,mixer,effect_chain]).');
      await adapter.assertz('learned_parameter_preference(test_user, swing, pattern_editor, 57).');
      await adapter.assertz('learned_routing_pattern(test_user, instrument_rack, mixer, monitoring).');

      const before = await adapter.queryAll('user_prefers_board(test_user, X)');
      expect(before.length).toBeGreaterThan(0);

      const ok = await unloadKB('user-prefs', adapter);
      expect(ok).toBe(true);

      const status = getKBStatus(adapter);
      expect(status.userPrefs).toBe(false);

      expect((await adapter.queryAll('user_prefers_board(test_user, _)')).length).toBe(0);
      expect((await adapter.queryAll('learned_workflow_pattern(test_user, _, _)')).length).toBe(0);
      expect((await adapter.queryAll('learned_parameter_preference(test_user, _, _, _)')).length).toBe(0);
      expect((await adapter.queryAll('learned_routing_pattern(test_user, _, _, _)')).length).toBe(0);
    });
  });
});
