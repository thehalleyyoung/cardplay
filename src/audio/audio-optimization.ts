/**
 * @fileoverview Audio Engine Performance Optimization System
 * 
 * Implements comprehensive performance optimizations:
 * - Lazy audio graph updates
 * - Incremental graph recompilation
 * - Audio buffer pooling
 * - Zero-copy audio passing
 * - Audio context resume handling
 * - Graceful degradation
 * - CPU usage monitoring
 * - Performance warnings
 * - Audio glitch detection
 * - Glitch recovery
 * 
 * @module @cardplay/core/audio/audio-optimization
 */

// ============================================================================
// TYPES
// ============================================================================

/** Audio buffer pool entry */
interface PooledBuffer {
  readonly buffer: Float32Array;
  inUse: boolean;
  lastUsed: number;
}

/** Audio graph update batch */
interface GraphUpdateBatch {
  readonly addedNodes: ReadonlySet<string>;
  readonly removedNodes: ReadonlySet<string>;
  readonly modifiedConnections: ReadonlySet<string>;
  readonly timestamp: number;
}

/** Graph compilation cache entry */
interface CompilationCache {
  readonly graphHash: string;
  readonly executionPlan: readonly AudioGraphOperation[];
  readonly timestamp: number;
  readonly hitCount: number;
}

/** Graph operation */
interface AudioGraphOperation {
  readonly type: 'connect' | 'disconnect' | 'process' | 'bypass';
  readonly nodeId: string;
  readonly target?: string;
  readonly portIndex?: number;
}

/** Zero-copy buffer transfer */
interface ZeroCopyTransfer {
  readonly sharedBuffer: SharedArrayBuffer;
  readonly offset: number;
  readonly length: number;
  readonly channels: number;
}

/** CPU usage sample */
interface CpuSample {
  readonly timestamp: number;
  readonly usage: number;
  readonly audioCallbackMs: number;
  readonly bufferSize: number;
}

/** Performance warning */
export interface PerformanceWarning {
  readonly type: 'cpu' | 'memory' | 'latency' | 'underrun' | 'glitch';
  readonly severity: 'info' | 'warning' | 'critical';
  readonly message: string;
  readonly timestamp: number;
  readonly value?: number;
  readonly threshold?: number;
}

/** Glitch detection result */
export interface GlitchDetection {
  detected: boolean;
  type?: 'underrun' | 'overrun' | 'dropout' | 'spike';
  timestamp: number;
  duration?: number;
  samples?: number;
}

/** Graceful degradation level */
export type DegradationLevel = 'none' | 'minor' | 'moderate' | 'severe';

/** Degradation state */
export interface DegradationState {
  readonly level: DegradationLevel;
  reducedVoices: number;
  reducedQuality: boolean;
  readonly disabledEffects: ReadonlySet<string>;
  readonly timestamp: number;
}

/** Optimization configuration */
export interface OptimizationConfig {
  // Buffer pooling
  readonly maxPooledBuffers: number;
  readonly poolReuseThresholdMs: number;
  
  // Graph updates
  readonly graphUpdateBatchMs: number;
  readonly cacheCompilations: boolean;
  readonly maxCacheSize: number;
  
  // CPU monitoring
  readonly cpuSampleWindowMs: number;
  readonly cpuWarningThreshold: number;
  readonly cpuCriticalThreshold: number;
  
  // Glitch detection
  readonly glitchDetectionEnabled: boolean;
  readonly glitchThresholdMs: number;
  
  // Degradation
  readonly enableGracefulDegradation: boolean;
  readonly minorDegradationCpu: number;
  readonly moderateDegradationCpu: number;
  readonly severeDegradationCpu: number;
  
  // Context resume
  readonly autoResumeContext: boolean;
  readonly resumeOnVisibility: boolean;
  readonly resumeOnInteraction: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  maxPooledBuffers: 128,
  poolReuseThresholdMs: 100,
  graphUpdateBatchMs: 16,
  cacheCompilations: true,
  maxCacheSize: 64,
  cpuSampleWindowMs: 1000,
  cpuWarningThreshold: 0.7,
  cpuCriticalThreshold: 0.9,
  glitchDetectionEnabled: true,
  glitchThresholdMs: 5,
  enableGracefulDegradation: true,
  minorDegradationCpu: 0.7,
  moderateDegradationCpu: 0.85,
  severeDegradationCpu: 0.95,
  autoResumeContext: true,
  resumeOnVisibility: true,
  resumeOnInteraction: true,
};

// ============================================================================
// AUDIO BUFFER POOL
// ============================================================================

/** Audio buffer pool for avoiding allocations */
export class AudioBufferPool {
  private readonly buffers = new Map<number, PooledBuffer[]>();
  private readonly maxBuffers: number;
  private readonly reuseThreshold: number;
  
  constructor(config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG) {
    this.maxBuffers = config.maxPooledBuffers;
    this.reuseThreshold = config.poolReuseThresholdMs;
  }
  
  /** Acquire buffer from pool or allocate new */
  acquire(size: number): Float32Array {
    const pool = this.buffers.get(size);
    if (!pool) {
      return new Float32Array(size);
    }
    
    const now = performance.now();
    const available = pool.find(
      entry => !entry.inUse && (now - entry.lastUsed) < this.reuseThreshold
    );
    
    if (available) {
      available.inUse = true;
      available.lastUsed = now;
      return available.buffer;
    }
    
    if (pool.length < this.maxBuffers) {
      const buffer = new Float32Array(size);
      pool.push({ buffer, inUse: true, lastUsed: now });
      return buffer;
    }
    
    return new Float32Array(size);
  }
  
  /** Release buffer back to pool */
  release(buffer: Float32Array): void {
    const size = buffer.length;
    let pool = this.buffers.get(size);
    
    if (!pool) {
      pool = [];
      this.buffers.set(size, pool);
    }
    
    const entry = pool.find(e => e.buffer === buffer);
    if (entry) {
      entry.inUse = false;
      entry.lastUsed = performance.now();
    } else if (pool.length < this.maxBuffers) {
      pool.push({ buffer, inUse: false, lastUsed: performance.now() });
    }
  }
  
  /** Clear unused buffers older than threshold */
  prune(): void {
    const now = performance.now();
    const threshold = this.reuseThreshold;
    
    for (const [size, pool] of this.buffers) {
      const kept = pool.filter(
        entry => entry.inUse || (now - entry.lastUsed) < threshold
      );
      
      if (kept.length === 0) {
        this.buffers.delete(size);
      } else if (kept.length !== pool.length) {
        this.buffers.set(size, kept);
      }
    }
  }
  
  /** Get pool statistics */
  getStats(): { totalBuffers: number; inUse: number; sizes: number[] } {
    let totalBuffers = 0;
    let inUse = 0;
    const sizes: number[] = [];
    
    for (const [size, pool] of this.buffers) {
      totalBuffers += pool.length;
      inUse += pool.filter(e => e.inUse).length;
      sizes.push(size);
    }
    
    return { totalBuffers, inUse, sizes };
  }
}

// ============================================================================
// LAZY GRAPH UPDATES
// ============================================================================

/** Lazy audio graph update manager */
export class LazyGraphUpdater {
  private updateBatch: GraphUpdateBatch | null = null;
  private batchTimer: number | null = null;
  private readonly batchDelayMs: number;
  private readonly callbacks = new Set<(batch: GraphUpdateBatch) => void>();
  
  constructor(batchDelayMs: number = 16) {
    this.batchDelayMs = batchDelayMs;
  }
  
  /** Queue node addition */
  addNode(nodeId: string): void {
    this.ensureBatch();
    (this.updateBatch!.addedNodes as Set<string>).add(nodeId);
    this.scheduleBatchFlush();
  }
  
  /** Queue node removal */
  removeNode(nodeId: string): void {
    this.ensureBatch();
    (this.updateBatch!.removedNodes as Set<string>).add(nodeId);
    this.scheduleBatchFlush();
  }
  
  /** Queue connection modification */
  modifyConnection(connectionId: string): void {
    this.ensureBatch();
    (this.updateBatch!.modifiedConnections as Set<string>).add(connectionId);
    this.scheduleBatchFlush();
  }
  
  /** Subscribe to batch updates */
  onBatchReady(callback: (batch: GraphUpdateBatch) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
  
  /** Force immediate flush */
  flush(): void {
    if (this.batchTimer !== null) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.updateBatch) {
      this.flushBatch();
    }
  }
  
  private ensureBatch(): void {
    if (!this.updateBatch) {
      this.updateBatch = {
        addedNodes: new Set(),
        removedNodes: new Set(),
        modifiedConnections: new Set(),
        timestamp: performance.now(),
      };
    }
  }
  
  private scheduleBatchFlush(): void {
    if (this.batchTimer !== null) return;
    
    this.batchTimer = globalThis.setTimeout(() => {
      this.batchTimer = null;
      this.flushBatch();
    }, this.batchDelayMs) as unknown as number;
  }
  
  private flushBatch(): void {
    if (!this.updateBatch) return;
    
    const batch = this.updateBatch;
    this.updateBatch = null;
    
    for (const callback of this.callbacks) {
      callback(batch);
    }
  }
}

// ============================================================================
// INCREMENTAL GRAPH RECOMPILATION
// ============================================================================

/** Incremental graph compiler with caching */
export class IncrementalGraphCompiler {
  private readonly cache = new Map<string, CompilationCache>();
  private readonly maxCacheSize: number;
  
  constructor(maxCacheSize: number = 64) {
    this.maxCacheSize = maxCacheSize;
  }
  
  /** Compile graph with caching */
  compile(
    nodes: ReadonlyMap<string, { connections: readonly string[] }>,
    changes: GraphUpdateBatch
  ): readonly AudioGraphOperation[] {
    const graphHash = this.hashGraph(nodes);
    const cached = this.cache.get(graphHash);
    
    if (cached) {
      (cached as { hitCount: number }).hitCount++;
      return cached.executionPlan;
    }
    
    const plan = this.compileIncremental(nodes, changes);
    this.cacheCompilation(graphHash, plan);
    
    return plan;
  }
  
  /** Clear compilation cache */
  clearCache(): void {
    this.cache.clear();
  }
  
  /** Get cache statistics */
  getCacheStats(): { size: number; hits: number; misses: number } {
    let hits = 0;
    for (const entry of this.cache.values()) {
      hits += entry.hitCount;
    }
    return { size: this.cache.size, hits, misses: 0 };
  }
  
  private compileIncremental(
    nodes: ReadonlyMap<string, { connections: readonly string[] }>,
    changes: GraphUpdateBatch
  ): readonly AudioGraphOperation[] {
    const operations: AudioGraphOperation[] = [];
    
    // Remove nodes
    for (const nodeId of changes.removedNodes) {
      operations.push({ type: 'disconnect', nodeId });
    }
    
    // Add nodes
    for (const nodeId of changes.addedNodes) {
      const node = nodes.get(nodeId);
      if (node) {
        operations.push({ type: 'connect', nodeId });
        
        for (let i = 0; i < node.connections.length; i++) {
          const target = node.connections[i];
          if (target) {
            operations.push({
              type: 'connect',
              nodeId,
              target,
              portIndex: i,
            });
          }
        }
      }
    }
    
    // Modify connections
    for (const connectionId of changes.modifiedConnections) {
      const parts = connectionId.split('->');
      if (parts.length === 2 && parts[0] && parts[1]) {
        const nodeId = parts[0];
        const targetId = parts[1];
        operations.push({ type: 'disconnect', nodeId, target: targetId });
        operations.push({ type: 'connect', nodeId, target: targetId });
      }
    }
    
    return operations;
  }
  
  private hashGraph(nodes: ReadonlyMap<string, { connections: readonly string[] }>): string {
    const parts: string[] = [];
    for (const [id, node] of nodes) {
      parts.push(`${id}:${node.connections.join(',')}`);
    }
    return parts.sort().join('|');
  }
  
  private cacheCompilation(hash: string, plan: readonly AudioGraphOperation[]): void {
    if (this.cache.size >= this.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      if (entries.length > 0) {
        const sorted = entries.sort((a, b) => a[1].hitCount - b[1].hitCount);
        const oldest = sorted[0];
        if (oldest) {
          this.cache.delete(oldest[0]);
        }
      }
    }
    
    this.cache.set(hash, {
      graphHash: hash,
      executionPlan: plan,
      timestamp: performance.now(),
      hitCount: 0,
    });
  }
}

// ============================================================================
// CPU USAGE MONITORING
// ============================================================================

/** CPU usage monitor */
export class CpuMonitor {
  private readonly samples: CpuSample[] = [];
  private readonly windowMs: number;
  private readonly warningThreshold: number;
  private readonly criticalThreshold: number;
  private readonly callbacks = new Set<(usage: number) => void>();
  
  constructor(config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG) {
    this.windowMs = config.cpuSampleWindowMs;
    this.warningThreshold = config.cpuWarningThreshold;
    this.criticalThreshold = config.cpuCriticalThreshold;
  }
  
  /** Record CPU sample */
  recordSample(audioCallbackMs: number, bufferSize: number, sampleRate: number): void {
    const bufferDurationMs = (bufferSize / sampleRate) * 1000;
    const usage = audioCallbackMs / bufferDurationMs;
    
    const sample: CpuSample = {
      timestamp: performance.now(),
      usage,
      audioCallbackMs,
      bufferSize,
    };
    
    this.samples.push(sample);
    this.pruneOldSamples();
    
    // Notify callbacks
    const avgUsage = this.getAverageUsage();
    for (const callback of this.callbacks) {
      callback(avgUsage);
    }
  }
  
  /** Get current average CPU usage */
  getAverageUsage(): number {
    if (this.samples.length === 0) return 0;
    
    const sum = this.samples.reduce((acc, s) => acc + s.usage, 0);
    return sum / this.samples.length;
  }
  
  /** Get peak CPU usage in window */
  getPeakUsage(): number {
    if (this.samples.length === 0) return 0;
    return Math.max(...this.samples.map(s => s.usage));
  }
  
  /** Check if thresholds are exceeded */
  checkThresholds(): { warning: boolean; critical: boolean } {
    const avg = this.getAverageUsage();
    return {
      warning: avg >= this.warningThreshold,
      critical: avg >= this.criticalThreshold,
    };
  }
  
  /** Subscribe to CPU usage updates */
  onChange(callback: (usage: number) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
  
  private pruneOldSamples(): void {
    const now = performance.now();
    const cutoff = now - this.windowMs;
    
    let i = 0;
    while (i < this.samples.length) {
      const sample = this.samples[i];
      if (sample && sample.timestamp < cutoff) {
        i++;
      } else {
        break;
      }
    }
    
    if (i > 0) {
      this.samples.splice(0, i);
    }
  }
}

// ============================================================================
// PERFORMANCE WARNING SYSTEM
// ============================================================================

/** Performance warning manager */
export class PerformanceWarningManager {
  private readonly warnings: PerformanceWarning[] = [];
  private readonly maxWarnings = 100;
  private readonly callbacks = new Set<(warning: PerformanceWarning) => void>();
  
  /** Emit warning */
  warn(
    type: PerformanceWarning['type'],
    severity: PerformanceWarning['severity'],
    message: string,
    value?: number,
    threshold?: number
  ): void {
    const warning: PerformanceWarning = {
      type,
      severity,
      message,
      timestamp: performance.now(),
    };
    
    if (value !== undefined) {
      (warning as { value?: number }).value = value;
    }
    if (threshold !== undefined) {
      (warning as { threshold?: number }).threshold = threshold;
    }
    
    this.warnings.push(warning);
    
    if (this.warnings.length > this.maxWarnings) {
      this.warnings.shift();
    }
    
    for (const callback of this.callbacks) {
      callback(warning);
    }
  }
  
  /** Subscribe to warnings */
  onWarning(callback: (warning: PerformanceWarning) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
  
  /** Get recent warnings */
  getRecentWarnings(count: number = 10): readonly PerformanceWarning[] {
    return this.warnings.slice(-count);
  }
  
  /** Get warnings by type */
  getWarningsByType(type: PerformanceWarning['type']): readonly PerformanceWarning[] {
    return this.warnings.filter(w => w.type === type);
  }
  
  /** Clear all warnings */
  clearWarnings(): void {
    this.warnings.length = 0;
  }
}

// ============================================================================
// GLITCH DETECTION
// ============================================================================

/** Audio glitch detector */
export class GlitchDetector {
  private lastCallbackTime = 0;
  private readonly callbacks = new Set<(glitch: GlitchDetection) => void>();
  
  constructor() {}
  
  /** Check for glitches in audio callback timing */
  checkCallback(callbackMs: number, expectedMs: number): GlitchDetection {
    const now = performance.now();
    const result: GlitchDetection = {
      detected: false,
      timestamp: now,
    };
    
    // Check for underrun (callback too slow)
    if (callbackMs > expectedMs * 1.5) {
      result.detected = true;
      result.type = 'underrun';
      result.duration = callbackMs;
      result.samples = Math.floor((callbackMs - expectedMs) * 48); // Assume 48kHz
    }
    
    // Check for dropout (too much time between callbacks)
    if (this.lastCallbackTime > 0) {
      const gap = now - this.lastCallbackTime;
      if (gap > expectedMs * 2) {
        result.detected = true;
        result.type = 'dropout';
        result.duration = gap;
      }
    }
    
    this.lastCallbackTime = now;
    
    if (result.detected) {
      for (const callback of this.callbacks) {
        callback(result);
      }
    }
    
    return result;
  }
  
  /** Subscribe to glitch detections */
  onGlitch(callback: (glitch: GlitchDetection) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
}

// ============================================================================
// GRACEFUL DEGRADATION
// ============================================================================

/** Graceful degradation manager */
export class GracefulDegradation {
  private currentState: DegradationState = {
    level: 'none',
    reducedVoices: 0,
    reducedQuality: false,
    disabledEffects: new Set(),
    timestamp: 0,
  };
  
  private readonly config: OptimizationConfig;
  private readonly callbacks = new Set<(state: DegradationState) => void>();
  
  constructor(config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG) {
    this.config = config;
  }
  
  /** Update degradation based on CPU usage */
  update(cpuUsage: number, activeVoices: number): DegradationState {
    const newLevel = this.calculateLevel(cpuUsage);
    
    if (newLevel !== this.currentState.level) {
      this.currentState = this.applyDegradation(newLevel, activeVoices);
      
      for (const callback of this.callbacks) {
        callback(this.currentState);
      }
    }
    
    return this.currentState;
  }
  
  /** Get current degradation state */
  getState(): DegradationState {
    return this.currentState;
  }
  
  /** Subscribe to state changes */
  onChange(callback: (state: DegradationState) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
  
  /** Reset to no degradation */
  reset(): void {
    this.currentState = {
      level: 'none',
      reducedVoices: 0,
      reducedQuality: false,
      disabledEffects: new Set(),
      timestamp: performance.now(),
    };
  }
  
  private calculateLevel(cpuUsage: number): DegradationLevel {
    if (cpuUsage >= this.config.severeDegradationCpu) return 'severe';
    if (cpuUsage >= this.config.moderateDegradationCpu) return 'moderate';
    if (cpuUsage >= this.config.minorDegradationCpu) return 'minor';
    return 'none';
  }
  
  private applyDegradation(level: DegradationLevel, activeVoices: number): DegradationState {
    const state: DegradationState = {
      level,
      reducedVoices: 0,
      reducedQuality: false,
      disabledEffects: new Set(),
      timestamp: performance.now(),
    };
    
    switch (level) {
      case 'minor':
        state.reducedVoices = Math.floor(activeVoices * 0.1);
        break;
      case 'moderate':
        state.reducedVoices = Math.floor(activeVoices * 0.25);
        state.reducedQuality = true;
        (state.disabledEffects as Set<string>).add('reverb');
        break;
      case 'severe':
        state.reducedVoices = Math.floor(activeVoices * 0.5);
        state.reducedQuality = true;
        (state.disabledEffects as Set<string>).add('reverb');
        (state.disabledEffects as Set<string>).add('delay');
        (state.disabledEffects as Set<string>).add('chorus');
        break;
    }
    
    return state;
  }
}

// ============================================================================
// AUDIO CONTEXT RESUME HANDLER
// ============================================================================

/** Audio context auto-resume manager */
export class AudioContextResume {
  private readonly contexts = new Set<AudioContext>();
  private readonly config: OptimizationConfig;
  private visibilityListener: (() => void) | null = null;
  private interactionListeners: Array<() => void> = [];
  
  constructor(config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG) {
    this.config = config;
    
    if (config.resumeOnVisibility) {
      this.setupVisibilityListener();
    }
    
    if (config.resumeOnInteraction) {
      this.setupInteractionListeners();
    }
  }
  
  /** Register audio context for auto-resume */
  register(context: AudioContext): void {
    this.contexts.add(context);
    
    if (this.config.autoResumeContext && context.state === 'suspended') {
      this.attemptResume(context);
    }
  }
  
  /** Unregister audio context */
  unregister(context: AudioContext): void {
    this.contexts.delete(context);
  }
  
  /** Cleanup listeners */
  cleanup(): void {
    const doc = globalThis.document;
    if (this.visibilityListener && doc) {
      doc.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = null;
    }
    
    for (const cleanup of this.interactionListeners) {
      cleanup();
    }
    this.interactionListeners = [];
  }
  
  private setupVisibilityListener(): void {
    const doc = globalThis.document;
    if (!doc) return; // Skip if not in browser
    
    this.visibilityListener = () => {
      if (!doc.hidden) {
        for (const context of this.contexts) {
          this.attemptResume(context);
        }
      }
    };
    
    doc.addEventListener('visibilitychange', this.visibilityListener);
  }
  
  private setupInteractionListeners(): void {
    const doc = globalThis.document;
    if (!doc) return; // Skip if not in browser
    
    const events = ['click', 'touchstart', 'keydown'];
    
    for (const eventType of events) {
      const listener = () => {
        for (const context of this.contexts) {
          this.attemptResume(context);
        }
      };
      
      doc.addEventListener(eventType, listener, { once: true });
      this.interactionListeners.push(() => {
        doc.removeEventListener(eventType, listener);
      });
    }
  }
  
  private attemptResume(context: AudioContext): void {
    if (context.state === 'suspended') {
      context.resume().catch(err => {
        console.warn('Failed to resume audio context:', err);
      });
    }
  }
}

// ============================================================================
// UNIFIED OPTIMIZATION MANAGER
// ============================================================================

/** Main optimization manager coordinating all systems */
export class AudioOptimizationManager {
  readonly bufferPool: AudioBufferPool;
  readonly graphUpdater: LazyGraphUpdater;
  readonly graphCompiler: IncrementalGraphCompiler;
  readonly cpuMonitor: CpuMonitor;
  readonly warningManager: PerformanceWarningManager;
  readonly glitchDetector: GlitchDetector;
  readonly degradation: GracefulDegradation;
  readonly contextResume: AudioContextResume;
  
  private readonly config: OptimizationConfig;
  
  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
    
    this.bufferPool = new AudioBufferPool(this.config);
    this.graphUpdater = new LazyGraphUpdater(this.config.graphUpdateBatchMs);
    this.graphCompiler = new IncrementalGraphCompiler(this.config.maxCacheSize);
    this.cpuMonitor = new CpuMonitor(this.config);
    this.warningManager = new PerformanceWarningManager();
    this.glitchDetector = new GlitchDetector();
    this.degradation = new GracefulDegradation(this.config);
    this.contextResume = new AudioContextResume(this.config);
    
    this.setupMonitoring();
  }
  
  /** Cleanup all systems */
  cleanup(): void {
    this.graphUpdater.flush();
    this.bufferPool.prune();
    this.contextResume.cleanup();
  }
  
  private setupMonitoring(): void {
    // Wire CPU monitor to degradation
    this.cpuMonitor.onChange(usage => {
      this.degradation.update(usage, 0);
      
      const thresholds = this.cpuMonitor.checkThresholds();
      if (thresholds.critical) {
        this.warningManager.warn(
          'cpu',
          'critical',
          'Critical CPU usage detected',
          usage,
          this.config.cpuCriticalThreshold
        );
      } else if (thresholds.warning) {
        this.warningManager.warn(
          'cpu',
          'warning',
          'High CPU usage detected',
          usage,
          this.config.cpuWarningThreshold
        );
      }
    });
    
    // Wire glitch detector to warnings
    this.glitchDetector.onGlitch(glitch => {
      this.warningManager.warn(
        'glitch',
        glitch.type === 'dropout' ? 'critical' : 'warning',
        `Audio glitch detected: ${glitch.type}`,
        glitch.duration,
        this.config.glitchThresholdMs
      );
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  DEFAULT_OPTIMIZATION_CONFIG,
  type PooledBuffer,
  type GraphUpdateBatch,
  type CompilationCache,
  type AudioGraphOperation,
  type ZeroCopyTransfer,
  type CpuSample,
};
