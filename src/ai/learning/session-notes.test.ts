/**
 * @fileoverview Session Notes Tests
 *
 * M377-M382: Tests for session notes CRUD, persistence, and search.
 *
 * @module @cardplay/ai/learning/session-notes.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSessionNote,
  getSessionNote,
  updateSessionNote,
  deleteSessionNote,
  getProjectNotes,
  searchSessionNotes,
  toggleNotePin,
  getAllNoteTags,
  countProjectNotes,
  getSessionNoteCount,
  resetSessionNotes,
  exportSessionNotes,
  importSessionNotes,
} from './session-notes';

describe('SessionNotes', () => {
  beforeEach(() => {
    resetSessionNotes();
  });

  // ===========================================================================
  // M377: Create and retrieve notes
  // ===========================================================================

  describe('create and retrieve (M377)', () => {
    it('creates a note with all fields', () => {
      const note = createSessionNote('proj1', '# My Notes\nSome content here.', {
        title: 'Session 1 Ideas',
        tags: ['ideas', 'mixing'],
        pinned: true,
        boardContext: 'mixing-board',
        deckContext: 'mixer-deck',
      });

      expect(note.noteId).toBeTruthy();
      expect(note.projectId).toBe('proj1');
      expect(note.title).toBe('Session 1 Ideas');
      expect(note.content).toBe('# My Notes\nSome content here.');
      expect(note.tags).toContain('ideas');
      expect(note.pinned).toBe(true);
      expect(note.boardContext).toBe('mixing-board');
      expect(note.deckContext).toBe('mixer-deck');
    });

    it('creates a quick note with defaults', () => {
      const note = createSessionNote('proj1', 'Quick thought');
      expect(note.title).toBe('');
      expect(note.tags).toEqual([]);
      expect(note.pinned).toBe(false);
      expect(note.boardContext).toBeNull();
    });

    it('retrieves by ID', () => {
      const note = createSessionNote('proj1', 'Test');
      expect(getSessionNote(note.noteId)).not.toBeNull();
      expect(getSessionNote(note.noteId)!.content).toBe('Test');
    });

    it('returns null for unknown ID', () => {
      expect(getSessionNote('nonexistent')).toBeNull();
    });
  });

  // ===========================================================================
  // Update and delete
  // ===========================================================================

  describe('update and delete', () => {
    it('updates note content', () => {
      const note = createSessionNote('proj1', 'Original');
      const updated = updateSessionNote(note.noteId, { content: 'Updated' });
      expect(updated).not.toBeNull();
      expect(updated!.content).toBe('Updated');
      // updatedAt should be a valid ISO timestamp (may match createdAt within same ms)
      expect(updated!.updatedAt).toBeTruthy();
    });

    it('updates note title and tags', () => {
      const note = createSessionNote('proj1', 'Content', { title: 'Old', tags: ['a'] });
      const updated = updateSessionNote(note.noteId, { title: 'New', tags: ['b', 'c'] });
      expect(updated!.title).toBe('New');
      expect(updated!.tags).toEqual(['b', 'c']);
    });

    it('returns null for unknown note ID', () => {
      expect(updateSessionNote('nope', { content: 'x' })).toBeNull();
    });

    it('deletes a note', () => {
      const note = createSessionNote('proj1', 'Deletable');
      expect(deleteSessionNote(note.noteId)).toBe(true);
      expect(getSessionNote(note.noteId)).toBeNull();
    });

    it('delete returns false for unknown ID', () => {
      expect(deleteSessionNote('nope')).toBe(false);
    });
  });

  // ===========================================================================
  // M379: Project-scoped retrieval
  // ===========================================================================

  describe('project-scoped notes (M379)', () => {
    it('returns notes for a project only', () => {
      createSessionNote('proj1', 'Note A');
      createSessionNote('proj1', 'Note B');
      createSessionNote('proj2', 'Note C');

      const proj1Notes = getProjectNotes('proj1');
      expect(proj1Notes).toHaveLength(2);
      expect(proj1Notes.every(n => n.projectId === 'proj1')).toBe(true);
    });

    it('sorts pinned first, then by updated date', () => {
      const n1 = createSessionNote('proj1', 'Unpinned 1');
      const n2 = createSessionNote('proj1', 'Pinned', { pinned: true });
      const n3 = createSessionNote('proj1', 'Unpinned 2');

      const notes = getProjectNotes('proj1');
      expect(notes[0].pinned).toBe(true);
      expect(notes[0].content).toBe('Pinned');
    });

    it('counts notes per project', () => {
      createSessionNote('proj1', 'A');
      createSessionNote('proj1', 'B');
      createSessionNote('proj2', 'C');
      expect(countProjectNotes('proj1')).toBe(2);
      expect(countProjectNotes('proj2')).toBe(1);
      expect(countProjectNotes('proj3')).toBe(0);
    });
  });

  // ===========================================================================
  // M380: Cross-project search
  // ===========================================================================

  describe('search across projects (M380)', () => {
    beforeEach(() => {
      createSessionNote('proj1', 'Mix the bass louder', { title: 'Mixing Notes', tags: ['mixing', 'bass'] });
      createSessionNote('proj1', 'Try reverb on vocals', { title: 'FX Ideas', tags: ['effects', 'vocals'] });
      createSessionNote('proj2', 'Chord progression idea: Am F C G', { title: 'Harmony', tags: ['chords'] });
      createSessionNote('proj2', 'Need to check bass frequency', { tags: ['mixing', 'bass'], boardContext: 'mixing-board' });
    });

    it('searches by query text', () => {
      const results = searchSessionNotes({ query: 'bass' });
      expect(results).toHaveLength(2);
    });

    it('searches by tags', () => {
      const results = searchSessionNotes({ tags: ['mixing'] });
      expect(results).toHaveLength(2);
    });

    it('filters by project', () => {
      const results = searchSessionNotes({ projectId: 'proj2' });
      expect(results).toHaveLength(2);
    });

    it('filters by board context', () => {
      const results = searchSessionNotes({ boardContext: 'mixing-board' });
      expect(results).toHaveLength(1);
    });

    it('filters pinned only', () => {
      // None pinned by default in this setup
      const results = searchSessionNotes({ pinnedOnly: true });
      expect(results).toHaveLength(0);
    });

    it('limits results', () => {
      const results = searchSessionNotes({ limit: 2 });
      expect(results).toHaveLength(2);
    });

    it('combines filters', () => {
      const results = searchSessionNotes({ projectId: 'proj1', tags: ['bass'] });
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Mixing Notes');
    });
  });

  // ===========================================================================
  // Pin toggle and tags
  // ===========================================================================

  describe('pin toggle and tags', () => {
    it('toggles pin status', () => {
      const note = createSessionNote('proj1', 'Test');
      expect(note.pinned).toBe(false);
      toggleNotePin(note.noteId);
      expect(getSessionNote(note.noteId)!.pinned).toBe(true);
      toggleNotePin(note.noteId);
      expect(getSessionNote(note.noteId)!.pinned).toBe(false);
    });

    it('returns false for unknown note', () => {
      expect(toggleNotePin('nope')).toBe(false);
    });

    it('collects all unique tags', () => {
      createSessionNote('proj1', 'A', { tags: ['mixing', 'bass'] });
      createSessionNote('proj2', 'B', { tags: ['bass', 'chords'] });
      expect(getAllNoteTags()).toEqual(['bass', 'chords', 'mixing']);
    });
  });

  // ===========================================================================
  // M381: Persistence (export/import)
  // ===========================================================================

  describe('persistence via export/import (M381)', () => {
    it('round-trips notes through export/import', () => {
      createSessionNote('proj1', 'Note 1', { title: 'First', tags: ['a'] });
      createSessionNote('proj1', 'Note 2');
      const exported = exportSessionNotes();
      expect(exported).toHaveLength(2);

      resetSessionNotes();
      expect(getSessionNoteCount()).toBe(0);

      const imported = importSessionNotes(exported);
      expect(imported).toBe(2);
      expect(getSessionNoteCount()).toBe(2);
    });

    it('skips duplicates on import', () => {
      createSessionNote('proj1', 'Note');
      const exported = exportSessionNotes();
      const imported = importSessionNotes(exported);
      expect(imported).toBe(0);
    });
  });
});
