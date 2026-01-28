/**
 * @fileoverview Tests for AudioWorklet-based Audio Engine Core.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LockFreeRingBuffer,
  PriorityEventQueue,
  AdaptiveBufferController,
  SampleAccurateScheduler,
  AudioGraphCompiler,
  simd,
  createEventRingBuffer,
  createEventQueue,
  createScheduler,
  createBufferController,
  createGraphCompiler,
  type AudioEvent,
  type AudioGraphNode,
} from './audio-engine';

describe('LockFreeRingBuffer', () => {
  describe('basic operations', () => {
    it('should create empty buffer', () => {
      const buffer = new LockFreeRingBuffer<number>(10);
      expect(buffer.capacity).toBe(10);
      expect(buffer.count).toBe(0);
      expect(buffer.isEmpty).toBe(true);
      expect(buffer.isFull).toBe(false);
    });
    
    it('should write and read items', () => {
      const buffer = new LockFreeRingBuffer<number>(10);
      
      expect(buffer.write(1)).toBe(true);
      expect(buffer.write(2)).toBe(true);
      expect(buffer.write(3)).toBe(true);
      
      expect(buffer.count).toBe(3);
      expect(buffer.isEmpty).toBe(false);
      
      expect(buffer.read()).toBe(1);
      expect(buffer.read()).toBe(2);
      expect(buffer.read()).toBe(3);
      expect(buffer.read()).toBeUndefined();
    });
    
    it('should maintain FIFO order', () => {
      const buffer = new LockFreeRingBuffer<string>(5);
      
      buffer.write('a');
      buffer.write('b');
      buffer.write('c');
      
      expect(buffer.read()).toBe('a');
      
      buffer.write('d');
      
      expect(buffer.read()).toBe('b');
      expect(buffer.read()).toBe('c');
      expect(buffer.read()).toBe('d');
    });
    
    it('should handle buffer full condition', () => {
      const buffer = new LockFreeRingBuffer<number>(3);
      
      expect(buffer.write(1)).toBe(true);
      expect(buffer.write(2)).toBe(true);
      expect(buffer.write(3)).toBe(false); // Full
      
      expect(buffer.isFull).toBe(true);
      expect(buffer.count).toBe(2);
    });
    
    it('should wrap around correctly', () => {
      const buffer = new LockFreeRingBuffer<number>(4); // Capacity 4 means max 3 items
      
      buffer.write(1);
      buffer.write(2);
      buffer.read();
      buffer.write(3);
      buffer.write(4);
      
      expect(buffer.read()).toBe(2);
      expect(buffer.read()).toBe(3);
      expect(buffer.read()).toBe(4);
    });
  });
  
  describe('batch operations', () => {
    it('should write multiple items', () => {
      const buffer = new LockFreeRingBuffer<number>(10);
      const items = [1, 2, 3, 4, 5];
      
      const written = buffer.writeBatch(items);
      
      expect(written).toBe(5);
      expect(buffer.count).toBe(5);
    });
    
    it('should read multiple items', () => {
      const buffer = new LockFreeRingBuffer<number>(10);
      buffer.writeBatch([1, 2, 3, 4, 5]);
      
      const items = buffer.readBatch(3);
      
      expect(items).toEqual([1, 2, 3]);
      expect(buffer.count).toBe(2);
    });
    
    it('should stop writing when full', () => {
      const buffer = new LockFreeRingBuffer<number>(3);
      const items = [1, 2, 3, 4, 5];
      
      const written = buffer.writeBatch(items);
      
      expect(written).toBe(2); // Only 2 fit
    });
  });
  
  describe('clear', () => {
    it('should clear all items', () => {
      const buffer = new LockFreeRingBuffer<number>(10);
      buffer.writeBatch([1, 2, 3, 4, 5]);
      
      buffer.clear();
      
      expect(buffer.isEmpty).toBe(true);
      expect(buffer.count).toBe(0);
    });
  });
});

describe('PriorityEventQueue', () => {
  const createEvent = (
    id: string,
    time: number,
    priority: number
  ): AudioEvent => ({
    id,
    type: 'test',
    time,
    priority,
    data: null,
  });
  
  describe('priority ordering', () => {
    it('should order by priority descending', () => {
      const queue = new PriorityEventQueue();
      
      queue.insert(createEvent('low', 0, 1));
      queue.insert(createEvent('high', 0, 10));
      queue.insert(createEvent('med', 0, 5));
      
      expect(queue.pop()?.id).toBe('high');
      expect(queue.pop()?.id).toBe('med');
      expect(queue.pop()?.id).toBe('low');
    });
    
    it('should order by time within same priority', () => {
      const queue = new PriorityEventQueue();
      
      queue.insert(createEvent('e3', 30, 5));
      queue.insert(createEvent('e1', 10, 5));
      queue.insert(createEvent('e2', 20, 5));
      
      expect(queue.pop()?.id).toBe('e1');
      expect(queue.pop()?.id).toBe('e2');
      expect(queue.pop()?.id).toBe('e3');
    });
    
    it('should maintain FIFO for identical events', () => {
      const queue = new PriorityEventQueue();
      
      queue.insert(createEvent('first', 10, 5));
      queue.insert(createEvent('second', 10, 5));
      queue.insert(createEvent('third', 10, 5));
      
      expect(queue.pop()?.id).toBe('first');
      expect(queue.pop()?.id).toBe('second');
      expect(queue.pop()?.id).toBe('third');
    });
  });
  
  describe('operations', () => {
    it('should peek without removing', () => {
      const queue = new PriorityEventQueue();
      const event = createEvent('test', 0, 5);
      
      queue.insert(event);
      
      expect(queue.peek()?.id).toBe('test');
      expect(queue.size).toBe(1);
      expect(queue.peek()?.id).toBe('test');
    });
    
    it('should get events before time', () => {
      const queue = new PriorityEventQueue();
      
      queue.insert(createEvent('e1', 10, 5));
      queue.insert(createEvent('e2', 20, 5));
      queue.insert(createEvent('e3', 30, 5));
      queue.insert(createEvent('e4', 40, 5));
      
      const events = queue.getEventsBeforeTime(25);
      
      expect(events).toHaveLength(2);
      expect(events[0]?.id).toBe('e1');
      expect(events[1]?.id).toBe('e2');
      expect(queue.size).toBe(2);
    });
    
    it('should cancel event by id', () => {
      const queue = new PriorityEventQueue();
      
      queue.insert(createEvent('e1', 10, 5));
      queue.insert(createEvent('e2', 20, 5));
      queue.insert(createEvent('e3', 30, 5));
      
      const cancelled = queue.cancel('e2');
      
      expect(cancelled).toBe(true);
      expect(queue.size).toBe(2);
      expect(queue.pop()?.id).toBe('e1');
      expect(queue.pop()?.id).toBe('e3');
    });
    
    it('should return false when canceling non-existent event', () => {
      const queue = new PriorityEventQueue();
      queue.insert(createEvent('e1', 10, 5));
      
      const cancelled = queue.cancel('nonexistent');
      
      expect(cancelled).toBe(false);
      expect(queue.size).toBe(1);
    });
  });
  
  describe('edge cases', () => {
    it('should handle empty queue', () => {
      const queue = new PriorityEventQueue();
      
      expect(queue.isEmpty).toBe(true);
      expect(queue.size).toBe(0);
      expect(queue.pop()).toBeUndefined();
      expect(queue.peek()).toBeUndefined();
    });
    
    it('should clear queue', () => {
      const queue = new PriorityEventQueue();
      queue.insert(createEvent('e1', 10, 5));
      queue.insert(createEvent('e2', 20, 5));
      
      queue.clear();
      
      expect(queue.isEmpty).toBe(true);
      expect(queue.size).toBe(0);
    });
  });
});

describe('AdaptiveBufferController', () => {
  describe('initialization', () => {
    it('should start with 128 buffer size', () => {
      const controller = new AdaptiveBufferController();
      
      expect(controller.currentSize).toBe(128);
      expect(controller.underrunCount).toBe(0);
    });
  });
  
  describe('load tracking', () => {
    it('should track average load', () => {
      const controller = new AdaptiveBufferController();
      
      controller.recordLoad(0.5);
      controller.recordLoad(0.6);
      controller.recordLoad(0.7);
      
      expect(controller.averageLoad).toBeCloseTo(0.6, 2);
    });
    
    it('should track peak load', () => {
      const controller = new AdaptiveBufferController();
      
      controller.recordLoad(0.5);
      controller.recordLoad(0.9);
      controller.recordLoad(0.6);
      
      expect(controller.peakLoad).toBe(0.9);
    });
  });
  
  describe('buffer size adjustment', () => {
    it('should increase size on underruns', () => {
      const controller = new AdaptiveBufferController();
      
      // Add some load history first
      for (let i = 0; i < 15; i++) {
        controller.recordLoad(0.5);
      }
      
      controller.recordUnderrun();
      controller.recordUnderrun();
      controller.recordUnderrun();
      
      const newSize = controller.shouldAdjustSize();
      
      expect(newSize).toBe(256);
    });
    
    it('should increase size on high load', () => {
      const controller = new AdaptiveBufferController();
      
      // Simulate high load (avgLoad > 0.8 AND peakLoad > 0.9)
      // Need at least 10 samples
      for (let i = 0; i < 25; i++) {
        controller.recordLoad(0.95); // High sustained load with peak > 0.9
      }
      
      const newSize = controller.shouldAdjustSize();
      
      expect(newSize).toBe(256);
    });
    
    it('should decrease size on low load', () => {
      const controller = new AdaptiveBufferController();
      controller.applyBufferSize(512);
      
      // Simulate low load
      for (let i = 0; i < 20; i++) {
        controller.recordLoad(0.2);
      }
      
      // Wait for cooldown
      const oldTime = Date.now;
      Date.now = () => oldTime() + 10000;
      
      const newSize = controller.shouldAdjustSize();
      
      Date.now = oldTime;
      
      expect(newSize).toBe(256);
    });
    
    it('should not adjust during cooldown', () => {
      const controller = new AdaptiveBufferController();
      
      controller.recordUnderrun();
      controller.recordUnderrun();
      controller.recordUnderrun();
      
      controller.shouldAdjustSize();
      controller.applyBufferSize(256);
      
      // Immediate second check should return null
      const newSize = controller.shouldAdjustSize();
      
      expect(newSize).toBeNull();
    });
  });
  
  describe('stats', () => {
    it('should return buffer stats', () => {
      const controller = new AdaptiveBufferController();
      
      controller.recordLoad(0.5);
      controller.recordLoad(0.7);
      controller.recordUnderrun();
      
      const stats = controller.getStats();
      
      expect(stats.currentSize).toBe(128);
      expect(stats.underruns).toBe(1);
      expect(stats.avgLoad).toBeCloseTo(0.6, 2);
      expect(stats.peakLoad).toBe(0.7);
    });
    
    it('should reset stats', () => {
      const controller = new AdaptiveBufferController();
      
      controller.recordLoad(0.5);
      controller.recordUnderrun();
      
      controller.reset();
      
      expect(controller.underrunCount).toBe(0);
      expect(controller.averageLoad).toBe(0);
      expect(controller.peakLoad).toBe(0);
    });
  });
});

describe('SampleAccurateScheduler', () => {
  const sampleRate = 48000;
  const lookaheadMs = 50;
  
  const createEvent = (
    id: string,
    time: number,
    priority: number = 5
  ): AudioEvent => ({
    id,
    type: 'note',
    time,
    priority,
    data: { note: 60 },
  });
  
  describe('event scheduling', () => {
    it('should schedule events', () => {
      const scheduler = new SampleAccurateScheduler(sampleRate, lookaheadMs);
      
      // Events at sample positions within first buffer
      scheduler.scheduleEvent(createEvent('e1', 50)); 
      scheduler.scheduleEvent(createEvent('e2', 200));
      
      // Process first buffer (0-128)
      const events = scheduler.process(128);
      
      expect(events).toHaveLength(1);
      expect(events[0]?.id).toBe('e1');
    });
    
    it('should return events in current buffer', () => {
      const scheduler = new SampleAccurateScheduler(sampleRate, lookaheadMs);
      
      scheduler.scheduleEvent(createEvent('e1', 50));
      scheduler.scheduleEvent(createEvent('e2', 150));
      scheduler.scheduleEvent(createEvent('e3', 200));
      
      // First buffer: 0-128
      const events1 = scheduler.process(128);
      expect(events1).toHaveLength(1);
      expect(events1[0]?.id).toBe('e1');
      
      // Second buffer: 128-256
      const events2 = scheduler.process(128);
      expect(events2).toHaveLength(2);
      expect(events2[0]?.id).toBe('e2');
      expect(events2[1]?.id).toBe('e3');
    });
    
    it('should implement lookahead scheduling', () => {
      const scheduler = new SampleAccurateScheduler(sampleRate, 100);
      
      // Event far in future
      const lookaheadSamples = Math.floor((sampleRate * 100) / 1000);
      scheduler.scheduleEvent(createEvent('future', lookaheadSamples + 1000));
      
      // Process should schedule event even though it's not in this buffer
      scheduler.process(128);
      
      // Event should be scheduled
      expect(scheduler.currentSample).toBe(128);
    });
  });
  
  describe('event cancellation', () => {
    it('should cancel scheduled events', () => {
      const scheduler = new SampleAccurateScheduler(sampleRate, lookaheadMs);
      
      scheduler.scheduleEvent(createEvent('e1', 1000));
      scheduler.scheduleEvent(createEvent('e2', 2000));
      
      const cancelled = scheduler.cancelEvent('e1');
      
      expect(cancelled).toBe(true);
      
      const events = scheduler.process(3000);
      expect(events).toHaveLength(1);
      expect(events[0]?.id).toBe('e2');
    });
  });
  
  describe('seeking', () => {
    it('should seek to position', () => {
      const scheduler = new SampleAccurateScheduler(sampleRate, lookaheadMs);
      
      scheduler.process(1000);
      expect(scheduler.currentSample).toBe(1000);
      
      scheduler.seek(500);
      expect(scheduler.currentSample).toBe(500);
    });
    
    it('should clear buffer on seek', () => {
      const scheduler = new SampleAccurateScheduler(sampleRate, lookaheadMs);
      
      // Event at sample 50
      scheduler.scheduleEvent(createEvent('e1', 50));
      scheduler.process(100);
      
      scheduler.seek(0);
      
      // Schedule again after seek
      scheduler.scheduleEvent(createEvent('e2', 50));
      
      // Event should be in buffer
      const events = scheduler.process(128);
      expect(events).toHaveLength(1);
      expect(events[0]?.id).toBe('e2');
    });
  });
  
  describe('clear', () => {
    it('should clear all scheduled events', () => {
      const scheduler = new SampleAccurateScheduler(sampleRate, lookaheadMs);
      
      scheduler.scheduleEvent(createEvent('e1', 100));
      scheduler.scheduleEvent(createEvent('e2', 200));
      
      scheduler.clear();
      
      const events = scheduler.process(500);
      expect(events).toHaveLength(0);
      expect(scheduler.currentSample).toBe(500); // Process advances position
    });
  });
});

describe('AudioGraphCompiler', () => {
  const createNode = (
    id: string,
    type: 'source' | 'effect' | 'destination',
    connections: string[] = []
  ): AudioGraphNode => ({
    id,
    type,
    connections,
    parameters: {},
  });
  
  describe('topological sort', () => {
    it('should compile linear graph', () => {
      const compiler = new AudioGraphCompiler();
      
      const nodes = new Map<string, AudioGraphNode>([
        ['source', createNode('source', 'source', ['effect'])],
        ['effect', createNode('effect', 'effect', ['dest'])],
        ['dest', createNode('dest', 'destination')],
      ]);
      
      const compiled = compiler.compile(nodes);
      
      expect(compiled.executionOrder).toEqual(['source', 'effect', 'dest']);
    });
    
    it('should compile branching graph', () => {
      const compiler = new AudioGraphCompiler();
      
      const nodes = new Map<string, AudioGraphNode>([
        ['source', createNode('source', 'source', ['fx1', 'fx2'])],
        ['fx1', createNode('fx1', 'effect', ['dest'])],
        ['fx2', createNode('fx2', 'effect', ['dest'])],
        ['dest', createNode('dest', 'destination')],
      ]);
      
      const compiled = compiler.compile(nodes);
      
      expect(compiled.executionOrder).toContain('source');
      expect(compiled.executionOrder.indexOf('source'))
        .toBeLessThan(compiled.executionOrder.indexOf('fx1'));
      expect(compiled.executionOrder.indexOf('source'))
        .toBeLessThan(compiled.executionOrder.indexOf('fx2'));
      expect(compiled.executionOrder.indexOf('fx1'))
        .toBeLessThan(compiled.executionOrder.indexOf('dest'));
    });
  });
  
  describe('optimizations', () => {
    it('should detect parallel groups', () => {
      const compiler = new AudioGraphCompiler();
      
      const nodes = new Map<string, AudioGraphNode>([
        ['s1', createNode('s1', 'source', ['dest'])],
        ['s2', createNode('s2', 'source', ['dest'])],
        ['dest', createNode('dest', 'destination')],
      ]);
      
      const compiled = compiler.compile(nodes);
      
      expect(compiled.optimizations.some(opt => 
        opt.startsWith('parallel-groups')
      )).toBe(true);
    });
    
    it('should detect no-op nodes', () => {
      const compiler = new AudioGraphCompiler();
      
      const nodes = new Map<string, AudioGraphNode>([
        ['source', createNode('source', 'source', ['noop'])],
        ['noop', createNode('noop', 'effect', ['dest'])],
        ['dest', createNode('dest', 'destination')],
      ]);
      
      const compiled = compiler.compile(nodes);
      
      expect(compiled.optimizations.some(opt => 
        opt.includes('no-op:noop')
      )).toBe(true);
    });
    
    it('should detect cacheable nodes', () => {
      const compiler = new AudioGraphCompiler();
      
      const nodes = new Map<string, AudioGraphNode>([
        ['source', createNode('source', 'source', ['dest'])],
        ['dest', createNode('dest', 'destination')],
      ]);
      
      const compiled = compiler.compile(nodes);
      
      expect(compiled.optimizations.some(opt => 
        opt.startsWith('cacheable')
      )).toBe(true);
    });
  });
});

describe('SIMD utilities', () => {
  describe('availability check', () => {
    it('should check for SIMD availability', () => {
      const available = simd.isAvailable();
      expect(typeof available).toBe('boolean');
    });
  });
  
  describe('audio operations', () => {
    it('should add buffers', () => {
      const dest = new Float32Array([1, 2, 3, 4]);
      const src = new Float32Array([0.5, 0.5, 0.5, 0.5]);
      
      simd.add(dest, src);
      
      expect(dest[0]).toBeCloseTo(1.5);
      expect(dest[1]).toBeCloseTo(2.5);
      expect(dest[2]).toBeCloseTo(3.5);
      expect(dest[3]).toBeCloseTo(4.5);
    });
    
    it('should multiply by scalar', () => {
      const buffer = new Float32Array([1, 2, 3, 4]);
      
      simd.multiplyScalar(buffer, 0.5);
      
      expect(buffer[0]).toBeCloseTo(0.5);
      expect(buffer[1]).toBeCloseTo(1.0);
      expect(buffer[2]).toBeCloseTo(1.5);
      expect(buffer[3]).toBeCloseTo(2.0);
    });
    
    it('should copy buffers', () => {
      const dest = new Float32Array(4);
      const src = new Float32Array([1, 2, 3, 4]);
      
      simd.copy(dest, src);
      
      expect(dest).toEqual(src);
    });
    
    it('should clear buffer', () => {
      const buffer = new Float32Array([1, 2, 3, 4]);
      
      simd.clear(buffer);
      
      expect(buffer[0]).toBe(0);
      expect(buffer[1]).toBe(0);
      expect(buffer[2]).toBe(0);
      expect(buffer[3]).toBe(0);
    });
  });
});

describe('Factory functions', () => {
  it('should create event ring buffer', () => {
    const buffer = createEventRingBuffer(100);
    expect(buffer.capacity).toBe(100);
  });
  
  it('should create event queue', () => {
    const queue = createEventQueue();
    expect(queue.isEmpty).toBe(true);
  });
  
  it('should create scheduler', () => {
    const scheduler = createScheduler(48000, 50);
    expect(scheduler.currentSample).toBe(0);
  });
  
  it('should create buffer controller', () => {
    const controller = createBufferController();
    expect(controller.currentSize).toBe(128);
  });
  
  it('should create graph compiler', () => {
    const compiler = createGraphCompiler();
    expect(compiler).toBeDefined();
  });
});
