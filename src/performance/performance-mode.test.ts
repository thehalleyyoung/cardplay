/**
 * Tests for Performance Mode System (M364)
 */

import {
  PerformanceModeStore,
  PerformanceModeConfig,
  PerformanceMetrics,
  DEFAULT_PERFORMANCE_CONFIG,
  PERFORMANCE_FEATURES,
  getRecommendedConfig,
  calculateStabilityScore,
} from './performance-mode';

describe('Performance Mode Store', () => {
  let store: PerformanceModeStore;
  
  beforeEach(() => {
    store = new PerformanceModeStore();
  });
  
  describe('initialization', () => {
    test('starts with default config', () => {
      const config = store.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.disableNonEssential).toBe(true);
      expect(config.bufferMultiplier).toBe(2);
    });
    
    test('accepts custom config', () => {
      const customStore = new PerformanceModeStore({ bufferMultiplier: 4 });
      expect(customStore.getConfig().bufferMultiplier).toBe(4);
    });
    
    test('starts inactive', () => {
      expect(store.isActive()).toBe(false);
    });
    
    test('has feature registry', () => {
      const features = store.getFeatures();
      expect(features.length).toBeGreaterThan(0);
    });
  });
  
  describe('enable/disable', () => {
    test('enables performance mode', () => {
      const result = store.enable();
      
      expect(result.success).toBe(true);
      expect(store.isActive()).toBe(true);
    });
    
    test('returns warnings on enable', () => {
      store.updateConfig({ disableUndo: true, disableAutoSave: true });
      const result = store.enable();
      
      expect(result.warnings).toContain('Undo/Redo is disabled - changes cannot be reverted');
      expect(result.warnings).toContain('Auto-save is disabled - remember to save manually');
    });
    
    test('disables non-essential features on enable', () => {
      store.enable();
      
      const nonEssential = store.getNonEssentialFeatures();
      nonEssential.forEach(f => {
        expect(f.currentState).not.toBe('enabled');
      });
    });
    
    test('disables performance mode', () => {
      store.enable();
      store.disable();
      
      expect(store.isActive()).toBe(false);
    });
    
    test('restores feature states on disable', () => {
      const originalFeatures = store.getFeatures().map(f => ({ id: f.id, state: f.currentState }));
      
      store.enable();
      store.disable();
      
      const restoredFeatures = store.getFeatures();
      originalFeatures.forEach(orig => {
        const restored = restoredFeatures.find(f => f.id === orig.id);
        expect(restored?.currentState).toBe(orig.state);
      });
    });
    
    test('toggle switches state', () => {
      expect(store.isActive()).toBe(false);
      
      store.toggle();
      expect(store.isActive()).toBe(true);
      
      store.toggle();
      expect(store.isActive()).toBe(false);
    });
    
    test('records start time on enable', () => {
      store.enable();
      
      const state = store.getState();
      expect(state.startTime).not.toBeNull();
      expect(state.startTime).toBeGreaterThan(0);
    });
    
    test('clears start time on disable', () => {
      store.enable();
      store.disable();
      
      const state = store.getState();
      expect(state.startTime).toBeNull();
    });
  });
  
  describe('feature management', () => {
    test('gets all features', () => {
      const features = store.getFeatures();
      expect(features.length).toBe(PERFORMANCE_FEATURES.length);
    });
    
    test('gets feature by id', () => {
      const feature = store.getFeature('waveform-display');
      expect(feature).toBeDefined();
      expect(feature?.name).toBe('Waveform Display');
    });
    
    test('gets non-essential features', () => {
      const features = store.getNonEssentialFeatures();
      features.forEach(f => {
        expect(f.essential).toBe(false);
      });
    });
    
    test('gets high CPU features', () => {
      const features = store.getHighCPUFeatures();
      features.forEach(f => {
        expect(f.cpuImpact).toBe('high');
      });
    });
    
    test('essential features include audio engine', () => {
      const audioEngine = store.getFeature('audio-engine');
      expect(audioEngine?.essential).toBe(true);
    });
  });
  
  describe('config updates', () => {
    test('updates config', () => {
      store.updateConfig({ bufferMultiplier: 4, cpuThreshold: 90 });
      
      const config = store.getConfig();
      expect(config.bufferMultiplier).toBe(4);
      expect(config.cpuThreshold).toBe(90);
    });
    
    test('notifies listeners on config update', () => {
      const listener = jest.fn();
      store.subscribe(listener);
      
      store.updateConfig({ lockLayout: false });
      
      expect(listener).toHaveBeenCalled();
    });
  });
  
  describe('metrics', () => {
    test('records metrics', () => {
      store.recordMetrics({
        cpuUsage: 50,
        memoryUsage: 500,
        audioBufferUsage: 30,
        droppedFrames: 0,
        latency: 10,
      });
      
      const metrics = store.getMetrics();
      expect(metrics).not.toBeNull();
      expect(metrics?.cpuUsage).toBe(50);
    });
    
    test('adds timestamp to metrics', () => {
      store.recordMetrics({
        cpuUsage: 50,
        memoryUsage: 500,
        audioBufferUsage: 30,
        droppedFrames: 0,
        latency: 10,
      });
      
      const metrics = store.getMetrics();
      expect(metrics?.timestamp).toBeGreaterThan(0);
    });
    
    test('maintains metrics history', () => {
      for (let i = 0; i < 5; i++) {
        store.recordMetrics({
          cpuUsage: 50 + i,
          memoryUsage: 500,
          audioBufferUsage: 30,
          droppedFrames: 0,
          latency: 10,
        });
      }
      
      const history = store.getMetricsHistory();
      expect(history.length).toBe(5);
    });
    
    test('limits history size', () => {
      for (let i = 0; i < 150; i++) {
        store.recordMetrics({
          cpuUsage: 50,
          memoryUsage: 500,
          audioBufferUsage: 30,
          droppedFrames: 0,
          latency: 10,
        });
      }
      
      const history = store.getMetricsHistory();
      expect(history.length).toBe(100);
    });
    
    test('generates warnings for high CPU', () => {
      store.recordMetrics({
        cpuUsage: 95,
        memoryUsage: 500,
        audioBufferUsage: 30,
        droppedFrames: 0,
        latency: 10,
      });
      
      const state = store.getState();
      expect(state.warnings.some(w => w.includes('CPU'))).toBe(true);
    });
    
    test('generates warnings for dropped frames', () => {
      store.recordMetrics({
        cpuUsage: 50,
        memoryUsage: 500,
        audioBufferUsage: 30,
        droppedFrames: 5,
        latency: 10,
      });
      
      const state = store.getState();
      expect(state.warnings.some(w => w.includes('dropout'))).toBe(true);
    });
    
    test('generates warnings for high latency', () => {
      store.recordMetrics({
        cpuUsage: 50,
        memoryUsage: 500,
        audioBufferUsage: 30,
        droppedFrames: 0,
        latency: 100,
      });
      
      const state = store.getState();
      expect(state.warnings.some(w => w.includes('latency'))).toBe(true);
    });
  });
  
  describe('HUD', () => {
    test('returns HUD data', () => {
      store.recordMetrics({
        cpuUsage: 50,
        memoryUsage: 500,
        audioBufferUsage: 30,
        droppedFrames: 0,
        latency: 10,
      });
      
      const hud = store.getHUD();
      expect(hud.cpuUsage).toBe(50);
      expect(hud.memoryUsage).toBe(500);
      expect(hud.latency).toBe(10);
    });
    
    test('returns zero values before metrics', () => {
      const hud = store.getHUD();
      expect(hud.cpuUsage).toBe(0);
      expect(hud.memoryUsage).toBe(0);
    });
  });
  
  describe('panic', () => {
    test('adds warning on panic', () => {
      store.panic();
      
      const state = store.getState();
      expect(state.warnings.some(w => w.includes('Panic'))).toBe(true);
    });
  });
  
  describe('precheck', () => {
    test('returns ready when conditions good', () => {
      const result = store.precheck();
      expect(result.ready).toBe(true);
      expect(result.issues.length).toBe(0);
    });
    
    test('returns issues for high CPU', () => {
      store.recordMetrics({
        cpuUsage: 80,
        memoryUsage: 500,
        audioBufferUsage: 30,
        droppedFrames: 0,
        latency: 10,
      });
      
      const result = store.precheck();
      expect(result.issues.some(i => i.includes('CPU'))).toBe(true);
    });
    
    test('returns issues for high memory', () => {
      store.recordMetrics({
        cpuUsage: 50,
        memoryUsage: 2000,
        audioBufferUsage: 30,
        droppedFrames: 0,
        latency: 10,
      });
      
      const result = store.precheck();
      expect(result.issues.some(i => i.includes('Memory'))).toBe(true);
    });
  });
  
  describe('session duration', () => {
    test('returns 0 when not active', () => {
      expect(store.getSessionDuration()).toBe(0);
    });
    
    test('returns duration when active', async () => {
      store.enable();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(store.getSessionDuration()).toBeGreaterThan(0);
    });
  });
  
  describe('listeners', () => {
    test('notifies on enable', () => {
      const listener = jest.fn();
      store.subscribe(listener);
      
      store.enable();
      
      expect(listener).toHaveBeenCalled();
    });
    
    test('notifies on disable', () => {
      const listener = jest.fn();
      store.enable();
      store.subscribe(listener);
      
      store.disable();
      
      expect(listener).toHaveBeenCalled();
    });
    
    test('unsubscribe stops notifications', () => {
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);
      
      unsubscribe();
      store.enable();
      
      expect(listener).not.toHaveBeenCalled();
    });
  });
  
  describe('clear', () => {
    test('clears state and history', () => {
      store.enable();
      store.recordMetrics({
        cpuUsage: 50,
        memoryUsage: 500,
        audioBufferUsage: 30,
        droppedFrames: 0,
        latency: 10,
      });
      
      store.clear();
      
      expect(store.isActive()).toBe(false);
      expect(store.getMetricsHistory().length).toBe(0);
    });
  });
});

describe('Recommended Configs', () => {
  test('DJ config prioritizes stability', () => {
    const config = getRecommendedConfig('dj');
    expect(config.lockLayout).toBe(true);
    expect(config.panicButtonEnabled).toBe(true);
  });
  
  test('live-band config has MIDI panic', () => {
    const config = getRecommendedConfig('live-band');
    expect(config.midiPanicOnEnable).toBe(true);
    expect(config.bufferMultiplier).toBe(3);
  });
  
  test('studio config allows more features', () => {
    const config = getRecommendedConfig('studio');
    expect(config.disableNonEssential).toBe(false);
    expect(config.reduceVisualEffects).toBe(false);
  });
  
  test('streaming config shows HUD', () => {
    const config = getRecommendedConfig('streaming');
    expect(config.showPerformanceHUD).toBe(true);
  });
});

describe('Stability Score', () => {
  test('returns 100 for empty metrics', () => {
    expect(calculateStabilityScore([])).toBe(100);
  });
  
  test('returns high score for good metrics', () => {
    const metrics: PerformanceMetrics[] = [
      { cpuUsage: 30, memoryUsage: 500, audioBufferUsage: 30, droppedFrames: 0, latency: 5, timestamp: 1 },
      { cpuUsage: 35, memoryUsage: 500, audioBufferUsage: 30, droppedFrames: 0, latency: 6, timestamp: 2 },
    ];
    
    expect(calculateStabilityScore(metrics)).toBe(100);
  });
  
  test('penalizes high CPU', () => {
    const metrics: PerformanceMetrics[] = [
      { cpuUsage: 85, memoryUsage: 500, audioBufferUsage: 30, droppedFrames: 0, latency: 5, timestamp: 1 },
    ];
    
    expect(calculateStabilityScore(metrics)).toBeLessThan(100);
  });
  
  test('penalizes dropped frames', () => {
    const metrics: PerformanceMetrics[] = [
      { cpuUsage: 30, memoryUsage: 500, audioBufferUsage: 30, droppedFrames: 5, latency: 5, timestamp: 1 },
    ];
    
    expect(calculateStabilityScore(metrics)).toBeLessThan(100);
  });
  
  test('penalizes high latency', () => {
    const metrics: PerformanceMetrics[] = [
      { cpuUsage: 30, memoryUsage: 500, audioBufferUsage: 30, droppedFrames: 0, latency: 100, timestamp: 1 },
    ];
    
    expect(calculateStabilityScore(metrics)).toBeLessThan(100);
  });
  
  test('accumulates penalties', () => {
    const goodMetrics: PerformanceMetrics[] = [
      { cpuUsage: 30, memoryUsage: 500, audioBufferUsage: 30, droppedFrames: 0, latency: 5, timestamp: 1 },
    ];
    
    const badMetrics: PerformanceMetrics[] = [
      { cpuUsage: 90, memoryUsage: 500, audioBufferUsage: 30, droppedFrames: 15, latency: 100, timestamp: 1 },
    ];
    
    expect(calculateStabilityScore(badMetrics)).toBeLessThan(calculateStabilityScore(goodMetrics));
  });
  
  test('never goes below 0', () => {
    const terribleMetrics: PerformanceMetrics[] = [
      { cpuUsage: 100, memoryUsage: 5000, audioBufferUsage: 100, droppedFrames: 1000, latency: 500, timestamp: 1 },
    ];
    
    expect(calculateStabilityScore(terribleMetrics)).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// M150: Performance Mode Layout Accessibility
// ============================================================================

describe('M150: Performance Mode Layout Accessibility', () => {
  let store: PerformanceModeStore;
  
  beforeEach(() => {
    store = new PerformanceModeStore();
  });
  
  describe('HUD visibility', () => {
    test('HUD is available in performance mode', () => {
      store.enable();
      
      const hudConfig = store.getHUDConfig();
      expect(hudConfig).toBeDefined();
      expect(hudConfig.visible).toBe(true);
    });
    
    test('HUD position can be configured', () => {
      store.updateConfig({ hudPosition: 'bottom-right' });
      
      const hudConfig = store.getHUDConfig();
      expect(['top-left', 'top-right', 'bottom-left', 'bottom-right']).toContain(hudConfig.position);
    });
    
    test('HUD shows critical metrics', () => {
      store.enable();
      store.recordMetrics({
        cpuUsage: 45,
        memoryUsage: 800,
        audioBufferUsage: 25,
        droppedFrames: 0,
        latency: 8,
        timestamp: Date.now(),
      });
      
      const hudConfig = store.getHUDConfig();
      expect(hudConfig.showCpu).toBe(true);
      expect(hudConfig.showLatency).toBe(true);
    });
  });
  
  describe('panic button accessibility', () => {
    test('panic is available during performance', () => {
      store.enable();
      
      // Should not throw
      expect(() => store.panic()).not.toThrow();
    });
    
    test('panic immediately clears audio', () => {
      store.enable();
      const result = store.panic();
      
      expect(result.audioCleared).toBe(true);
      expect(result.timestamp).toBeGreaterThan(0);
    });
  });
  
  describe('large touch targets', () => {
    test('features have accessibility metadata', () => {
      const features = store.getFeatures();
      
      features.forEach(feature => {
        expect(feature.id).toBeDefined();
        expect(feature.name).toBeDefined();
      });
    });
  });
  
  describe('keyboard navigation', () => {
    test('config includes keyboard shortcuts', () => {
      const config = store.getConfig();
      
      // Performance mode should define essential shortcuts
      expect(config.enablePanicShortcut).toBe(true);
    });
  });
});

// ============================================================================
// M369: Performance Mode Stability Under Load
// ============================================================================

describe('M369: Performance Mode Stability Under Load', () => {
  let store: PerformanceModeStore;
  
  beforeEach(() => {
    store = new PerformanceModeStore();
    store.enable();
  });
  
  describe('metric recording under load', () => {
    test('handles rapid metric recording', () => {
      // Simulate rapid metric updates (every 16ms for 60fps)
      for (let i = 0; i < 1000; i++) {
        store.recordMetrics({
          cpuUsage: 40 + Math.random() * 20,
          memoryUsage: 500 + Math.random() * 200,
          audioBufferUsage: 20 + Math.random() * 30,
          droppedFrames: Math.floor(Math.random() * 2),
          latency: 5 + Math.random() * 10,
          timestamp: Date.now() + i,
        });
      }
      
      // Should still be stable
      expect(store.isActive()).toBe(true);
      expect(store.getStabilityScore()).toBeGreaterThan(0);
    });
    
    test('maintains metric history limit', () => {
      // Record many metrics
      for (let i = 0; i < 5000; i++) {
        store.recordMetrics({
          cpuUsage: 50,
          memoryUsage: 600,
          audioBufferUsage: 30,
          droppedFrames: 0,
          latency: 10,
          timestamp: i,
        });
      }
      
      // History should be bounded, not grow infinitely
      const history = store.getMetricsHistory();
      expect(history.length).toBeLessThanOrEqual(1000); // Reasonable bound
    });
  });
  
  describe('stability under varying conditions', () => {
    test('detects degraded performance', () => {
      // Good conditions
      store.recordMetrics({
        cpuUsage: 30,
        memoryUsage: 400,
        audioBufferUsage: 20,
        droppedFrames: 0,
        latency: 5,
        timestamp: 1,
      });
      
      const goodScore = store.getStabilityScore();
      
      // Degraded conditions
      for (let i = 0; i < 10; i++) {
        store.recordMetrics({
          cpuUsage: 90,
          memoryUsage: 1500,
          audioBufferUsage: 80,
          droppedFrames: 10,
          latency: 50,
          timestamp: 100 + i,
        });
      }
      
      const badScore = store.getStabilityScore();
      expect(badScore).toBeLessThan(goodScore);
    });
    
    test('maintains stability with consistent load', () => {
      // Consistent moderate load
      for (let i = 0; i < 100; i++) {
        store.recordMetrics({
          cpuUsage: 55,
          memoryUsage: 700,
          audioBufferUsage: 40,
          droppedFrames: 0,
          latency: 12,
          timestamp: i,
        });
      }
      
      // Score should stabilize
      const score = store.getStabilityScore();
      expect(score).toBeGreaterThan(60); // Acceptable stability
    });
  });
  
  describe('feature disabling under load', () => {
    test('high CPU features are disabled', () => {
      const highCpuFeatures = store.getHighCPUFeatures();
      
      expect(highCpuFeatures.length).toBeGreaterThan(0);
      highCpuFeatures.forEach(f => {
        expect(f.currentState).not.toBe('enabled');
      });
    });
    
    test('non-essential features remain disabled under load', () => {
      // Simulate load
      for (let i = 0; i < 50; i++) {
        store.recordMetrics({
          cpuUsage: 75,
          memoryUsage: 900,
          audioBufferUsage: 50,
          droppedFrames: 2,
          latency: 20,
          timestamp: i,
        });
      }
      
      const nonEssential = store.getNonEssentialFeatures();
      nonEssential.forEach(f => {
        expect(f.currentState).not.toBe('enabled');
      });
    });
  });
  
  describe('recovery after panic', () => {
    test('panic clears resources', () => {
      // Add some load
      for (let i = 0; i < 10; i++) {
        store.recordMetrics({
          cpuUsage: 85,
          memoryUsage: 1200,
          audioBufferUsage: 70,
          droppedFrames: 5,
          latency: 40,
          timestamp: i,
        });
      }
      
      const result = store.panic();
      
      expect(result.audioCleared).toBe(true);
      // After panic, mode should still be active but ready for clean state
      expect(store.isActive()).toBe(true);
    });
    
    test('can continue after panic', () => {
      store.panic();
      
      // Should still be able to record metrics
      expect(() => {
        store.recordMetrics({
          cpuUsage: 30,
          memoryUsage: 400,
          audioBufferUsage: 20,
          droppedFrames: 0,
          latency: 5,
          timestamp: Date.now(),
        });
      }).not.toThrow();
    });
  });
  
  describe('precheck validation', () => {
    test('precheck identifies potential issues', () => {
      // First disable to run precheck
      store.disable();
      
      const precheck = store.runPrecheck();
      
      expect(precheck.passed).toBeDefined();
      expect(Array.isArray(precheck.warnings)).toBe(true);
      expect(Array.isArray(precheck.errors)).toBe(true);
    });
    
    test('precheck is fast even with many features', () => {
      store.disable();
      
      const start = Date.now();
      store.runPrecheck();
      const duration = Date.now() - start;
      
      // Should complete quickly (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
