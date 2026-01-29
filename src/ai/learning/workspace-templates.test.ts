/**
 * @fileoverview Workspace Templates Tests
 *
 * M344-M347: Tests for workspace template save/load/search/defaults.
 *
 * @module @cardplay/ai/learning/workspace-templates.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveWorkspaceTemplate,
  getWorkspaceTemplate,
  listWorkspaceTemplates,
  applyWorkspaceTemplate,
  deleteWorkspaceTemplate,
  updateWorkspaceTemplate,
  getWorkspaceTemplateCount,
  resetAllWorkspaceTemplates,
  exportWorkspaceTemplates,
  importWorkspaceTemplates,
  getBuiltinTemplateIds,
  type WorkspaceTemplate,
  type ApplyTemplateOptions,
} from './workspace-templates';

describe('WorkspaceTemplates', () => {
  beforeEach(() => {
    resetAllWorkspaceTemplates();
  });

  // ===========================================================================
  // M347: Builtin templates
  // ===========================================================================

  describe('builtin templates (M347)', () => {
    it('ships default templates for common tasks', () => {
      const ids = getBuiltinTemplateIds();
      expect(ids.length).toBeGreaterThanOrEqual(7);
      expect(ids).toContain('builtin_beat_making');
      expect(ids).toContain('builtin_mixing');
      expect(ids).toContain('builtin_mastering');
      expect(ids).toContain('builtin_scoring');
      expect(ids).toContain('builtin_sound_design');
      expect(ids).toContain('builtin_live_performance');
      expect(ids).toContain('builtin_ai_composer');
    });

    it('builtin templates have valid structure', () => {
      const templates = listWorkspaceTemplates({ author: 'builtin' });
      for (const t of templates) {
        expect(t.templateId).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.category).toBeTruthy();
        expect(t.author).toBe('builtin');
        expect(t.decks.length).toBeGreaterThan(0);
        expect(t.controlLevel).toBeTruthy();
      }
    });

    it('builtin templates cannot be deleted', () => {
      const deleted = deleteWorkspaceTemplate('builtin_beat_making');
      expect(deleted).toBe(false);
      expect(getWorkspaceTemplate('builtin_beat_making')).not.toBeNull();
    });
  });

  // ===========================================================================
  // M344/M345: Save templates
  // ===========================================================================

  describe('save workspace template (M344/M345)', () => {
    it('saves a user template with all fields', () => {
      const t = saveWorkspaceTemplate(
        'My Custom Beat',
        'A custom beat-making layout',
        'beat-making',
        'basic-tracker-board',
        'manual-with-hints',
        { type: 'dock', panels: [] },
        [{ id: 'deck1', type: 'pattern-deck', cardLayout: 'stack', allowReordering: true, allowDragOut: true }],
        [{ sourceId: 'deck1', sourcePort: 'audio-out', targetId: 'deck2', targetPort: 'audio-in', connectionType: 'audio' }],
        { deck1: { zoom: 150 } },
        ['custom', 'hip-hop'],
      );

      expect(t.templateId).toBeTruthy();
      expect(t.name).toBe('My Custom Beat');
      expect(t.author).toBe('user');
      expect(t.decks).toHaveLength(1);
      expect(t.connections).toHaveLength(1);
      expect(t.deckPresets).toEqual({ deck1: { zoom: 150 } });
      expect(t.tags).toContain('custom');
    });

    it('generates unique IDs for each save', () => {
      const t1 = saveWorkspaceTemplate('A', '', 'general', null, 'full-manual', { type: 'dock', panels: [] }, [], []);
      const t2 = saveWorkspaceTemplate('B', '', 'general', null, 'full-manual', { type: 'dock', panels: [] }, [], []);
      expect(t1.templateId).not.toBe(t2.templateId);
    });

    it('deep-clones deck presets to prevent mutation', () => {
      const presets: Record<string, Record<string, unknown>> = { d1: { val: 42 } };
      const t = saveWorkspaceTemplate('X', '', 'general', null, 'full-manual', { type: 'dock', panels: [] }, [], [], presets);
      presets.d1.val = 999;
      expect(t.deckPresets.d1.val).toBe(42);
    });
  });

  // ===========================================================================
  // M346: Apply templates
  // ===========================================================================

  describe('apply workspace template (M346)', () => {
    it('applies a template and returns action plan', () => {
      const t = saveWorkspaceTemplate(
        'Test', '', 'general', null, 'full-manual',
        { type: 'dock', panels: [] },
        [
          { id: 'd1', type: 'pattern-deck', cardLayout: 'stack', allowReordering: true, allowDragOut: true },
          { id: 'd2', type: 'mixer-deck', cardLayout: 'stack', allowReordering: true, allowDragOut: true },
        ],
        [{ sourceId: 'd1', sourcePort: 'out', targetId: 'd2', targetPort: 'in', connectionType: 'audio' }],
        { d1: { tempo: 120 } },
      );

      const result = applyWorkspaceTemplate(t.templateId);
      expect(result).not.toBeNull();
      expect(result!.success).toBe(true);
      expect(result!.appliedDecks).toHaveLength(2);
      expect(result!.appliedConnections).toBe(1);
      expect(result!.appliedPresets).toBe(1);
    });

    it('skips routing when option is false', () => {
      const t = saveWorkspaceTemplate(
        'Test', '', 'general', null, 'full-manual',
        { type: 'dock', panels: [] }, [],
        [{ sourceId: 'a', sourcePort: 'out', targetId: 'b', targetPort: 'in', connectionType: 'audio' }],
      );
      const result = applyWorkspaceTemplate(t.templateId, { applyRouting: false });
      expect(result!.appliedConnections).toBe(0);
      expect(result!.warnings.length).toBeGreaterThan(0);
    });

    it('returns null for unknown template ID', () => {
      expect(applyWorkspaceTemplate('nonexistent')).toBeNull();
    });
  });

  // ===========================================================================
  // Search and filtering
  // ===========================================================================

  describe('list and search templates', () => {
    it('filters by category', () => {
      const results = listWorkspaceTemplates({ category: 'mixing' });
      expect(results.every(t => t.category === 'mixing')).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('filters by query string', () => {
      const results = listWorkspaceTemplates({ query: 'beat' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.name.toLowerCase().includes('beat'))).toBe(true);
    });

    it('filters by tags', () => {
      const results = listWorkspaceTemplates({ tags: ['ai'] });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(t => t.tags.includes('ai'))).toBe(true);
    });

    it('filters by deck type', () => {
      const results = listWorkspaceTemplates({ hasDeckType: 'notation-deck' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(t => t.decks.some(d => d.type === 'notation-deck'))).toBe(true);
    });

    it('filters by author', () => {
      saveWorkspaceTemplate('User One', '', 'general', null, 'full-manual', { type: 'dock', panels: [] }, [], []);
      const userOnly = listWorkspaceTemplates({ author: 'user' });
      expect(userOnly.every(t => t.author === 'user')).toBe(true);
      expect(userOnly.length).toBe(1);
    });

    it('sorts builtins first, then by updated date', () => {
      saveWorkspaceTemplate('Z first', '', 'general', null, 'full-manual', { type: 'dock', panels: [] }, [], []);
      const all = listWorkspaceTemplates();
      const firstUserIndex = all.findIndex(t => t.author === 'user');
      const lastBuiltinIndex = all.findLastIndex(t => t.author === 'builtin');
      if (firstUserIndex >= 0 && lastBuiltinIndex >= 0) {
        expect(firstUserIndex).toBeGreaterThan(lastBuiltinIndex);
      }
    });
  });

  // ===========================================================================
  // Update / Delete
  // ===========================================================================

  describe('update and delete', () => {
    it('updates user template metadata', () => {
      const t = saveWorkspaceTemplate('Old Name', '', 'general', null, 'full-manual', { type: 'dock', panels: [] }, [], []);
      const updated = updateWorkspaceTemplate(t.templateId, { name: 'New Name', category: 'mixing' });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('New Name');
      expect(updated!.category).toBe('mixing');
    });

    it('cannot update builtin templates', () => {
      const result = updateWorkspaceTemplate('builtin_beat_making', { name: 'Hacked' });
      expect(result).toBeNull();
    });

    it('deletes user templates', () => {
      const t = saveWorkspaceTemplate('Deletable', '', 'general', null, 'full-manual', { type: 'dock', panels: [] }, [], []);
      expect(deleteWorkspaceTemplate(t.templateId)).toBe(true);
      expect(getWorkspaceTemplate(t.templateId)).toBeNull();
    });
  });

  // ===========================================================================
  // Export / Import
  // ===========================================================================

  describe('export and import', () => {
    it('round-trips templates through export/import', () => {
      saveWorkspaceTemplate('Exportable', '', 'general', null, 'full-manual', { type: 'dock', panels: [] }, [], []);
      const exported = exportWorkspaceTemplates();
      const countBefore = getWorkspaceTemplateCount();

      resetAllWorkspaceTemplates();
      const imported = importWorkspaceTemplates(exported);
      // Only user templates imported (builtins are already re-registered by reset)
      expect(imported).toBeGreaterThanOrEqual(1);
    });

    it('skips duplicates on import', () => {
      const t = saveWorkspaceTemplate('Dup', '', 'general', null, 'full-manual', { type: 'dock', panels: [] }, [], []);
      const exported = exportWorkspaceTemplates();
      const imported = importWorkspaceTemplates(exported);
      expect(imported).toBe(0); // All already exist
    });
  });
});
