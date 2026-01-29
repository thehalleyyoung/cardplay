/**
 * @fileoverview KB Memory Profiler Test Suite
 *
 * N166: Profile KB memory usage
 * N167: Identify memory-heavy KB sections
 * N175: Memory budget tests
 * N176: Memory leak tests
 *
 * @module @cardplay/ai/engine/kb-memory-profiler.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getKBMemoryProfiler,
  resetKBMemoryProfiler,
} from './kb-memory-profiler';

describe('KB Memory Profiler (N166-N176)', () => {
  beforeEach(() => {
    resetKBMemoryProfiler();
  });

  afterEach(() => {
    resetKBMemoryProfiler();
  });

  // ========================================================================
  // N166: Profile KB memory usage
  // ========================================================================

  describe('N166: Profile KB memory usage', () => {
    it('estimates memory for source string', () => {
      const profiler = getKBMemoryProfiler();
      
      const source = `
        fact(a, b).
        fact(c, d).
        rule(X, Y) :- fact(X, Y).
      `;
      
      const estimate = profiler.estimateSourceMemory(source);
      expect(estimate).toBeGreaterThan(0);
      // Should be at least 2x the source size due to parsing overhead
      expect(estimate).toBeGreaterThan(source.length * 2);
    });

    it('registers and tracks sections', () => {
      const profiler = getKBMemoryProfiler();
      
      const source = 'test_fact(1). test_fact(2).';
      profiler.registerSection('test-section', source);
      profiler.markLoaded('test-section');
      
      const breakdown = profiler.getMemoryBreakdown();
      expect(breakdown.sections).toHaveLength(1);
      expect(breakdown.sections[0]?.name).toBe('test-section');
    });

    it('calculates total memory across sections', () => {
      const profiler = getKBMemoryProfiler();
      
      profiler.registerSection('section-a', 'fact_a(1). fact_a(2).');
      profiler.registerSection('section-b', 'fact_b(x). fact_b(y). fact_b(z).');
      profiler.markLoaded('section-a');
      profiler.markLoaded('section-b');
      
      const breakdown = profiler.getMemoryBreakdown();
      expect(breakdown.sections).toHaveLength(2);
      expect(breakdown.totalEstimatedBytes).toBeGreaterThan(0);
    });

    it('excludes unloaded sections from breakdown', () => {
      const profiler = getKBMemoryProfiler();
      
      profiler.registerSection('loaded', 'loaded_fact(1).');
      profiler.registerSection('unloaded', 'unloaded_fact(2).');
      profiler.markLoaded('loaded');
      // Don't mark 'unloaded' as loaded
      
      const breakdown = profiler.getMemoryBreakdown();
      expect(breakdown.sections).toHaveLength(1);
      expect(breakdown.sections[0]?.name).toBe('loaded');
    });
  });

  // ========================================================================
  // N167: Identify memory-heavy KB sections
  // ========================================================================

  describe('N167: Identify memory-heavy KB sections', () => {
    it('identifies heavy sections (>1MB)', () => {
      const profiler = getKBMemoryProfiler();
      
      // Create a large source string (>1MB when parsed)
      const largeFacts = Array.from({ length: 10000 }, (_, i) => 
        `large_fact(${i}, value_${i}, data_${i}).`
      ).join('\n');
      
      profiler.registerSection('heavy-section', largeFacts);
      profiler.markLoaded('heavy-section');
      
      const breakdown = profiler.getMemoryBreakdown();
      expect(breakdown.sections[0]?.isHeavy).toBe(true);
    });

    it('sorts sections by size descending', () => {
      const profiler = getKBMemoryProfiler();
      
      const small = 'small(1).';
      const medium = Array.from({ length: 100 }, (_, i) => `medium(${i}).`).join('\n');
      const large = Array.from({ length: 1000 }, (_, i) => `large(${i}).`).join('\n');
      
      profiler.registerSection('small', small);
      profiler.registerSection('medium', medium);
      profiler.registerSection('large', large);
      profiler.markLoaded('small');
      profiler.markLoaded('medium');
      profiler.markLoaded('large');
      
      const breakdown = profiler.getMemoryBreakdown();
      expect(breakdown.sections[0]?.name).toBe('large');
      expect(breakdown.sections[1]?.name).toBe('medium');
      expect(breakdown.sections[2]?.name).toBe('small');
    });

    it('counts facts and rules separately', () => {
      const profiler = getKBMemoryProfiler();
      
      const source = `
        fact1(a).
        fact2(b).
        fact3(c).
        rule1(X) :- fact1(X).
        rule2(X, Y) :- fact1(X), fact2(Y).
      `;
      
      profiler.registerSection('mixed', source);
      profiler.markLoaded('mixed');
      
      const breakdown = profiler.getMemoryBreakdown();
      expect(breakdown.ruleCount).toBeGreaterThan(0);
      expect(breakdown.factCount).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Compression potential
  // ========================================================================

  describe('Compression potential estimation', () => {
    it('detects high compression potential for repeated patterns', () => {
      const profiler = getKBMemoryProfiler();
      
      // Highly repetitive facts
      const repetitive = Array.from({ length: 100 }, (_, i) => 
        `similar_fact(category, value_${i}).`
      ).join('\n');
      
      profiler.registerSection('repetitive', repetitive);
      profiler.markLoaded('repetitive');
      
      const breakdown = profiler.getMemoryBreakdown();
      const section = breakdown.sections.find(s => s.name === 'repetitive');
      expect(['high', 'medium']).toContain(section?.compressionPotential);
    });

    it('detects low compression potential for varied content', () => {
      const profiler = getKBMemoryProfiler();
      
      // Varied predicates
      const varied = `
        alpha(1). beta(2). gamma(3). delta(4). epsilon(5).
        zeta(6). eta(7). theta(8). iota(9). kappa(10).
        lambda(11). mu(12). nu(13). xi(14). omicron(15).
      `;
      
      profiler.registerSection('varied', varied);
      profiler.markLoaded('varied');
      
      const breakdown = profiler.getMemoryBreakdown();
      const section = breakdown.sections.find(s => s.name === 'varied');
      expect(['none', 'low']).toContain(section?.compressionPotential);
    });
  });

  // ========================================================================
  // N169: Garbage collection
  // ========================================================================

  describe('N169: Garbage collection simulation', () => {
    it('simulates GC and reports freed memory', () => {
      const profiler = getKBMemoryProfiler();
      
      const source = `
        used_pred(x).
        unused_pred_a(y).
        unused_pred_b(z).
      `;
      
      profiler.registerSection('test', source);
      profiler.markLoaded('test');
      
      const usedPredicates = new Set(['used_pred']);
      const result = profiler.simulateGC(usedPredicates);
      
      expect(result.freedBytes).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('reports zero freed when all predicates used', () => {
      const profiler = getKBMemoryProfiler();
      
      const source = 'pred_a(x). pred_b(y).';
      profiler.registerSection('test', source);
      profiler.markLoaded('test');
      
      const usedPredicates = new Set(['pred_a', 'pred_b']);
      const result = profiler.simulateGC(usedPredicates);
      
      expect(result.freedBytes).toBe(0);
    });
  });

  // ========================================================================
  // Optimization suggestions
  // ========================================================================

  describe('Optimization suggestions', () => {
    it('suggests GC for heavy sections', () => {
      const profiler = getKBMemoryProfiler();
      
      // Create heavy section
      const large = Array.from({ length: 20000 }, (_, i) => 
        `heavy_fact(${i}, value).`
      ).join('\n');
      
      profiler.registerSection('heavy', large);
      profiler.markLoaded('heavy');
      
      const optimizations = profiler.getOptimizations();
      const gcSuggestion = optimizations.find(o => o.type === 'gc');
      expect(gcSuggestion).toBeDefined();
      expect(gcSuggestion?.priority).toBe('high');
    });

    it('suggests lazy loading for optional sections', () => {
      const profiler = getKBMemoryProfiler();
      
      const optional = Array.from({ length: 1000 }, (_, i) => 
        `optional_fact(${i}).`
      ).join('\n');
      
      profiler.registerSection('optional-section', optional, true);
      profiler.markLoaded('optional-section');
      
      const optimizations = profiler.getOptimizations();
      const lazySuggestion = optimizations.find(o => o.type === 'lazy-load');
      expect(lazySuggestion).toBeDefined();
    });

    it('sorts suggestions by estimated savings', () => {
      const profiler = getKBMemoryProfiler();
      
      const small = Array.from({ length: 100 }, (_, i) => `small(${i}).`).join('\n');
      const large = Array.from({ length: 10000 }, (_, i) => `large(${i}, value).`).join('\n');
      
      profiler.registerSection('small', small, true);
      profiler.registerSection('large', large, true);
      profiler.markLoaded('small');
      profiler.markLoaded('large');
      
      const optimizations = profiler.getOptimizations();
      if (optimizations.length >= 2) {
        expect(optimizations[0]!.estimatedSavings).toBeGreaterThanOrEqual(optimizations[1]!.estimatedSavings);
      }
    });
  });

  // ========================================================================
  // N173: Memory dashboard
  // ========================================================================

  describe('N173: Memory dashboard', () => {
    it('provides dashboard data', () => {
      const profiler = getKBMemoryProfiler();
      profiler.enable();
      
      profiler.registerSection('test', 'test_fact(1).');
      profiler.markLoaded('test');
      
      const dashboard = profiler.getDashboard();
      
      expect(dashboard.currentUsage).toBeDefined();
      expect(dashboard.budgetStatus).toBeDefined();
      expect(dashboard.budgetStatus.budgetBytes).toBe(20 * 1024 * 1024);
    });

    it('tracks history points', () => {
      const profiler = getKBMemoryProfiler();
      profiler.enable();
      
      profiler.registerSection('test', 'fact(x).');
      profiler.markLoaded('test');
      
      profiler.recordHistoryPoint(10);
      profiler.recordHistoryPoint(20);
      profiler.recordHistoryPoint(30);
      
      const dashboard = profiler.getDashboard();
      expect(dashboard.history).toHaveLength(3);
      expect(dashboard.history[2]?.queryCount).toBe(30);
    });

    it('reports budget status correctly', () => {
      const profiler = getKBMemoryProfiler();
      profiler.setBudget(1000); // 1KB budget
      
      profiler.registerSection('small', 'a(1).');
      profiler.markLoaded('small');
      
      const dashboard = profiler.getDashboard();
      expect(['ok', 'warning', 'critical']).toContain(dashboard.budgetStatus.status);
    });
  });

  // ========================================================================
  // N175: Memory budget
  // ========================================================================

  describe('N175: Memory budget tests', () => {
    it('checks memory against budget', () => {
      const profiler = getKBMemoryProfiler();
      profiler.setBudget(100 * 1024 * 1024); // 100MB
      
      profiler.registerSection('test', 'small_fact(1).');
      profiler.markLoaded('test');
      
      const dashboard = profiler.getDashboard();
      expect(dashboard.budgetStatus.percentUsed).toBeLessThan(1);
      expect(dashboard.budgetStatus.status).toBe('ok');
    });

    it('detects when over budget', () => {
      const profiler = getKBMemoryProfiler();
      profiler.setBudget(100); // Tiny budget
      
      const source = Array.from({ length: 100 }, (_, i) => `fact(${i}).`).join('\n');
      profiler.registerSection('test', source);
      profiler.markLoaded('test');
      
      const dashboard = profiler.getDashboard();
      expect(dashboard.budgetStatus.percentUsed).toBeGreaterThan(100);
      expect(dashboard.budgetStatus.status).toBe('critical');
    });
  });

  // ========================================================================
  // N176: Memory leak tests
  // ========================================================================

  describe('N176: No memory leaks', () => {
    it('clears all data on reset', () => {
      const profiler = getKBMemoryProfiler();
      profiler.enable();
      
      profiler.registerSection('test', 'leak_test(1).');
      profiler.markLoaded('test');
      profiler.recordHistoryPoint(100);
      
      profiler.reset();
      
      const breakdown = profiler.getMemoryBreakdown();
      expect(breakdown.sections).toHaveLength(0);
      expect(breakdown.totalEstimatedBytes).toBe(0);
    });

    it('limits history size', () => {
      const profiler = getKBMemoryProfiler();
      profiler.enable();
      
      // Record many history points
      for (let i = 0; i < 2000; i++) {
        profiler.recordHistoryPoint(i);
      }
      
      const dashboard = profiler.getDashboard();
      // Should be limited to maxHistory (1000)
      expect(dashboard.history.length).toBeLessThanOrEqual(1000);
    });

    it('handles section unloading', () => {
      const profiler = getKBMemoryProfiler();
      
      profiler.registerSection('temporary', 'temp(1).');
      profiler.markLoaded('temporary');
      
      let breakdown = profiler.getMemoryBreakdown();
      expect(breakdown.sections).toHaveLength(1);
      
      profiler.markUnloaded('temporary');
      
      breakdown = profiler.getMemoryBreakdown();
      expect(breakdown.sections).toHaveLength(0);
    });
  });

  // ========================================================================
  // Reporting
  // ========================================================================

  describe('Reporting', () => {
    it('formats human-readable report', () => {
      const profiler = getKBMemoryProfiler();
      
      profiler.registerSection('test', 'report_test(1). report_test(2).');
      profiler.markLoaded('test');
      
      const report = profiler.formatReport();
      
      expect(report).toContain('KB Memory Report');
      expect(report).toContain('Status:');
      expect(report).toContain('Used:');
    });

    it('exports data as JSON', () => {
      const profiler = getKBMemoryProfiler();
      
      profiler.registerSection('test', 'export_test(1).');
      profiler.markLoaded('test');
      
      const json = profiler.exportJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.dashboard).toBeDefined();
    });
  });
});
