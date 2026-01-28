/**
 * @fileoverview Audio Engine Context Management.
 * 
 * Provides singleton management of WebAudio AudioContext with:
 * - Lazy creation on user gesture
 * - Automatic resume on visibility change
 * - Device enumeration and selection
 * - Performance monitoring and recovery
 * 
 * @module @cardplay/core/audio/context
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Audio engine configuration.
 */
export interface AudioEngineConfig {
  /** Preferred sample rate (default: 48000) */
  readonly sampleRate?: number;
  /** Buffer size for low latency (default: 128) */
  readonly bufferSize?: 128 | 256 | 512 | 1024;
  /** Latency hint */
  readonly latencyHint?: AudioContextLatencyCategory | number;
  /** Enable performance monitoring */
  readonly enableMetrics?: boolean;
  /** Glitch detection threshold in ms */
  readonly glitchThresholdMs?: number;
  /** Auto-resume on visibility change */
  readonly autoResume?: boolean;
}

/**
 * Audio context state.
 */
export type AudioEngineState = 'uninitialized' | 'suspended' | 'running' | 'closed' | 'error';

/**
 * Audio device information.
 */
export interface AudioDevice {
  readonly deviceId: string;
  readonly label: string;
  readonly kind: 'audioinput' | 'audiooutput';
  readonly groupId: string;
  readonly isDefault: boolean;
}

/**
 * Audio performance metrics.
 */
export interface AudioMetrics {
  /** Current audio time */
  readonly currentTime: number;
  /** Output latency in seconds */
  readonly outputLatency: number;
  /** Base latency in seconds */
  readonly baseLatency: number;
  /** Sample rate */
  readonly sampleRate: number;
  /** Estimated CPU load (0-1) */
  readonly cpuLoad: number;
  /** Number of buffer underruns detected */
  readonly glitchCount: number;
  /** Last callback duration in ms */
  readonly lastCallbackDuration: number;
}

/**
 * Audio engine event types.
 */
export type AudioEngineEventType = 
  | 'statechange'
  | 'devicechange'
  | 'glitch'
  | 'error'
  | 'resume'
  | 'suspend';

/**
 * Audio engine event.
 */
export interface AudioEngineEvent {
  readonly type: AudioEngineEventType;
  readonly timestamp: number;
  readonly data?: unknown;
}

/**
 * Audio engine event listener.
 */
export type AudioEngineEventListener = (event: AudioEngineEvent) => void;

// ============================================================================
// AUDIO ENGINE CONTEXT
// ============================================================================

/**
 * Audio engine context interface.
 */
export interface AudioEngineContext {
  /** Current state */
  readonly state: AudioEngineState;
  /** Native AudioContext (if initialized) */
  readonly context: AudioContext | null;
  /** Configuration */
  readonly config: AudioEngineConfig;
  /** Current metrics */
  readonly metrics: AudioMetrics;
  
  /** Initialize the audio context */
  initialize(): Promise<void>;
  /** Resume audio context */
  resume(): Promise<void>;
  /** Suspend audio context */
  suspend(): Promise<void>;
  /** Close and cleanup */
  close(): Promise<void>;
  /** Warmup the context */
  warmup(): Promise<void>;
  
  /** Get available devices */
  getDevices(): Promise<readonly AudioDevice[]>;
  /** Get input devices */
  getInputDevices(): Promise<readonly AudioDevice[]>;
  /** Get output devices */
  getOutputDevices(): Promise<readonly AudioDevice[]>;
  /** Set output device */
  setOutputDevice(deviceId: string): Promise<void>;
  /** Set input device */
  setInputDevice(deviceId: string): Promise<void>;
  
  /** Add event listener */
  addEventListener(type: AudioEngineEventType, listener: AudioEngineEventListener): void;
  /** Remove event listener */
  removeEventListener(type: AudioEngineEventType, listener: AudioEngineEventListener): void;
}

/**
 * Default configuration.
 */
const DEFAULT_CONFIG: Required<AudioEngineConfig> = {
  sampleRate: 48000,
  bufferSize: 128,
  latencyHint: 'interactive',
  enableMetrics: true,
  glitchThresholdMs: 10,
  autoResume: true,
};

/**
 * Audio engine context implementation.
 */
class AudioEngineContextImpl implements AudioEngineContext {
  private _state: AudioEngineState = 'uninitialized';
  private _context: AudioContext | null = null;
  private readonly _config: Required<AudioEngineConfig>;
  private _metrics: AudioMetrics;
  private readonly _listeners = new Map<AudioEngineEventType, Set<AudioEngineEventListener>>();
  private _glitchCount = 0;
  private _lastCallbackTime = 0;
  private _visibilityHandler: (() => void) | null = null;
  private _deviceChangeHandler: (() => void) | null = null;
  private _metricsInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor(config?: AudioEngineConfig) {
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._metrics = this.createInitialMetrics();
  }
  
  get state(): AudioEngineState {
    return this._state;
  }
  
  get context(): AudioContext | null {
    return this._context;
  }
  
  get config(): AudioEngineConfig {
    return this._config;
  }
  
  get metrics(): AudioMetrics {
    return this._metrics;
  }
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  async initialize(): Promise<void> {
    if (this._context) {
      return;
    }
    
    try {
      // Create AudioContext with configuration
      const options: AudioContextOptions = {
        sampleRate: this._config.sampleRate,
        latencyHint: this._config.latencyHint,
      };
      
      this._context = new AudioContext(options);
      this._state = this._context.state === 'running' ? 'running' : 'suspended';
      
      // Setup event handlers
      this._context.onstatechange = () => {
        this.handleStateChange();
      };
      
      // Setup visibility handler for auto-resume
      if (this._config.autoResume && typeof document !== 'undefined') {
        this._visibilityHandler = () => {
          if (document.visibilityState === 'visible' && this._context?.state === 'suspended') {
            this.resume().catch(console.error);
          }
        };
        document.addEventListener('visibilitychange', this._visibilityHandler);
      }
      
      // Setup device change handler
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        this._deviceChangeHandler = () => {
          this.emit({ type: 'devicechange', timestamp: Date.now() });
        };
        navigator.mediaDevices.addEventListener('devicechange', this._deviceChangeHandler);
      }
      
      // Start metrics collection
      if (this._config.enableMetrics) {
        this.startMetricsCollection();
      }
      
      this.emit({ type: 'statechange', timestamp: Date.now(), data: this._state });
    } catch (error) {
      this._state = 'error';
      this.emit({ type: 'error', timestamp: Date.now(), data: error });
      throw error;
    }
  }
  
  async resume(): Promise<void> {
    if (!this._context) {
      await this.initialize();
    }
    
    if (this._context && this._context.state === 'suspended') {
      await this._context.resume();
      this._state = 'running';
      this.emit({ type: 'resume', timestamp: Date.now() });
    }
  }
  
  async suspend(): Promise<void> {
    if (this._context && this._context.state === 'running') {
      await this._context.suspend();
      this._state = 'suspended';
      this.emit({ type: 'suspend', timestamp: Date.now() });
    }
  }
  
  async close(): Promise<void> {
    if (this._context) {
      await this._context.close();
      this._context = null;
      this._state = 'closed';
      
      // Cleanup handlers
      if (this._visibilityHandler && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', this._visibilityHandler);
        this._visibilityHandler = null;
      }
      
      if (this._deviceChangeHandler && typeof navigator !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', this._deviceChangeHandler);
        this._deviceChangeHandler = null;
      }
      
      if (this._metricsInterval) {
        clearInterval(this._metricsInterval);
        this._metricsInterval = null;
      }
      
      this.emit({ type: 'statechange', timestamp: Date.now(), data: 'closed' });
    }
  }
  
  async warmup(): Promise<void> {
    if (!this._context) {
      await this.initialize();
    }
    
    if (!this._context) return;
    
    // Create and play a silent buffer to warm up the audio graph
    const buffer = this._context.createBuffer(1, 128, this._context.sampleRate);
    const source = this._context.createBufferSource();
    source.buffer = buffer;
    source.connect(this._context.destination);
    source.start();
    source.stop(this._context.currentTime + 0.01);
  }
  
  // ============================================================================
  // DEVICE MANAGEMENT
  // ============================================================================
  
  async getDevices(): Promise<readonly AudioDevice[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return [];
    }
    
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(d => d.kind === 'audioinput' || d.kind === 'audiooutput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Device ${index + 1}`,
          kind: d.kind as 'audioinput' | 'audiooutput',
          groupId: d.groupId,
          isDefault: d.deviceId === 'default',
        }));
    } catch {
      return [];
    }
  }
  
  async getInputDevices(): Promise<readonly AudioDevice[]> {
    const devices = await this.getDevices();
    return devices.filter(d => d.kind === 'audioinput');
  }
  
  async getOutputDevices(): Promise<readonly AudioDevice[]> {
    const devices = await this.getDevices();
    return devices.filter(d => d.kind === 'audiooutput');
  }
  
  async setOutputDevice(deviceId: string): Promise<void> {
    if (!this._context) {
      throw new Error('Audio context not initialized');
    }
    
    // Use setSinkId if available (Chrome)
    const ctx = this._context as AudioContext & { setSinkId?: (id: string) => Promise<void> };
    if (ctx.setSinkId) {
      await ctx.setSinkId(deviceId);
    } else {
      console.warn('setSinkId not supported in this browser');
    }
  }
  
  async setInputDevice(_deviceId: string): Promise<void> {
    // Input device selection requires getUserMedia with deviceId constraint
    console.warn('Input device selection not implemented');
  }
  
  // ============================================================================
  // EVENT HANDLING
  // ============================================================================
  
  addEventListener(type: AudioEngineEventType, listener: AudioEngineEventListener): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(listener);
  }
  
  removeEventListener(type: AudioEngineEventType, listener: AudioEngineEventListener): void {
    this._listeners.get(type)?.delete(listener);
  }
  
  private emit(event: AudioEngineEvent): void {
    const listeners = this._listeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error('Audio engine event listener error:', error);
        }
      }
    }
  }
  
  // ============================================================================
  // INTERNAL
  // ============================================================================
  
  private handleStateChange(): void {
    if (this._context) {
      const state = this._context.state;
      if (state === 'running') {
        this._state = 'running';
      } else if (state === 'suspended') {
        this._state = 'suspended';
      } else if (state === 'closed') {
        this._state = 'closed';
      }
      this.emit({ type: 'statechange', timestamp: Date.now(), data: this._state });
    }
  }
  
  private createInitialMetrics(): AudioMetrics {
    return {
      currentTime: 0,
      outputLatency: 0,
      baseLatency: 0,
      sampleRate: this._config.sampleRate,
      cpuLoad: 0,
      glitchCount: 0,
      lastCallbackDuration: 0,
    };
  }
  
  private startMetricsCollection(): void {
    this._metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 100);
  }
  
  private updateMetrics(): void {
    if (!this._context) return;
    
    const ctx = this._context as AudioContext & { 
      outputLatency?: number;
      baseLatency?: number;
    };
    
    const now = performance.now();
    const callbackDuration = this._lastCallbackTime > 0 ? now - this._lastCallbackTime : 0;
    this._lastCallbackTime = now;
    
    // Detect glitches (callback took too long)
    if (callbackDuration > this._config.glitchThresholdMs) {
      this._glitchCount++;
      this.emit({ type: 'glitch', timestamp: Date.now(), data: { duration: callbackDuration } });
    }
    
    this._metrics = {
      currentTime: this._context.currentTime,
      outputLatency: ctx.outputLatency ?? 0,
      baseLatency: ctx.baseLatency ?? 0,
      sampleRate: this._context.sampleRate,
      cpuLoad: 0, // Would need AudioWorklet for accurate CPU measurement
      glitchCount: this._glitchCount,
      lastCallbackDuration: callbackDuration,
    };
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let audioEngineInstance: AudioEngineContext | null = null;

/**
 * Gets the audio engine context singleton.
 */
export function getAudioEngine(config?: AudioEngineConfig): AudioEngineContext {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngineContextImpl(config);
  }
  return audioEngineInstance;
}

/**
 * Resets the audio engine context.
 */
export async function resetAudioEngine(): Promise<void> {
  if (audioEngineInstance) {
    await audioEngineInstance.close();
    audioEngineInstance = null;
  }
}

// ============================================================================
// CONTEXT POOL
// ============================================================================

/**
 * Audio context pool for parallel processing.
 */
export interface AudioContextPool {
  /** Acquire a context from the pool */
  acquire(): Promise<AudioContext>;
  /** Release a context back to the pool */
  release(context: AudioContext): void;
  /** Get pool size */
  readonly size: number;
  /** Get available count */
  readonly available: number;
  /** Close all contexts */
  close(): Promise<void>;
}

/**
 * Audio context pool implementation.
 */
class AudioContextPoolImpl implements AudioContextPool {
  private readonly _contexts: AudioContext[] = [];
  private readonly _available: AudioContext[] = [];
  private readonly _maxSize: number;
  private readonly _config: AudioContextOptions;
  
  constructor(maxSize: number = 4, config?: AudioContextOptions) {
    this._maxSize = maxSize;
    this._config = config ?? {};
  }
  
  get size(): number {
    return this._contexts.length;
  }
  
  get available(): number {
    return this._available.length;
  }
  
  async acquire(): Promise<AudioContext> {
    // Return available context
    if (this._available.length > 0) {
      const ctx = this._available.pop()!;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      return ctx;
    }
    
    // Create new context if under limit
    if (this._contexts.length < this._maxSize) {
      const ctx = new AudioContext(this._config);
      this._contexts.push(ctx);
      return ctx;
    }
    
    // Wait for available context
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (this._available.length > 0) {
          clearInterval(check);
          resolve(this.acquire());
        }
      }, 10);
    });
  }
  
  release(context: AudioContext): void {
    if (this._contexts.includes(context)) {
      this._available.push(context);
    }
  }
  
  async close(): Promise<void> {
    await Promise.all(this._contexts.map(ctx => ctx.close()));
    this._contexts.length = 0;
    this._available.length = 0;
  }
}

/**
 * Creates an audio context pool.
 */
export function createContextPool(
  maxSize?: number,
  config?: AudioContextOptions
): AudioContextPool {
  return new AudioContextPoolImpl(maxSize, config);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Negotiates the best sample rate.
 */
export function negotiateSampleRate(preferred: number = 48000): number {
  // Check hardware capabilities if available
  const supported = [44100, 48000, 88200, 96000];
  if (supported.includes(preferred)) {
    return preferred;
  }
  // Default to 48kHz
  return 48000;
}

/**
 * Detects if audio is likely to glitch.
 */
export function detectGlitchRisk(metrics: AudioMetrics): boolean {
  // High latency or CPU load indicates glitch risk
  return metrics.outputLatency > 0.05 || metrics.cpuLoad > 0.8;
}

/**
 * Gets optimal buffer size for current hardware.
 */
export function getOptimalBufferSize(): 128 | 256 | 512 | 1024 {
  // Prefer low latency on modern hardware
  // Could be enhanced with hardware detection
  return 128;
}

/**
 * Creates audio context with retry on failure.
 */
export async function createContextWithRetry(
  config?: AudioContextOptions,
  maxRetries: number = 3
): Promise<AudioContext> {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const ctx = new AudioContext(config);
      return ctx;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
  
  throw lastError;
}
