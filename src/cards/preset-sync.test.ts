/**
 * @fileoverview Tests for Preset Cloud Sync.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import {
  DEFAULT_PRESET_SYNC_CONFIG,
  initPresetDB,
  savePresetLocal,
  loadPresetLocal,
  loadAllPresetsLocal,
  deletePresetLocal,
  syncPresets,
  getPresetSyncStatuses,
  saveSyncConfig,
  loadSyncConfig,
} from './preset-sync';
import { createPreset } from './presets';

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
global.localStorage = localStorageMock as any;

describe('Preset Cloud Sync', () => {
  // Clean up IndexedDB after each test
  afterEach(async () => {
    try {
      const db = await initPresetDB();
      const tx = db.transaction('presets', 'readwrite');
      const store = tx.objectStore('presets');
      store.clear();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
    
    // Clean up localStorage
    localStorageMock.clear();
  });
  
  describe('Local Storage (IndexedDB)', () => {
    it('should initialize IndexedDB', async () => {
      const db = await initPresetDB();
      expect(db.name).toBe('cardplay-presets');
      expect(db.objectStoreNames.contains('presets')).toBe(true);
    });
    
    it('should save and load preset from IndexedDB', async () => {
      const preset = createPreset({
        id: 'test-1',
        name: 'Test Preset',
        category: 'test',
        params: { gain: 0.5 },
      });
      
      await savePresetLocal(preset);
      const loaded = await loadPresetLocal('test-1');
      
      expect(loaded).toEqual(preset);
    });
    
    it('should return null for non-existent preset', async () => {
      const loaded = await loadPresetLocal('nonexistent');
      expect(loaded).toBeNull();
    });
    
    it('should load all presets', async () => {
      const preset1 = createPreset({
        id: 'test-1',
        name: 'Test 1',
        category: 'test',
        params: { gain: 0.5 },
      });
      
      const preset2 = createPreset({
        id: 'test-2',
        name: 'Test 2',
        category: 'test',
        params: { gain: 0.8 },
      });
      
      await savePresetLocal(preset1);
      await savePresetLocal(preset2);
      
      const all = await loadAllPresetsLocal();
      expect(all).toHaveLength(2);
      expect(all.map(p => p.id).sort()).toEqual(['test-1', 'test-2']);
    });
    
    it('should delete preset from IndexedDB', async () => {
      const preset = createPreset({
        id: 'test-1',
        name: 'Test Preset',
        category: 'test',
        params: { gain: 0.5 },
      });
      
      await savePresetLocal(preset);
      await deletePresetLocal('test-1');
      
      const loaded = await loadPresetLocal('test-1');
      expect(loaded).toBeNull();
    });
    
    it('should update existing preset', async () => {
      const preset1 = createPreset({
        id: 'test-1',
        name: 'Test Preset',
        category: 'test',
        params: { gain: 0.5 },
      });
      
      const preset2 = createPreset({
        id: 'test-1',
        name: 'Updated Preset',
        category: 'test',
        params: { gain: 0.8 },
      });
      
      await savePresetLocal(preset1);
      await savePresetLocal(preset2);
      
      const loaded = await loadPresetLocal('test-1');
      expect(loaded?.name).toBe('Updated Preset');
      expect(loaded?.params.gain).toBe(0.8);
    });
  });
  
  describe('Sync Configuration', () => {
    it('should have correct default config', () => {
      expect(DEFAULT_PRESET_SYNC_CONFIG.enabled).toBe(false);
      expect(DEFAULT_PRESET_SYNC_CONFIG.provider).toBe('local');
      expect(DEFAULT_PRESET_SYNC_CONFIG.encrypted).toBe(true);
      expect(DEFAULT_PRESET_SYNC_CONFIG.autoSyncIntervalMs).toBe(0);
    });
    
    it('should save and load sync config', () => {
      const config = {
        ...DEFAULT_PRESET_SYNC_CONFIG,
        enabled: true,
        provider: 'cardplay-cloud' as const,
        autoSyncIntervalMs: 60000,
      };
      
      saveSyncConfig(config);
      const loaded = loadSyncConfig();
      
      expect(loaded.enabled).toBe(true);
      expect(loaded.provider).toBe('cardplay-cloud');
      expect(loaded.autoSyncIntervalMs).toBe(60000);
    });
    
    it('should return default config if localStorage is empty', () => {
      const loaded = loadSyncConfig();
      expect(loaded).toEqual(DEFAULT_PRESET_SYNC_CONFIG);
    });
    
    it('should not persist sensitive data', () => {
      const config = {
        ...DEFAULT_PRESET_SYNC_CONFIG,
        enabled: true,
        authToken: 'secret-token',
      };
      
      saveSyncConfig(config);
      const json = localStorage.getItem('cardplay-preset-sync-config');
      
      expect(json).not.toContain('secret-token');
      expect(json).not.toContain('encryptionKey');
    });
  });
  
  describe('Cloud Sync (Local-Only Mode)', () => {
    it('should return success with no changes when cloud sync disabled', async () => {
      const config = DEFAULT_PRESET_SYNC_CONFIG;
      const result = await syncPresets(config);
      
      expect(result.success).toBe(true);
      expect(result.uploaded).toBe(0);
      expect(result.downloaded).toBe(0);
      expect(result.conflicts).toBe(0);
      expect(result.errors).toBe(0);
    });
    
    it('should return empty statuses when cloud sync disabled', async () => {
      const config = DEFAULT_PRESET_SYNC_CONFIG;
      const statuses = await getPresetSyncStatuses(config);
      
      expect(statuses).toHaveLength(0);
    });
  });
  
  describe('Sync Status Detection', () => {
    it('should detect local-only presets (stub mode)', async () => {
      const preset = createPreset({
        id: 'test-1',
        name: 'Test Preset',
        category: 'test',
        params: { gain: 0.5 },
      });
      
      await savePresetLocal(preset);
      
      const config = {
        ...DEFAULT_PRESET_SYNC_CONFIG,
        enabled: true,
        provider: 'cardplay-cloud' as const,
      };
      
      const statuses = await getPresetSyncStatuses(config);
      
      // In stub mode, cloud returns empty list, so all local presets are "local-newer"
      expect(statuses).toHaveLength(1);
      expect(statuses[0].state).toBe('local-newer');
      expect(statuses[0].existsLocal).toBe(true);
      expect(statuses[0].existsCloud).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle sync when cloud is disabled', async () => {
      const config = {
        ...DEFAULT_PRESET_SYNC_CONFIG,
        enabled: false,
        provider: 'local' as const,
      };
      
      const result = await syncPresets(config);
      
      // When cloud sync is disabled, sync returns success with no changes
      expect(result.success).toBe(true);
      expect(result.errors).toBe(0);
      expect(result.uploaded).toBe(0);
      expect(result.downloaded).toBe(0);
    });
  });
});
