/**
 * @fileoverview KB IndexedDB Cache
 *
 * L365: KB caching in IndexedDB for fast reload.
 *
 * Caches raw Prolog KB program text in IndexedDB so that on subsequent
 * app loads the source can be retrieved instantly without re-parsing
 * from bundled imports. Gracefully degrades when IndexedDB is unavailable
 * (e.g., Node.js test environments).
 *
 * @module @cardplay/ai/engine/kb-idb-cache
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * A single cached KB entry.
 */
export interface KBCacheEntry {
  readonly kbName: string;
  readonly version: string;
  readonly programText: string;
  readonly cachedAt: number;
}

/**
 * Options for opening the KB cache.
 */
export interface KBCacheOptions {
  readonly dbName?: string;
  readonly storeName?: string;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_DB_NAME = 'cardplay-kb-cache';
const DEFAULT_STORE_NAME = 'kbs';

// ============================================================================
// KB CACHE
// ============================================================================

/**
 * IndexedDB-backed cache for KB program strings.
 * L365: Provides fast KB reload on subsequent app launches.
 */
export class KBCache {
  private db: IDBDatabase;
  private storeName: string;

  /** @internal Use `openKBCache()` to create instances. */
  constructor(db: IDBDatabase, storeName: string) {
    this.db = db;
    this.storeName = storeName;
  }

  /**
   * Retrieve a cached KB entry by name.
   * Returns null if not found.
   */
  async get(kbName: string): Promise<KBCacheEntry | null> {
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(kbName);

        req.onsuccess = () => {
          resolve((req.result as KBCacheEntry) ?? null);
        };
        req.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Store or update a KB cache entry.
   */
  async put(entry: KBCacheEntry): Promise<void> {
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.put(entry);

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Delete a cached KB entry by name.
   */
  async delete(kbName: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.delete(kbName);

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Clear all cached KB entries.
   */
  async clear(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Retrieve all cached KB entries.
   */
  async getAllEntries(): Promise<KBCacheEntry[]> {
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.getAll();

        req.onsuccess = () => {
          resolve((req.result as KBCacheEntry[]) ?? []);
        };
        req.onerror = () => {
          resolve([]);
        };
      } catch {
        resolve([]);
      }
    });
  }

  /**
   * Check whether the cached version is stale (doesn't match currentVersion).
   * Returns true if there is no cached entry or the version differs.
   */
  async isStale(kbName: string, currentVersion: string): Promise<boolean> {
    const entry = await this.get(kbName);
    if (!entry) return true;
    return entry.version !== currentVersion;
  }

  /**
   * Close the underlying IndexedDB connection.
   */
  close(): void {
    try {
      this.db.close();
    } catch {
      // Ignore close errors
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Check whether IndexedDB is available in the current environment.
 */
function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Open the KB cache backed by IndexedDB.
 *
 * Returns null if IndexedDB is not available (e.g., Node.js test env).
 *
 * @param options - Optional DB and store name overrides.
 */
export async function openKBCache(options?: KBCacheOptions): Promise<KBCache | null> {
  if (!isIndexedDBAvailable()) {
    return null;
  }

  const dbName = options?.dbName ?? DEFAULT_DB_NAME;
  const storeName = options?.storeName ?? DEFAULT_STORE_NAME;

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'kbName' });
        }
      };

      request.onsuccess = () => {
        resolve(new KBCache(request.result, storeName));
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}
