/**
 * @fileoverview Tests for Audio Engine Context Management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAudioEngine,
  resetAudioEngine,
  createContextPool,
  negotiateSampleRate,
  detectGlitchRisk,
  getOptimalBufferSize,
  createContextWithRetry,
} from './context';
import type { AudioEngineConfig, AudioMetrics } from './context';

// ============================================================================
// MOCKS
// ============================================================================

// Mock AudioContext for Node.js environment
class MockAudioContext {
  state: AudioContextState = 'suspended';
  sampleRate = 48000;
  currentTime = 0;
  baseLatency = 0.005;
  outputLatency = 0.01;
  onstatechange: (() => void) | null = null;
  
  constructor(_options?: AudioContextOptions) {
    // Apply options
  }
  
  async resume(): Promise<void> {
    this.state = 'running';
    this.onstatechange?.();
  }
  
  async suspend(): Promise<void> {
    this.state = 'suspended';
    this.onstatechange?.();
  }
  
  async close(): Promise<void> {
    this.state = 'closed';
    this.onstatechange?.();
  }
  
  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: () => new Float32Array(length),
      copyFromChannel: () => {},
      copyToChannel: () => {},
    } as AudioBuffer;
  }
  
  createBufferSource(): AudioBufferSourceNode {
    return {
      buffer: null,
      connect: () => {},
      start: () => {},
      stop: () => {},
      disconnect: () => {},
    } as unknown as AudioBufferSourceNode;
  }
  
  get destination(): AudioDestinationNode {
    return {} as AudioDestinationNode;
  }
}

// Setup global mock
beforeEach(() => {
  (global as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;
});

afterEach(async () => {
  await resetAudioEngine();
});

// ============================================================================
// AUDIO ENGINE TESTS
// ============================================================================

describe('getAudioEngine', () => {
  it('should create singleton', () => {
    const engine1 = getAudioEngine();
    const engine2 = getAudioEngine();
    expect(engine1).toBe(engine2);
  });

  it('should start uninitialized', () => {
    const engine = getAudioEngine();
    expect(engine.state).toBe('uninitialized');
    expect(engine.context).toBeNull();
  });

  it('should apply config', () => {
    const config: AudioEngineConfig = {
      sampleRate: 44100,
      bufferSize: 256,
      latencyHint: 'playback',
    };
    const engine = getAudioEngine(config);
    expect(engine.config.sampleRate).toBe(44100);
  });
});

describe('AudioEngineContext initialization', () => {
  it('should initialize context', async () => {
    const engine = getAudioEngine();
    await engine.initialize();
    
    expect(engine.context).not.toBeNull();
    expect(engine.state).toBe('suspended'); // Mock starts suspended
  });

  it('should resume context', async () => {
    const engine = getAudioEngine();
    await engine.initialize();
    await engine.resume();
    
    expect(engine.state).toBe('running');
  });

  it('should suspend context', async () => {
    const engine = getAudioEngine();
    await engine.initialize();
    await engine.resume();
    await engine.suspend();
    
    expect(engine.state).toBe('suspended');
  });

  it('should close context', async () => {
    const engine = getAudioEngine();
    await engine.initialize();
    await engine.close();
    
    expect(engine.state).toBe('closed');
    expect(engine.context).toBeNull();
  });
});

describe('AudioEngineContext warmup', () => {
  it('should warmup without error', async () => {
    const engine = getAudioEngine();
    await expect(engine.warmup()).resolves.not.toThrow();
  });
});

describe('AudioEngineContext events', () => {
  it('should emit statechange events', async () => {
    const engine = getAudioEngine();
    const listener = vi.fn();
    
    engine.addEventListener('statechange', listener);
    await engine.initialize();
    
    expect(listener).toHaveBeenCalled();
  });

  it('should remove event listeners', async () => {
    const engine = getAudioEngine();
    const listener = vi.fn();
    
    engine.addEventListener('statechange', listener);
    engine.removeEventListener('statechange', listener);
    await engine.initialize();
    
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('AudioEngineContext metrics', () => {
  it('should provide initial metrics', () => {
    const engine = getAudioEngine();
    const metrics = engine.metrics;
    
    expect(metrics.sampleRate).toBe(48000);
    expect(metrics.glitchCount).toBe(0);
  });
});

// ============================================================================
// CONTEXT POOL TESTS
// ============================================================================

describe('createContextPool', () => {
  it('should create pool', () => {
    const pool = createContextPool(4);
    expect(pool.size).toBe(0);
    expect(pool.available).toBe(0);
  });

  it('should acquire context', async () => {
    const pool = createContextPool(4);
    const ctx = await pool.acquire();
    
    expect(ctx).toBeDefined();
    expect(pool.size).toBe(1);
    expect(pool.available).toBe(0);
  });

  it('should release context', async () => {
    const pool = createContextPool(4);
    const ctx = await pool.acquire();
    pool.release(ctx);
    
    expect(pool.available).toBe(1);
  });

  it('should reuse released context', async () => {
    const pool = createContextPool(4);
    const ctx1 = await pool.acquire();
    pool.release(ctx1);
    const ctx2 = await pool.acquire();
    
    expect(ctx2).toBe(ctx1);
  });

  it('should close all contexts', async () => {
    const pool = createContextPool(4);
    await pool.acquire();
    await pool.acquire();
    
    expect(pool.size).toBe(2);
    
    await pool.close();
    
    expect(pool.size).toBe(0);
  });
});

// ============================================================================
// UTILITY TESTS
// ============================================================================

describe('negotiateSampleRate', () => {
  it('should return preferred if supported', () => {
    expect(negotiateSampleRate(48000)).toBe(48000);
    expect(negotiateSampleRate(44100)).toBe(44100);
  });

  it('should default to 48kHz', () => {
    expect(negotiateSampleRate(12345)).toBe(48000);
    expect(negotiateSampleRate()).toBe(48000);
  });
});

describe('detectGlitchRisk', () => {
  it('should detect high latency risk', () => {
    const metrics: AudioMetrics = {
      currentTime: 0,
      outputLatency: 0.1,
      baseLatency: 0.01,
      sampleRate: 48000,
      cpuLoad: 0.5,
      glitchCount: 0,
      lastCallbackDuration: 0,
    };
    
    expect(detectGlitchRisk(metrics)).toBe(true);
  });

  it('should detect high CPU risk', () => {
    const metrics: AudioMetrics = {
      currentTime: 0,
      outputLatency: 0.01,
      baseLatency: 0.01,
      sampleRate: 48000,
      cpuLoad: 0.9,
      glitchCount: 0,
      lastCallbackDuration: 0,
    };
    
    expect(detectGlitchRisk(metrics)).toBe(true);
  });

  it('should not detect risk for normal metrics', () => {
    const metrics: AudioMetrics = {
      currentTime: 0,
      outputLatency: 0.01,
      baseLatency: 0.01,
      sampleRate: 48000,
      cpuLoad: 0.3,
      glitchCount: 0,
      lastCallbackDuration: 0,
    };
    
    expect(detectGlitchRisk(metrics)).toBe(false);
  });
});

describe('getOptimalBufferSize', () => {
  it('should return 128 for low latency', () => {
    expect(getOptimalBufferSize()).toBe(128);
  });
});

describe('createContextWithRetry', () => {
  it('should create context on first try', async () => {
    const ctx = await createContextWithRetry();
    expect(ctx).toBeDefined();
  });

  it('should retry on failure', async () => {
    let attempts = 0;
    const OriginalAudioContext = (global as unknown as { AudioContext: typeof MockAudioContext }).AudioContext;
    
    (global as unknown as { AudioContext: unknown }).AudioContext = class {
      constructor() {
        attempts++;
        if (attempts < 2) {
          throw new Error('Mock failure');
        }
      }
      state = 'suspended';
    };
    
    const ctx = await createContextWithRetry({}, 3);
    expect(ctx).toBeDefined();
    expect(attempts).toBe(2);
    
    (global as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = OriginalAudioContext;
  });
});
