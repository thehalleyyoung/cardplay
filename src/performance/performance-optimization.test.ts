/**
 * Performance Optimization Tests
 */

import { describe, it, expect } from 'vitest';
import { lazyModule, preloadCriticalModules } from './code-splitting';
import { BundleSizeMonitor, formatBytes, analyzeBundleComposition } from './bundle-monitor';
import { DEFAULT_TREE_SHAKING_CONFIG, generateSideEffectsConfig } from './tree-shaking';

describe('Code Splitting', () => {
  it('should lazy load modules', async () => {
    const testModule = lazyModule(async () => ({ test: 'value' }));
    
    expect(testModule.isLoaded()).toBe(false);
    expect(testModule.get()).toBeUndefined();
    
    const loaded = await testModule.load();
    expect(loaded.test).toBe('value');
    expect(testModule.isLoaded()).toBe(true);
    expect(testModule.get()?.test).toBe('value');
  });

  it('should cache loaded modules', async () => {
    let loadCount = 0;
    const testModule = lazyModule(async () => {
      loadCount++;
      return { count: loadCount };
    });
    
    await testModule.load();
    await testModule.load();
    await testModule.load();
    
    expect(loadCount).toBe(1);
  });

  it('should handle concurrent loads', async () => {
    let loadCount = 0;
    const testModule = lazyModule(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      loadCount++;
      return { count: loadCount };
    });
    
    const [result1, result2, result3] = await Promise.all([
      testModule.load(),
      testModule.load(),
      testModule.load(),
    ]);
    
    expect(loadCount).toBe(1);
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  it('should not crash if preload is called in non-browser env', () => {
    expect(() => preloadCriticalModules()).not.toThrow();
  });
});

describe('Bundle Size Monitor', () => {
  it('should check bundle size against budget', () => {
    const monitor = new BundleSizeMonitor([
      { name: 'test', maxSize: 100 * 1024, warningThreshold: 0.9 },
    ]);
    
    const report = monitor.check('test', 50 * 1024);
    expect(report.overBudget).toBe(false);
    expect(report.nearBudget).toBe(false);
    expect(report.budgetUsage).toBe(50);
  });

  it('should detect over-budget modules', () => {
    const monitor = new BundleSizeMonitor([
      { name: 'test', maxSize: 100 * 1024, warningThreshold: 0.9 },
    ]);
    
    const report = monitor.check('test', 150 * 1024);
    expect(report.overBudget).toBe(true);
  });

  it('should detect near-budget modules', () => {
    const monitor = new BundleSizeMonitor([
      { name: 'test', maxSize: 100 * 1024, warningThreshold: 0.9 },
    ]);
    
    const report = monitor.check('test', 95 * 1024);
    expect(report.nearBudget).toBe(true);
    expect(report.overBudget).toBe(false);
  });

  it('should generate full report', () => {
    const monitor = new BundleSizeMonitor();
    const sizes = new Map([
      ['main', 400 * 1024],
      ['vendor', 250 * 1024],
    ]);
    
    const reports = monitor.generateReport(sizes);
    expect(reports.length).toBe(2);
    expect(reports.some(r => r.name === 'main')).toBe(true);
  });

  it('should format bytes correctly', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1500)).toBe('1.5 KB');
    expect(formatBytes(1500000)).toBe('1.43 MB');
  });

  it('should analyze bundle composition', () => {
    const sizes = new Map([
      ['main', 500 * 1024],
      ['vendor', 300 * 1024],
      ['ui', 200 * 1024],
    ]);
    
    const composition = analyzeBundleComposition(sizes);
    expect(composition.total).toBe(1000 * 1024);
    expect(composition.largest[0].name).toBe('main');
    expect(composition.largest[0].percentage).toBeCloseTo(50, 1);
  });
});

describe('Tree Shaking Config', () => {
  it('should have default config', () => {
    expect(DEFAULT_TREE_SHAKING_CONFIG.enabled).toBe(true);
    expect(DEFAULT_TREE_SHAKING_CONFIG.sideEffectFreeModules.length).toBeGreaterThan(0);
    expect(DEFAULT_TREE_SHAKING_CONFIG.sideEffectModules.length).toBeGreaterThan(0);
  });

  it('should generate sideEffects config', () => {
    const config = generateSideEffectsConfig(DEFAULT_TREE_SHAKING_CONFIG);
    expect(config.sideEffects).toBeDefined();
    expect(Array.isArray(config.sideEffects)).toBe(true);
  });

  it('should mark all as side-effect when disabled', () => {
    const config = generateSideEffectsConfig({
      ...DEFAULT_TREE_SHAKING_CONFIG,
      enabled: false,
    });
    expect(config.sideEffects).toBe(true);
  });
});
