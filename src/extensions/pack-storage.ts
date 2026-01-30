/**
 * @fileoverview Pack-Scoped Storage
 * 
 * Change 438: Pack-scoped storage namespaces.
 * Third-party packs cannot overwrite each other's persisted state.
 * Each pack gets its own isolated storage namespace.
 * 
 * @module @cardplay/extensions/pack-storage
 */

import type { CardManifest } from '../user-cards/manifest';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Storage key with pack namespace.
 */
export interface NamespacedStorageKey {
  readonly packNamespace: string;
  readonly key: string;
}

/**
 * Storage entry with metadata.
 */
export interface StorageEntry<T = unknown> {
  readonly value: T;
  readonly packNamespace: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly version?: string;
}

// ============================================================================
// PACK STORAGE MANAGER
// ============================================================================

/**
 * Pack-scoped storage manager.
 * Ensures each pack can only access its own storage namespace.
 */
export class PackStorageManager {
  private storage = new Map<string, StorageEntry>();
  
  /**
   * Format a namespaced key.
   */
  private formatKey(packNamespace: string, key: string): string {
    return `${packNamespace}::${key}`;
  }
  
  /**
   * Parse a namespaced key.
   */
  private parseKey(namespacedKey: string): NamespacedStorageKey | null {
    const parts = namespacedKey.split('::');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    return {
      packNamespace: parts[0],
      key: parts[1],
    };
  }
  
  /**
   * Set a value in pack storage.
   */
  set<T>(packNamespace: string, key: string, value: T, version?: string): void {
    this.validateNamespace(packNamespace);
    this.validateKey(key);
    
    const namespacedKey = this.formatKey(packNamespace, key);
    const existing = this.storage.get(namespacedKey);
    const now = Date.now();
    
    const entry: StorageEntry<T> = {
      value,
      packNamespace,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    
    if (version !== undefined) {
      (entry as { version: string }).version = version;
    }
    
    this.storage.set(namespacedKey, entry);
  }
  
  /**
   * Get a value from pack storage.
   */
  get<T>(packNamespace: string, key: string): T | undefined {
    this.validateNamespace(packNamespace);
    this.validateKey(key);
    
    const namespacedKey = this.formatKey(packNamespace, key);
    const entry = this.storage.get(namespacedKey);
    return entry?.value as T | undefined;
  }
  
  /**
   * Check if a key exists in pack storage.
   */
  has(packNamespace: string, key: string): boolean {
    this.validateNamespace(packNamespace);
    this.validateKey(key);
    
    const namespacedKey = this.formatKey(packNamespace, key);
    return this.storage.has(namespacedKey);
  }
  
  /**
   * Delete a value from pack storage.
   */
  delete(packNamespace: string, key: string): boolean {
    this.validateNamespace(packNamespace);
    this.validateKey(key);
    
    const namespacedKey = this.formatKey(packNamespace, key);
    return this.storage.delete(namespacedKey);
  }
  
  /**
   * List all keys in a pack's namespace.
   */
  keys(packNamespace: string): string[] {
    this.validateNamespace(packNamespace);
    
    const prefix = `${packNamespace}::`;
    const keys: string[] = [];
    
    for (const namespacedKey of this.storage.keys()) {
      if (namespacedKey.startsWith(prefix)) {
        const parsed = this.parseKey(namespacedKey);
        if (parsed) {
          keys.push(parsed.key);
        }
      }
    }
    
    return keys;
  }
  
  /**
   * Clear all storage for a pack.
   */
  clear(packNamespace: string): void {
    this.validateNamespace(packNamespace);
    
    const keysToDelete = this.keys(packNamespace);
    for (const key of keysToDelete) {
      this.delete(packNamespace, key);
    }
  }
  
  /**
   * Get storage usage for a pack (bytes).
   */
  getUsage(packNamespace: string): number {
    this.validateNamespace(packNamespace);
    
    let totalBytes = 0;
    const prefix = `${packNamespace}::`;
    
    for (const [namespacedKey, entry] of this.storage.entries()) {
      if (namespacedKey.startsWith(prefix)) {
        // Rough estimate of storage size
        totalBytes += JSON.stringify(entry).length * 2; // UTF-16 bytes
      }
    }
    
    return totalBytes;
  }
  
  /**
   * Get storage entry with metadata.
   */
  getEntry(packNamespace: string, key: string): StorageEntry | undefined {
    this.validateNamespace(packNamespace);
    this.validateKey(key);
    
    const namespacedKey = this.formatKey(packNamespace, key);
    return this.storage.get(namespacedKey);
  }
  
  /**
   * Export storage for a pack (for backup/sync).
   */
  export(packNamespace: string): Record<string, StorageEntry> {
    this.validateNamespace(packNamespace);
    
    const exported: Record<string, StorageEntry> = {};
    const prefix = `${packNamespace}::`;
    
    for (const [namespacedKey, entry] of this.storage.entries()) {
      if (namespacedKey.startsWith(prefix)) {
        const parsed = this.parseKey(namespacedKey);
        if (parsed) {
          exported[parsed.key] = entry;
        }
      }
    }
    
    return exported;
  }
  
  /**
   * Import storage for a pack.
   */
  import(packNamespace: string, data: Record<string, StorageEntry>): void {
    this.validateNamespace(packNamespace);
    
    for (const [key, entry] of Object.entries(data)) {
      // Verify namespace matches
      if (entry.packNamespace !== packNamespace) {
        throw new Error(
          `Cannot import entry with namespace '${entry.packNamespace}' into '${packNamespace}'`
        );
      }
      
      const namespacedKey = this.formatKey(packNamespace, key);
      this.storage.set(namespacedKey, entry);
    }
  }
  
  /**
   * Validate namespace format.
   */
  private validateNamespace(packNamespace: string): void {
    if (!packNamespace || typeof packNamespace !== 'string') {
      throw new Error('Pack namespace must be a non-empty string');
    }
    
    // Namespace must not contain ::
    if (packNamespace.includes('::')) {
      throw new Error('Pack namespace cannot contain "::"');
    }
    
    // Basic safety check - alphanumeric, dash, underscore
    if (!/^[a-zA-Z0-9_-]+$/.test(packNamespace)) {
      throw new Error(
        `Invalid pack namespace '${packNamespace}'. ` +
        `Must contain only alphanumeric characters, dashes, and underscores.`
      );
    }
  }
  
  /**
   * Validate storage key format.
   */
  private validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new Error('Storage key must be a non-empty string');
    }
    
    // Key must not contain ::
    if (key.includes('::')) {
      throw new Error('Storage key cannot contain "::"');
    }
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

const globalPackStorage = new PackStorageManager();

/**
 * Get the global pack storage manager.
 */
export function getPackStorage(): PackStorageManager {
  return globalPackStorage;
}

// ============================================================================
// PACK STORAGE API
// ============================================================================

/**
 * Create a scoped storage API for a specific pack.
 * This is what extensions receive - they can only access their own namespace.
 */
export function createPackStorageAPI(packManifest: CardManifest) {
  const packNamespace = packManifest.name;
  const storage = getPackStorage();
  
  return {
    /**
     * Set a value in this pack's storage.
     */
    set<T>(key: string, value: T): void {
      storage.set(packNamespace, key, value, packManifest.version);
    },
    
    /**
     * Get a value from this pack's storage.
     */
    get<T>(key: string): T | undefined {
      return storage.get<T>(packNamespace, key);
    },
    
    /**
     * Check if a key exists in this pack's storage.
     */
    has(key: string): boolean {
      return storage.has(packNamespace, key);
    },
    
    /**
     * Delete a value from this pack's storage.
     */
    delete(key: string): boolean {
      return storage.delete(packNamespace, key);
    },
    
    /**
     * List all keys in this pack's storage.
     */
    keys(): string[] {
      return storage.keys(packNamespace);
    },
    
    /**
     * Clear all storage for this pack.
     */
    clear(): void {
      storage.clear(packNamespace);
    },
    
    /**
     * Get storage usage for this pack (bytes).
     */
    getUsage(): number {
      return storage.getUsage(packNamespace);
    },
    
    /**
     * Export this pack's storage (for backup).
     */
    export(): Record<string, StorageEntry> {
      return storage.export(packNamespace);
    },
    
    /**
     * Import data into this pack's storage.
     */
    import(data: Record<string, StorageEntry>): void {
      storage.import(packNamespace, data);
    },
  };
}

/**
 * Pack storage API type (what extensions see).
 */
export type PackStorageAPI = ReturnType<typeof createPackStorageAPI>;
