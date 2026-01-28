/**
 * @fileoverview Tests for AudioWorklet Infrastructure.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createWorkletMessage,
  createParamMessage,
  createStateMessage,
  createEventMessage,
  createMetricsMessage,
  RingBuffer,
  SharedRingBuffer,
  generateBaseProcessorScript,
  registerWorkletModule,
  getWorkletModule,
  createWorkletTiming,
  timeToSamples,
  samplesToTime,
  isTimingAccurate,
  WorkletProfiler,
  withErrorBoundary,
  setWorkletDebug,
  workletDebug,
} from './worklet';

// ============================================================================
// MESSAGE PROTOCOL TESTS
// ============================================================================

describe('createWorkletMessage', () => {
  it('should create message with type and data', () => {
    const msg = createWorkletMessage('init', { test: true });
    
    expect(msg.type).toBe('init');
    expect(msg.data).toEqual({ test: true });
    expect(msg.timestamp).toBeGreaterThan(0);
  });
});

describe('createParamMessage', () => {
  it('should create parameter message', () => {
    const msg = createParamMessage('gain', 0.5, 'a-rate');
    
    expect(msg.type).toBe('param');
    expect(msg.data.name).toBe('gain');
    expect(msg.data.value).toBe(0.5);
    expect(msg.data.automationRate).toBe('a-rate');
  });
});

describe('createStateMessage', () => {
  it('should create state message', () => {
    const state = { voices: 8, filter: 'lowpass' };
    const msg = createStateMessage(state, 42);
    
    expect(msg.type).toBe('state');
    expect(msg.data.state).toEqual(state);
    expect(msg.data.version).toBe(42);
  });
});

describe('createEventMessage', () => {
  it('should create event message', () => {
    const events = [{ type: 'noteOn', note: 60 }];
    const msg = createEventMessage(events, 1.5);
    
    expect(msg.type).toBe('event');
    expect(msg.data.events).toEqual(events);
    expect(msg.data.startTime).toBe(1.5);
  });
});

describe('createMetricsMessage', () => {
  it('should create metrics message', () => {
    const metrics = { cpuTime: 0.5, bufferTime: 2.9, eventCount: 10 };
    const msg = createMetricsMessage(metrics);
    
    expect(msg.type).toBe('metrics');
    expect(msg.data).toEqual(metrics);
  });
});

// ============================================================================
// RING BUFFER TESTS
// ============================================================================

describe('RingBuffer', () => {
  it('should create empty buffer', () => {
    const buffer = new RingBuffer<number>(10);
    
    expect(buffer.count).toBe(0);
    expect(buffer.capacity).toBe(10);
    expect(buffer.isEmpty).toBe(true);
    expect(buffer.isFull).toBe(false);
  });

  it('should write and read items', () => {
    const buffer = new RingBuffer<number>(10);
    
    buffer.write(1);
    buffer.write(2);
    buffer.write(3);
    
    expect(buffer.count).toBe(3);
    expect(buffer.read()).toBe(1);
    expect(buffer.read()).toBe(2);
    expect(buffer.read()).toBe(3);
    expect(buffer.isEmpty).toBe(true);
  });

  it('should peek without removing', () => {
    const buffer = new RingBuffer<number>(10);
    
    buffer.write(42);
    
    expect(buffer.peek()).toBe(42);
    expect(buffer.count).toBe(1);
    expect(buffer.peek()).toBe(42);
  });

  it('should handle full buffer', () => {
    const buffer = new RingBuffer<number>(3);
    
    expect(buffer.write(1)).toBe(true);
    expect(buffer.write(2)).toBe(true);
    expect(buffer.write(3)).toBe(true);
    expect(buffer.write(4)).toBe(false); // Full
    expect(buffer.isFull).toBe(true);
  });

  it('should clear buffer', () => {
    const buffer = new RingBuffer<number>(10);
    
    buffer.write(1);
    buffer.write(2);
    buffer.clear();
    
    expect(buffer.isEmpty).toBe(true);
    expect(buffer.read()).toBeUndefined();
  });

  it('should read all items', () => {
    const buffer = new RingBuffer<number>(10);
    
    buffer.write(1);
    buffer.write(2);
    buffer.write(3);
    
    const all = buffer.readAll();
    expect(all).toEqual([1, 2, 3]);
    expect(buffer.isEmpty).toBe(true);
  });

  it('should wrap around', () => {
    const buffer = new RingBuffer<number>(3);
    
    buffer.write(1);
    buffer.write(2);
    buffer.read(); // Remove 1
    buffer.write(3);
    buffer.read(); // Remove 2
    buffer.write(4);
    
    expect(buffer.readAll()).toEqual([3, 4]);
  });
});

// ============================================================================
// SHARED RING BUFFER TESTS
// ============================================================================

describe('SharedRingBuffer', () => {
  it('should create with SharedArrayBuffer', () => {
    const buffer = new SharedRingBuffer(1024);
    
    expect(buffer.buffer).toBeInstanceOf(SharedArrayBuffer);
    expect(buffer.count).toBe(0);
  });

  it('should write and read values', () => {
    const buffer = new SharedRingBuffer(10);
    
    buffer.write(3.14);
    buffer.write(2.71);
    
    expect(buffer.read()).toBeCloseTo(3.14);
    expect(buffer.read()).toBeCloseTo(2.71);
  });

  it('should return undefined when empty', () => {
    const buffer = new SharedRingBuffer(10);
    
    expect(buffer.read()).toBeUndefined();
  });

  it('should return false when full', () => {
    const buffer = new SharedRingBuffer(3);
    
    expect(buffer.write(1)).toBe(true);
    expect(buffer.write(2)).toBe(true);
    expect(buffer.write(3)).toBe(false); // Capacity is 3 but one slot reserved
  });
});

// ============================================================================
// BASE PROCESSOR TESTS
// ============================================================================

describe('generateBaseProcessorScript', () => {
  it('should generate valid script', () => {
    const script = generateBaseProcessorScript();
    
    expect(script).toContain('CardplayProcessor');
    expect(script).toContain('extends AudioWorkletProcessor');
    expect(script).toContain('registerProcessor');
    expect(script).toContain('processAudio');
  });
});

// ============================================================================
// WORKLET LOADER TESTS
// ============================================================================

describe('registerWorkletModule', () => {
  beforeEach(() => {
    // Clear modules between tests
  });

  it('should register and retrieve module', () => {
    registerWorkletModule('test-module', 'console.log("test")');
    
    const script = getWorkletModule('test-module');
    expect(script).toBe('console.log("test")');
  });

  it('should return undefined for unknown module', () => {
    expect(getWorkletModule('nonexistent')).toBeUndefined();
  });
});

// ============================================================================
// TIMING UTILITIES TESTS
// ============================================================================

describe('createWorkletTiming', () => {
  it('should create timing info', () => {
    const timing = createWorkletTiming(48000, 128);
    
    expect(timing.sampleRate).toBe(48000);
    expect(timing.bufferSize).toBe(128);
    expect(timing.samplesPerMs).toBe(48);
    expect(timing.bufferDurationMs).toBeCloseTo(2.667, 2);
  });
});

describe('timeToSamples', () => {
  it('should convert time to samples', () => {
    expect(timeToSamples(1, 48000)).toBe(48000);
    expect(timeToSamples(0.5, 44100)).toBe(22050);
    expect(timeToSamples(0.001, 48000)).toBe(48);
  });
});

describe('samplesToTime', () => {
  it('should convert samples to time', () => {
    expect(samplesToTime(48000, 48000)).toBe(1);
    expect(samplesToTime(22050, 44100)).toBe(0.5);
  });
});

describe('isTimingAccurate', () => {
  it('should detect accurate timing', () => {
    expect(isTimingAccurate(10, 10)).toBe(true);
    expect(isTimingAccurate(10, 10.5)).toBe(true);
    expect(isTimingAccurate(10, 9.5)).toBe(true);
  });

  it('should detect inaccurate timing', () => {
    expect(isTimingAccurate(10, 12)).toBe(false);
    expect(isTimingAccurate(10, 8)).toBe(false);
  });

  it('should use custom tolerance', () => {
    expect(isTimingAccurate(10, 12, 3)).toBe(true);
    expect(isTimingAccurate(10, 12, 1)).toBe(false);
  });
});

// ============================================================================
// PROFILER TESTS
// ============================================================================

describe('WorkletProfiler', () => {
  it('should record entries', () => {
    const profiler = new WorkletProfiler();
    
    profiler.record('process', 0, 0.5);
    profiler.record('process', 1, 0.6);
    
    expect(profiler.entries).toHaveLength(2);
  });

  it('should calculate average', () => {
    const profiler = new WorkletProfiler();
    
    profiler.record('process', 0, 1.0);
    profiler.record('process', 1, 2.0);
    profiler.record('process', 2, 3.0);
    
    expect(profiler.getAverage('process')).toBe(2.0);
  });

  it('should calculate max', () => {
    const profiler = new WorkletProfiler();
    
    profiler.record('process', 0, 1.0);
    profiler.record('process', 1, 5.0);
    profiler.record('process', 2, 3.0);
    
    expect(profiler.getMax('process')).toBe(5.0);
  });

  it('should limit entries', () => {
    const profiler = new WorkletProfiler(3);
    
    profiler.record('a', 0, 1);
    profiler.record('b', 1, 2);
    profiler.record('c', 2, 3);
    profiler.record('d', 3, 4);
    
    expect(profiler.entries).toHaveLength(3);
    expect(profiler.entries[0]!.name).toBe('b');
  });

  it('should clear entries', () => {
    const profiler = new WorkletProfiler();
    
    profiler.record('test', 0, 1);
    profiler.clear();
    
    expect(profiler.entries).toHaveLength(0);
  });
});

// ============================================================================
// ERROR BOUNDARY TESTS
// ============================================================================

describe('withErrorBoundary', () => {
  it('should return result on success', () => {
    const result = withErrorBoundary(
      () => 42,
      () => {}
    );
    
    expect(result).toBe(42);
  });

  it('should call onError on failure', () => {
    let capturedError: { message: string } | null = null;
    
    withErrorBoundary(
      () => { throw new Error('Test error'); },
      (err) => { capturedError = err; }
    );
    
    expect(capturedError).not.toBeNull();
    expect(capturedError!.message).toBe('Test error');
  });

  it('should return undefined on failure', () => {
    const result = withErrorBoundary(
      () => { throw new Error('Fail'); },
      () => {}
    );
    
    expect(result).toBeUndefined();
  });
});

// ============================================================================
// DEBUG LOGGING TESTS
// ============================================================================

describe('workletDebug', () => {
  it('should not throw when disabled', () => {
    setWorkletDebug(false);
    expect(() => workletDebug('test')).not.toThrow();
  });

  it('should not throw when enabled', () => {
    setWorkletDebug(true);
    expect(() => workletDebug('test')).not.toThrow();
    setWorkletDebug(false);
  });
});
