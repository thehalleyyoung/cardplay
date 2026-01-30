/**
 * Performance Mode System
 * 
 * Implements M364: Implement "Performance Mode" for live use.
 * Provides stable, low-latency mode for live performance.
 */

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/** Performance mode configuration */
export interface PerformanceModeConfig {
  /** Enable performance mode */
  enabled: boolean;
  
  /** Disable non-essential features for stability */
  disableNonEssential: boolean;
  
  /** Reduce visual effects for lower CPU usage */
  reduceVisualEffects: boolean;
  
  /** Increase buffer size for stability */
  bufferMultiplier: number; // 1-4
  
  /** Disable undo/redo during performance */
  disableUndo: boolean;
  
  /** Disable auto-save during performance */
  disableAutoSave: boolean;
  
  /** Lock deck layout during performance */
  lockLayout: boolean;
  
  /** Panic button enabled (stop all audio) */
  panicButtonEnabled: boolean;
  
  /** MIDI panic on enable */
  midiPanicOnEnable: boolean;
  
  /** Pre-load all samples before enabling */
  preloadSamples: boolean;
  
  /** Disable AI suggestions during performance */
  disableAISuggestions: boolean;
  
  /** Maximum CPU usage threshold (0-100) */
  cpuThreshold: number;
  
  /** Show performance HUD */
  showPerformanceHUD: boolean;
  
  /** HUD position */
  hudPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /** Show keyboard shortcuts */
  keyboardShortcuts?: boolean;
}

/** Feature that can be disabled in performance mode */
export interface PerformanceFeature {
  id: string;
  name: string;
  category: 'visual' | 'ai' | 'editing' | 'system' | 'audio';
  essential: boolean;
  cpuImpact: 'low' | 'medium' | 'high';
  currentState: 'enabled' | 'disabled' | 'reduced';
}

/** Performance metrics */
export interface PerformanceMetrics {
  cpuUsage: number; // 0-100
  memoryUsage: number; // MB
  audioBufferUsage: number; // 0-100
  droppedFrames: number;
  latency: number; // ms
  timestamp: number;
}

/** Performance HUD data */
export interface PerformanceHUD {
  cpuUsage: number;
  memoryUsage: number;
  latency: number;
  droppedFrames: number;
  midiActivity: boolean;
  audioClipping: boolean;
  warnings: string[];
}

/** HUD configuration */
export interface HUDConfig {
  visible: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showCpu: boolean;
  showLatency: boolean;
  showMemory: boolean;
  showDroppedFrames: boolean;
}

/** Panic result */
export interface PanicResult {
  audioCleared: boolean;
  timestamp: number;
}

/** Precheck result */
export interface PrecheckResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
}

/** Performance mode state */
export interface PerformanceModeState {
  active: boolean;
  startTime: number | null;
  config: PerformanceModeConfig;
  disabledFeatures: string[];
  metrics: PerformanceMetrics | null;
  warnings: string[];
}

// --------------------------------------------------------------------------
// Default configuration
// --------------------------------------------------------------------------

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceModeConfig = {
  enabled: false,
  disableNonEssential: true,
  reduceVisualEffects: true,
  bufferMultiplier: 2,
  disableUndo: true,
  disableAutoSave: true,
  lockLayout: true,
  panicButtonEnabled: true,
  midiPanicOnEnable: false,
  preloadSamples: true,
  disableAISuggestions: true,
  cpuThreshold: 80,
  showPerformanceHUD: true,
  hudPosition: 'top-right',
  keyboardShortcuts: true,
};

// --------------------------------------------------------------------------
// Feature registry
// --------------------------------------------------------------------------

export const PERFORMANCE_FEATURES: PerformanceFeature[] = [
  // Visual features
  { id: 'waveform-display', name: 'Waveform Display', category: 'visual', essential: false, cpuImpact: 'medium', currentState: 'enabled' },
  { id: 'spectrum-analyzer', name: 'Spectrum Analyzer', category: 'visual', essential: false, cpuImpact: 'high', currentState: 'enabled' },
  { id: 'smooth-scrolling', name: 'Smooth Scrolling', category: 'visual', essential: false, cpuImpact: 'low', currentState: 'enabled' },
  { id: 'animations', name: 'UI Animations', category: 'visual', essential: false, cpuImpact: 'low', currentState: 'enabled' },
  { id: 'meter-updates', name: 'VU Meter Updates', category: 'visual', essential: true, cpuImpact: 'medium', currentState: 'enabled' },
  
  // AI features
  { id: 'ai-suggestions', name: 'AI Suggestions', category: 'ai', essential: false, cpuImpact: 'medium', currentState: 'enabled' },
  { id: 'learning-tracking', name: 'Learning Tracking', category: 'ai', essential: false, cpuImpact: 'low', currentState: 'enabled' },
  { id: 'context-help', name: 'Context Help', category: 'ai', essential: false, cpuImpact: 'low', currentState: 'enabled' },
  
  // Editing features
  { id: 'undo-redo', name: 'Undo/Redo', category: 'editing', essential: false, cpuImpact: 'low', currentState: 'enabled' },
  { id: 'auto-save', name: 'Auto-Save', category: 'editing', essential: false, cpuImpact: 'medium', currentState: 'enabled' },
  { id: 'clipboard', name: 'Clipboard', category: 'editing', essential: true, cpuImpact: 'low', currentState: 'enabled' },
  
  // System features
  { id: 'background-tasks', name: 'Background Tasks', category: 'system', essential: false, cpuImpact: 'medium', currentState: 'enabled' },
  { id: 'file-monitoring', name: 'File Monitoring', category: 'system', essential: false, cpuImpact: 'low', currentState: 'enabled' },
  { id: 'crash-reporter', name: 'Crash Reporter', category: 'system', essential: true, cpuImpact: 'low', currentState: 'enabled' },
  
  // Audio features
  { id: 'audio-engine', name: 'Audio Engine', category: 'audio', essential: true, cpuImpact: 'high', currentState: 'enabled' },
  { id: 'midi-input', name: 'MIDI Input', category: 'audio', essential: true, cpuImpact: 'low', currentState: 'enabled' },
  { id: 'audio-recording', name: 'Audio Recording', category: 'audio', essential: false, cpuImpact: 'medium', currentState: 'enabled' },
];

// --------------------------------------------------------------------------
// Performance Mode Store
// --------------------------------------------------------------------------

export class PerformanceModeStore {
  private state: PerformanceModeState;
  private metricsHistory: PerformanceMetrics[] = [];
  private listeners: Set<(state: PerformanceModeState) => void> = new Set();
  private features: Map<string, PerformanceFeature> = new Map();
  private savedFeatureStates: Map<string, 'enabled' | 'disabled' | 'reduced'> = new Map();
  
  constructor(config?: Partial<PerformanceModeConfig>) {
    this.state = {
      active: false,
      startTime: null,
      config: { ...DEFAULT_PERFORMANCE_CONFIG, ...config },
      disabledFeatures: [],
      metrics: null,
      warnings: [],
    };
    
    // Initialize feature registry
    PERFORMANCE_FEATURES.forEach(f => {
      this.features.set(f.id, { ...f });
    });
  }
  
  // State access
  getState(): PerformanceModeState {
    return { ...this.state };
  }
  
  isActive(): boolean {
    return this.state.active;
  }
  
  getConfig(): PerformanceModeConfig {
    return { ...this.state.config };
  }
  
  updateConfig(updates: Partial<PerformanceModeConfig>): void {
    this.state.config = { ...this.state.config, ...updates };
    this.notifyListeners();
  }
  
  // Feature management
  getFeatures(): PerformanceFeature[] {
    return Array.from(this.features.values());
  }
  
  getFeature(id: string): PerformanceFeature | undefined {
    return this.features.get(id);
  }
  
  getNonEssentialFeatures(): PerformanceFeature[] {
    return Array.from(this.features.values()).filter(f => !f.essential);
  }
  
  getHighCPUFeatures(): PerformanceFeature[] {
    return Array.from(this.features.values()).filter(f => f.cpuImpact === 'high');
  }
  
  // Performance mode control
  enable(): { success: boolean; warnings: string[] } {
    if (this.state.active) {
      return { success: true, warnings: [] };
    }
    
    const warnings: string[] = [];
    const disabledFeatures: string[] = [];
    
    // Save current feature states
    this.savedFeatureStates.clear();
    this.features.forEach((f, id) => {
      this.savedFeatureStates.set(id, f.currentState);
    });
    
    // Disable non-essential features
    if (this.state.config.disableNonEssential) {
      this.features.forEach((f, id) => {
        if (!f.essential) {
          f.currentState = 'disabled';
          disabledFeatures.push(id);
        }
      });
    }
    
    // Reduce visual effects
    if (this.state.config.reduceVisualEffects) {
      ['waveform-display', 'spectrum-analyzer', 'animations', 'smooth-scrolling'].forEach(id => {
        const feature = this.features.get(id);
        if (feature && feature.currentState !== 'disabled') {
          feature.currentState = 'reduced';
        }
      });
    }
    
    // Check for potential issues
    if (this.state.config.disableUndo) {
      warnings.push('Undo/Redo is disabled - changes cannot be reverted');
    }
    
    if (this.state.config.disableAutoSave) {
      warnings.push('Auto-save is disabled - remember to save manually');
    }
    
    this.state = {
      ...this.state,
      active: true,
      startTime: Date.now(),
      disabledFeatures,
      warnings,
    };
    
    this.notifyListeners();
    
    return { success: true, warnings };
  }
  
  disable(): void {
    if (!this.state.active) return;
    
    // Restore saved feature states
    this.savedFeatureStates.forEach((state, id) => {
      const feature = this.features.get(id);
      if (feature) {
        feature.currentState = state;
      }
    });
    
    this.state = {
      ...this.state,
      active: false,
      startTime: null,
      disabledFeatures: [],
      warnings: [],
    };
    
    this.notifyListeners();
  }
  
  toggle(): { success: boolean; warnings: string[] } {
    if (this.state.active) {
      this.disable();
      return { success: true, warnings: [] };
    } else {
      return this.enable();
    }
  }
  
  // Panic button
  panic(): PanicResult {
    // In a real implementation, this would:
    // 1. Stop all audio playback
    // 2. Send MIDI all-notes-off
    // 3. Reset audio engine state
    console.log('PANIC: Stopping all audio');
    
    const result: PanicResult = {
      audioCleared: true,
      timestamp: Date.now(),
    };
    
    // Emit panic event
    this.state.warnings = [...this.state.warnings, 'Panic triggered'];
    this.notifyListeners();
    
    return result;
  }
  
  // Metrics
  recordMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    const fullMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp: Date.now(),
    };
    
    this.state.metrics = fullMetrics;
    this.metricsHistory.push(fullMetrics);
    
    // Keep only last 100 entries
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }
    
    // Check thresholds
    this.checkThresholds(fullMetrics);
    
    this.notifyListeners();
  }
  
  getMetrics(): PerformanceMetrics | null {
    return this.state.metrics;
  }
  
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }
  
  private checkThresholds(metrics: PerformanceMetrics): void {
    const warnings: string[] = [];
    
    if (metrics.cpuUsage > this.state.config.cpuThreshold) {
      warnings.push(`CPU usage high: ${metrics.cpuUsage.toFixed(1)}%`);
    }
    
    if (metrics.droppedFrames > 0) {
      warnings.push(`Audio dropouts detected: ${metrics.droppedFrames} frames`);
    }
    
    if (metrics.latency > 50) {
      warnings.push(`High latency: ${metrics.latency.toFixed(1)}ms`);
    }
    
    if (warnings.length > 0) {
      this.state.warnings = warnings;
    }
  }
  
  // HUD
  getHUD(): PerformanceHUD {
    const metrics = this.state.metrics;
    
    return {
      cpuUsage: metrics?.cpuUsage ?? 0,
      memoryUsage: metrics?.memoryUsage ?? 0,
      latency: metrics?.latency ?? 0,
      droppedFrames: metrics?.droppedFrames ?? 0,
      midiActivity: false, // Would be updated from MIDI system
      audioClipping: false, // Would be updated from audio system
      warnings: [...this.state.warnings],
    };
  }
  
  getHUDConfig(): HUDConfig {
    return {
      visible: this.state.active && this.state.config.showPerformanceHUD,
      position: this.state.config.hudPosition ?? 'top-right',
      showCpu: true,
      showLatency: true,
      showMemory: true,
      showDroppedFrames: true,
    };
  }
  
  // Stability score (0-1, 1 is best)
  getStabilityScore(): number {
    if (this.metricsHistory.length === 0) return 1.0;
    
    // Calculate stability based on recent metrics
    const recent = this.metricsHistory.slice(-10);
    let totalScore = 0;
    
    for (const m of recent) {
      let score = 1.0;
      
      // Penalize high CPU
      if (m.cpuUsage > 80) score -= 0.3;
      else if (m.cpuUsage > 60) score -= 0.1;
      
      // Penalize dropped frames
      score -= Math.min(0.3, m.droppedFrames * 0.05);
      
      // Penalize high latency
      if (m.latency > 50) score -= 0.2;
      else if (m.latency > 20) score -= 0.1;
      
      totalScore += Math.max(0, score);
    }
    
    return totalScore / recent.length;
  }
  
  // Precheck validation
  runPrecheck(): PrecheckResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Check if samples need loading
    if (this.state.config.preloadSamples) {
      // Would check sample loading status in real implementation
    }
    
    // Check current metrics
    if (this.state.metrics) {
      if (this.state.metrics.cpuUsage > 70) {
        warnings.push('CPU usage is already high');
      }
      if (this.state.metrics.cpuUsage > 90) {
        errors.push('CPU usage is critical');
      }
      if (this.state.metrics.memoryUsage > 1000) {
        warnings.push('Memory usage is high');
      }
    }
    
    return {
      passed: errors.length === 0,
      warnings,
      errors,
    };
  }
  
  // Session info
  getSessionDuration(): number {
    if (!this.state.startTime) return 0;
    return Date.now() - this.state.startTime;
  }
  
  // Listeners
  subscribe(listener: (state: PerformanceModeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
  
  // Precheck before enabling
  precheck(): { ready: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check if samples need loading
    if (this.state.config.preloadSamples) {
      // Would check sample loading status
      // issues.push('Some samples are not loaded');
    }
    
    // Check current metrics
    if (this.state.metrics) {
      if (this.state.metrics.cpuUsage > 70) {
        issues.push('CPU usage is already high');
      }
      if (this.state.metrics.memoryUsage > 1000) {
        issues.push('Memory usage is high');
      }
    }
    
    return {
      ready: issues.length === 0,
      issues,
    };
  }
  
  // Clear
  clear(): void {
    this.disable();
    this.metricsHistory = [];
  }
}

// --------------------------------------------------------------------------
// Utility functions
// --------------------------------------------------------------------------

/**
 * Get recommended configuration for different scenarios
 */
export function getRecommendedConfig(scenario: 'dj' | 'live-band' | 'studio' | 'streaming'): Partial<PerformanceModeConfig> {
  switch (scenario) {
    case 'dj':
      return {
        bufferMultiplier: 2,
        disableNonEssential: true,
        reduceVisualEffects: true,
        lockLayout: true,
        panicButtonEnabled: true,
        cpuThreshold: 70,
      };
    
    case 'live-band':
      return {
        bufferMultiplier: 3,
        disableNonEssential: true,
        reduceVisualEffects: true,
        lockLayout: true,
        midiPanicOnEnable: true,
        cpuThreshold: 60,
      };
    
    case 'studio':
      return {
        bufferMultiplier: 1,
        disableNonEssential: false,
        reduceVisualEffects: false,
        lockLayout: false,
        cpuThreshold: 85,
      };
    
    case 'streaming':
      return {
        bufferMultiplier: 2,
        disableNonEssential: true,
        reduceVisualEffects: true,
        showPerformanceHUD: true,
        cpuThreshold: 75,
      };
  }
}

/**
 * Calculate stability score based on metrics history
 */
export function calculateStabilityScore(metrics: PerformanceMetrics[]): number {
  if (metrics.length === 0) return 100;
  
  let score = 100;
  
  // Penalize for high CPU usage
  const avgCPU = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
  if (avgCPU > 80) score -= 20;
  else if (avgCPU > 60) score -= 10;
  
  // Penalize for dropped frames
  const totalDropped = metrics.reduce((sum, m) => sum + m.droppedFrames, 0);
  if (totalDropped > 10) score -= 30;
  else if (totalDropped > 0) score -= 15;
  
  // Penalize for high latency
  const avgLatency = metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length;
  if (avgLatency > 50) score -= 20;
  else if (avgLatency > 20) score -= 10;
  
  return Math.max(0, score);
}

// Singleton instance
export const performanceModeStore = new PerformanceModeStore();
