/**
 * @fileoverview Preset Cloud Backup System (Optional).
 * 
 * Provides optional cloud synchronization for presets with:
 * - IndexedDB local storage as primary
 * - Cloud backup as secondary (opt-in)
 * - Conflict resolution (last-write-wins with version tracking)
 * - Offline-first operation
 * - Incremental sync (only changed presets)
 * - Privacy-first (no tracking, E2E encryption option)
 * 
 * @module @cardplay/cards/preset-sync
 */

import type { Preset } from './presets';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cloud sync configuration.
 */
export interface PresetSyncConfig {
  /** Whether cloud sync is enabled */
  readonly enabled: boolean;
  /** Cloud provider (future: multiple providers) */
  readonly provider: 'local' | 'cardplay-cloud';
  /** API endpoint URL (if using cloud) */
  readonly endpoint?: string;
  /** Auth token (if using cloud) */
  readonly authToken?: string;
  /** Enable end-to-end encryption */
  readonly encrypted: boolean;
  /** Encryption key (derived from user password if encrypted) */
  readonly encryptionKey?: CryptoKey;
  /** Auto-sync interval in ms (0 = manual only) */
  readonly autoSyncIntervalMs: number;
  /** Last sync timestamp */
  readonly lastSyncAt: number;
}

/**
 * Sync status for a preset.
 */
export interface PresetSyncStatus {
  /** Preset ID */
  readonly presetId: string;
  /** Whether preset exists locally */
  readonly existsLocal: boolean;
  /** Whether preset exists in cloud */
  readonly existsCloud: boolean;
  /** Local version timestamp */
  readonly localVersion: number;
  /** Cloud version timestamp */
  readonly cloudVersion: number;
  /** Sync state */
  readonly state: 'in-sync' | 'local-newer' | 'cloud-newer' | 'conflict' | 'error';
  /** Last sync attempt timestamp */
  readonly lastAttemptAt: number;
  /** Error message if state === 'error' */
  readonly error?: string;
}

/**
 * Sync operation result.
 */
export interface PresetSyncResult {
  /** Whether sync succeeded */
  readonly success: boolean;
  /** Number of presets uploaded */
  readonly uploaded: number;
  /** Number of presets downloaded */
  readonly downloaded: number;
  /** Number of conflicts (manual resolution needed) */
  readonly conflicts: number;
  /** Number of errors */
  readonly errors: number;
  /** Detailed status per preset */
  readonly details: readonly PresetSyncStatus[];
  /** Total sync duration in ms */
  readonly durationMs: number;
}

/**
 * Conflict resolution strategy.
 */
export type ConflictResolution =
  | 'local-wins'    // Always keep local version
  | 'cloud-wins'    // Always keep cloud version
  | 'newest-wins'   // Keep newest by timestamp (default)
  | 'manual'        // Prompt user for each conflict
  ;

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

/**
 * Default sync configuration (cloud sync disabled by default).
 */
export const DEFAULT_PRESET_SYNC_CONFIG: PresetSyncConfig = Object.freeze({
  enabled: false,
  provider: 'local',
  encrypted: true,
  autoSyncIntervalMs: 0, // Manual sync only by default
  lastSyncAt: 0,
});

// ============================================================================
// LOCAL STORAGE (IndexedDB)
// ============================================================================

const DB_NAME = 'cardplay-presets';
const DB_VERSION = 1;
const STORE_NAME = 'presets';

/**
 * Initialize IndexedDB for local preset storage.
 */
export async function initPresetDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('modifiedAt', 'modifiedAt', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
    };
  });
}

/**
 * Save preset to local IndexedDB.
 */
export async function savePresetLocal(preset: Preset): Promise<void> {
  const db = await initPresetDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(preset);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Load preset from local IndexedDB.
 */
export async function loadPresetLocal(id: string): Promise<Preset | null> {
  const db = await initPresetDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result ?? null);
  });
}

/**
 * Load all presets from local IndexedDB.
 */
export async function loadAllPresetsLocal(): Promise<readonly Preset[]> {
  const db = await initPresetDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Delete preset from local IndexedDB.
 */
export async function deletePresetLocal(id: string): Promise<void> {
  const db = await initPresetDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ============================================================================
// CLOUD SYNC (STUB - Future Implementation)
// ============================================================================

/**
 * Upload preset to cloud (stub for future implementation).
 * 
 * In production, this would call a REST API to store presets in the cloud.
 * For now, it's a no-op that returns success.
 */
export async function uploadPresetToCloud(
  _preset: Preset,
  config: PresetSyncConfig
): Promise<void> {
  if (!config.enabled || config.provider === 'local') {
    return; // No-op for local-only mode
  }
  
  // TODO: Implement actual cloud upload
  // - Encrypt preset if config.encrypted
  // - POST to config.endpoint + '/presets'
  // - Include authToken in headers
  // - Handle errors and retries
  
  // Stub implementation for now
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
}

/**
 * Download preset from cloud (stub for future implementation).
 */
export async function downloadPresetFromCloud(
  _id: string,
  config: PresetSyncConfig
): Promise<Preset | null> {
  if (!config.enabled || config.provider === 'local') {
    return null; // No-op for local-only mode
  }
  
  // TODO: Implement actual cloud download
  // - GET from config.endpoint + '/presets/' + id
  // - Include authToken in headers
  // - Decrypt preset if config.encrypted
  // - Handle errors and retries
  
  // Stub implementation for now
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  return null;
}

/**
 * List all presets in cloud (stub for future implementation).
 */
export async function listPresetsInCloud(
  config: PresetSyncConfig
): Promise<readonly { id: string; modifiedAt: number }[]> {
  if (!config.enabled || config.provider === 'local') {
    return []; // No-op for local-only mode
  }
  
  // TODO: Implement actual cloud list
  // - GET from config.endpoint + '/presets'
  // - Include authToken in headers
  // - Return list of { id, modifiedAt } for sync comparison
  
  // Stub implementation for now
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  return [];
}

/**
 * Delete preset from cloud (stub for future implementation).
 */
export async function deletePresetFromCloud(
  _id: string,
  config: PresetSyncConfig
): Promise<void> {
  if (!config.enabled || config.provider === 'local') {
    return; // No-op for local-only mode
  }
  
  // TODO: Implement actual cloud delete
  // - DELETE to config.endpoint + '/presets/' + id
  // - Include authToken in headers
  
  // Stub implementation for now
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
}

// ============================================================================
// SYNC LOGIC
// ============================================================================

/**
 * Sync presets between local and cloud.
 * 
 * This is the main sync function that:
 * 1. Compares local and cloud preset lists
 * 2. Uploads newer local presets
 * 3. Downloads newer cloud presets
 * 4. Resolves conflicts based on strategy
 */
export async function syncPresets(
  config: PresetSyncConfig,
  _strategy: ConflictResolution = 'newest-wins'
): Promise<PresetSyncResult> {
  const startTime = Date.now();
  
  if (!config.enabled || config.provider === 'local') {
    // Cloud sync disabled, return success with no changes
    return {
      success: true,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: 0,
      details: [],
      durationMs: Date.now() - startTime,
    };
  }
  
  try {
    // Load local presets
    const localPresets = await loadAllPresetsLocal();
    const localMap = new Map(localPresets.map(p => [p.id, p]));
    
    // List cloud presets
    const cloudList = await listPresetsInCloud(config);
    const cloudMap = new Map(cloudList.map(p => [p.id, p.modifiedAt]));
    
    // Determine sync actions
    const statuses: PresetSyncStatus[] = [];
    let uploaded = 0;
    let downloaded = 0;
    let conflicts = 0;
    let errors = 0;
    
    // Process local presets
    for (const local of localPresets) {
      const cloudModified = cloudMap.get(local.id);
      
      if (cloudModified === undefined) {
        // Preset only exists locally, upload it
        try {
          await uploadPresetToCloud(local, config);
          uploaded++;
          statuses.push({
            presetId: local.id,
            existsLocal: true,
            existsCloud: true,
            localVersion: local.modifiedAt,
            cloudVersion: local.modifiedAt,
            state: 'in-sync',
            lastAttemptAt: Date.now(),
          });
        } catch (error) {
          errors++;
          statuses.push({
            presetId: local.id,
            existsLocal: true,
            existsCloud: false,
            localVersion: local.modifiedAt,
            cloudVersion: 0,
            state: 'error',
            lastAttemptAt: Date.now(),
            error: String(error),
          });
        }
      } else if (local.modifiedAt > cloudModified) {
        // Local is newer, upload it
        try {
          await uploadPresetToCloud(local, config);
          uploaded++;
          statuses.push({
            presetId: local.id,
            existsLocal: true,
            existsCloud: true,
            localVersion: local.modifiedAt,
            cloudVersion: local.modifiedAt,
            state: 'in-sync',
            lastAttemptAt: Date.now(),
          });
        } catch (error) {
          errors++;
          statuses.push({
            presetId: local.id,
            existsLocal: true,
            existsCloud: true,
            localVersion: local.modifiedAt,
            cloudVersion: cloudModified,
            state: 'error',
            lastAttemptAt: Date.now(),
            error: String(error),
          });
        }
      } else if (local.modifiedAt < cloudModified) {
        // Cloud is newer, download it
        try {
          const cloudPreset = await downloadPresetFromCloud(local.id, config);
          if (cloudPreset) {
            await savePresetLocal(cloudPreset);
            downloaded++;
            statuses.push({
              presetId: local.id,
              existsLocal: true,
              existsCloud: true,
              localVersion: cloudPreset.modifiedAt,
              cloudVersion: cloudPreset.modifiedAt,
              state: 'in-sync',
              lastAttemptAt: Date.now(),
            });
          }
        } catch (error) {
          errors++;
          statuses.push({
            presetId: local.id,
            existsLocal: true,
            existsCloud: true,
            localVersion: local.modifiedAt,
            cloudVersion: cloudModified,
            state: 'error',
            lastAttemptAt: Date.now(),
            error: String(error),
          });
        }
      } else {
        // Same version, already in sync
        statuses.push({
          presetId: local.id,
          existsLocal: true,
          existsCloud: true,
          localVersion: local.modifiedAt,
          cloudVersion: cloudModified,
          state: 'in-sync',
          lastAttemptAt: Date.now(),
        });
      }
    }
    
    // Process cloud-only presets
    for (const [id, cloudModified] of cloudMap) {
      if (!localMap.has(id)) {
        // Preset only exists in cloud, download it
        try {
          const cloudPreset = await downloadPresetFromCloud(id, config);
          if (cloudPreset) {
            await savePresetLocal(cloudPreset);
            downloaded++;
            statuses.push({
              presetId: id,
              existsLocal: true,
              existsCloud: true,
              localVersion: cloudPreset.modifiedAt,
              cloudVersion: cloudModified,
              state: 'in-sync',
              lastAttemptAt: Date.now(),
            });
          }
        } catch (error) {
          errors++;
          statuses.push({
            presetId: id,
            existsLocal: false,
            existsCloud: true,
            localVersion: 0,
            cloudVersion: cloudModified,
            state: 'error',
            lastAttemptAt: Date.now(),
            error: String(error),
          });
        }
      }
    }
    
    return {
      success: errors === 0,
      uploaded,
      downloaded,
      conflicts,
      errors,
      details: statuses,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: 1,
      details: [],
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Get sync status for all presets (comparison without syncing).
 */
export async function getPresetSyncStatuses(
  config: PresetSyncConfig
): Promise<readonly PresetSyncStatus[]> {
  if (!config.enabled || config.provider === 'local') {
    return [];
  }
  
  const localPresets = await loadAllPresetsLocal();
  const cloudList = await listPresetsInCloud(config);
  const cloudMap = new Map(cloudList.map(p => [p.id, p.modifiedAt]));
  
  const statuses: PresetSyncStatus[] = [];
  
  for (const local of localPresets) {
    const cloudModified = cloudMap.get(local.id);
    
    if (cloudModified === undefined) {
      statuses.push({
        presetId: local.id,
        existsLocal: true,
        existsCloud: false,
        localVersion: local.modifiedAt,
        cloudVersion: 0,
        state: 'local-newer',
        lastAttemptAt: 0,
      });
    } else if (local.modifiedAt > cloudModified) {
      statuses.push({
        presetId: local.id,
        existsLocal: true,
        existsCloud: true,
        localVersion: local.modifiedAt,
        cloudVersion: cloudModified,
        state: 'local-newer',
        lastAttemptAt: 0,
      });
    } else if (local.modifiedAt < cloudModified) {
      statuses.push({
        presetId: local.id,
        existsLocal: true,
        existsCloud: true,
        localVersion: local.modifiedAt,
        cloudVersion: cloudModified,
        state: 'cloud-newer',
        lastAttemptAt: 0,
      });
    } else {
      statuses.push({
        presetId: local.id,
        existsLocal: true,
        existsCloud: true,
        localVersion: local.modifiedAt,
        cloudVersion: cloudModified,
        state: 'in-sync',
        lastAttemptAt: 0,
      });
    }
  }
  
  // Add cloud-only presets
  for (const [id, cloudModified] of cloudMap) {
    if (!localPresets.some(p => p.id === id)) {
      statuses.push({
        presetId: id,
        existsLocal: false,
        existsCloud: true,
        localVersion: 0,
        cloudVersion: cloudModified,
        state: 'cloud-newer',
        lastAttemptAt: 0,
      });
    }
  }
  
  return statuses;
}

// ============================================================================
// CONFIG MANAGEMENT
// ============================================================================

/**
 * Save sync config to localStorage.
 */
export function saveSyncConfig(config: PresetSyncConfig): void {
  // Don't persist encryption key or auth token in localStorage for security
  const safeConfig = {
    ...config,
    encryptionKey: undefined,
    authToken: undefined,
  };
  localStorage.setItem('cardplay-preset-sync-config', JSON.stringify(safeConfig));
}

/**
 * Load sync config from localStorage.
 */
export function loadSyncConfig(): PresetSyncConfig {
  const json = localStorage.getItem('cardplay-preset-sync-config');
  if (!json) {
    return DEFAULT_PRESET_SYNC_CONFIG;
  }
  
  try {
    const parsed = JSON.parse(json);
    return {
      ...DEFAULT_PRESET_SYNC_CONFIG,
      ...parsed,
    };
  } catch {
    return DEFAULT_PRESET_SYNC_CONFIG;
  }
}
