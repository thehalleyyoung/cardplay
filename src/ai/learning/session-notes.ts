/**
 * @fileoverview Session Notes System
 *
 * M377: Implement "Session Notes" feature (project-scoped notes).
 * M378: Notes deck showing markdown editor.
 * M379: Notes persistence per project.
 * M380: Notes search across projects.
 * M381: Tests for session notes persistence.
 *
 * Provides a local-only, in-memory note store scoped per project.
 * Each note is a timestamped markdown entry associated with a project,
 * optionally tagged and linked to a specific board/deck context.
 *
 * @module @cardplay/ai/learning/session-notes
 */

// =============================================================================
// Types
// =============================================================================

/** A session note associated with a project. */
export interface SessionNote {
  /** Unique note ID. */
  readonly noteId: string;

  /** Project this note belongs to. */
  readonly projectId: string;

  /** Note title (can be empty for quick notes). */
  readonly title: string;

  /** Markdown content. */
  readonly content: string;

  /** Free-form tags for categorisation. */
  readonly tags: readonly string[];

  /** Whether this note is pinned to the top. */
  readonly pinned: boolean;

  /** Board context (which board was active when note was created). */
  readonly boardContext: string | null;

  /** Deck context (which deck was focused). */
  readonly deckContext: string | null;

  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;

  /** ISO-8601 last-modified timestamp. */
  readonly updatedAt: string;
}

/** Options when creating a session note. */
export interface CreateNoteOptions {
  readonly title?: string;
  readonly tags?: string[];
  readonly pinned?: boolean;
  readonly boardContext?: string;
  readonly deckContext?: string;
}

/** Criteria for searching notes. */
export interface NoteSearchCriteria {
  /** Free-text query matching title, content, tags. */
  readonly query?: string;
  /** Filter by project ID. */
  readonly projectId?: string;
  /** Filter by tag (any match). */
  readonly tags?: readonly string[];
  /** Filter pinned only. */
  readonly pinnedOnly?: boolean;
  /** Filter by board context. */
  readonly boardContext?: string;
  /** Sort by field (default: updatedAt). */
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'title';
  /** Sort direction (default: desc). */
  readonly sortDirection?: 'asc' | 'desc';
  /** Limit results. */
  readonly limit?: number;
}

// =============================================================================
// Store
// =============================================================================

/**
 * In-memory session notes store.
 * Local-only — no network calls.
 */
class SessionNoteStore {
  private notes: Map<string, SessionNote> = new Map();
  private nextId = 1;

  /**
   * M377: Create a new session note.
   */
  create(
    projectId: string,
    content: string,
    opts: CreateNoteOptions = {},
  ): SessionNote {
    const noteId = `note_${this.nextId++}_${Date.now()}`;
    const now = new Date().toISOString();
    const note: SessionNote = {
      noteId,
      projectId,
      title: opts.title ?? '',
      content,
      tags: opts.tags ?? [],
      pinned: opts.pinned ?? false,
      boardContext: opts.boardContext ?? null,
      deckContext: opts.deckContext ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(noteId, note);
    return note;
  }

  /**
   * Get a note by ID.
   */
  get(noteId: string): SessionNote | null {
    return this.notes.get(noteId) ?? null;
  }

  /**
   * Update note content and/or metadata.
   */
  update(
    noteId: string,
    updates: Partial<Pick<SessionNote, 'title' | 'content' | 'tags' | 'pinned'>>,
  ): SessionNote | null {
    const existing = this.notes.get(noteId);
    if (!existing) return null;

    const updated: SessionNote = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.notes.set(noteId, updated);
    return updated;
  }

  /**
   * Delete a note.
   */
  delete(noteId: string): boolean {
    return this.notes.delete(noteId);
  }

  /**
   * M379: Get all notes for a project, pinned first then by updated date.
   */
  getByProject(projectId: string): SessionNote[] {
    return [...this.notes.values()]
      .filter(n => n.projectId === projectId)
      .sort((a, b) => {
        // Pinned first
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        // Then by updatedAt descending
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  /**
   * M380: Search notes across all projects.
   */
  search(criteria?: NoteSearchCriteria): SessionNote[] {
    let results = [...this.notes.values()];

    if (criteria) {
      if (criteria.projectId) {
        results = results.filter(n => n.projectId === criteria.projectId);
      }
      if (criteria.tags && criteria.tags.length > 0) {
        const requiredTags = new Set(criteria.tags.map(t => t.toLowerCase()));
        results = results.filter(n =>
          n.tags.some(tag => requiredTags.has(tag.toLowerCase()))
        );
      }
      if (criteria.pinnedOnly) {
        results = results.filter(n => n.pinned);
      }
      if (criteria.boardContext) {
        results = results.filter(n => n.boardContext === criteria.boardContext);
      }
      if (criteria.query) {
        const q = criteria.query.toLowerCase();
        results = results.filter(
          n =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.tags.some(tag => tag.toLowerCase().includes(q))
        );
      }

      // Sort
      const sortBy = criteria.sortBy ?? 'updatedAt';
      const sortDir = criteria.sortDirection ?? 'desc';
      const mult = sortDir === 'asc' ? 1 : -1;

      results.sort((a, b) => {
        // Always put pinned first
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        switch (sortBy) {
          case 'title':
            return mult * a.title.localeCompare(b.title);
          case 'createdAt':
            return mult * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          case 'updatedAt':
            return mult * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
          default:
            return 0;
        }
      });

      if (criteria.limit && criteria.limit > 0) {
        results = results.slice(0, criteria.limit);
      }
    }

    return results;
  }

  /**
   * Toggle pin status.
   */
  togglePin(noteId: string): boolean {
    const existing = this.notes.get(noteId);
    if (!existing) return false;
    this.update(noteId, { pinned: !existing.pinned });
    return true;
  }

  /**
   * Get all unique tags across all notes.
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    for (const n of this.notes.values()) {
      for (const tag of n.tags) tags.add(tag);
    }
    return [...tags].sort();
  }

  /**
   * Count notes for a project.
   */
  countByProject(projectId: string): number {
    let count = 0;
    for (const n of this.notes.values()) {
      if (n.projectId === projectId) count++;
    }
    return count;
  }

  /** Total note count. */
  count(): number {
    return this.notes.size;
  }

  /** Reset all notes (for testing). */
  reset(): void {
    this.notes.clear();
    this.nextId = 1;
  }

  /** Export all notes. */
  exportAll(): SessionNote[] {
    return [...this.notes.values()];
  }

  /** Import notes (additive, skip duplicates). */
  importAll(notes: SessionNote[]): number {
    let imported = 0;
    for (const n of notes) {
      if (!this.notes.has(n.noteId)) {
        this.notes.set(n.noteId, n);
        imported++;
      }
    }
    return imported;
  }
}

// =============================================================================
// Singleton & Public API
// =============================================================================

const noteStore = new SessionNoteStore();

/**
 * M377: Create a new session note for a project.
 */
export function createSessionNote(
  projectId: string,
  content: string,
  opts?: CreateNoteOptions,
): SessionNote {
  return noteStore.create(projectId, content, opts);
}

/**
 * Get a session note by ID.
 */
export function getSessionNote(noteId: string): SessionNote | null {
  return noteStore.get(noteId);
}

/**
 * Update a session note.
 */
export function updateSessionNote(
  noteId: string,
  updates: Partial<Pick<SessionNote, 'title' | 'content' | 'tags' | 'pinned'>>,
): SessionNote | null {
  return noteStore.update(noteId, updates);
}

/**
 * Delete a session note.
 */
export function deleteSessionNote(noteId: string): boolean {
  return noteStore.delete(noteId);
}

/**
 * M379: Get all notes for a project (pinned first, then by updated date).
 */
export function getProjectNotes(projectId: string): SessionNote[] {
  return noteStore.getByProject(projectId);
}

/**
 * M380: Search notes across all projects.
 */
export function searchSessionNotes(criteria?: NoteSearchCriteria): SessionNote[] {
  return noteStore.search(criteria);
}

/**
 * Toggle note pin status.
 */
export function toggleNotePin(noteId: string): boolean {
  return noteStore.togglePin(noteId);
}

/**
 * Get all unique tags across all session notes.
 */
export function getAllNoteTags(): string[] {
  return noteStore.getAllTags();
}

/**
 * Count notes for a project.
 */
export function countProjectNotes(projectId: string): number {
  return noteStore.countByProject(projectId);
}

/**
 * Get total note count.
 */
export function getSessionNoteCount(): number {
  return noteStore.count();
}

/**
 * Reset all session notes (for testing).
 */
export function resetSessionNotes(): void {
  noteStore.reset();
}

/**
 * Export all session notes.
 */
export function exportSessionNotes(): SessionNote[] {
  return noteStore.exportAll();
}

/**
 * Import session notes (additive, skip duplicates).
 */
export function importSessionNotes(notes: SessionNote[]): number {
  return noteStore.importAll(notes);
}
