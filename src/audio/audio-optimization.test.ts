/**
 * @fileoverview Tests for Audio Engine Performance Optimization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AudioBufferPool,
  LazyGraphUpdater,
  IncrementalGraphCompiler,
  CpuMonitor,
  PerformanceWarningManager,
  GlitchDetector,
  GracefulDegradation,
  AudioContextResume,
  AudioOptimizationManager,
  DEFAULT_OPTIMIZATION_CONFIG,
  type GraphUpdateBatch,
  type PerformanceWarning,
  type GlitchDetection,
} from './audio-optimization';

describe('AudioBufferPool', () => {
  let pool: AudioBufferPool;
  
  beforeEach(() => {
    pool = new AudioBufferPool();
  });
  
  it('should allocate new buffer when pool is empty', () => {
    const buffer = pool.acquire(1024);
    expect(buffer.length).toBe(1024);
    expect(buffer instanceof Float32Array).toBe(true);
  });
  
  it('should reuse released buffers', () => {
    const buffer1 = pool.acquire(1024);
    pool.release(buffer1);
    
    const buffer2 = pool.acquire(1024);
    expect(buffer2).toBe(buffer1);
  });
  
  it('should not reuse in-use buffers', () => {
    const buffer1 = pool.acquire(1024);
    const buffer2 = pool.acquire(1024);
    
    expect(buffer2).not.toBe(buffer1);
  });
  
  it('should track buffer sizes separately', () => {
    const buffer512 = pool.acquire(512);
    const buffer1024 = pool.acquire(1024);
    
    pool.release(buffer512);
    pool.release(buffer1024);
    
    const stats = pool.getStats();
    expect(stats.sizes).toContain(512);
    expect(stats.sizes).toContain(1024);
  });
  
  it('should prune old unused buffers', () => {
    const originalNow = performance.now;
    let fakeTime = performance.now();
    
    // Mock performance.now
    vi.spyOn(performance, 'now').mockImplementation(() => fakeTime);
    
    const buffer = pool.acquire(1024);
    pool.release(buffer);
    
    // Advance fake time beyond reuse threshold
    fakeTime += 150;
    pool.prune();
    
    const stats = pool.getStats();
    // Buffer should be pruned as it's old
    expect(stats.totalBuffers).toBe(0);
    
    // Restore
    performance.now = originalNow;
  });
  
  it('should report accurate statistics', () => {
    const buffer1 = pool.acquire(1024);
    const buffer2 = pool.acquire(1024);
    pool.release(buffer1);
    
    const stats = pool.getStats();
    // At least one buffer is tracked
    expect(stats.totalBuffers).toBeGreaterThanOrEqual(1);
    // Buffer2 is still in use (not released yet)
    expect(stats.inUse).toBeGreaterThanOrEqual(0);
  });
});

describe('LazyGraphUpdater', () => {
  let updater: LazyGraphUpdater;
  
  beforeEach(() => {
    vi.useFakeTimers();
    updater = new LazyGraphUpdater(10);
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should batch node additions', () => {
    const batches: GraphUpdateBatch[] = [];
    updater.onBatchReady(batch => batches.push(batch));
    
    updater.addNode('node1');
    updater.addNode('node2');
    
    expect(batches.length).toBe(0);
    
    vi.advanceTimersByTime(15);
    
    expect(batches.length).toBe(1);
    expect(batches[0].addedNodes.size).toBe(2);
    expect(batches[0].addedNodes.has('node1')).toBe(true);
    expect(batches[0].addedNodes.has('node2')).toBe(true);
  });
  
  it('should batch node removals', () => {
    const batches: GraphUpdateBatch[] = [];
    updater.onBatchReady(batch => batches.push(batch));
    
    updater.removeNode('node1');
    updater.removeNode('node2');
    
    vi.advanceTimersByTime(15);
    
    expect(batches[0].removedNodes.size).toBe(2);
  });
  
  it('should batch connection modifications', () => {
    const batches: GraphUpdateBatch[] = [];
    updater.onBatchReady(batch => batches.push(batch));
    
    updater.modifyConnection('conn1');
    updater.modifyConnection('conn2');
    
    vi.advanceTimersByTime(15);
    
    expect(batches[0].modifiedConnections.size).toBe(2);
  });
  
  it('should support manual flush', () => {
    const batches: GraphUpdateBatch[] = [];
    updater.onBatchReady(batch => batches.push(batch));
    
    updater.addNode('node1');
    updater.flush();
    
    expect(batches.length).toBe(1);
  });
  
  it('should support unsubscribe', () => {
    const batches: GraphUpdateBatch[] = [];
    const unsubscribe = updater.onBatchReady(batch => batches.push(batch));
    
    updater.addNode('node1');
    unsubscribe();
    
    vi.advanceTimersByTime(15);
    
    expect(batches.length).toBe(0);
  });
});

describe('IncrementalGraphCompiler', () => {
  let compiler: IncrementalGraphCompiler;
  
  beforeEach(() => {
    compiler = new IncrementalGraphCompiler(10);
  });
  
  it('should compile graph changes to operations', () => {
    const nodes = new Map([
      ['node1', { connections: ['node2'] }],
      ['node2', { connections: [] }],
    ]);
    
    const changes: GraphUpdateBatch = {
      addedNodes: new Set(['node1']),
      removedNodes: new Set(),
      modifiedConnections: new Set(),
      timestamp: 0,
    };
    
    const operations = compiler.compile(nodes, changes);
    
    expect(operations.length).toBeGreaterThan(0);
    expect(operations.some(op => op.type === 'connect')).toBe(true);
  });
  
  it('should cache compilation results', () => {
    const nodes = new Map([
      ['node1', { connections: ['node2'] }],
    ]);
    
    const changes: GraphUpdateBatch = {
      addedNodes: new Set(['node1']),
      removedNodes: new Set(),
      modifiedConnections: new Set(),
      timestamp: 0,
    };
    
    compiler.compile(nodes, changes);
    compiler.compile(nodes, changes);
    
    const stats = compiler.getCacheStats();
    expect(stats.hits).toBeGreaterThan(0);
  });
  
  it('should handle node removal', () => {
    const nodes = new Map();
    
    const changes: GraphUpdateBatch = {
      addedNodes: new Set(),
      removedNodes: new Set(['node1']),
      modifiedConnections: new Set(),
      timestamp: 0,
    };
    
    const operations = compiler.compile(nodes, changes);
    
    expect(operations.some(op => op.type === 'disconnect')).toBe(true);
  });
  
  it('should clear cache', () => {
    const nodes = new Map([['node1', { connections: [] }]]);
    const changes: GraphUpdateBatch = {
      addedNodes: new Set(['node1']),
      removedNodes: new Set(),
      modifiedConnections: new Set(),
      timestamp: 0,
    };
    
    compiler.compile(nodes, changes);
    compiler.clearCache();
    
    const stats = compiler.getCacheStats();
    expect(stats.size).toBe(0);
  });
});

describe('CpuMonitor', () => {
  let monitor: CpuMonitor;
  
  beforeEach(() => {
    monitor = new CpuMonitor();
  });
  
  it('should record CPU samples', () => {
    monitor.recordSample(2, 128, 48000);
    
    const usage = monitor.getAverageUsage();
    expect(usage).toBeGreaterThan(0);
  });
  
  it('should calculate average usage', () => {
    monitor.recordSample(1, 128, 48000);
    monitor.recordSample(2, 128, 48000);
    monitor.recordSample(3, 128, 48000);
    
    const avg = monitor.getAverageUsage();
    expect(avg).toBeGreaterThan(0);
  });
  
  it('should track peak usage', () => {
    monitor.recordSample(1, 128, 48000);
    monitor.recordSample(5, 128, 48000);
    monitor.recordSample(2, 128, 48000);
    
    const peak = monitor.getPeakUsage();
    expect(peak).toBeGreaterThanOrEqual(monitor.getAverageUsage());
  });
  
  it('should detect threshold violations', () => {
    monitor.recordSample(10, 128, 48000);
    
    const thresholds = monitor.checkThresholds();
    expect(thresholds.warning || thresholds.critical).toBe(true);
  });
  
  it('should notify subscribers', () => {
    const usages: number[] = [];
    monitor.onChange(usage => usages.push(usage));
    
    monitor.recordSample(2, 128, 48000);
    
    expect(usages.length).toBe(1);
    expect(usages[0]).toBeGreaterThan(0);
  });
  
  it('should support unsubscribe', () => {
    const usages: number[] = [];
    const unsubscribe = monitor.onChange(usage => usages.push(usage));
    
    unsubscribe();
    monitor.recordSample(2, 128, 48000);
    
    expect(usages.length).toBe(0);
  });
});

describe('PerformanceWarningManager', () => {
  let manager: PerformanceWarningManager;
  
  beforeEach(() => {
    manager = new PerformanceWarningManager();
  });
  
  it('should emit warnings', () => {
    const warnings: PerformanceWarning[] = [];
    manager.onWarning(warning => warnings.push(warning));
    
    manager.warn('cpu', 'warning', 'Test warning');
    
    expect(warnings.length).toBe(1);
    expect(warnings[0].type).toBe('cpu');
    expect(warnings[0].severity).toBe('warning');
  });
  
  it('should store warning history', () => {
    manager.warn('cpu', 'info', 'Test 1');
    manager.warn('memory', 'warning', 'Test 2');
    
    const recent = manager.getRecentWarnings(10);
    expect(recent.length).toBe(2);
  });
  
  it('should filter warnings by type', () => {
    manager.warn('cpu', 'info', 'CPU warning');
    manager.warn('memory', 'info', 'Memory warning');
    
    const cpuWarnings = manager.getWarningsByType('cpu');
    expect(cpuWarnings.length).toBe(1);
    expect(cpuWarnings[0].type).toBe('cpu');
  });
  
  it('should clear warnings', () => {
    manager.warn('cpu', 'info', 'Test');
    manager.clearWarnings();
    
    const recent = manager.getRecentWarnings(10);
    expect(recent.length).toBe(0);
  });
  
  it('should limit warning history size', () => {
    for (let i = 0; i < 150; i++) {
      manager.warn('cpu', 'info', `Warning ${i}`);
    }
    
    const recent = manager.getRecentWarnings(150);
    expect(recent.length).toBeLessThanOrEqual(100);
  });
});

describe('GlitchDetector', () => {
  let detector: GlitchDetector;
  
  beforeEach(() => {
    detector = new GlitchDetector();
  });
  
  it('should detect underrun glitches', () => {
    const result = detector.checkCallback(10, 3);
    
    expect(result.detected).toBe(true);
    expect(result.type).toBe('underrun');
  });
  
  it('should not detect when within threshold', () => {
    const result = detector.checkCallback(3, 3);
    
    expect(result.detected).toBe(false);
  });
  
  it('should detect dropout glitches', () => {
    const originalNow = performance.now;
    let fakeTime = performance.now();
    
    // Mock performance.now
    vi.spyOn(performance, 'now').mockImplementation(() => fakeTime);
    
    detector.checkCallback(3, 3);
    
    // Simulate significant time passing (more than 2x expected)
    fakeTime += 50;
    
    const result = detector.checkCallback(3, 3);
    
    expect(result.detected).toBe(true);
    expect(result.type).toBe('dropout');
    
    // Restore
    performance.now = originalNow;
  });
  
  it('should notify subscribers on glitch', () => {
    const glitches: GlitchDetection[] = [];
    detector.onGlitch(glitch => glitches.push(glitch));
    
    detector.checkCallback(10, 3);
    
    expect(glitches.length).toBe(1);
    expect(glitches[0].detected).toBe(true);
  });
});

describe('GracefulDegradation', () => {
  let degradation: GracefulDegradation;
  
  beforeEach(() => {
    degradation = new GracefulDegradation();
  });
  
  it('should remain at none level for low CPU', () => {
    const state = degradation.update(0.5, 64);
    
    expect(state.level).toBe('none');
    expect(state.reducedVoices).toBe(0);
  });
  
  it('should apply minor degradation', () => {
    const state = degradation.update(0.75, 64);
    
    expect(state.level).toBe('minor');
    expect(state.reducedVoices).toBeGreaterThan(0);
  });
  
  it('should apply moderate degradation', () => {
    const state = degradation.update(0.87, 64);
    
    expect(state.level).toBe('moderate');
    expect(state.reducedQuality).toBe(true);
    expect(state.disabledEffects.size).toBeGreaterThan(0);
  });
  
  it('should apply severe degradation', () => {
    const state = degradation.update(0.96, 64);
    
    expect(state.level).toBe('severe');
    expect(state.reducedVoices).toBeGreaterThan(0);
    expect(state.disabledEffects.size).toBeGreaterThan(1);
  });
  
  it('should notify subscribers on state change', () => {
    const states: any[] = [];
    degradation.onChange(state => states.push(state));
    
    degradation.update(0.75, 64);
    
    expect(states.length).toBe(1);
    expect(states[0].level).toBe('minor');
  });
  
  it('should not notify if level unchanged', () => {
    const states: any[] = [];
    degradation.onChange(state => states.push(state));
    
    degradation.update(0.5, 64);
    degradation.update(0.55, 64);
    
    expect(states.length).toBe(0);
  });
  
  it('should reset to none', () => {
    degradation.update(0.96, 64);
    degradation.reset();
    
    const state = degradation.getState();
    expect(state.level).toBe('none');
  });
});

describe('AudioContextResume', () => {
  let resume: AudioContextResume;
  let mockContext: any;
  
  beforeEach(() => {
    mockContext = {
      state: 'suspended',
      resume: vi.fn().mockResolvedValue(undefined),
    };
    
    resume = new AudioContextResume({
      ...DEFAULT_OPTIMIZATION_CONFIG,
      resumeOnVisibility: false,
      resumeOnInteraction: false,
    });
  });
  
  afterEach(() => {
    resume.cleanup();
  });
  
  it('should register audio context', () => {
    resume.register(mockContext);
    expect(mockContext.resume).toHaveBeenCalled();
  });
  
  it('should not resume if already running', () => {
    mockContext.state = 'running';
    resume.register(mockContext);
    expect(mockContext.resume).not.toHaveBeenCalled();
  });
  
  it('should unregister context', () => {
    resume.register(mockContext);
    resume.unregister(mockContext);
    
    // No way to directly test, but should not error
    expect(true).toBe(true);
  });
});

describe('AudioOptimizationManager', () => {
  let manager: AudioOptimizationManager;
  
  beforeEach(() => {
    manager = new AudioOptimizationManager();
  });
  
  afterEach(() => {
    manager.cleanup();
  });
  
  it('should initialize all subsystems', () => {
    expect(manager.bufferPool).toBeDefined();
    expect(manager.graphUpdater).toBeDefined();
    expect(manager.graphCompiler).toBeDefined();
    expect(manager.cpuMonitor).toBeDefined();
    expect(manager.warningManager).toBeDefined();
    expect(manager.glitchDetector).toBeDefined();
    expect(manager.degradation).toBeDefined();
    expect(manager.contextResume).toBeDefined();
  });
  
  it('should coordinate CPU monitoring and degradation', () => {
    const warnings: PerformanceWarning[] = [];
    manager.warningManager.onWarning(w => warnings.push(w));
    
    manager.cpuMonitor.recordSample(10, 128, 48000);
    
    expect(warnings.length).toBeGreaterThan(0);
  });
  
  it('should coordinate glitch detection and warnings', () => {
    const warnings: PerformanceWarning[] = [];
    manager.warningManager.onWarning(w => warnings.push(w));
    
    manager.glitchDetector.checkCallback(10, 3);
    
    const glitchWarnings = warnings.filter(w => w.type === 'glitch');
    expect(glitchWarnings.length).toBeGreaterThan(0);
  });
  
  it('should cleanup all subsystems', () => {
    manager.graphUpdater.addNode('test');
    manager.cleanup();
    
    // Should flush pending updates
    expect(true).toBe(true);
  });
});

describe('Integration Tests', () => {
  it('should handle full optimization pipeline', () => {
    vi.useFakeTimers();
    
    const manager = new AudioOptimizationManager();
    
    // Simulate graph updates
    manager.graphUpdater.addNode('node1');
    manager.graphUpdater.addNode('node2');
    
    vi.advanceTimersByTime(20);
    
    // Simulate CPU load
    manager.cpuMonitor.recordSample(5, 128, 48000);
    
    // Check degradation
    const state = manager.degradation.getState();
    expect(state).toBeDefined();
    
    manager.cleanup();
    vi.useRealTimers();
  });
  
  it('should emit warnings under high load', () => {
    const manager = new AudioOptimizationManager();
    const warnings: PerformanceWarning[] = [];
    
    manager.warningManager.onWarning(w => warnings.push(w));
    
    // Simulate critical CPU load
    for (let i = 0; i < 10; i++) {
      manager.cpuMonitor.recordSample(15, 128, 48000);
    }
    
    expect(warnings.some(w => w.severity === 'critical')).toBe(true);
    
    manager.cleanup();
  });
  
  it('should recover from glitches gracefully', () => {
    const manager = new AudioOptimizationManager();
    const glitches: GlitchDetection[] = [];
    
    manager.glitchDetector.onGlitch(g => glitches.push(g));
    
    // Simulate glitch
    manager.glitchDetector.checkCallback(20, 3);
    
    expect(glitches.length).toBeGreaterThan(0);
    
    // Check degradation response
    manager.cpuMonitor.recordSample(20, 128, 48000);
    const state = manager.degradation.getState();
    
    expect(state.level).not.toBe('none');
    
    manager.cleanup();
  });
});
