/**
 * @fileoverview Tests for IndexedDB Persistence Backend.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  DB_NAME,
  DB_VERSION,
  StoreName,
  type StorableItem,
  type PhraseItem,
  type PresetItem,
  openDatabase,
  closeDatabase,
  create,
  read,
  update,
  remove,
  list,
  count,
  clear,
  findByIndex,
  findByTags,
  exportStore,
  importStore,
  backupDatabase,
  restoreDatabase,
  isIndexedDBAvailable,
} from './indexeddb-backend';

describe('IndexedDB Backend', () => {
  beforeEach(async () => {
    // Close any existing database connection
    closeDatabase();
    
    // Delete the test database
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete database'));
    });
  });

  afterEach(() => {
    closeDatabase();
  });

  // ============================================================================
  // DATABASE INITIALIZATION
  // ============================================================================

  describe('openDatabase', () => {
    it('creates database with correct version', async () => {
      const db = await openDatabase();
      expect(db.name).toBe(DB_NAME);
      expect(db.version).toBe(DB_VERSION);
    });

    it('creates all required object stores', async () => {
      const db = await openDatabase();
      const storeNames = Array.from(db.objectStoreNames);
      
      expect(storeNames).toContain(StoreName.PHRASES);
      expect(storeNames).toContain(StoreName.PRESETS);
      expect(storeNames).toContain(StoreName.PROJECTS);
      expect(storeNames).toContain(StoreName.USER_CARDS);
      expect(storeNames).toContain(StoreName.SAMPLES);
      expect(storeNames).toContain(StoreName.METADATA);
    });

    it('returns same instance on multiple calls', async () => {
      const db1 = await openDatabase();
      const db2 = await openDatabase();
      expect(db1).toBe(db2);
    });
  });

  describe('closeDatabase', () => {
    it('closes database connection', async () => {
      const db = await openDatabase();
      expect(db.name).toBe(DB_NAME);
      
      closeDatabase();
      
      // Next open should create new connection
      const db2 = await openDatabase();
      expect(db2).not.toBe(db);
    });
  });

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  describe('create', () => {
    it('creates a new phrase item', async () => {
      const phrase: PhraseItem = {
        id: 'phrase-1',
        type: 'phrase',
        name: 'Test Phrase',
        category: 'melody',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['test', 'melody'],
        data: { notes: [] },
      };

      const created = await create(StoreName.PHRASES, phrase);
      expect(created).toEqual(phrase);
    });

    it('throws error for duplicate ID', async () => {
      const phrase: PhraseItem = {
        id: 'phrase-1',
        type: 'phrase',
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      };

      await create(StoreName.PHRASES, phrase);
      
      await expect(
        create(StoreName.PHRASES, phrase)
      ).rejects.toThrow();
    });
  });

  describe('read', () => {
    it('reads existing item', async () => {
      const phrase: PhraseItem = {
        id: 'phrase-1',
        type: 'phrase',
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      };

      await create(StoreName.PHRASES, phrase);
      const retrieved = await read<PhraseItem>(StoreName.PHRASES, 'phrase-1');
      
      expect(retrieved).toEqual(phrase);
    });

    it('returns undefined for non-existent item', async () => {
      const result = await read(StoreName.PHRASES, 'nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates existing item', async () => {
      const phrase: PhraseItem = {
        id: 'phrase-1',
        type: 'phrase',
        name: 'Original Name',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      };

      await create(StoreName.PHRASES, phrase);
      
      const updated = await update(StoreName.PHRASES, {
        ...phrase,
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.updatedAt).toBeGreaterThanOrEqual(phrase.updatedAt);
    });

    it('creates item if not exists (upsert)', async () => {
      const phrase: PhraseItem = {
        id: 'phrase-1',
        type: 'phrase',
        name: 'New',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      };

      const updated = await update(StoreName.PHRASES, phrase);
      expect(updated.id).toBe(phrase.id);
      expect(updated.name).toBe(phrase.name);
      expect(updated.updatedAt).toBeGreaterThanOrEqual(phrase.updatedAt);
    });
  });

  describe('remove', () => {
    it('deletes existing item', async () => {
      const phrase: PhraseItem = {
        id: 'phrase-1',
        type: 'phrase',
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      };

      await create(StoreName.PHRASES, phrase);
      await remove(StoreName.PHRASES, 'phrase-1');
      
      const retrieved = await read(StoreName.PHRASES, 'phrase-1');
      expect(retrieved).toBeUndefined();
    });

    it('succeeds for non-existent item', async () => {
      await expect(
        remove(StoreName.PHRASES, 'nonexistent')
      ).resolves.toBeUndefined();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await openDatabase();
      
      // Create test phrases
      for (let i = 0; i < 5; i++) {
        const phrase: PhraseItem = {
          id: `phrase-${i}`,
          type: 'phrase',
          name: `Phrase ${i}`,
          category: i % 2 === 0 ? 'melody' : 'harmony',
          createdAt: Date.now() + i * 1000,
          updatedAt: Date.now() + i * 1000,
          tags: i % 2 === 0 ? ['even'] : ['odd'],
          data: {},
        };
        await create(StoreName.PHRASES, phrase);
      }
    });

    it('lists all items', async () => {
      const result = await list<PhraseItem>(StoreName.PHRASES);
      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(false);
    });

    it('respects limit', async () => {
      const result = await list<PhraseItem>(StoreName.PHRASES, { limit: 3 });
      expect(result.items).toHaveLength(3);
      expect(result.hasMore).toBe(true);
    });

    it('respects offset', async () => {
      const result = await list<PhraseItem>(StoreName.PHRASES, { offset: 2, limit: 2 });
      expect(result.items).toHaveLength(2);
    });

    it('sorts by specified field', async () => {
      const result = await list<PhraseItem>(StoreName.PHRASES, {
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });
      
      expect(result.items[0]?.id).toBe('phrase-0');
      expect(result.items[4]?.id).toBe('phrase-4');
    });
  });

  describe('count', () => {
    it('counts items in store', async () => {
      await openDatabase();
      
      expect(await count(StoreName.PHRASES)).toBe(0);
      
      const phrase: PhraseItem = {
        id: 'phrase-1',
        type: 'phrase',
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      };
      await create(StoreName.PHRASES, phrase);
      
      expect(await count(StoreName.PHRASES)).toBe(1);
    });
  });

  describe('clear', () => {
    it('removes all items from store', async () => {
      await openDatabase();
      
      // Create multiple items
      for (let i = 0; i < 3; i++) {
        await create(StoreName.PHRASES, {
          id: `phrase-${i}`,
          type: 'phrase',
          name: `Test ${i}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data: {},
        } as PhraseItem);
      }
      
      expect(await count(StoreName.PHRASES)).toBe(3);
      
      await clear(StoreName.PHRASES);
      
      expect(await count(StoreName.PHRASES)).toBe(0);
    });
  });

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  describe('findByIndex', () => {
    beforeEach(async () => {
      await openDatabase();
      
      await create(StoreName.PHRASES, {
        id: 'phrase-1',
        type: 'phrase',
        name: 'Melody A',
        category: 'melody',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      } as PhraseItem);

      await create(StoreName.PHRASES, {
        id: 'phrase-2',
        type: 'phrase',
        name: 'Melody B',
        category: 'melody',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      } as PhraseItem);

      await create(StoreName.PHRASES, {
        id: 'phrase-3',
        type: 'phrase',
        name: 'Harmony A',
        category: 'harmony',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      } as PhraseItem);
    });

    it('finds items by category', async () => {
      const result = await findByIndex<PhraseItem>(
        StoreName.PHRASES,
        'category',
        'melody'
      );
      
      expect(result.items).toHaveLength(2);
      expect(result.items.every(item => item.category === 'melody')).toBe(true);
    });
  });

  describe('findByTags', () => {
    beforeEach(async () => {
      await openDatabase();
      
      await create(StoreName.PHRASES, {
        id: 'phrase-1',
        type: 'phrase',
        name: 'Test 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['tag-a', 'tag-b'],
        data: {},
      } as PhraseItem);

      await create(StoreName.PHRASES, {
        id: 'phrase-2',
        type: 'phrase',
        name: 'Test 2',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['tag-b', 'tag-c'],
        data: {},
      } as PhraseItem);

      await create(StoreName.PHRASES, {
        id: 'phrase-3',
        type: 'phrase',
        name: 'Test 3',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['tag-c'],
        data: {},
      } as PhraseItem);
    });

    it('finds items with any matching tag', async () => {
      const result = await findByTags<PhraseItem>(
        StoreName.PHRASES,
        ['tag-a', 'tag-c']
      );
      
      expect(result.items).toHaveLength(3);
    });

    it('returns unique items', async () => {
      const result = await findByTags<PhraseItem>(
        StoreName.PHRASES,
        ['tag-b', 'tag-c']
      );
      
      // phrase-1 (tag-a, tag-b), phrase-2 (tag-b, tag-c), phrase-3 (tag-c) = 3 items
      expect(result.items).toHaveLength(3);
    });
  });

  // ============================================================================
  // HIGH-LEVEL OPERATIONS
  // ============================================================================

  describe('exportStore/importStore', () => {
    it('exports and imports data', async () => {
      await openDatabase();
      
      // Create test data
      const phrases: PhraseItem[] = [
        {
          id: 'phrase-1',
          type: 'phrase',
          name: 'Test 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data: {},
        },
        {
          id: 'phrase-2',
          type: 'phrase',
          name: 'Test 2',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          data: {},
        },
      ];

      for (const phrase of phrases) {
        await create(StoreName.PHRASES, phrase);
      }
      
      // Export
      const exported = await exportStore<PhraseItem>(StoreName.PHRASES);
      expect(exported).toHaveLength(2);
      
      // Clear and import
      await clear(StoreName.PHRASES);
      await importStore(StoreName.PHRASES, exported);
      
      // Verify
      const count_ = await count(StoreName.PHRASES);
      expect(count_).toBe(2);
    });
  });

  describe('backupDatabase/restoreDatabase', () => {
    it('backs up and restores entire database', async () => {
      await openDatabase();
      
      // Create test data
      await create(StoreName.PHRASES, {
        id: 'phrase-1',
        type: 'phrase',
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      } as PhraseItem);

      await create(StoreName.PRESETS, {
        id: 'preset-1',
        type: 'preset',
        name: 'Test Preset',
        cardId: 'card-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      } as PresetItem);
      
      // Backup
      const backup = await backupDatabase();
      expect(backup[StoreName.PHRASES]).toHaveLength(1);
      expect(backup[StoreName.PRESETS]).toHaveLength(1);
      
      // Clear everything
      await clear(StoreName.PHRASES);
      await clear(StoreName.PRESETS);
      
      // Restore
      await restoreDatabase(backup);
      
      // Verify
      expect(await count(StoreName.PHRASES)).toBe(1);
      expect(await count(StoreName.PRESETS)).toBe(1);
    });
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe('isIndexedDBAvailable', () => {
    it('returns true in test environment', () => {
      expect(isIndexedDBAvailable()).toBe(true);
    });
  });
});
