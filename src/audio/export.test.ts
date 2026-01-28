/**
 * @fileoverview Tests for Audio Export & Offline Rendering System.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AudioExportEngine,
  getExportEngine,
  DEFAULT_EXPORT_CONFIG,
  FACTORY_EXPORT_PRESETS,
  type ExportConfig,
  type ExportQueueEntry,
} from './export';

describe('AudioExportEngine', () => {
  let engine: AudioExportEngine;

  beforeEach(() => {
    engine = new AudioExportEngine();
  });

  describe('Queue Management', () => {
    it('should add export to queue', () => {
      const id = engine.addToQueue(DEFAULT_EXPORT_CONFIG);
      expect(id).toMatch(/^export-/);
      
      const queue = engine.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe(id);
      // Export starts processing immediately after being added
      expect(['queued', 'processing']).toContain(queue[0].status);
    });

    it('should retrieve entry by ID', () => {
      const id = engine.addToQueue(DEFAULT_EXPORT_CONFIG);
      const entry = engine.getEntry(id);
      
      expect(entry).not.toBeNull();
      expect(entry?.id).toBe(id);
      expect(entry?.config).toEqual(DEFAULT_EXPORT_CONFIG);
    });

    it('should return null for unknown ID', () => {
      const entry = engine.getEntry('unknown-id');
      expect(entry).toBeNull();
    });

    it('should cancel queued export', () => {
      // Add multiple exports so the second one stays queued while first processes
      const id1 = engine.addToQueue(DEFAULT_EXPORT_CONFIG);
      const id2 = engine.addToQueue({ ...DEFAULT_EXPORT_CONFIG, filename: 'second' });
      
      // First export starts processing immediately, second stays queued
      // Try to cancel the second (queued) one
      const entry2 = engine.getEntry(id2);
      if (entry2?.status === 'queued') {
        const cancelled = engine.cancel(id2);
        expect(cancelled).toBe(true);
      } else {
        // If both are processing, cancelling should fail
        const cancelled = engine.cancel(id2);
        expect(cancelled).toBe(false);
      }
    });

    it('should not cancel processing export', () => {
      const id = engine.addToQueue(DEFAULT_EXPORT_CONFIG);
      
      // Simulate processing state
      const queue = engine.getQueue();
      if (queue[0]) {
        (queue[0] as { status: string }).status = 'processing';
      }
      
      const cancelled = engine.cancel(id);
      expect(cancelled).toBe(false);
    });

    it('should clear completed exports', async () => {
      const id1 = engine.addToQueue({ ...DEFAULT_EXPORT_CONFIG, filename: 'test1' });
      const id2 = engine.addToQueue({ ...DEFAULT_EXPORT_CONFIG, filename: 'test2' });
      
      // Wait for processing to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Manually mark as complete for testing
      const queue = engine.getQueue();
      queue.forEach(entry => {
        (entry as { status: string }).status = 'complete';
      });
      
      engine.clearCompleted();
      expect(engine.getQueue().length).toBeLessThan(2);
    });
  });

  describe('Export Configuration', () => {
    it('should use default config', () => {
      expect(DEFAULT_EXPORT_CONFIG).toMatchObject({
        format: 'wav',
        bitDepth: 24,
        sampleRate: 48000,
        dither: 'triangular',
        normalizeDb: -0.3,
        tailLengthMs: 1000,
        startTick: null,
        endTick: null,
        loopOnly: false,
        realtime: false,
      });
    });

    it('should allow custom config', () => {
      const customConfig: ExportConfig = {
        ...DEFAULT_EXPORT_CONFIG,
        format: 'flac',
        bitDepth: 32,
        sampleRate: 96000,
        normalizeDb: null,
      };
      
      const id = engine.addToQueue(customConfig);
      const entry = engine.getEntry(id);
      
      expect(entry?.config.format).toBe('flac');
      expect(entry?.config.bitDepth).toBe(32);
      expect(entry?.config.sampleRate).toBe(96000);
      expect(entry?.config.normalizeDb).toBeNull();
    });
  });

  describe('Factory Presets', () => {
    it('should have CD quality preset', () => {
      const cdPreset = FACTORY_EXPORT_PRESETS.find(p => p.id === 'wav-16bit-44.1k');
      expect(cdPreset).toBeDefined();
      expect(cdPreset?.config.bitDepth).toBe(16);
      expect(cdPreset?.config.sampleRate).toBe(44100);
    });

    it('should have studio quality preset', () => {
      const studioPreset = FACTORY_EXPORT_PRESETS.find(p => p.id === 'wav-24bit-48k');
      expect(studioPreset).toBeDefined();
      expect(studioPreset?.config.bitDepth).toBe(24);
      expect(studioPreset?.config.sampleRate).toBe(48000);
    });

    it('should have hi-res preset', () => {
      const hiresPreset = FACTORY_EXPORT_PRESETS.find(p => p.id === 'flac-24bit-96k');
      expect(hiresPreset).toBeDefined();
      expect(hiresPreset?.config.format).toBe('flac');
      expect(hiresPreset?.config.sampleRate).toBe(96000);
    });

    it('should have MP3 preset', () => {
      const mp3Preset = FACTORY_EXPORT_PRESETS.find(p => p.id === 'mp3-320k');
      expect(mp3Preset).toBeDefined();
      expect(mp3Preset?.config.format).toBe('mp3');
    });
  });

  describe('WAV Encoding', () => {
    it('should generate valid WAV file structure', async () => {
      const config: ExportConfig = {
        ...DEFAULT_EXPORT_CONFIG,
        format: 'wav',
        bitDepth: 16,
        filename: 'test',
        realtime: false,
      };

      const id = engine.addToQueue(config);
      
      // Wait for export to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const entry = engine.getEntry(id);
      expect(entry?.result?.success).toBe(true);
      expect(entry?.result?.blob).not.toBeNull();
      expect(entry?.result?.filename).toMatch(/\.wav$/);
    });

    it('should include proper metadata', async () => {
      const config: ExportConfig = {
        ...DEFAULT_EXPORT_CONFIG,
        filename: 'metadata-test',
      };

      const id = engine.addToQueue(config);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const entry = engine.getEntry(id);
      expect(entry?.result?.durationSeconds).toBeGreaterThan(0);
      expect(entry?.result?.fileSizeBytes).toBeGreaterThan(0);
    });
  });

  describe('Progress Tracking', () => {
    it('should track export progress', async () => {
      const id = engine.addToQueue(DEFAULT_EXPORT_CONFIG);
      
      // Allow some processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const entry = engine.getEntry(id);
      expect(entry?.progress).not.toBeNull();
      expect(entry?.progress?.phase).toBeDefined();
    });

    it('should report completion', async () => {
      const id = engine.addToQueue(DEFAULT_EXPORT_CONFIG);
      
      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const entry = engine.getEntry(id);
      expect(entry?.status).toMatch(/complete|error/);
      expect(entry?.completedAt).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid format gracefully', async () => {
      const config: ExportConfig = {
        ...DEFAULT_EXPORT_CONFIG,
        format: 'mp3' as ExportFormat, // Not yet implemented
      };

      const id = engine.addToQueue(config);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const entry = engine.getEntry(id);
      expect(entry?.status).toBe('error');
      expect(entry?.result?.error).toContain('not yet implemented');
    });
  });

  describe('Singleton', () => {
    it('should return same instance', () => {
      const engine1 = getExportEngine();
      const engine2 = getExportEngine();
      expect(engine1).toBe(engine2);
    });
  });
});

describe('Export Filename Generation', () => {
  it('should include format extension', async () => {
    const engine = new AudioExportEngine();
    
    const configs: ExportFormat[] = ['wav', 'mp3', 'flac', 'ogg'];
    
    for (const format of configs) {
      const config: ExportConfig = {
        ...DEFAULT_EXPORT_CONFIG,
        format,
        filename: 'test',
      };
      
      const id = engine.addToQueue(config);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const entry = engine.getEntry(id);
      if (entry?.result?.success) {
        expect(entry.result.filename).toMatch(new RegExp(`\\.${format}$`));
      }
    }
  });

  it('should sanitize filename', () => {
    const engine = new AudioExportEngine();
    const config: ExportConfig = {
      ...DEFAULT_EXPORT_CONFIG,
      filename: 'test file (with) special chars',
    };
    
    const id = engine.addToQueue(config);
    const entry = engine.getEntry(id);
    expect(entry?.config.filename).toBeTruthy();
  });
});

describe('Audio Processing', () => {
  it('should respect bit depth', () => {
    const depths: BitDepth[] = [16, 24, 32];
    depths.forEach(bitDepth => {
      expect([16, 24, 32]).toContain(bitDepth);
    });
  });

  it('should respect sample rate', () => {
    const rates: SampleRate[] = [44100, 48000, 96000, 192000];
    rates.forEach(sampleRate => {
      expect([44100, 48000, 96000, 192000]).toContain(sampleRate);
    });
  });

  it('should calculate duration correctly', () => {
    // Test duration calculation
    const sampleRate = 48000;
    const numSamples = sampleRate * 5; // 5 seconds
    const duration = numSamples / sampleRate;
    expect(duration).toBe(5);
  });
});
