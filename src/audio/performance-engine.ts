/**
 * @fileoverview Performance & Low-Latency Audio Engine
 * 
 * Implements high-performance audio processing with:
 * - WASM-based synthesis engines
 * - SIMD optimization for vector operations
 * - AudioWorklet with ring buffer
 * - Sample streaming from disk
 * - Memory-efficient sample management
 * - Real-time performance monitoring
 * 
 * @module @cardplay/core/audio/performance-engine
 */

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

/** Performance metrics */
export interface PerformanceMetrics {
  // Timing
  audioCallbackMs: number;
  maxAudioCallbackMs: number;
  averageCallbackMs: number;
  callbackJitter: number;
  bufferUnderruns: number;
  
  // CPU
  dspLoadPercent: number;
  peakDspLoadPercent: number;
  workerUtilization: number;
  
  // Memory
  heapUsedMB: number;
  heapTotalMB: number;
  sampleMemoryMB: number;
  wavetableMemoryMB: number;
  
  // Audio
  sampleRate: number;
  bufferSize: number;
  latencyMs: number;
  activeVoices: number;
  
  // Streaming
  streamsActive: number;
  streamCacheHitRate: number;
  diskReadsPending: number;
  
  // WASM/SIMD
  wasmEnabled: boolean;
  simdEnabled: boolean;
  workletActive: boolean;
}

/** Buffer sizes */
export type BufferSize = 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;

/** Sample rate options */
export type SampleRateOption = 22050 | 44100 | 48000 | 88200 | 96000 | 176400 | 192000;

/** Engine configuration */
export interface EngineConfig {
  sampleRate: SampleRateOption;
  bufferSize: BufferSize;
  maxVoices: number;
  
  // WASM/SIMD
  enableWASM: boolean;
  enableSIMD: boolean;
  wasmMemoryMB: number;
  
  // Worklet
  useAudioWorklet: boolean;
  workletPath: string;
  
  // Streaming
  enableStreaming: boolean;
  streamCacheMB: number;
  preloadSamples: boolean;
  
  // Threading
  numWorkers: number;
  
  // Quality
  interpolationQuality: 'none' | 'linear' | 'cubic' | 'sinc';
  oversamplingFactor: 1 | 2 | 4 | 8;
}

/** Default engine config */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  sampleRate: 44100,
  bufferSize: 256,
  maxVoices: 64,
  enableWASM: true,
  enableSIMD: true,
  wasmMemoryMB: 64,
  useAudioWorklet: true,
  workletPath: '/worklets/audio-processor.js',
  enableStreaming: true,
  streamCacheMB: 128,
  preloadSamples: true,
  numWorkers: 4,
  interpolationQuality: 'cubic',
  oversamplingFactor: 2,
};

// ============================================================================
// RING BUFFER
// ============================================================================

/**
 * Lock-free ring buffer for audio thread communication
 */
export class AudioRingBuffer {
  private buffer: SharedArrayBuffer;
  private data: Float32Array;
  private writeIndex: Uint32Array;
  private readIndex: Uint32Array;
  private capacity: number;
  
  constructor(capacitySamples: number, channels = 2) {
    this.capacity = capacitySamples;
    
    // Total size: data + 2 indices (write, read)
    const dataSize = capacitySamples * channels * Float32Array.BYTES_PER_ELEMENT;
    const indexSize = 2 * Uint32Array.BYTES_PER_ELEMENT;
    
    this.buffer = new SharedArrayBuffer(dataSize + indexSize);
    this.data = new Float32Array(this.buffer, 0, capacitySamples * channels);
    this.writeIndex = new Uint32Array(this.buffer, dataSize, 1);
    this.readIndex = new Uint32Array(this.buffer, dataSize + 4, 1);
    
    // Initialize indices
    Atomics.store(this.writeIndex, 0, 0);
    Atomics.store(this.readIndex, 0, 0);
  }
  
  /**
   * Get available space for writing
   */
  availableWrite(): number {
    const write = Atomics.load(this.writeIndex, 0);
    const read = Atomics.load(this.readIndex, 0);
    
    if (write >= read) {
      return this.capacity - (write - read) - 1;
    } else {
      return read - write - 1;
    }
  }
  
  /**
   * Get available samples for reading
   */
  availableRead(): number {
    const write = Atomics.load(this.writeIndex, 0);
    const read = Atomics.load(this.readIndex, 0);
    
    if (write >= read) {
      return write - read;
    } else {
      return this.capacity - read + write;
    }
  }
  
  /**
   * Write samples to ring buffer
   */
  write(left: Float32Array, right: Float32Array, offset: number, length: number): number {
    const available = this.availableWrite();
    const toWrite = Math.min(length, available);
    
    if (toWrite === 0) return 0;
    
    let writePos = Atomics.load(this.writeIndex, 0);
    
    for (let i = 0; i < toWrite; i++) {
      const idx = (writePos + i) % this.capacity;
      this.data[idx * 2] = left[offset + i]!;
      this.data[idx * 2 + 1] = right[offset + i]!;
    }
    
    // Update write index atomically
    Atomics.store(this.writeIndex, 0, (writePos + toWrite) % this.capacity);
    
    return toWrite;
  }
  
  /**
   * Read samples from ring buffer
   */
  read(left: Float32Array, right: Float32Array, offset: number, length: number): number {
    const available = this.availableRead();
    const toRead = Math.min(length, available);
    
    if (toRead === 0) return 0;
    
    let readPos = Atomics.load(this.readIndex, 0);
    
    for (let i = 0; i < toRead; i++) {
      const idx = (readPos + i) % this.capacity;
      left[offset + i] = this.data[idx * 2]!;
      right[offset + i] = this.data[idx * 2 + 1]!;
    }
    
    // Update read index atomically
    Atomics.store(this.readIndex, 0, (readPos + toRead) % this.capacity);
    
    return toRead;
  }
  
  /**
   * Get underlying shared buffer
   */
  getSharedBuffer(): SharedArrayBuffer {
    return this.buffer;
  }
  
  /**
   * Reset buffer
   */
  reset(): void {
    Atomics.store(this.writeIndex, 0, 0);
    Atomics.store(this.readIndex, 0, 0);
  }
}

// ============================================================================
// WASM MODULE INTERFACE
// ============================================================================

/**
 * WASM module interface for synthesis operations
 */
export interface WASMModule {
  // Memory
  memory: WebAssembly.Memory;
  
  // Oscillator functions
  oscillator_process(
    outputPtr: number,
    length: number,
    frequency: number,
    phase: number,
    waveform: number
  ): number;
  
  // Wavetable functions  
  wavetable_init(tablePtr: number, frameCount: number, frameSize: number): void;
  wavetable_process(
    outputPtr: number,
    length: number,
    tablePtr: number,
    frequency: number,
    phase: number,
    morphPosition: number
  ): number;
  
  // Filter functions
  filter_init(type: number, cutoff: number, resonance: number): number;
  filter_process(filterPtr: number, inputPtr: number, outputPtr: number, length: number): void;
  filter_set_params(filterPtr: number, cutoff: number, resonance: number): void;
  
  // Envelope functions
  envelope_init(attack: number, decay: number, sustain: number, release: number): number;
  envelope_process(envPtr: number, outputPtr: number, length: number, gate: number): number;
  envelope_trigger(envPtr: number): void;
  envelope_release(envPtr: number): void;
  
  // SIMD vector operations
  simd_mul_add(aPtr: number, bPtr: number, cPtr: number, outPtr: number, length: number): void;
  simd_mix(aPtr: number, bPtr: number, mixPtr: number, outPtr: number, length: number): void;
  simd_apply_gain(dataPtr: number, length: number, gain: number): void;
  
  // Sample interpolation
  sample_read_linear(dataPtr: number, length: number, phase: number): number;
  sample_read_cubic(dataPtr: number, length: number, phase: number): number;
  sample_read_sinc(dataPtr: number, length: number, phase: number): number;
  
  // Memory management
  malloc(size: number): number;
  free(ptr: number): void;
}

/**
 * Load and initialize WASM module
 */
export async function loadWASMModule(wasmUrl: string): Promise<WASMModule | null> {
  try {
    const response = await fetch(wasmUrl);
    const wasmBytes = await response.arrayBuffer();
    
    const memory = new WebAssembly.Memory({
      initial: 256, // 16MB
      maximum: 1024, // 64MB
      shared: true, // For threading
    });
    
    const imports = {
      env: {
        memory,
        // Math functions
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        exp: Math.exp,
        log: Math.log,
        pow: Math.pow,
        sqrt: Math.sqrt,
        floor: Math.floor,
        ceil: Math.ceil,
        abs: Math.abs,
        min: Math.min,
        max: Math.max,
        // Random (seeded in WASM for reproducibility)
        random: Math.random,
      },
    };
    
    const { instance } = await WebAssembly.instantiate(wasmBytes, imports);
    
    return {
      memory,
      ...instance.exports,
    } as unknown as WASMModule;
  } catch (error) {
    console.warn('WASM module failed to load:', error);
    return null;
  }
}

// ============================================================================
// SIMD OPERATIONS (FALLBACK)
// ============================================================================

/**
 * SIMD-style vector operations (JavaScript fallback)
 */
export class SIMDOperations {
  /**
   * Multiply-add: out = a * b + c
   */
  static mulAdd(
    a: Float32Array,
    b: Float32Array,
    c: Float32Array,
    out: Float32Array,
    length: number
  ): void {
    // Process in chunks of 4 for potential auto-vectorization
    const chunks = Math.floor(length / 4);
    
    for (let i = 0; i < chunks; i++) {
      const idx = i * 4;
      out[idx] = a[idx]! * b[idx]! + c[idx]!;
      out[idx + 1] = a[idx + 1]! * b[idx + 1]! + c[idx + 1]!;
      out[idx + 2] = a[idx + 2]! * b[idx + 2]! + c[idx + 2]!;
      out[idx + 3] = a[idx + 3]! * b[idx + 3]! + c[idx + 3]!;
    }
    
    // Handle remaining
    for (let i = chunks * 4; i < length; i++) {
      out[i] = a[i]! * b[i]! + c[i]!;
    }
  }
  
  /**
   * Mix two buffers: out = a * (1 - mix) + b * mix
   */
  static mix(
    a: Float32Array,
    b: Float32Array,
    mix: Float32Array | number,
    out: Float32Array,
    length: number
  ): void {
    if (typeof mix === 'number') {
      const oneMinusMix = 1 - mix;
      for (let i = 0; i < length; i++) {
        out[i] = a[i]! * oneMinusMix + b[i]! * mix;
      }
    } else {
      for (let i = 0; i < length; i++) {
        const m = mix[i]!;
        out[i] = a[i]! * (1 - m) + b[i]! * m;
      }
    }
  }
  
  /**
   * Apply gain to buffer
   */
  static applyGain(data: Float32Array, length: number, gain: number): void {
    for (let i = 0; i < length; i++) {
      data[i] = data[i]! * gain;
    }
  }
  
  /**
   * Copy buffer
   */
  static copy(src: Float32Array, dst: Float32Array, length: number): void {
    dst.set(src.subarray(0, length));
  }
  
  /**
   * Clear buffer
   */
  static clear(data: Float32Array, length: number): void {
    data.fill(0, 0, length);
  }
  
  /**
   * Add buffers: out = a + b
   */
  static add(
    a: Float32Array,
    b: Float32Array,
    out: Float32Array,
    length: number
  ): void {
    for (let i = 0; i < length; i++) {
      out[i] = a[i]! + b[i]!;
    }
  }
  
  /**
   * Accumulate: out += a * gain
   */
  static accumulate(
    src: Float32Array,
    dst: Float32Array,
    length: number,
    gain: number
  ): void {
    for (let i = 0; i < length; i++) {
      dst[i] = (dst[i] ?? 0) + src[i]! * gain;
    }
  }
  
  /**
   * Soft clip
   */
  static softClip(data: Float32Array, length: number): void {
    for (let i = 0; i < length; i++) {
      const x = data[i]!;
      if (x > 1) {
        data[i] = 1 - 1 / (x + 1);
      } else if (x < -1) {
        data[i] = -1 + 1 / (-x + 1);
      }
    }
  }
}

// ============================================================================
// SAMPLE STREAMER
// ============================================================================

/** Stream cache entry */
interface StreamCacheEntry {
  sampleId: string;
  data: Float32Array;
  startSample: number;
  endSample: number;
  lastAccessTime: number;
  accessCount: number;
}

/**
 * Disk streaming for large samples
 */
export class SampleStreamer {
  private cache: Map<string, StreamCacheEntry[]> = new Map();
  private cacheSize = 0;
  private maxCacheSize: number;
  private chunkSize: number;
  private pendingReads: Map<string, Promise<Float32Array>> = new Map();
  
  // Statistics
  private cacheHits = 0;
  private cacheMisses = 0;
  
  constructor(maxCacheMB = 128, chunkSizeSamples = 65536) {
    this.maxCacheSize = maxCacheMB * 1024 * 1024;
    this.chunkSize = chunkSizeSamples;
  }
  
  /**
   * Request sample data for streaming
   */
  async requestChunk(
    sampleId: string,
    startSample: number,
    endSample: number,
    loadFunction: (start: number, end: number) => Promise<Float32Array>
  ): Promise<Float32Array> {
    const chunkKey = `${sampleId}_${Math.floor(startSample / this.chunkSize)}`;
    
    // Check cache
    const cached = this.getCachedChunk(sampleId, startSample, endSample);
    if (cached) {
      this.cacheHits++;
      return cached;
    }
    
    this.cacheMisses++;
    
    // Check if already loading
    if (this.pendingReads.has(chunkKey)) {
      return this.pendingReads.get(chunkKey)!;
    }
    
    // Load new chunk
    const chunkStart = Math.floor(startSample / this.chunkSize) * this.chunkSize;
    const chunkEnd = chunkStart + this.chunkSize;
    
    const loadPromise = loadFunction(chunkStart, chunkEnd);
    this.pendingReads.set(chunkKey, loadPromise);
    
    try {
      const data = await loadPromise;
      this.addToCache(sampleId, chunkStart, chunkEnd, data);
      this.pendingReads.delete(chunkKey);
      
      // Return requested portion
      const offset = startSample - chunkStart;
      const length = endSample - startSample;
      return data.subarray(offset, offset + length);
    } catch (error) {
      this.pendingReads.delete(chunkKey);
      throw error;
    }
  }
  
  /**
   * Get cached chunk if available
   */
  private getCachedChunk(
    sampleId: string,
    startSample: number,
    endSample: number
  ): Float32Array | null {
    const entries = this.cache.get(sampleId);
    if (!entries) return null;
    
    for (const entry of entries) {
      if (entry.startSample <= startSample && entry.endSample >= endSample) {
        entry.lastAccessTime = Date.now();
        entry.accessCount++;
        
        const offset = startSample - entry.startSample;
        const length = endSample - startSample;
        return entry.data.subarray(offset, offset + length);
      }
    }
    
    return null;
  }
  
  /**
   * Add chunk to cache
   */
  private addToCache(
    sampleId: string,
    startSample: number,
    endSample: number,
    data: Float32Array
  ): void {
    const dataSize = data.length * Float32Array.BYTES_PER_ELEMENT;
    
    // Evict if necessary
    while (this.cacheSize + dataSize > this.maxCacheSize) {
      this.evictOldest();
    }
    
    const entry: StreamCacheEntry = {
      sampleId,
      data: new Float32Array(data),
      startSample,
      endSample,
      lastAccessTime: Date.now(),
      accessCount: 1,
    };
    
    if (!this.cache.has(sampleId)) {
      this.cache.set(sampleId, []);
    }
    this.cache.get(sampleId)!.push(entry);
    this.cacheSize += dataSize;
  }
  
  /**
   * Evict oldest/least used entry
   */
  private evictOldest(): void {
    let oldest: StreamCacheEntry | null = null;
    let oldestKey: string | null = null;
    let oldestIndex = -1;
    let oldestScore = Infinity;
    
    for (const [key, entries] of this.cache) {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (!entry) continue;
        // Score: prioritize recent and frequently accessed
        const score = entry.lastAccessTime + entry.accessCount * 10000;
        if (score < oldestScore) {
          oldest = entry;
          oldestKey = key;
          oldestIndex = i;
          oldestScore = score;
        }
      }
    }
    
    if (oldest && oldestKey !== null && oldestIndex >= 0) {
      this.cacheSize -= oldest.data.length * Float32Array.BYTES_PER_ELEMENT;
      this.cache.get(oldestKey)!.splice(oldestIndex, 1);
      
      if (this.cache.get(oldestKey)!.length === 0) {
        this.cache.delete(oldestKey);
      }
    }
  }
  
  /**
   * Preload sample into cache
   */
  async preload(
    sampleId: string,
    totalLength: number,
    loadFunction: (start: number, end: number) => Promise<Float32Array>
  ): Promise<void> {
    // Preload first chunk (attack)
    await this.requestChunk(sampleId, 0, Math.min(this.chunkSize, totalLength), loadFunction);
  }
  
  /**
   * Clear sample from cache
   */
  clearSample(sampleId: string): void {
    const entries = this.cache.get(sampleId);
    if (entries) {
      for (const entry of entries) {
        this.cacheSize -= entry.data.length * Float32Array.BYTES_PER_ELEMENT;
      }
      this.cache.delete(sampleId);
    }
  }
  
  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    this.cacheSize = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    cacheSize: number;
    maxCacheSize: number;
    hitRate: number;
    entries: number;
  } {
    const total = this.cacheHits + this.cacheMisses;
    return {
      cacheSize: this.cacheSize,
      maxCacheSize: this.maxCacheSize,
      hitRate: total > 0 ? this.cacheHits / total : 0,
      entries: Array.from(this.cache.values()).reduce((sum, arr) => sum + arr.length, 0),
    };
  }
}

// ============================================================================
// AUDIO WORKLET PROCESSOR
// ============================================================================

/**
 * AudioWorklet processor message types
 */
export type WorkletMessageType =
  | 'init'
  | 'noteOn'
  | 'noteOff'
  | 'parameter'
  | 'preset'
  | 'wasm'
  | 'sample'
  | 'wavetable'
  | 'metrics';

export interface WorkletMessage {
  type: WorkletMessageType;
  data: unknown;
  timestamp: number;
}

/**
 * Generate AudioWorklet processor code
 */
export function generateWorkletCode(): string {
  return `
class SynthProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.sampleRate = options.processorOptions?.sampleRate || 44100;
    this.voices = [];
    this.maxVoices = options.processorOptions?.maxVoices || 64;
    this.ringBuffer = null;
    
    // Performance tracking
    this.lastCallbackTime = 0;
    this.callbackDurations = [];
    
    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    // Initialize voices
    for (let i = 0; i < this.maxVoices; i++) {
      this.voices.push({
        active: false,
        note: 0,
        velocity: 0,
        phase: 0,
        envPhase: 0,
        envValue: 0,
        state: 'idle',
      });
    }
  }
  
  handleMessage(msg) {
    switch (msg.type) {
      case 'noteOn':
        this.noteOn(msg.data.note, msg.data.velocity);
        break;
      case 'noteOff':
        this.noteOff(msg.data.note);
        break;
      case 'parameter':
        this.setParameter(msg.data.name, msg.data.value);
        break;
      case 'ringBuffer':
        this.ringBuffer = msg.data;
        break;
    }
  }
  
  noteOn(note, velocity) {
    for (const voice of this.voices) {
      if (!voice.active) {
        voice.active = true;
        voice.note = note;
        voice.velocity = velocity;
        voice.phase = 0;
        voice.envPhase = 0;
        voice.envValue = 0;
        voice.state = 'attack';
        return;
      }
    }
  }
  
  noteOff(note) {
    for (const voice of this.voices) {
      if (voice.active && voice.note === note) {
        voice.state = 'release';
        voice.envPhase = 0;
      }
    }
  }
  
  setParameter(name, value) {
    // Parameter handling
  }
  
  process(inputs, outputs, parameters) {
    const startTime = currentTime;
    
    const output = outputs[0];
    if (!output || output.length === 0) return true;
    
    const left = output[0];
    const right = output[1] || output[0];
    const bufferSize = left.length;
    
    // Clear output
    left.fill(0);
    right.fill(0);
    
    // Process all voices
    for (const voice of this.voices) {
      if (!voice.active) continue;
      
      const frequency = 440 * Math.pow(2, (voice.note - 69) / 12);
      const phaseInc = frequency / this.sampleRate;
      
      for (let i = 0; i < bufferSize; i++) {
        // Update envelope
        switch (voice.state) {
          case 'attack':
            voice.envValue += 0.001;
            if (voice.envValue >= 1) {
              voice.envValue = 1;
              voice.state = 'sustain';
            }
            break;
          case 'release':
            voice.envValue *= 0.999;
            if (voice.envValue < 0.001) {
              voice.active = false;
            }
            break;
        }
        
        // Generate sample (sine wave)
        const sample = Math.sin(voice.phase * 2 * Math.PI) * voice.envValue * (voice.velocity / 127);
        
        left[i] += sample;
        right[i] += sample;
        
        voice.phase = (voice.phase + phaseInc) % 1;
      }
    }
    
    // Soft clip output
    for (let i = 0; i < bufferSize; i++) {
      left[i] = Math.tanh(left[i] * 0.7);
      right[i] = Math.tanh(right[i] * 0.7);
    }
    
    // Track performance
    const duration = (currentTime - startTime) * 1000;
    this.callbackDurations.push(duration);
    if (this.callbackDurations.length > 100) {
      this.callbackDurations.shift();
    }
    
    return true;
  }
}

registerProcessor('synth-processor', SynthProcessor);
`;
}

// ============================================================================
// PERFORMANCE ENGINE
// ============================================================================

/**
 * High-performance audio engine
 */
export class PerformanceEngine {
  private config: EngineConfig;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private wasmModule: WASMModule | null = null;
  private streamer: SampleStreamer;
  private _ringBuffer: AudioRingBuffer | null = null;
  
  // Metrics
  private metrics: PerformanceMetrics;
  private callbackTimes: number[] = [];
  private maxCallbackTimes = 100;
  
  // State
  private isInitialized = false;
  private _isRunning = false;
  
  /** Get whether the engine is currently running */
  get isRunning(): boolean {
    return this._isRunning;
  }
  
  /** Get the ring buffer for audio thread communication */
  get ringBuffer(): AudioRingBuffer | null {
    return this._ringBuffer;
  }
  
  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this.streamer = new SampleStreamer(this.config.streamCacheMB);
    
    this.metrics = {
      audioCallbackMs: 0,
      maxAudioCallbackMs: 0,
      averageCallbackMs: 0,
      callbackJitter: 0,
      bufferUnderruns: 0,
      dspLoadPercent: 0,
      peakDspLoadPercent: 0,
      workerUtilization: 0,
      heapUsedMB: 0,
      heapTotalMB: 0,
      sampleMemoryMB: 0,
      wavetableMemoryMB: 0,
      sampleRate: this.config.sampleRate,
      bufferSize: this.config.bufferSize,
      latencyMs: this.config.bufferSize / this.config.sampleRate * 1000,
      activeVoices: 0,
      streamsActive: 0,
      streamCacheHitRate: 0,
      diskReadsPending: 0,
      wasmEnabled: false,
      simdEnabled: false,
      workletActive: false,
    };
  }
  
  /**
   * Initialize audio engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Create audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: this.config.sampleRate,
      latencyHint: 'interactive',
    });
    
    // Load WASM if enabled
    if (this.config.enableWASM) {
      try {
        this.wasmModule = await loadWASMModule('/wasm/synth.wasm');
        this.metrics.wasmEnabled = this.wasmModule !== null;
        
        // Check SIMD support
        if (this.wasmModule && this.config.enableSIMD) {
          this.metrics.simdEnabled = this.checkSIMDSupport();
        }
      } catch (error) {
        console.warn('WASM initialization failed:', error);
      }
    }
    
    // Set up AudioWorklet
    if (this.config.useAudioWorklet && this.audioContext) {
      try {
        const workletCode = generateWorkletCode();
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        await this.audioContext.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        
        this.workletNode = new AudioWorkletNode(this.audioContext, 'synth-processor', {
          processorOptions: {
            sampleRate: this.config.sampleRate,
            maxVoices: this.config.maxVoices,
          },
          outputChannelCount: [2],
        });
        
        this.workletNode.connect(this.audioContext.destination);
        this.metrics.workletActive = true;
        
        // Set up ring buffer for main thread communication
        this._ringBuffer = new AudioRingBuffer(this.config.bufferSize * 4, 2);
        
      } catch (error) {
        console.warn('AudioWorklet initialization failed:', error);
        this.metrics.workletActive = false;
      }
    }
    
    this.isInitialized = true;
    this.updateMetrics();
  }
  
  /**
   * Start audio engine
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    this._isRunning = true;
  }
  
  /**
   * Stop audio engine
   */
  stop(): void {
    if (this.audioContext?.state === 'running') {
      this.audioContext.suspend();
    }
    this._isRunning = false;
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.stop();
    
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.streamer.clearAll();
    this.isInitialized = false;
  }
  
  /**
   * Note on
   */
  noteOn(note: number, velocity: number, channel = 0): void {
    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'noteOn',
        data: { note, velocity, channel },
        timestamp: this.audioContext?.currentTime ?? 0,
      });
    }
  }
  
  /**
   * Note off
   */
  noteOff(note: number, channel = 0): void {
    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'noteOff',
        data: { note, channel },
        timestamp: this.audioContext?.currentTime ?? 0,
      });
    }
  }
  
  /**
   * Set parameter
   */
  setParameter(name: string, value: number): void {
    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'parameter',
        data: { name, value },
        timestamp: this.audioContext?.currentTime ?? 0,
      });
    }
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }
  
  /**
   * Get sample streamer
   */
  getStreamer(): SampleStreamer {
    return this.streamer;
  }
  
  /**
   * Get WASM module
   */
  getWASMModule(): WASMModule | null {
    return this.wasmModule;
  }
  
  /**
   * Get audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
  
  /**
   * Check SIMD support
   */
  private checkSIMDSupport(): boolean {
    try {
      // Check for WebAssembly SIMD support
      const simdTest = new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0,
        253, 15, 253, 98, 11,
      ]);
      return WebAssembly.validate(simdTest);
    } catch {
      return false;
    }
  }
  
  /**
   * Update metrics
   */
  private updateMetrics(): void {
    // Memory usage
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      this.metrics.heapUsedMB = memory.usedJSHeapSize / (1024 * 1024);
      this.metrics.heapTotalMB = memory.totalJSHeapSize / (1024 * 1024);
    }
    
    // Streamer stats
    const streamerStats = this.streamer.getStats();
    this.metrics.streamCacheHitRate = streamerStats.hitRate;
    
    // Calculate average callback time
    if (this.callbackTimes.length > 0) {
      const sum = this.callbackTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageCallbackMs = sum / this.callbackTimes.length;
      this.metrics.maxAudioCallbackMs = Math.max(...this.callbackTimes);
      
      // Calculate jitter (standard deviation)
      const avg = this.metrics.averageCallbackMs;
      const variance = this.callbackTimes.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / this.callbackTimes.length;
      this.metrics.callbackJitter = Math.sqrt(variance);
    }
    
    // DSP load
    const theoreticalCallbackTime = this.config.bufferSize / this.config.sampleRate * 1000;
    this.metrics.dspLoadPercent = (this.metrics.averageCallbackMs / theoreticalCallbackTime) * 100;
    this.metrics.peakDspLoadPercent = (this.metrics.maxAudioCallbackMs / theoreticalCallbackTime) * 100;
    
    // Latency
    this.metrics.latencyMs = this.config.bufferSize / this.config.sampleRate * 1000;
    if (this.audioContext) {
      this.metrics.latencyMs += (this.audioContext.baseLatency ?? 0) * 1000;
      this.metrics.latencyMs += (this.audioContext.outputLatency ?? 0) * 1000;
    }
  }
  
  /**
   * Record callback time
   */
  recordCallbackTime(timeMs: number): void {
    this.callbackTimes.push(timeMs);
    if (this.callbackTimes.length > this.maxCallbackTimes) {
      this.callbackTimes.shift();
    }
    this.metrics.audioCallbackMs = timeMs;
  }
}

// ============================================================================
// INTERPOLATION
// ============================================================================

/**
 * Sample interpolation algorithms
 */
export class Interpolation {
  /**
   * Linear interpolation
   */
  static linear(data: Float32Array, phase: number): number {
    const length = data.length;
    if (length === 0) return 0;
    
    const idx0 = Math.floor(phase) % length;
    const idx1 = (idx0 + 1) % length;
    const frac = phase - Math.floor(phase);
    
    return data[idx0]! * (1 - frac) + data[idx1]! * frac;
  }
  
  /**
   * Cubic (Hermite) interpolation
   */
  static cubic(data: Float32Array, phase: number): number {
    const length = data.length;
    if (length === 0) return 0;
    
    const idx = Math.floor(phase);
    const frac = phase - idx;
    
    const idx0 = ((idx - 1) % length + length) % length;
    const idx1 = idx % length;
    const idx2 = (idx + 1) % length;
    const idx3 = (idx + 2) % length;
    
    const y0 = data[idx0]!;
    const y1 = data[idx1]!;
    const y2 = data[idx2]!;
    const y3 = data[idx3]!;
    
    // Hermite interpolation
    const c0 = y1;
    const c1 = 0.5 * (y2 - y0);
    const c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
    const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
    
    return ((c3 * frac + c2) * frac + c1) * frac + c0;
  }
  
  /**
   * Sinc interpolation (windowed)
   */
  static sinc(data: Float32Array, phase: number, windowSize = 16): number {
    const length = data.length;
    if (length === 0) return 0;
    
    const idx = Math.floor(phase);
    const frac = phase - idx;
    
    let sum = 0;
    const halfWindow = windowSize / 2;
    
    for (let i = -halfWindow + 1; i <= halfWindow; i++) {
      const sampleIdx = ((idx + i) % length + length) % length;
      const x = i - frac;
      
      // Sinc function
      let sincVal: number;
      if (Math.abs(x) < 1e-10) {
        sincVal = 1;
      } else {
        const px = Math.PI * x;
        sincVal = Math.sin(px) / px;
      }
      
      // Lanczos window
      const windowVal = x === 0 ? 1 : Math.sin(Math.PI * x / halfWindow) / (Math.PI * x / halfWindow);
      
      sum += data[sampleIdx]! * sincVal * windowVal;
    }
    
    return sum;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createPerformanceEngine(config?: Partial<EngineConfig>): PerformanceEngine {
  return new PerformanceEngine(config);
}

export { SIMDOperations as SIMD };
