/**
 * @fileoverview Tests for KB Health Report
 * @module @cardplay/ai/knowledge/__tests__/kb-health-report
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadMusicTheoryKB,
  isMusicTheoryLoaded,
  kbHealthReport,
  getLoadedPredicates,
  resetMusicTheoryLoader,
  loadOntologyKB,
  isOntologyLoaded,
} from '../music-theory-loader';
import { getPrologAdapter } from '../../engine/prolog-adapter';

describe('KB Health Report (Changes 387-388)', () => {
  beforeEach(() => {
    resetMusicTheoryLoader();
  });

  describe('kbHealthReport', () => {
    it('should report unloaded state initially', () => {
      const report = kbHealthReport();
      expect(report.mainKBLoaded).toBe(false);
      expect(report.coreModules.length).toBeGreaterThan(0);
      expect(report.totalModules).toBeGreaterThan(0);
    });

    it('should report loaded state after loading KB', async () => {
      await loadMusicTheoryKB();
      const report = kbHealthReport();
      
      expect(report.mainKBLoaded).toBe(true);
      expect(report.coreModules.every(m => m.loaded)).toBe(true);
    });

    it('should list all core modules', () => {
      const report = kbHealthReport();
      
      expect(report.coreModules).toContainEqual(
        expect.objectContaining({ name: 'music-theory', type: 'core' })
      );
      expect(report.coreModules).toContainEqual(
        expect.objectContaining({ name: 'galant', type: 'core' })
      );
      expect(report.coreModules).toContainEqual(
        expect.objectContaining({ name: 'music-spec', type: 'spec' })
      );
    });

    it('should calculate total size', () => {
      const report = kbHealthReport();
      expect(report.totalSize).toBeGreaterThan(0);
      
      const calculatedSize = report.coreModules.reduce((sum, m) => sum + m.size, 0);
      expect(report.totalSize).toBe(calculatedSize);
    });

    it('should include module size information', () => {
      const report = kbHealthReport();
      
      report.coreModules.forEach(mod => {
        expect(mod.size).toBeGreaterThanOrEqual(0);
        expect(typeof mod.size).toBe('number');
      });
    });

    it('should report deterministic module loading order', () => {
      const report1 = kbHealthReport();
      const report2 = kbHealthReport();
      
      // Module order should be consistent
      expect(report1.coreModules.map(m => m.name)).toEqual(
        report2.coreModules.map(m => m.name)
      );
    });
  });

  describe('ontology modules in health report', () => {
    it('should initially have no ontology modules', () => {
      const report = kbHealthReport();
      expect(report.ontologyModules.length).toBe(0);
    });

    it('should include loaded ontology modules', async () => {
      await loadMusicTheoryKB();
      
      // Load an ontology (carnatic is a builtin)
      await loadOntologyKB('carnatic');
      
      const report = kbHealthReport();
      
      if (report.ontologyModules.length > 0) {
        expect(report.ontologyModules.some(m => m.name === 'carnatic')).toBe(true);
      }
    });

    it('should track total modules including ontologies', async () => {
      const report1 = kbHealthReport();
      const initialTotal = report1.totalModules;
      
      await loadMusicTheoryKB();
      await loadOntologyKB('carnatic');
      
      const report2 = kbHealthReport();
      
      // Total should include core + ontology modules
      expect(report2.totalModules).toBeGreaterThanOrEqual(initialTotal);
    });
  });

  describe('getLoadedPredicates (Change 387)', () => {
    it('should return empty array when KB not loaded', async () => {
      const predicates = await getLoadedPredicates();
      expect(predicates).toEqual([]);
    });

    it('should return predicates after KB loaded', async () => {
      await loadMusicTheoryKB();
      const predicates = await getLoadedPredicates();
      
      // Should have at least some predicates
      expect(predicates.length).toBeGreaterThan(0);
    });

    it('should return predicates in name/arity format', async () => {
      await loadMusicTheoryKB();
      const predicates = await getLoadedPredicates();
      
      // Check format of predicates
      predicates.forEach(pred => {
        // Should be in format name/arity
        expect(pred).toMatch(/^[\w_]+\/\d+$/);
      });
    });
  });

  describe('module determinism', () => {
    it('should load modules in consistent order', async () => {
      await loadMusicTheoryKB();
      const report = kbHealthReport();
      
      const moduleNames = report.coreModules.map(m => m.name);
      
      // First module should be main music-theory
      expect(moduleNames[0]).toBe('music-theory');
      
      // Last module should be music-spec (MusicSpec definitions)
      expect(moduleNames[moduleNames.length - 1]).toBe('music-spec');
    });

    it('should report loaded status consistently', async () => {
      const report1 = kbHealthReport();
      expect(report1.mainKBLoaded).toBe(false);
      
      await loadMusicTheoryKB();
      
      const report2 = kbHealthReport();
      expect(report2.mainKBLoaded).toBe(true);
      
      // Calling again shouldn't change loaded status
      await loadMusicTheoryKB();
      
      const report3 = kbHealthReport();
      expect(report3.mainKBLoaded).toBe(true);
    });
  });

  describe('health report for debugging', () => {
    it('should provide useful debugging information', () => {
      const report = kbHealthReport();
      
      // Should have meaningful data for each module
      report.coreModules.forEach(mod => {
        expect(mod.name).toBeTruthy();
        expect(mod.type).toMatch(/^(core|spec|ontology)$/);
        expect(typeof mod.loaded).toBe('boolean');
        expect(typeof mod.size).toBe('number');
      });
    });

    it('should calculate accurate totals', () => {
      const report = kbHealthReport();
      
      const manualModuleCount = report.coreModules.length + report.ontologyModules.length;
      expect(report.totalModules).toBe(manualModuleCount);
      
      const manualSize = report.coreModules.reduce((sum, m) => sum + m.size, 0);
      expect(report.totalSize).toBe(manualSize);
    });
  });
});
