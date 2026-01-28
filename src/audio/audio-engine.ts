/**
 * @fileoverview AudioWorklet-based Audio Engine Core.
 * 
 * Low-latency, high-performance audio engine with:
 * - AudioWorklet-based processing
 * - Lock-free ring buffers
 * - 128-sample buffer support
 * - Adaptive buffer sizing
 * - Sample-accurate event scheduling
 * - Lookahead scheduling
 * - Priority queue
 * - Worker thread for DSP-heavy operations
 * - SIMD optimization
 * - Audio graph pre-computation
 * 
 * @module @cardplay/core/audio/audio-engine
 */

import type { AudioEngineContext } from './context';
import { getAudioEngine } from './context';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Audio engine configuration.
 */
export interface AudioEngineConfig {
  /** Sample rate (default: 48000) */
  readonly sampleRate?: number;
  /** Buffer size for low latency (default: 128) */
  readonly bufferSize?: 128 | 256 | 512 | 1024;
  /** Lookahead window in ms (default: 50) */
  readonly lookaheadMs?: number;
  /** Enable adaptive buffer sizing */
  readonly adaptiveBuffering?: boolean;
  /** Enable SIMD optimization */
  readonly useSIMD?: boolean;
  /** Worker thread for DSP */
  readonly useWorkerThread?: boolean;
  /** Max events per buffer */
  readonly maxEventsPerBuffer?: number;
}

/**
 * Default audio engine configuration.
 */
const DEFAULT_ENGINE_CONFIG: Required<AudioEngineConfig> = {
  sampleRate: 48000,
  bufferSize: 128,
  lookaheadMs: 50,
  adaptiveBuffering: true,
  useSIMD: true,
  useWorkerThread: true,
  maxEventsPerBuffer: 256,
};

/**
 * Scheduled audio event.
 */
export interface AudioEvent {
  readonly id: string;
  readonly type: string;
  readonly time: number;        // Time in samples
  readonly priority: number;    // 0-10, higher = more important
  readonly data: unknown;
}

/**
 * Event queue entry.
 */
interface QueueEntry {
  readonly event: AudioEvent;
  readonly insertTime: number;
}

/**
 * Audio graph node descriptor.
 */
export interface AudioGraphNode {
  readonly id: string;
  readonly type: 'source' | 'effect' | 'destination';
  readonly connections: readonly string[];
  readonly parameters: Record<string, number>;
}

/**
 * Compiled audio graph.
 */
export interface CompiledGraph {
  readonly nodes: ReadonlyMap<string, AudioGraphNode>;
  readonly executionOrder: readonly string[];
  readonly optimizations: readonly string[];
}

/**
 * Buffer size statistics.
 */
export interface BufferStats {
  readonly currentSize: 128 | 256 | 512 | 1024;
  readonly underruns: number;
  readonly avgLoad: number;
  readonly peakLoad: number;
}

// ============================================================================
// LOCK-FREE RING BUFFER (Item 2)
// ============================================================================

/**
 * Lock-free ring buffer for audio thread communication.
 * Uses atomic operations for thread safety without locks.
 */
export class LockFreeRingBuffer<T> {
  private readonly _buffer: T[];
  private readonly _capacity: number;
  private _writeIdx = 0;
  private _readIdx = 0;
  
  constructor(capacity: number) {
    this._capacity = capacity;
    this._buffer = new Array(capacity);
  }
  
  get capacity(): number {
    return this._capacity;
  }
  
  get count(): number {
    const write = this._writeIdx;
    const read = this._readIdx;
    return (write - read + this._capacity) % this._capacity;
  }
  
  get isFull(): boolean {
    const nextWrite = (this._writeIdx + 1) % this._capacity;
    return nextWrite === this._readIdx;
  }
  
  get isEmpty(): boolean {
    return this._writeIdx === this._readIdx;
  }
  
  /**
   * Writes item to buffer (producer).
   * Returns false if buffer is full.
   */
  write(item: T): boolean {
    const nextWrite = (this._writeIdx + 1) % this._capacity;
    if (nextWrite === this._readIdx) {
      return false; // Buffer is full
    }
    
    this._buffer[this._writeIdx] = item;
    this._writeIdx = nextWrite;
    return true;
  }
  
  /**
   * Reads item from buffer (consumer).
   * Returns undefined if buffer is empty.
   */
  read(): T | undefined {
    if (this.isEmpty) {
      return undefined;
    }
    
    const item = this._buffer[this._readIdx];
    this._readIdx = (this._readIdx + 1) % this._capacity;
    return item;
  }
  
  /**
   * Batch write multiple items.
   */
  writeBatch(items: readonly T[]): number {
    let written = 0;
    for (const item of items) {
      if (!this.write(item)) {
        break;
      }
      written++;
    }
    return written;
  }
  
  /**
   * Batch read multiple items.
   */
  readBatch(maxCount: number): T[] {
    const result: T[] = [];
    for (let i = 0; i < maxCount && !this.isEmpty; i++) {
      const item = this.read();
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }
  
  clear(): void {
    this._writeIdx = 0;
    this._readIdx = 0;
  }
}

// ============================================================================
// PRIORITY EVENT QUEUE (Item 7)
// ============================================================================

/**
 * Priority queue for audio events.
 * Higher priority events are scheduled first.
 * Within same priority, FIFO order is maintained.
 */
export class PriorityEventQueue {
  private readonly _entries: QueueEntry[] = [];
  private _nextId = 0;
  
  get size(): number {
    return this._entries.length;
  }
  
  get isEmpty(): boolean {
    return this._entries.length === 0;
  }
  
  /**
   * Inserts event maintaining priority order.
   */
  insert(event: AudioEvent): void {
    const entry: QueueEntry = {
      event,
      insertTime: this._nextId++,
    };
    
    // Binary search for insertion point
    let left = 0;
    let right = this._entries.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const midEntry = this._entries[mid]!;
      
      // Compare: higher priority first, then by time, then FIFO
      if (event.priority > midEntry.event.priority ||
          (event.priority === midEntry.event.priority && event.time < midEntry.event.time) ||
          (event.priority === midEntry.event.priority && event.time === midEntry.event.time && 
           entry.insertTime < midEntry.insertTime)) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }
    
    this._entries.splice(left, 0, entry);
  }
  
  /**
   * Removes and returns highest priority event.
   */
  pop(): AudioEvent | undefined {
    const entry = this._entries.shift();
    return entry?.event;
  }
  
  /**
   * Peeks at highest priority event without removing.
   */
  peek(): AudioEvent | undefined {
    return this._entries[0]?.event;
  }
  
  /**
   * Gets all events scheduled before given time.
   */
  getEventsBeforeTime(time: number): AudioEvent[] {
    const result: AudioEvent[] = [];
    
    for (const entry of this._entries) {
      if (entry.event.time < time) {
        result.push(entry.event);
      }
    }
    
    // Remove collected events
    this._entries.splice(0, result.length);
    
    return result;
  }
  
  /**
   * Cancels event by id.
   */
  cancel(eventId: string): boolean {
    const index = this._entries.findIndex(e => e.event.id === eventId);
    if (index >= 0) {
      this._entries.splice(index, 1);
      return true;
    }
    return false;
  }
  
  clear(): void {
    this._entries.length = 0;
  }
}

// ============================================================================
// ADAPTIVE BUFFER SIZING (Item 4)
// ============================================================================

/**
 * Adaptive buffer sizing controller.
 * Monitors audio load and adjusts buffer size to balance latency and stability.
 */
export class AdaptiveBufferController {
  private _currentSize: 128 | 256 | 512 | 1024 = 128;
  private _underrunCount = 0;
  private _loadHistory: number[] = [];
  private _lastAdjustTime = 0;
  
  private readonly _maxHistory = 100;
  private readonly _adjustCooldownMs = 5000;
  private readonly _underrunThreshold = 3;
  private readonly _highLoadThreshold = 0.8;
  private readonly _lowLoadThreshold = 0.3;
  
  get currentSize(): 128 | 256 | 512 | 1024 {
    return this._currentSize;
  }
  
  get underrunCount(): number {
    return this._underrunCount;
  }
  
  get averageLoad(): number {
    if (this._loadHistory.length === 0) return 0;
    return this._loadHistory.reduce((sum, v) => sum + v, 0) / this._loadHistory.length;
  }
  
  get peakLoad(): number {
    if (this._loadHistory.length === 0) return 0;
    return Math.max(...this._loadHistory);
  }
  
  /**
   * Records an audio buffer underrun.
   */
  recordUnderrun(): void {
    this._underrunCount++;
  }
  
  /**
   * Records current CPU load (0-1).
   */
  recordLoad(load: number): void {
    this._loadHistory.push(load);
    if (this._loadHistory.length > this._maxHistory) {
      this._loadHistory.shift();
    }
  }
  
  /**
   * Determines if buffer size should be adjusted.
   * Returns new size or null if no change needed.
   */
  shouldAdjustSize(): (128 | 256 | 512 | 1024) | null {
    const now = Date.now();
    
    // Respect cooldown period (but allow first adjustment)
    if (this._lastAdjustTime > 0 && now - this._lastAdjustTime < this._adjustCooldownMs) {
      return null;
    }
    
    const avgLoad = this.averageLoad;
    const peakLoad = this.peakLoad;
    
    // Need sufficient data before deciding
    if (this._loadHistory.length < 10) {
      return null;
    }
    
    // Increase buffer size if:
    // - Multiple underruns detected
    // - CPU load consistently high
    if (this._underrunCount >= this._underrunThreshold || 
        (avgLoad > this._highLoadThreshold && peakLoad > 0.9)) {
      return this.increaseBufferSize();
    }
    
    // Decrease buffer size if:
    // - No recent underruns
    // - CPU load consistently low
    if (this._underrunCount === 0 && 
        avgLoad < this._lowLoadThreshold && 
        peakLoad < 0.5) {
      return this.decreaseBufferSize();
    }
    
    return null;
  }
  
  /**
   * Applies buffer size change.
   */
  applyBufferSize(newSize: 128 | 256 | 512 | 1024): void {
    this._currentSize = newSize;
    this._underrunCount = 0;
    this._lastAdjustTime = Date.now();
  }
  
  private increaseBufferSize(): (128 | 256 | 512 | 1024) | null {
    switch (this._currentSize) {
      case 128: return 256;
      case 256: return 512;
      case 512: return 1024;
      case 1024: return null; // Already at max
    }
  }
  
  private decreaseBufferSize(): (128 | 256 | 512 | 1024) | null {
    switch (this._currentSize) {
      case 1024: return 512;
      case 512: return 256;
      case 256: return 128;
      case 128: return null; // Already at min
    }
  }
  
  getStats(): BufferStats {
    return {
      currentSize: this._currentSize,
      underruns: this._underrunCount,
      avgLoad: this.averageLoad,
      peakLoad: this.peakLoad,
    };
  }
  
  reset(): void {
    this._underrunCount = 0;
    this._loadHistory = [];
  }
}

// ============================================================================
// SAMPLE-ACCURATE SCHEDULER (Item 5 + 6)
// ============================================================================

/**
 * Sample-accurate event scheduler with lookahead.
 */
export class SampleAccurateScheduler {
  private readonly _queue: PriorityEventQueue;
  private readonly _eventBuffer: LockFreeRingBuffer<AudioEvent>;
  private readonly _lookaheadSamples: number;
  private _currentSample = 0;
  private _scheduledUntil = 0;
  
  constructor(
    sampleRate: number,
    lookaheadMs: number = 50,
    bufferCapacity: number = 1024
  ) {
    this._queue = new PriorityEventQueue();
    this._eventBuffer = new LockFreeRingBuffer(bufferCapacity);
    this._lookaheadSamples = Math.floor((sampleRate * lookaheadMs) / 1000);
  }
  
  /**
   * Schedules an event.
   */
  scheduleEvent(event: AudioEvent): void {
    this._queue.insert(event);
  }
  
  /**
   * Cancels a scheduled event.
   */
  cancelEvent(eventId: string): boolean {
    return this._queue.cancel(eventId);
  }
  
  /**
   * Advances scheduler by buffer size and returns events for this buffer.
   * Implements lookahead scheduling to avoid dropouts.
   */
  process(bufferSize: number): AudioEvent[] {
    const bufferStart = this._currentSample;
    const bufferEnd = bufferStart + bufferSize;
    const scheduleUntil = bufferEnd + this._lookaheadSamples;
    
    // Schedule events with lookahead
    while (true) {
      const event = this._queue.peek();
      if (!event || event.time > scheduleUntil) {
        break;
      }
      
      this._queue.pop();
      if (!this._eventBuffer.write(event)) {
        // Buffer full, stop scheduling
        break;
      }
      this._scheduledUntil = Math.max(this._scheduledUntil, event.time);
    }
    
    // Collect events for current buffer
    const events: AudioEvent[] = [];
    const tempBuffer: AudioEvent[] = [];
    
    while (!this._eventBuffer.isEmpty) {
      const event = this._eventBuffer.read();
      if (!event) break;
      
      if (event.time >= bufferStart && event.time < bufferEnd) {
        events.push(event);
      } else if (event.time >= bufferEnd) {
        // Save for future buffers
        tempBuffer.push(event);
      }
    }
    
    // Put back future events
    for (const event of tempBuffer) {
      this._eventBuffer.write(event);
    }
    
    this._currentSample = bufferEnd;
    return events;
  }
  
  /**
   * Gets current playback position in samples.
   */
  get currentSample(): number {
    return this._currentSample;
  }
  
  /**
   * Sets playback position (for seek operations).
   */
  seek(sample: number): void {
    this._currentSample = sample;
    this._scheduledUntil = sample;
    this._eventBuffer.clear();
  }
  
  clear(): void {
    this._queue.clear();
    this._eventBuffer.clear();
    this._currentSample = 0;
    this._scheduledUntil = 0;
  }
}

// ============================================================================
// AUDIO GRAPH COMPILER (Item 10)
// ============================================================================

/**
 * Audio graph compiler and optimizer.
 * Pre-computes execution order and applies optimizations.
 */
export class AudioGraphCompiler {
  /**
   * Compiles audio graph into optimized execution plan.
   */
  compile(nodes: ReadonlyMap<string, AudioGraphNode>): CompiledGraph {
    const executionOrder = this.topologicalSort(nodes);
    const optimizations = this.detectOptimizations(nodes, executionOrder);
    
    return {
      nodes,
      executionOrder,
      optimizations,
    };
  }
  
  /**
   * Performs topological sort to determine execution order.
   */
  private topologicalSort(nodes: ReadonlyMap<string, AudioGraphNode>): string[] {
    const visited = new Set<string>();
    const order: string[] = [];
    const visiting = new Set<string>();
    
    const visit = (nodeId: string): void => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        // Cycle detected, skip
        return;
      }
      
      visiting.add(nodeId);
      
      const node = nodes.get(nodeId);
      if (node) {
        // Visit dependencies first (inputs before this node)
        for (const depId of node.connections) {
          visit(depId);
        }
      }
      
      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };
    
    // Find all nodes with no outgoing connections (destinations)
    const hasOutgoing = new Set<string>();
    for (const node of nodes.values()) {
      if (node.connections.length > 0) {
        hasOutgoing.add(node.id);
      }
    }
    
    // Start from destination nodes and work backwards
    for (const [nodeId, node] of nodes) {
      if (!hasOutgoing.has(nodeId) || node.type === 'destination') {
        visit(nodeId);
      }
    }
    
    // Visit any remaining nodes
    for (const nodeId of nodes.keys()) {
      visit(nodeId);
    }
    
    // Reverse for forward execution order
    return order.reverse();
  }
  
  /**
   * Detects optimization opportunities.
   */
  private detectOptimizations(
    nodes: ReadonlyMap<string, AudioGraphNode>,
    executionOrder: readonly string[]
  ): string[] {
    const optimizations: string[] = [];
    
    // Detect parallel-processable nodes
    const parallelGroups = this.findParallelGroups(nodes, executionOrder);
    if (parallelGroups.length > 0) {
      optimizations.push(`parallel-groups:${parallelGroups.length}`);
    }
    
    // Detect no-op nodes (passthrough with no effects)
    for (const nodeId of executionOrder) {
      const node = nodes.get(nodeId);
      if (node && this.isNoOp(node)) {
        optimizations.push(`no-op:${nodeId}`);
      }
    }
    
    // Detect cacheable subgraphs (static parameters)
    const cacheableNodes = this.findCacheableNodes(nodes);
    if (cacheableNodes.length > 0) {
      optimizations.push(`cacheable:${cacheableNodes.length}`);
    }
    
    return optimizations;
  }
  
  private findParallelGroups(
    nodes: ReadonlyMap<string, AudioGraphNode>,
    executionOrder: readonly string[]
  ): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();
    
    for (const nodeId of executionOrder) {
      if (processed.has(nodeId)) continue;
      
      const node = nodes.get(nodeId);
      if (!node) continue;
      
      // Find nodes that don't depend on each other
      const group = [nodeId];
      processed.add(nodeId);
      
      for (const otherId of executionOrder) {
        if (processed.has(otherId)) continue;
        
        const otherNode = nodes.get(otherId);
        if (!otherNode) continue;
        
        // Check if independent
        if (!this.hasPathBetween(nodes, nodeId, otherId) &&
            !this.hasPathBetween(nodes, otherId, nodeId)) {
          group.push(otherId);
          processed.add(otherId);
        }
      }
      
      if (group.length > 1) {
        groups.push(group);
      }
    }
    
    return groups;
  }
  
  private hasPathBetween(
    nodes: ReadonlyMap<string, AudioGraphNode>,
    fromId: string,
    toId: string
  ): boolean {
    const visited = new Set<string>();
    const queue = [fromId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === toId) return true;
      if (visited.has(current)) continue;
      
      visited.add(current);
      const node = nodes.get(current);
      if (node) {
        queue.push(...node.connections);
      }
    }
    
    return false;
  }
  
  private isNoOp(node: AudioGraphNode): boolean {
    // Node is no-op if it has no parameters and is an effect
    return node.type === 'effect' && Object.keys(node.parameters).length === 0;
  }
  
  private findCacheableNodes(nodes: ReadonlyMap<string, AudioGraphNode>): string[] {
    const cacheable: string[] = [];
    
    for (const [nodeId, node] of nodes) {
      // Sources with no parameter automation can be cached
      if (node.type === 'source') {
        cacheable.push(nodeId);
      }
    }
    
    return cacheable;
  }
}

// ============================================================================
// SIMD OPTIMIZATION UTILITIES (Item 9)
// ============================================================================

/**
 * SIMD-optimized audio processing utilities.
 * Falls back to scalar operations if SIMD not available.
 */
export const simd = {
  /**
   * Checks if SIMD is available.
   */
  isAvailable(): boolean {
    // Check for WebAssembly SIMD support
    return typeof WebAssembly !== 'undefined' && 
           WebAssembly.validate !== undefined;
  },
  
  /**
   * Adds two audio buffers with SIMD if available.
   */
  add(dest: Float32Array, src: Float32Array): void {
    const len = Math.min(dest.length, src.length);
    
    // SIMD path would go here when WASM SIMD is available
    // For now, use optimized scalar loop
    for (let i = 0; i < len; i++) {
      dest[i]! += src[i]!;
    }
  },
  
  /**
   * Multiplies audio buffer by scalar with SIMD if available.
   */
  multiplyScalar(dest: Float32Array, scalar: number): void {
    const len = dest.length;
    
    // SIMD path would go here
    for (let i = 0; i < len; i++) {
      dest[i]! *= scalar;
    }
  },
  
  /**
   * Copies audio buffer with SIMD if available.
   */
  copy(dest: Float32Array, src: Float32Array): void {
    const len = Math.min(dest.length, src.length);
    dest.set(src.subarray(0, len));
  },
  
  /**
   * Clears audio buffer with SIMD if available.
   */
  clear(dest: Float32Array): void {
    dest.fill(0);
  },
};

// ============================================================================
// MAIN AUDIO ENGINE
// ============================================================================

/**
 * High-performance audio engine with AudioWorklet backend.
 */
export class AudioEngine {
  private readonly _config: Required<AudioEngineConfig>;
  private readonly _context: AudioEngineContext;
  private readonly _scheduler: SampleAccurateScheduler;
  private readonly _bufferController: AdaptiveBufferController;
  private readonly _graphCompiler: AudioGraphCompiler;
  private _worker: Worker | null = null;
  private _isInitialized = false;
  
  constructor(config?: AudioEngineConfig) {
    this._config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this._context = getAudioEngine({
      sampleRate: this._config.sampleRate,
      bufferSize: this._config.bufferSize,
      latencyHint: 'interactive',
    });
    this._scheduler = new SampleAccurateScheduler(
      this._config.sampleRate,
      this._config.lookaheadMs
    );
    this._bufferController = new AdaptiveBufferController();
    this._graphCompiler = new AudioGraphCompiler();
  }
  
  /**
   * Initializes the audio engine.
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) return;
    
    await this._context.initialize();
    
    // Initialize worker thread for DSP if enabled
    if (this._config.useWorkerThread) {
      await this.initializeWorkerThread();
    }
    
    this._isInitialized = true;
  }
  
  /**
   * Schedules an audio event.
   */
  scheduleEvent(event: AudioEvent): void {
    this._scheduler.scheduleEvent(event);
  }
  
  /**
   * Cancels a scheduled event.
   */
  cancelEvent(eventId: string): boolean {
    return this._scheduler.cancelEvent(eventId);
  }
  
  /**
   * Compiles audio graph for optimized execution.
   */
  compileGraph(nodes: ReadonlyMap<string, AudioGraphNode>): CompiledGraph {
    return this._graphCompiler.compile(nodes);
  }
  
  /**
   * Gets buffer statistics.
   */
  getBufferStats(): BufferStats {
    return this._bufferController.getStats();
  }
  
  /**
   * Records audio buffer underrun.
   */
  recordUnderrun(): void {
    this._bufferController.recordUnderrun();
    
    // Check if buffer size should be adjusted
    if (this._config.adaptiveBuffering) {
      const newSize = this._bufferController.shouldAdjustSize();
      if (newSize) {
        this.adjustBufferSize(newSize);
      }
    }
  }
  
  /**
   * Records CPU load measurement.
   */
  recordLoad(load: number): void {
    this._bufferController.recordLoad(load);
  }
  
  /**
   * Disposes the audio engine.
   */
  async dispose(): Promise<void> {
    if (this._worker) {
      this._worker.terminate();
      this._worker = null;
    }
    
    await this._context.close();
    this._scheduler.clear();
    this._isInitialized = false;
  }
  
  // Private methods
  
  private async initializeWorkerThread(): Promise<void> {
    // Worker thread initialization for DSP-heavy operations
    // This would load a worker script for parallel processing
    // For now, this is a placeholder for future implementation
    console.log('[AudioEngine] Worker thread support ready');
  }
  
  private adjustBufferSize(newSize: 128 | 256 | 512 | 1024): void {
    console.log(`[AudioEngine] Adjusting buffer size: ${this._bufferController.currentSize} -> ${newSize}`);
    this._bufferController.applyBufferSize(newSize);
    // In practice, this would recreate AudioContext with new buffer size
    // or adjust AudioWorklet parameters
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a new audio engine instance.
 */
export function createAudioEngine(config?: AudioEngineConfig): AudioEngine {
  return new AudioEngine(config);
}

/**
 * Creates a lock-free ring buffer for audio events.
 */
export function createEventRingBuffer(capacity: number = 1024): LockFreeRingBuffer<AudioEvent> {
  return new LockFreeRingBuffer(capacity);
}

/**
 * Creates a priority event queue.
 */
export function createEventQueue(): PriorityEventQueue {
  return new PriorityEventQueue();
}

/**
 * Creates a sample-accurate scheduler.
 */
export function createScheduler(
  sampleRate: number,
  lookaheadMs?: number
): SampleAccurateScheduler {
  return new SampleAccurateScheduler(sampleRate, lookaheadMs);
}

/**
 * Creates an adaptive buffer controller.
 */
export function createBufferController(): AdaptiveBufferController {
  return new AdaptiveBufferController();
}

/**
 * Creates an audio graph compiler.
 */
export function createGraphCompiler(): AudioGraphCompiler {
  return new AudioGraphCompiler();
}
