/**
 * @fileoverview Registry V2 Integration Tests
 * 
 * Tests for the unified registry system.
 */

import { describe, it, expect } from 'vitest';
import {
  createEmptySnapshot,
  serializeSnapshot,
  deserializeSnapshot,
  computeDiff,
  DiffChangeType,
  validateEntry,
  type RegistrySnapshot,
  type TypedRegistryEntry,
} from '../index';

describe('Registry V2', () => {
  describe('Snapshot Management', () => {
    it('should create empty snapshot', () => {
      const snapshot = createEmptySnapshot('1.0.0');
      
      expect(snapshot.version).toBe(1);
      expect(snapshot.cardplayVersion).toBe('1.0.0');
      expect(snapshot.entries).toEqual({});
      expect(snapshot.createdAt).toBeInstanceOf(Date);
    });
    
    it('should serialize and deserialize snapshot', () => {
      const snapshot = createEmptySnapshot('1.0.0');
      const json = serializeSnapshot(snapshot);
      const deserialized = deserializeSnapshot(json);
      
      expect(deserialized.version).toBe(snapshot.version);
      expect(deserialized.cardplayVersion).toBe(snapshot.cardplayVersion);
      expect(deserialized.createdAt.toISOString()).toBe(snapshot.createdAt.toISOString());
    });
  });
  
  describe('Diff Generation', () => {
    it('should compute diff between snapshots', () => {
      const snapshot1 = createEmptySnapshot('1.0.0');
      const snapshot2: RegistrySnapshot = {
        ...snapshot1,
        entries: {
          card: [
            {
              type: 'card',
              entity: { id: 'test:card', name: 'Test Card' },
              provenance: {
                id: 'test:card',
                source: { packId: 'test', version: '1.0.0' },
                registeredAt: new Date(),
                builtin: false,
                active: true,
              },
            },
          ],
        },
      };
      
      const diff = computeDiff(snapshot1, snapshot2);
      
      expect(diff.summary.added).toBe(1);
      expect(diff.summary.removed).toBe(0);
      expect(diff.summary.modified).toBe(0);
      expect(diff.changes.card).toBeDefined();
      expect(diff.changes.card![0].type).toBe(DiffChangeType.ADDED);
    });
  });
  
  describe('Validation', () => {
    it('should validate builtin card entry', () => {
      const entry: TypedRegistryEntry = {
        type: 'card',
        entity: { id: 'filter', name: 'Filter' },
        provenance: {
          id: 'filter',
          source: { packId: 'core', version: '1.0.0' },
          registeredAt: new Date(),
          builtin: true,
          active: true,
        },
      };
      
      const result = validateEntry(entry);
      expect(result.valid).toBe(true);
    });
    
    it('should warn about non-namespaced third-party card', () => {
      const entry: TypedRegistryEntry = {
        type: 'card',
        entity: { id: 'mycard', name: 'My Card' },
        provenance: {
          id: 'mycard',
          source: { packId: 'mypack', version: '1.0.0' },
          registeredAt: new Date(),
          builtin: false,
          active: true,
        },
      };
      
      const result = validateEntry(entry);
      expect(result.messages.some(m => m.code === 'MISSING_NAMESPACE')).toBe(true);
    });
  });
});
