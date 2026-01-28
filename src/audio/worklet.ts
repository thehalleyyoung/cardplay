/**
 * @fileoverview AudioWorklet Infrastructure.
 * 
 * Provides base processor classes and utilities for AudioWorklet:
 * - Base processor class
 * - Message protocol
 * - Parameter handling
 * - State synchronization
 * - Ring buffer for events
 * 
 * @module @cardplay/core/audio/worklet
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Worklet message types.
 */
export type WorkletMessageType =
  | 'init'
  | 'param'
  | 'state'
  | 'event'
  | 'metrics'
  | 'error'
  | 'bypass'
  | 'debug';

/**
 * Worklet message.
 */
export interface WorkletMessage<T = unknown> {
  readonly type: WorkletMessageType;
  readonly timestamp: number;
  readonly data: T;
}

/**
 * Parameter update message.
 */
export interface ParamMessage {
  readonly name: string;
  readonly value: number;
  readonly automationRate?: 'a-rate' | 'k-rate';
}

/**
 * State synchronization message.
 */
export interface StateMessage<S = unknown> {
  readonly state: S;
  readonly version: number;
}

/**
 * Event message for scheduling.
 */
export interface EventMessage<E = unknown> {
  readonly events: readonly E[];
  readonly startTime: number;
}

/**
 * Metrics message.
 */
export interface MetricsMessage {
  readonly cpuTime: number;
  readonly bufferTime: number;
  readonly eventCount: number;
  readonly voiceCount?: number;
}

/**
 * Worklet processor options.
 */
export interface ProcessorOptions {
  readonly sampleRate: number;
  readonly bufferSize: number;
  readonly channelCount: number;
}

// ============================================================================
// MESSAGE PROTOCOL
// ============================================================================

/**
 * Creates a worklet message.
 */
export function createWorkletMessage<T>(
  type: WorkletMessageType,
  data: T
): WorkletMessage<T> {
  return {
    type,
    timestamp: Date.now(),
    data,
  };
}

/**
 * Creates a parameter update message.
 */
export function createParamMessage(
  name: string,
  value: number,
  automationRate?: 'a-rate' | 'k-rate'
): WorkletMessage<ParamMessage> {
  const data: ParamMessage = automationRate !== undefined
    ? { name, value, automationRate }
    : { name, value };
  return createWorkletMessage('param', data);
}

/**
 * Creates a state sync message.
 */
export function createStateMessage<S>(
  state: S,
  version: number
): WorkletMessage<StateMessage<S>> {
  return createWorkletMessage('state', { state, version });
}

/**
 * Creates an event message.
 */
export function createEventMessage<E>(
  events: readonly E[],
  startTime: number
): WorkletMessage<EventMessage<E>> {
  return createWorkletMessage('event', { events, startTime });
}

/**
 * Creates a metrics message.
 */
export function createMetricsMessage(
  metrics: MetricsMessage
): WorkletMessage<MetricsMessage> {
  return createWorkletMessage('metrics', metrics);
}

// ============================================================================
// RING BUFFER
// ============================================================================

/**
 * Ring buffer for lock-free event passing.
 */
export class RingBuffer<T> {
  private readonly _buffer: T[];
  private readonly _capacity: number;
  private _writeIndex = 0;
  private _readIndex = 0;
  private _count = 0;
  
  constructor(capacity: number) {
    this._capacity = capacity;
    this._buffer = new Array(capacity);
  }
  
  /**
   * Gets current item count.
   */
  get count(): number {
    return this._count;
  }
  
  /**
   * Gets capacity.
   */
  get capacity(): number {
    return this._capacity;
  }
  
  /**
   * Checks if buffer is empty.
   */
  get isEmpty(): boolean {
    return this._count === 0;
  }
  
  /**
   * Checks if buffer is full.
   */
  get isFull(): boolean {
    return this._count === this._capacity;
  }
  
  /**
   * Writes an item to the buffer.
   */
  write(item: T): boolean {
    if (this.isFull) {
      return false;
    }
    
    this._buffer[this._writeIndex] = item;
    this._writeIndex = (this._writeIndex + 1) % this._capacity;
    this._count++;
    return true;
  }
  
  /**
   * Reads an item from the buffer.
   */
  read(): T | undefined {
    if (this.isEmpty) {
      return undefined;
    }
    
    const item = this._buffer[this._readIndex];
    this._readIndex = (this._readIndex + 1) % this._capacity;
    this._count--;
    return item;
  }
  
  /**
   * Peeks at the next item without removing.
   */
  peek(): T | undefined {
    if (this.isEmpty) {
      return undefined;
    }
    return this._buffer[this._readIndex];
  }
  
  /**
   * Clears the buffer.
   */
  clear(): void {
    this._writeIndex = 0;
    this._readIndex = 0;
    this._count = 0;
  }
  
  /**
   * Reads all items into an array.
   */
  readAll(): T[] {
    const items: T[] = [];
    while (!this.isEmpty) {
      const item = this.read();
      if (item !== undefined) {
        items.push(item);
      }
    }
    return items;
  }
}

// ============================================================================
// SHARED ARRAY BUFFER RING
// ============================================================================

/**
 * Lock-free ring buffer using SharedArrayBuffer.
 * For use between main thread and worklet.
 */
export class SharedRingBuffer {
  private readonly _buffer: SharedArrayBuffer;
  private readonly _data: Float32Array;
  private readonly _state: Int32Array;
  private readonly _capacity: number;
  
  // State indices
  private static readonly WRITE_INDEX = 0;
  private static readonly READ_INDEX = 1;
  
  constructor(capacity: number) {
    this._capacity = capacity;
    // Data buffer + 2 integers for indices
    this._buffer = new SharedArrayBuffer(capacity * 4 + 8);
    this._data = new Float32Array(this._buffer, 8, capacity);
    this._state = new Int32Array(this._buffer, 0, 2);
  }
  
  /**
   * Gets the underlying SharedArrayBuffer.
   */
  get buffer(): SharedArrayBuffer {
    return this._buffer;
  }
  
  /**
   * Gets current count (approximate, may race).
   */
  get count(): number {
    const write = Atomics.load(this._state, SharedRingBuffer.WRITE_INDEX);
    const read = Atomics.load(this._state, SharedRingBuffer.READ_INDEX);
    return (write - read + this._capacity) % this._capacity;
  }
  
  /**
   * Writes a value (producer side).
   */
  write(value: number): boolean {
    const write = Atomics.load(this._state, SharedRingBuffer.WRITE_INDEX);
    const read = Atomics.load(this._state, SharedRingBuffer.READ_INDEX);
    
    const nextWrite = (write + 1) % this._capacity;
    if (nextWrite === read) {
      return false; // Full
    }
    
    this._data[write] = value;
    Atomics.store(this._state, SharedRingBuffer.WRITE_INDEX, nextWrite);
    return true;
  }
  
  /**
   * Reads a value (consumer side).
   */
  read(): number | undefined {
    const write = Atomics.load(this._state, SharedRingBuffer.WRITE_INDEX);
    const read = Atomics.load(this._state, SharedRingBuffer.READ_INDEX);
    
    if (read === write) {
      return undefined; // Empty
    }
    
    const value = this._data[read];
    Atomics.store(this._state, SharedRingBuffer.READ_INDEX, (read + 1) % this._capacity);
    return value;
  }
}

// ============================================================================
// BASE PROCESSOR SCRIPT
// ============================================================================

/**
 * Generates the base processor script for worklets.
 */
export function generateBaseProcessorScript(): string {
  return `
/**
 * CardplayProcessor - Base AudioWorklet processor class.
 */
class CardplayProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this._bypassed = false;
    this._state = null;
    this._stateVersion = 0;
    this._metrics = {
      cpuTime: 0,
      bufferTime: 0,
      eventCount: 0,
    };
    
    // Setup message handling
    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    // Initialize with options
    this.initialize(options?.processorOptions ?? {});
  }
  
  static get parameterDescriptors() {
    return [];
  }
  
  initialize(options) {
    // Override in subclasses
  }
  
  handleMessage(message) {
    switch (message.type) {
      case 'param':
        this.handleParam(message.data);
        break;
      case 'state':
        this.handleState(message.data);
        break;
      case 'event':
        this.handleEvent(message.data);
        break;
      case 'bypass':
        this._bypassed = message.data;
        break;
      case 'debug':
        console.log('[CardplayProcessor]', message.data);
        break;
    }
  }
  
  handleParam(data) {
    // Override in subclasses
  }
  
  handleState(data) {
    this._state = data.state;
    this._stateVersion = data.version;
  }
  
  handleEvent(data) {
    // Override in subclasses
  }
  
  sendMetrics() {
    this.port.postMessage({
      type: 'metrics',
      timestamp: Date.now(),
      data: this._metrics,
    });
  }
  
  sendError(error) {
    this.port.postMessage({
      type: 'error',
      timestamp: Date.now(),
      data: { message: error.message, stack: error.stack },
    });
  }
  
  process(inputs, outputs, parameters) {
    if (this._bypassed) {
      // Pass through
      for (let i = 0; i < inputs.length; i++) {
        for (let j = 0; j < inputs[i].length; j++) {
          outputs[i][j].set(inputs[i][j]);
        }
      }
      return true;
    }
    
    const startTime = performance.now();
    
    try {
      this.processAudio(inputs, outputs, parameters);
    } catch (error) {
      this.sendError(error);
    }
    
    const endTime = performance.now();
    this._metrics.cpuTime = endTime - startTime;
    this._metrics.bufferTime = outputs[0]?.[0]?.length / sampleRate * 1000 || 0;
    
    return true;
  }
  
  processAudio(inputs, outputs, parameters) {
    // Override in subclasses
    // Default: silence
    for (const output of outputs) {
      for (const channel of output) {
        channel.fill(0);
      }
    }
  }
}

// Register the processor
registerProcessor('cardplay-processor', CardplayProcessor);
`;
}

// ============================================================================
// WORKLET LOADER
// ============================================================================

/**
 * Worklet module registry.
 */
const workletModules = new Map<string, string>();

/**
 * Registers a worklet module.
 */
export function registerWorkletModule(name: string, script: string): void {
  workletModules.set(name, script);
}

/**
 * Gets a registered worklet module.
 */
export function getWorkletModule(name: string): string | undefined {
  return workletModules.get(name);
}

/**
 * Loads a worklet module into an AudioContext.
 */
export async function loadWorkletModule(
  context: AudioContext,
  name: string,
  script?: string
): Promise<void> {
  const moduleScript = script ?? workletModules.get(name);
  if (!moduleScript) {
    throw new Error(`Worklet module "${name}" not found`);
  }
  
  // Create blob URL from script
  const blob = new Blob([moduleScript], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  
  try {
    await context.audioWorklet.addModule(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Loads the base CardplayProcessor module.
 */
export async function loadBaseProcessor(context: AudioContext): Promise<void> {
  const script = generateBaseProcessorScript();
  await loadWorkletModule(context, 'cardplay-processor', script);
}

// ============================================================================
// WORKLET NODE WRAPPER
// ============================================================================

/**
 * Options for CardplayWorkletNode.
 */
export interface CardplayNodeOptions {
  readonly numberOfInputs?: number;
  readonly numberOfOutputs?: number;
  readonly channelCount?: number;
  readonly processorOptions?: Record<string, unknown>;
}

/**
 * Wraps an AudioWorkletNode with CardplayProcessor functionality.
 */
export class CardplayWorkletNode {
  private readonly _node: AudioWorkletNode;
  private readonly _context: AudioContext;
  private _bypassed = false;
  private _metrics: MetricsMessage = {
    cpuTime: 0,
    bufferTime: 0,
    eventCount: 0,
  };
  
  constructor(
    context: AudioContext,
    processorName: string,
    options?: CardplayNodeOptions
  ) {
    this._context = context;
    this._node = new AudioWorkletNode(context, processorName, {
      numberOfInputs: options?.numberOfInputs ?? 1,
      numberOfOutputs: options?.numberOfOutputs ?? 1,
      channelCount: options?.channelCount ?? 2,
      processorOptions: options?.processorOptions,
    });
    
    // Handle messages from processor
    this._node.port.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data as WorkletMessage);
    };
  }
  
  /**
   * Gets the underlying AudioWorkletNode.
   */
  get node(): AudioWorkletNode {
    return this._node;
  }
  
  /**
   * Gets the AudioContext.
   */
  get context(): AudioContext {
    return this._context;
  }
  
  /**
   * Gets current metrics.
   */
  get metrics(): MetricsMessage {
    return this._metrics;
  }
  
  /**
   * Gets/sets bypass state.
   */
  get bypassed(): boolean {
    return this._bypassed;
  }
  
  set bypassed(value: boolean) {
    this._bypassed = value;
    this.sendMessage(createWorkletMessage('bypass', value));
  }
  
  /**
   * Connects to destination.
   */
  connect(destination: AudioNode): void {
    this._node.connect(destination);
  }
  
  /**
   * Disconnects from all.
   */
  disconnect(): void {
    this._node.disconnect();
  }
  
  /**
   * Sends a parameter update.
   */
  setParameter(name: string, value: number): void {
    this.sendMessage(createParamMessage(name, value));
  }
  
  /**
   * Sends state update.
   */
  setState<S>(state: S, version: number): void {
    this.sendMessage(createStateMessage(state, version));
  }
  
  /**
   * Sends events.
   */
  sendEvents<E>(events: readonly E[], startTime: number): void {
    this.sendMessage(createEventMessage(events, startTime));
  }
  
  /**
   * Sends a debug message.
   */
  debug(message: string): void {
    this.sendMessage(createWorkletMessage('debug', message));
  }
  
  private sendMessage(message: WorkletMessage): void {
    this._node.port.postMessage(message);
  }
  
  private handleMessage(message: WorkletMessage): void {
    switch (message.type) {
      case 'metrics':
        this._metrics = message.data as MetricsMessage;
        break;
      case 'error':
        console.error('[CardplayWorkletNode] Error:', message.data);
        break;
    }
  }
}

// ============================================================================
// TIMING UTILITIES
// ============================================================================

/**
 * High-precision timing for worklets.
 */
export interface WorkletTiming {
  readonly sampleRate: number;
  readonly bufferSize: number;
  readonly samplesPerMs: number;
  readonly bufferDurationMs: number;
}

/**
 * Creates timing info.
 */
export function createWorkletTiming(
  sampleRate: number,
  bufferSize: number
): WorkletTiming {
  return {
    sampleRate,
    bufferSize,
    samplesPerMs: sampleRate / 1000,
    bufferDurationMs: (bufferSize / sampleRate) * 1000,
  };
}

/**
 * Converts time in seconds to sample offset.
 */
export function timeToSamples(
  timeSeconds: number,
  sampleRate: number
): number {
  return Math.round(timeSeconds * sampleRate);
}

/**
 * Converts sample offset to time in seconds.
 */
export function samplesToTime(
  samples: number,
  sampleRate: number
): number {
  return samples / sampleRate;
}

/**
 * Checks if timing is within 1ms accuracy.
 */
export function isTimingAccurate(
  targetMs: number,
  actualMs: number,
  toleranceMs: number = 1
): boolean {
  return Math.abs(targetMs - actualMs) <= toleranceMs;
}

// ============================================================================
// PERFORMANCE PROFILING
// ============================================================================

/**
 * Performance profile entry.
 */
export interface ProfileEntry {
  readonly name: string;
  readonly startTime: number;
  readonly duration: number;
}

/**
 * Simple profiler for worklet performance.
 */
export class WorkletProfiler {
  private readonly _entries: ProfileEntry[] = [];
  private readonly _maxEntries: number;
  
  constructor(maxEntries: number = 1000) {
    this._maxEntries = maxEntries;
  }
  
  /**
   * Gets all entries.
   */
  get entries(): readonly ProfileEntry[] {
    return this._entries;
  }
  
  /**
   * Records a profile entry.
   */
  record(name: string, startTime: number, duration: number): void {
    if (this._entries.length >= this._maxEntries) {
      this._entries.shift();
    }
    this._entries.push({ name, startTime, duration });
  }
  
  /**
   * Gets average duration for a named operation.
   */
  getAverage(name: string): number {
    const matching = this._entries.filter(e => e.name === name);
    if (matching.length === 0) return 0;
    return matching.reduce((sum, e) => sum + e.duration, 0) / matching.length;
  }
  
  /**
   * Gets max duration for a named operation.
   */
  getMax(name: string): number {
    const matching = this._entries.filter(e => e.name === name);
    if (matching.length === 0) return 0;
    return Math.max(...matching.map(e => e.duration));
  }
  
  /**
   * Clears all entries.
   */
  clear(): void {
    this._entries.length = 0;
  }
}

// ============================================================================
// ERROR BOUNDARIES
// ============================================================================

/**
 * Worklet error info.
 */
export interface WorkletError {
  readonly message: string;
  readonly stack?: string;
  readonly timestamp: number;
  readonly processorName?: string;
}

/**
 * Error boundary for worklet operations.
 */
export function withErrorBoundary<T>(
  operation: () => T,
  onError: (error: WorkletError) => void
): T | undefined {
  try {
    return operation();
  } catch (error) {
    const err = error as Error;
    const workletError: WorkletError = err.stack !== undefined
      ? { message: err.message, stack: err.stack, timestamp: Date.now() }
      : { message: err.message, timestamp: Date.now() };
    onError(workletError);
    return undefined;
  }
}

// ============================================================================
// DEBUG LOGGING
// ============================================================================

let debugEnabled = false;

/**
 * Enables/disables debug logging.
 */
export function setWorkletDebug(enabled: boolean): void {
  debugEnabled = enabled;
}

/**
 * Logs debug message if enabled.
 */
export function workletDebug(message: string, ...args: unknown[]): void {
  if (debugEnabled) {
    console.log(`[Worklet] ${message}`, ...args);
  }
}
