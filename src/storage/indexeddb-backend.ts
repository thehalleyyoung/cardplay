/**
 * @fileoverview IndexedDB Persistence Backend.
 * 
 * Provides persistent storage for phrases, presets, projects, and other data
 * using IndexedDB for efficient local storage with indexing and querying.
 * 
 * @module @cardplay/storage/indexeddb-backend
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Database schema version.
 */
export const DB_VERSION = 1;

/**
 * Database name.
 */
export const DB_NAME = 'cardplay-db';

/**
 * Object store names.
 */
export enum StoreName {
  PHRASES = 'phrases',
  PRESETS = 'presets',
  PROJECTS = 'projects',
  USER_CARDS = 'userCards',
  SAMPLES = 'samples',
  METADATA = 'metadata',
}

/**
 * Storable item with common fields.
 */
export interface StorableItem {
  readonly id: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly tags?: readonly string[];
}

/**
 * Phrase storage item.
 */
export interface PhraseItem extends StorableItem {
  readonly type: 'phrase';
  readonly name: string;
  readonly category?: string;
  readonly data: unknown; // Phrase data structure
}

/**
 * Preset storage item.
 */
export interface PresetItem extends StorableItem {
  readonly type: 'preset';
  readonly name: string;
  readonly cardId: string;
  readonly category?: string;
  readonly data: unknown; // Preset parameter values
}

/**
 * Project storage item.
 */
export interface ProjectItem extends StorableItem {
  readonly type: 'project';
  readonly name: string;
  readonly tempo: number;
  readonly data: unknown; // Full project data
}

/**
 * User card storage item.
 */
export interface UserCardItem extends StorableItem {
  readonly type: 'userCard';
  readonly name: string;
  readonly category: string;
  readonly data: unknown; // Card definition
}

/**
 * Sample metadata storage.
 */
export interface SampleItem extends StorableItem {
  readonly type: 'sample';
  readonly name: string;
  readonly sampleRate: number;
  readonly duration: number;
  readonly size: number;
  readonly format: string;
  readonly data: ArrayBuffer;
}

/**
 * Query options.
 */
export interface QueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly filter?: Record<string, unknown>;
}

/**
 * Query result.
 */
export interface QueryResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly hasMore: boolean;
}

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let dbInstance: IDBDatabase | null = null;

/**
 * Opens the IndexedDB database.
 */
export async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance !== null) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message ?? 'Unknown error'}`));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      upgradeDatabase(db, event.oldVersion);
    };
  });
}

/**
 * Upgrades database schema.
 */
function upgradeDatabase(db: IDBDatabase, oldVersion: number): void {
  // Version 1: Initial schema
  if (oldVersion < 1) {
    // Phrases store
    if (!db.objectStoreNames.contains(StoreName.PHRASES)) {
      const phrasesStore = db.createObjectStore(StoreName.PHRASES, { keyPath: 'id' });
      phrasesStore.createIndex('name', 'name', { unique: false });
      phrasesStore.createIndex('category', 'category', { unique: false });
      phrasesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      phrasesStore.createIndex('createdAt', 'createdAt', { unique: false });
      phrasesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
    }

    // Presets store
    if (!db.objectStoreNames.contains(StoreName.PRESETS)) {
      const presetsStore = db.createObjectStore(StoreName.PRESETS, { keyPath: 'id' });
      presetsStore.createIndex('name', 'name', { unique: false });
      presetsStore.createIndex('cardId', 'cardId', { unique: false });
      presetsStore.createIndex('category', 'category', { unique: false });
      presetsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      presetsStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    // Projects store
    if (!db.objectStoreNames.contains(StoreName.PROJECTS)) {
      const projectsStore = db.createObjectStore(StoreName.PROJECTS, { keyPath: 'id' });
      projectsStore.createIndex('name', 'name', { unique: false });
      projectsStore.createIndex('createdAt', 'createdAt', { unique: false });
      projectsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
    }

    // User cards store
    if (!db.objectStoreNames.contains(StoreName.USER_CARDS)) {
      const cardsStore = db.createObjectStore(StoreName.USER_CARDS, { keyPath: 'id' });
      cardsStore.createIndex('name', 'name', { unique: false });
      cardsStore.createIndex('category', 'category', { unique: false });
      cardsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
    }

    // Samples store
    if (!db.objectStoreNames.contains(StoreName.SAMPLES)) {
      const samplesStore = db.createObjectStore(StoreName.SAMPLES, { keyPath: 'id' });
      samplesStore.createIndex('name', 'name', { unique: false });
      samplesStore.createIndex('format', 'format', { unique: false });
      samplesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
    }

    // Metadata store
    if (!db.objectStoreNames.contains(StoreName.METADATA)) {
      db.createObjectStore(StoreName.METADATA, { keyPath: 'key' });
    }
  }
}

/**
 * Closes the database.
 */
export function closeDatabase(): void {
  if (dbInstance !== null) {
    dbInstance.close();
    dbInstance = null;
  }
}

// ============================================================================
// BASIC CRUD OPERATIONS
// ============================================================================

/**
 * Creates a new item in a store.
 */
export async function create<T extends StorableItem>(
  storeName: StoreName,
  item: T
): Promise<T> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(new Error(`Failed to create item: ${request.error?.message ?? 'Unknown error'}`));
  });
}

/**
 * Reads an item by ID.
 */
export async function read<T extends StorableItem>(
  storeName: StoreName,
  id: string
): Promise<T | undefined> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(new Error(`Failed to read item: ${request.error?.message ?? 'Unknown error'}`));
  });
}

/**
 * Updates an existing item.
 */
export async function update<T extends StorableItem>(
  storeName: StoreName,
  item: T
): Promise<T> {
  const db = await openDatabase();
  
  const updatedItem = {
    ...item,
    updatedAt: Date.now(),
  } as T;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(updatedItem);

    request.onsuccess = () => resolve(updatedItem);
    request.onerror = () => reject(new Error(`Failed to update item: ${request.error?.message ?? 'Unknown error'}`));
  });
}

/**
 * Deletes an item by ID.
 */
export async function remove(
  storeName: StoreName,
  id: string
): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete item: ${request.error?.message ?? 'Unknown error'}`));
  });
}

/**
 * Lists all items in a store with optional query.
 */
export async function list<T extends StorableItem>(
  storeName: StoreName,
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const db = await openDatabase();
  const {
    limit = 100,
    offset = 0,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = options;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    // Use index if available
    let source: IDBObjectStore | IDBIndex = store;
    if (sortBy !== 'id' && store.indexNames.contains(sortBy)) {
      source = store.index(sortBy);
    }
    
    const direction = sortOrder === 'asc' ? 'next' : 'prev';
    const request = source.openCursor(null, direction);
    
    const items: T[] = [];
    let count = 0;
    let skipped = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
      
      if (cursor) {
        if (skipped < offset) {
          skipped++;
          cursor.continue();
          return;
        }
        
        if (count < limit) {
          items.push(cursor.value as T);
          count++;
          cursor.continue();
        } else {
          // We have more items beyond the limit
          resolve({
            items,
            total: offset + count + 1, // At least this many
            hasMore: true,
          });
        }
      } else {
        // No more items
        resolve({
          items,
          total: offset + count,
          hasMore: false,
        });
      }
    };

    request.onerror = () => reject(new Error(`Failed to list items: ${request.error?.message ?? 'Unknown error'}`));
  });
}

/**
 * Counts items in a store.
 */
export async function count(storeName: StoreName): Promise<number> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to count items: ${request.error?.message ?? 'Unknown error'}`));
  });
}

/**
 * Clears all items from a store.
 */
export async function clear(storeName: StoreName): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to clear store: ${request.error?.message ?? 'Unknown error'}`));
  });
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Finds items by index value.
 */
export async function findByIndex<T extends StorableItem>(
  storeName: StoreName,
  indexName: string,
  value: string | number,
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const db = await openDatabase();
  const { limit = 100, offset = 0 } = options;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.openCursor(IDBKeyRange.only(value));
    
    const items: T[] = [];
    let count = 0;
    let skipped = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
      
      if (cursor) {
        if (skipped < offset) {
          skipped++;
          cursor.continue();
          return;
        }
        
        if (count < limit) {
          items.push(cursor.value as T);
          count++;
          cursor.continue();
        } else {
          resolve({
            items,
            total: offset + count + 1,
            hasMore: true,
          });
        }
      } else {
        resolve({
          items,
          total: offset + count,
          hasMore: false,
        });
      }
    };

    request.onerror = () => reject(new Error(`Failed to find by index: ${request.error?.message ?? 'Unknown error'}`));
  });
}

/**
 * Searches items by tags.
 */
export async function findByTags<T extends StorableItem>(
  storeName: StoreName,
  tags: readonly string[],
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const db = await openDatabase();
  const { limit = 100 } = options;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('tags');
    
    const items: T[] = [];
    const seen = new Set<string>();
    
    // Search for each tag
    const promises = tags.map(tag => {
      return new Promise<void>((resolveTag) => {
        const request = index.openCursor(IDBKeyRange.only(tag));
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
          
          if (cursor && items.length < limit) {
            const item = cursor.value as T;
            if (!seen.has(item.id)) {
              seen.add(item.id);
              items.push(item);
            }
            cursor.continue();
          } else {
            resolveTag();
          }
        };
        
        request.onerror = () => resolveTag();
      });
    });
    
    Promise.all(promises).then(() => {
      resolve({
        items,
        total: items.length,
        hasMore: items.length >= limit,
      });
    }).catch(reject);
  });
}

// ============================================================================
// HIGH-LEVEL OPERATIONS
// ============================================================================

/**
 * Exports all data from a store.
 */
export async function exportStore<T extends StorableItem>(
  storeName: StoreName
): Promise<readonly T[]> {
  const result = await list<T>(storeName, { limit: Number.MAX_SAFE_INTEGER });
  return result.items;
}

/**
 * Imports data into a store (replaces existing).
 */
export async function importStore<T extends StorableItem>(
  storeName: StoreName,
  items: readonly T[]
): Promise<void> {
  await clear(storeName);
  
  for (const item of items) {
    await create(storeName, item);
  }
}

/**
 * Backs up entire database to JSON.
 */
export async function backupDatabase(): Promise<Record<string, unknown[]>> {
  const backup: Record<string, unknown[]> = {};
  
  for (const storeName of Object.values(StoreName)) {
    backup[storeName] = [...await exportStore(storeName)];
  }
  
  return backup;
}

/**
 * Restores database from backup.
 */
export async function restoreDatabase(backup: Record<string, unknown[]>): Promise<void> {
  for (const [storeName, items] of Object.entries(backup)) {
    if (Object.values(StoreName).includes(storeName as StoreName)) {
      await importStore(storeName as StoreName, items as StorableItem[]);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if IndexedDB is available.
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Gets database size estimate (if available).
 */
export async function getDatabaseSize(): Promise<number | undefined> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage;
  }
  return undefined;
}

/**
 * Gets storage quota (if available).
 */
export async function getStorageQuota(): Promise<number | undefined> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.quota;
  }
  return undefined;
}
