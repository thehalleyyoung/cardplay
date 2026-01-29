/**
 * @fileoverview Tests for Project Versioning System
 *
 * Covers roadmap items:
 *   - M309: Project version save/load with naming
 *   - M310: Project comparison view (diff between versions)
 *   - M311: Version system prevents overwrites
 *   - M312: Version comparison shows meaningful changes
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  saveProjectVersion,
  loadProjectVersion,
  listProjectVersions,
  deleteProjectVersion,
  compareProjectVersions,
  getProjectVersionCount,
  resetProjectVersions,
  exportProjectVersions,
  importProjectVersions,
  generateVersionName,
} from './project-versioning';

describe('Project Versioning', () => {
  beforeEach(() => {
    resetProjectVersions();
  });

  // ===========================================================================
  // M309: Save / Load
  // ===========================================================================

  describe('Save and Load (M309)', () => {
    it('saves a version and retrieves it by ID', () => {
      const v = saveProjectVersion('My Song v1', 'numbered', { tempo: 120, key: 'C' });
      expect(v.versionId).toBeTruthy();
      expect(v.versionName).toBe('My Song v1');
      expect(v.convention).toBe('numbered');
      expect(v.projectData).toEqual({ tempo: 120, key: 'C' });

      const loaded = loadProjectVersion(v.versionId);
      expect(loaded).not.toBeNull();
      expect(loaded!.versionName).toBe('My Song v1');
    });

    it('returns null for unknown version IDs', () => {
      expect(loadProjectVersion('nonexistent')).toBeNull();
    });

    it('lists all versions', () => {
      saveProjectVersion('v1', 'numbered', { x: 1 });
      saveProjectVersion('v2', 'numbered', { x: 2 });
      saveProjectVersion('v3', 'numbered', { x: 3 });

      const list = listProjectVersions();
      expect(list.length).toBe(3);
      const names = list.map((v) => v.versionName);
      expect(names).toContain('v1');
      expect(names).toContain('v2');
      expect(names).toContain('v3');
    });

    it('deletes a version', () => {
      const v = saveProjectVersion('delete me', 'numbered', {});
      expect(getProjectVersionCount()).toBe(1);

      const deleted = deleteProjectVersion(v.versionId);
      expect(deleted).toBe(true);
      expect(getProjectVersionCount()).toBe(0);
      expect(loadProjectVersion(v.versionId)).toBeNull();
    });

    it('supports tags and notes', () => {
      const v = saveProjectVersion(
        'tagged version',
        'descriptive',
        { foo: 'bar' },
        ['wip', 'idea'],
        'Early concept sketch'
      );
      expect(v.tags).toEqual(['wip', 'idea']);
      expect(v.notes).toBe('Early concept sketch');
    });
  });

  // ===========================================================================
  // M310: Version Comparison
  // ===========================================================================

  describe('Version Comparison (M310)', () => {
    it('detects added keys', () => {
      const v1 = saveProjectVersion('v1', 'numbered', { tempo: 120 });
      const v2 = saveProjectVersion('v2', 'numbered', { tempo: 120, key: 'Dm' });

      const diff = compareProjectVersions(v1.versionId, v2.versionId);
      expect(diff).not.toBeNull();
      expect(diff!.additions).toBe(1);
      expect(diff!.diffs.find((d) => d.path === 'key')).toMatchObject({
        type: 'added',
        newValue: 'Dm',
      });
    });

    it('detects removed keys', () => {
      const v1 = saveProjectVersion('v1', 'numbered', { tempo: 120, key: 'C' });
      const v2 = saveProjectVersion('v2', 'numbered', { tempo: 120 });

      const diff = compareProjectVersions(v1.versionId, v2.versionId);
      expect(diff).not.toBeNull();
      expect(diff!.removals).toBe(1);
    });

    it('detects changed values', () => {
      const v1 = saveProjectVersion('v1', 'numbered', { tempo: 120 });
      const v2 = saveProjectVersion('v2', 'numbered', { tempo: 140 });

      const diff = compareProjectVersions(v1.versionId, v2.versionId);
      expect(diff).not.toBeNull();
      expect(diff!.modifications).toBe(1);
      expect(diff!.diffs[0]).toMatchObject({
        path: 'tempo',
        type: 'changed',
        oldValue: 120,
        newValue: 140,
      });
    });

    it('M312: reports no changes for identical versions', () => {
      const data = { tempo: 120, key: 'C', tracks: ['drums', 'bass'] };
      const v1 = saveProjectVersion('v1', 'numbered', data);
      const v2 = saveProjectVersion('v2', 'numbered', data);

      const diff = compareProjectVersions(v1.versionId, v2.versionId);
      expect(diff!.totalChanges).toBe(0);
    });

    it('returns null when version IDs are invalid', () => {
      expect(compareProjectVersions('bad1', 'bad2')).toBeNull();
    });
  });

  // ===========================================================================
  // M311: Overwrite Prevention
  // ===========================================================================

  describe('Overwrite Prevention (M311)', () => {
    it('each save creates a distinct version ID', () => {
      const v1 = saveProjectVersion('v1', 'numbered', { x: 1 });
      const v2 = saveProjectVersion('v2', 'numbered', { x: 2 });
      expect(v1.versionId).not.toBe(v2.versionId);
      expect(getProjectVersionCount()).toBe(2);
    });

    it('saving with same name creates separate version', () => {
      const v1 = saveProjectVersion('Same Name', 'numbered', { x: 1 });
      const v2 = saveProjectVersion('Same Name', 'numbered', { x: 2 });
      expect(v1.versionId).not.toBe(v2.versionId);

      // Both should be loadable
      expect(loadProjectVersion(v1.versionId)).not.toBeNull();
      expect(loadProjectVersion(v2.versionId)).not.toBeNull();
    });
  });

  // ===========================================================================
  // Export / Import
  // ===========================================================================

  describe('Export and Import', () => {
    it('exports and imports versions', () => {
      saveProjectVersion('v1', 'numbered', { a: 1 });
      saveProjectVersion('v2', 'numbered', { b: 2 });
      const exported = exportProjectVersions();
      expect(exported.length).toBe(2);

      resetProjectVersions();
      expect(getProjectVersionCount()).toBe(0);

      importProjectVersions(exported);
      expect(getProjectVersionCount()).toBe(2);
    });

    it('import is additive (no duplicates)', () => {
      const v = saveProjectVersion('v1', 'numbered', { a: 1 });
      const exported = exportProjectVersions();

      // Import same data again
      importProjectVersions(exported);
      // Should not create duplicates
      expect(getProjectVersionCount()).toBe(1);
    });
  });

  // ===========================================================================
  // Naming Conventions
  // ===========================================================================

  describe('Version Naming (M308)', () => {
    it('generates date-based names', () => {
      const name = generateVersionName('date_based', 'My Song');
      expect(name).toContain('My Song');
      expect(name).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('generates numbered names', () => {
      const name = generateVersionName('numbered', 'Track', 5);
      expect(name).toBe('Track v5');
    });

    it('generates milestone names', () => {
      const name = generateVersionName('milestone', 'Demo', 3);
      expect(name).toBe('Demo – Milestone 3');
    });

    it('generates descriptive names', () => {
      const name = generateVersionName('descriptive', 'Project', 2);
      expect(name).toBe('Project – Draft 2');
    });
  });
});
