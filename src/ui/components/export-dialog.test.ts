/**
 * @fileoverview Tests for Export Dialog UI Component.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ExportDialogManager,
  createExportDialogState,
  formatFileSize,
  formatDuration,
  formatDb,
  formatProgress,
  formatTimeRemaining,
  getPhaseDisplayName,
  getFormatDisplay,
  getAvailableBitDepths,
  getSampleRateDisplay,
  getDitherDisplay,
  formatSupportsBitDepth,
  isDitherRecommended,
  getExportWarnings,
  type ExportDialogState,
} from './export-dialog';
import { DEFAULT_EXPORT_CONFIG } from '../../audio/export';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

global.localStorage = localStorageMock as Storage;

// Mock setInterval/clearInterval
let intervalId = 0;
const intervals = new Map<number, NodeJS.Timeout>();
global.window = {
  setInterval: vi.fn((fn: () => void, ms: number) => {
    const id = ++intervalId;
    intervals.set(id, setInterval(fn, ms));
    return id;
  }),
  clearInterval: vi.fn((id: number) => {
    const interval = intervals.get(id);
    if (interval) {
      clearInterval(interval);
      intervals.delete(id);
    }
  }),
} as unknown as Window & typeof globalThis;

describe('ExportDialogManager', () => {
  let manager: ExportDialogManager | null = null;

  beforeEach(() => {
    localStorageMock.clear();
    manager = new ExportDialogManager();
  });

  afterEach(() => {
    if (manager) {
      if (!manager) return;
      manager.destroy();
      manager = null;
    }
  });

  describe('State Management', () => {
    it('should initialize with default state', () => {
      if (!manager) return;
      const state = manager.getState();
      expect(state.isOpen).toBe(false);
      expect(state.config).toEqual(DEFAULT_EXPORT_CONFIG);
      expect(state.showAdvanced).toBe(false);
      expect(state.showQueue).toBe(false);
    });

    it('should open dialog', () => {
      if (!manager) return;
      if (!manager) return;
      manager.open();
      expect(manager.getState().isOpen).toBe(true);
    });

    it('should close dialog', () => {
      if (!manager) return;
      if (!manager) return;
      manager.open();
      if (!manager) return;
      manager.close();
      expect(manager.getState().isOpen).toBe(false);
    });

    it('should toggle advanced options', () => {
      if (!manager) return;
      expect(manager.getState().showAdvanced).toBe(false);
      if (!manager) return;
      manager.toggleAdvanced();
      expect(manager.getState().showAdvanced).toBe(true);
      if (!manager) return;
      manager.toggleAdvanced();
      expect(manager.getState().showAdvanced).toBe(false);
    });

    it('should toggle queue panel', () => {
      if (!manager) return;
      expect(manager.getState().showQueue).toBe(false);
      if (!manager) return;
      manager.toggleQueue();
      expect(manager.getState().showQueue).toBe(true);
    });
  });

  describe('Configuration Updates', () => {
    it('should update config field', () => {
      if (!manager) return;
      manager.updateConfig('format', 'flac');
      expect(manager.getState().config.format).toBe('flac');
    });

    it('should clear selected preset on custom change', () => {
      if (!manager) return;
      manager.loadPreset('wav-24bit-48k');
      expect(manager.getState().selectedPresetId).toBe('wav-24bit-48k');
      
      if (!manager) return;
      manager.updateConfig('bitDepth', 32);
      expect(manager.getState().selectedPresetId).toBeNull();
    });

    it('should validate config on update', () => {
      if (!manager) return;
      manager.updateConfig('filename', '');
      expect(manager.getState().validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Preset Management', () => {
    it('should load factory preset', () => {
      if (!manager) return;
      manager.loadPreset('wav-24bit-48k');
      const state = manager.getState();
      
      expect(state.selectedPresetId).toBe('wav-24bit-48k');
      expect(state.config.format).toBe('wav');
      expect(state.config.bitDepth).toBe(24);
      expect(state.config.sampleRate).toBe(48000);
    });

    it('should save user preset', () => {
      if (!manager) return;
      manager.updateConfig('bitDepth', 32);
      if (!manager) return;
      manager.savePreset('My Custom Preset', 'Custom 32-bit export');
      
      const state = manager.getState();
      const userPresets = state.presets.filter(p => !p.isFactory);
      expect(userPresets.length).toBeGreaterThan(0);
      expect(userPresets[0].name).toBe('My Custom Preset');
    });

    it('should persist user presets to localStorage', () => {
      if (!manager) return;
      manager.savePreset('Test Preset', 'Test description');
      
      // Create new manager
      const manager2 = new ExportDialogManager();
      const userPresets = manager2.getState().presets.filter(p => !p.isFactory);
      
      expect(userPresets.length).toBeGreaterThan(0);
      expect(userPresets[0].name).toBe('Test Preset');
      
      manager2.destroy();
    });

    it('should delete user preset', () => {
      if (!manager) return;
      manager.savePreset('To Delete', 'Will be deleted');
      const state1 = manager.getState();
      const presetId = state1.presets.find(p => p.name === 'To Delete')?.id;
      
      expect(presetId).toBeDefined();
      
      if (presetId) {
        if (!manager) return;
        manager.deletePreset(presetId);
        const state2 = manager.getState();
        const found = state2.presets.find(p => p.id === presetId);
        expect(found).toBeUndefined();
      }
    });

    it('should not delete factory preset', () => {
      const initialCount = manager.getState().presets.length;
      if (!manager) return;
      manager.deletePreset('wav-24bit-48k');
      expect(manager.getState().presets.length).toBe(initialCount);
    });
  });

  describe('Validation', () => {
    it('should validate filename', () => {
      if (!manager) return;
      manager.updateConfig('filename', '');
      expect(manager.getState().validationErrors).toContain('Filename is required');
    });

    it('should validate normalization level', () => {
      if (!manager) return;
      manager.updateConfig('normalizeDb', 1);
      expect(manager.getState().validationErrors.length).toBeGreaterThan(0);
      
      if (!manager) return;
      manager.updateConfig('normalizeDb', -70);
      expect(manager.getState().validationErrors.length).toBeGreaterThan(0);
    });

    it('should validate start/end markers', () => {
      if (!manager) return;
      manager.updateConfig('startTick', 100);
      if (!manager) return;
      manager.updateConfig('endTick', 50);
      expect(manager.getState().validationErrors.length).toBeGreaterThan(0);
    });

    it('should allow valid config', () => {
      if (!manager) return;
      manager.updateConfig('filename', 'valid-export');
      if (!manager) return;
      manager.updateConfig('normalizeDb', -0.3);
      expect(manager.getState().validationErrors).toHaveLength(0);
    });
  });

  describe('Export Queue', () => {
    it('should start export with valid config', () => {
      if (!manager) return;
      manager.updateConfig('filename', 'test-export');
      if (!manager) return;
      manager.startExport();
      
      // Queue should be updated
      const state = manager.getState();
      expect(state.showQueue).toBe(true);
    });

    it('should not start export with invalid config', () => {
      if (!manager) return;
      manager.updateConfig('filename', '');
      if (!manager) return;
      manager.startExport();
      
      expect(manager.getState().validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('State Subscription', () => {
    it('should notify listeners on state change', () => {
      let notified = false;
      const unsubscribe = manager.subscribe(state => {
        notified = true;
      });

      if (!manager) return;
      manager.open();
      expect(notified).toBe(true);
      
      unsubscribe();
    });

    it('should unsubscribe correctly', () => {
      let callCount = 0;
      const unsubscribe = manager.subscribe(state => {
        callCount++;
      });

      if (!manager) return;
      manager.open(); // +1
      const countAfterOpen = callCount;
      unsubscribe();
      if (!manager) return;
      manager.close(); // Should not increment after unsubscribe
      
      // Verify unsubscribe worked - count should not have increased
      expect(callCount).toBe(countAfterOpen);
    });
  });
});

describe('Formatting Helpers', () => {
  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024 * 5)).toBe('5.0 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024 * 10)).toBe('10.0 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 2)).toBe('2.00 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(45)).toBe('0:45');
    });

    it('should format minutes', () => {
      expect(formatDuration(125)).toBe('2:05');
    });

    it('should pad seconds', () => {
      expect(formatDuration(65)).toBe('1:05');
    });
  });

  describe('formatDb', () => {
    it('should format dB values', () => {
      expect(formatDb(-0.3)).toBe('-0.3 dB');
      expect(formatDb(-12.5)).toBe('-12.5 dB');
    });

    it('should handle -Infinity', () => {
      expect(formatDb(-Infinity)).toBe('-∞ dB');
    });
  });

  describe('formatProgress', () => {
    it('should format percentage', () => {
      expect(formatProgress(0)).toBe('0%');
      expect(formatProgress(0.5)).toBe('50%');
      expect(formatProgress(1)).toBe('100%');
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format null as calculating', () => {
      expect(formatTimeRemaining(null)).toBe('Calculating...');
    });

    it('should format seconds', () => {
      expect(formatTimeRemaining(30000)).toBe('30s');
    });

    it('should format minutes', () => {
      expect(formatTimeRemaining(125000)).toBe('2m 5s');
    });
  });

  describe('getPhaseDisplayName', () => {
    it('should return display names', () => {
      expect(getPhaseDisplayName('preparing')).toBe('Preparing...');
      expect(getPhaseDisplayName('rendering')).toBe('Rendering audio...');
      expect(getPhaseDisplayName('encoding')).toBe('Encoding...');
      expect(getPhaseDisplayName('complete')).toBe('Complete');
      expect(getPhaseDisplayName('error')).toBe('Error');
    });
  });
});

describe('Format Helpers', () => {
  describe('getFormatDisplay', () => {
    it('should return display names with icons', () => {
      expect(getFormatDisplay('wav')).toContain('WAV');
      expect(getFormatDisplay('mp3')).toContain('MP3');
      expect(getFormatDisplay('flac')).toContain('FLAC');
      expect(getFormatDisplay('ogg')).toContain('OGG');
    });
  });

  describe('getAvailableBitDepths', () => {
    it('should return correct depths for WAV', () => {
      const depths = getAvailableBitDepths('wav');
      expect(depths).toEqual([16, 24, 32]);
    });

    it('should return correct depths for FLAC', () => {
      const depths = getAvailableBitDepths('flac');
      expect(depths).toEqual([16, 24, 32]);
    });

    it('should return fixed depth for MP3', () => {
      const depths = getAvailableBitDepths('mp3');
      expect(depths).toEqual([16]);
    });
  });

  describe('formatSupportsBitDepth', () => {
    it('should check WAV support', () => {
      expect(formatSupportsBitDepth('wav', 24)).toBe(true);
      expect(formatSupportsBitDepth('wav', 16)).toBe(true);
    });

    it('should check MP3 support', () => {
      expect(formatSupportsBitDepth('mp3', 16)).toBe(true);
      expect(formatSupportsBitDepth('mp3', 24)).toBe(false);
    });
  });

  describe('getSampleRateDisplay', () => {
    it('should format sample rates', () => {
      expect(getSampleRateDisplay(44100)).toBe('44.1 kHz');
      expect(getSampleRateDisplay(48000)).toBe('48.0 kHz');
      expect(getSampleRateDisplay(96000)).toBe('96.0 kHz');
    });
  });

  describe('getDitherDisplay', () => {
    it('should return dither names', () => {
      expect(getDitherDisplay('none')).toBe('None');
      expect(getDitherDisplay('triangular')).toContain('TPDF');
      expect(getDitherDisplay('shaped')).toContain('Shaped');
    });
  });
});

describe('Validation Helpers', () => {
  describe('isDitherRecommended', () => {
    it('should recommend for 16-bit', () => {
      expect(isDitherRecommended(16)).toBe(true);
    });

    it('should recommend for 24-bit', () => {
      expect(isDitherRecommended(24)).toBe(true);
    });

    it('should not recommend for 32-bit', () => {
      expect(isDitherRecommended(32)).toBe(false);
    });
  });

  describe('getExportWarnings', () => {
    it('should warn about missing dither', () => {
      const config = {
        ...DEFAULT_EXPORT_CONFIG,
        bitDepth: 16 as const,
        dither: 'none' as const,
      };
      const warnings = getExportWarnings(config);
      expect(warnings.some(w => w.toLowerCase().includes('dither'))).toBe(true);
    });

    it('should warn about normalization', () => {
      const config = {
        ...DEFAULT_EXPORT_CONFIG,
        normalizeDb: -0.05,
      };
      const warnings = getExportWarnings(config);
      expect(warnings.some(w => w.includes('0 dBFS'))).toBe(true);
    });

    it('should warn about realtime mode', () => {
      const config = {
        ...DEFAULT_EXPORT_CONFIG,
        realtime: true,
      };
      const warnings = getExportWarnings(config);
      expect(warnings.some(w => w.includes('Real-time'))).toBe(true);
    });
  });
});
