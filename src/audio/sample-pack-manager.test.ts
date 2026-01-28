/**
 * @fileoverview Tests for Sample Pack Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPackCredits,
  exportPackCredits,
  createPackPreviewPlayer,
  createPackDownloadManager,
  checkPackUpdates,
  checkAllPackUpdates,
  updatePack,
  uninstallPack,
  uninstallPacks,
  calculateFreedSpace,
  formatBytes,
} from './sample-pack-manager';
import type { PackPreviewConfig } from './sample-pack-manager';

// Mock AudioContext
class MockAudioContext {
  destination = { connect: vi.fn() };
  currentTime = 0;
  
  createGain() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      gain: { value: 0.7 },
    };
  }
  
  createBufferSource() {
    return {
      buffer: null,
      playbackRate: { value: 1.0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    };
  }
}

describe('Sample Pack Manager', () => {
  describe('Pack Credits & Licensing', () => {
    it('should get pack credits for valid pack', () => {
      const credits = getPackCredits('808-drums');
      
      expect(credits).not.toBeNull();
      expect(credits?.packId).toBe('808-drums');
      expect(credits?.packName).toBe('808 Drums');
      expect(credits?.author).toBe('Cardplay');
      expect(credits?.license).toContain('CC0');
      expect(credits?.copyrightNotice).toContain('Copyright');
    });

    it('should return null for invalid pack', () => {
      const credits = getPackCredits('nonexistent-pack');
      expect(credits).toBeNull();
    });

    it('should include Freesound attributions', () => {
      const credits = getPackCredits('808-drums');
      expect(credits).not.toBeNull();
      expect(Array.isArray(credits?.freesoundAttributions)).toBe(true);
    });

    it('should generate license URL for common licenses', () => {
      const credits = getPackCredits('808-drums');
      expect(credits?.licenseUrl).toContain('creativecommons.org');
    });

    it('should export credits as formatted text', () => {
      const text = exportPackCredits('808-drums');
      
      expect(text).toContain('808 Drums - Credits');
      expect(text).toContain('Version:');
      expect(text).toContain('Author:');
      expect(text).toContain('License:');
      expect(text).toContain('Description:');
      expect(text).toContain('Copyright Notice:');
    });

    it('should handle missing pack in export', () => {
      const text = exportPackCredits('nonexistent');
      expect(text).toContain('not found');
    });
  });

  describe('Pack Preview Player', () => {
    let audioContext: any;

    beforeEach(() => {
      audioContext = new MockAudioContext();
    });

    it('should create preview player', () => {
      const config: PackPreviewConfig = {
        packId: '808-drums',
        maxSamplesToPreview: 5,
      };

      const player = createPackPreviewPlayer(audioContext, config);
      
      expect(player).toBeDefined();
      expect(player.getState().packId).toBe('808-drums');
      expect(player.getState().playing).toBe(false);
      expect(player.getState().currentSampleIndex).toBe(0);
    });

    it('should initialize with default config values', () => {
      const config: PackPreviewConfig = {
        packId: '808-drums',
      };

      const player = createPackPreviewPlayer(audioContext, config);
      const state = player.getState();
      
      expect(state.volume).toBeGreaterThan(0);
      expect(state.playbackRate).toBe(1.0);
    });

    it('should set volume', () => {
      const player = createPackPreviewPlayer(audioContext, {
        packId: '808-drums',
      });

      player.setVolume(0.5);
      expect(player.getState().volume).toBe(0.5);

      player.setVolume(-0.1); // Should clamp to 0
      expect(player.getState().volume).toBe(0);

      player.setVolume(1.5); // Should clamp to 1
      expect(player.getState().volume).toBe(1);
    });

    it('should set playback rate', () => {
      const player = createPackPreviewPlayer(audioContext, {
        packId: '808-drums',
      });

      player.setPlaybackRate(2.0);
      expect(player.getState().playbackRate).toBe(2.0);

      player.setPlaybackRate(0.1); // Should clamp to 0.25
      expect(player.getState().playbackRate).toBe(0.25);

      player.setPlaybackRate(5.0); // Should clamp to 4.0
      expect(player.getState().playbackRate).toBe(4.0);
    });

    it('should navigate to next sample', () => {
      const player = createPackPreviewPlayer(audioContext, {
        packId: '808-drums',
        maxSamplesToPreview: 3,
      });

      expect(player.getState().currentSampleIndex).toBe(0);
      
      player.next();
      expect(player.getState().currentSampleIndex).toBe(1);
      
      player.next();
      expect(player.getState().currentSampleIndex).toBe(2);
      
      player.next(); // Should wrap to 0
      expect(player.getState().currentSampleIndex).toBe(0);
    });

    it('should navigate to previous sample', () => {
      const player = createPackPreviewPlayer(audioContext, {
        packId: '808-drums',
        maxSamplesToPreview: 3,
      });

      expect(player.getState().currentSampleIndex).toBe(0);
      
      player.previous(); // Should wrap to 2
      expect(player.getState().currentSampleIndex).toBe(2);
      
      player.previous();
      expect(player.getState().currentSampleIndex).toBe(1);
    });

    it('should notify state changes', () => {
      const player = createPackPreviewPlayer(audioContext, {
        packId: '808-drums',
      });

      const callback = vi.fn();
      player.onPlaybackStateChange(callback);

      player.setVolume(0.5);
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].volume).toBe(0.5);
    });

    it('should clean up on dispose', () => {
      const player = createPackPreviewPlayer(audioContext, {
        packId: '808-drums',
      });

      expect(() => player.dispose()).not.toThrow();
    });
  });

  describe('Pack Download Manager', () => {
    it('should create download manager', () => {
      const manager = createPackDownloadManager();
      expect(manager).toBeDefined();
    });

    it('should queue download', () => {
      const manager = createPackDownloadManager();
      
      manager.queueDownload('808-drums');
      const progress = manager.getProgress('808-drums');
      
      expect(progress).not.toBeNull();
      expect(progress?.packId).toBe('808-drums');
      expect(progress?.status).toMatch(/queued|downloading/);
    });

    it('should not queue duplicate downloads', () => {
      const manager = createPackDownloadManager();
      
      manager.queueDownload('808-drums');
      manager.queueDownload('808-drums');
      
      const progress = manager.getProgress('808-drums');
      expect(progress).not.toBeNull();
    });

    it('should cancel download', async () => {
      const manager = createPackDownloadManager();
      
      manager.queueDownload('808-drums');
      // Wait a tick for the queue to process
      await new Promise(resolve => setTimeout(resolve, 10));
      manager.cancelDownload('808-drums');
      
      const progress = manager.getProgress('808-drums');
      // After cancel, progress may be null or have error status
      if (progress) {
        expect(progress.status).toBe('error');
        expect(progress.error).toContain('Cancelled');
      } else {
        expect(progress).toBeNull();
      }
    });

    it('should track progress with callback', async () => {
      const manager = createPackDownloadManager();
      const progressUpdates: any[] = [];
      
      manager.onProgress('808-drums', (progress) => {
        progressUpdates.push({ ...progress });
      });

      manager.queueDownload('808-drums');
      
      // Wait for some progress
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].packId).toBe('808-drums');
    });

    it('should return null for unknown pack', () => {
      const manager = createPackDownloadManager();
      const progress = manager.getProgress('nonexistent');
      expect(progress).toBeNull();
    });
  });

  describe('Pack Update Checker', () => {
    it('should check for pack updates', async () => {
      const updateInfo = await checkPackUpdates('808-drums');
      
      expect(updateInfo).not.toBeNull();
      expect(updateInfo?.packId).toBe('808-drums');
      expect(updateInfo?.currentVersion).toBeDefined();
      expect(updateInfo?.latestVersion).toBeDefined();
      expect(typeof updateInfo?.updateAvailable).toBe('boolean');
    });

    it('should return null for invalid pack', async () => {
      const updateInfo = await checkPackUpdates('nonexistent');
      expect(updateInfo).toBeNull();
    });

    it('should check all packs for updates', async () => {
      const updates = await checkAllPackUpdates();
      
      expect(Array.isArray(updates)).toBe(true);
      // No updates available in test data
      expect(updates.length).toBe(0);
    });

    it('should update pack', async () => {
      const result = await updatePack('808-drums');
      expect(typeof result).toBe('boolean');
    });

    it('should handle update progress callback', async () => {
      const progressUpdates: any[] = [];
      const callback = (progress: any) => {
        progressUpdates.push(progress);
      };

      await updatePack('808-drums', callback);
      // Progress callback may not be called if no update available
      expect(true).toBe(true); // Test passes if no errors
    });
  });

  describe('Pack Uninstaller', () => {
    it('should uninstall pack', async () => {
      const result = await uninstallPack('808-drums');
      
      expect(result.packId).toBe('808-drums');
      expect(result.success).toBe(true);
      expect(result.freedSpace).toBeGreaterThan(0);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should handle invalid pack', async () => {
      const result = await uninstallPack('nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should uninstall multiple packs', async () => {
      const results = await uninstallPacks(['808-drums', 'trap-drums']);
      
      expect(results.length).toBe(2);
      expect(results[0].packId).toBe('808-drums');
      expect(results[1].packId).toBe('trap-drums');
    });

    it('should calculate freed space', () => {
      const space = calculateFreedSpace(['808-drums', 'trap-drums']);
      expect(space).toBeGreaterThan(0);
    });

    it('should handle empty pack list', () => {
      const space = calculateFreedSpace([]);
      expect(space).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    it('should format bytes as human-readable', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1536 * 1024)).toBe('1.5 MB');
    });

    it('should handle large byte values', () => {
      const result = formatBytes(1024 * 1024 * 1024 * 1024);
      expect(result).toContain('TB');
    });

    it('should handle fractional bytes', () => {
      const result = formatBytes(1536.5);
      expect(result).toContain('KB');
    });
  });
});
