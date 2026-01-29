/**
 * @fileoverview Project Metadata System
 *
 * M372: Add project metadata (genre, tempo, key, tags).
 * M373: Add project search and filtering.
 * M374: Add project favorites and collections.
 *
 * Provides a local-only, in-memory store for project metadata that enriches
 * project versions with musical context (genre, tempo, key, tags, etc.)
 * and enables search/filtering across projects.
 *
 * @module @cardplay/ai/learning/project-metadata
 */

// =============================================================================
// Types
// =============================================================================

/** Musical key specification. */
export interface MusicalKey {
  readonly root: string;   // e.g., 'C', 'F#', 'Bb'
  readonly mode: string;   // e.g., 'major', 'minor', 'dorian'
}

/** Time signature. */
export interface TimeSignature {
  readonly numerator: number;
  readonly denominator: number;
}

/** Project metadata describing musical and organisational properties. */
export interface ProjectMetadata {
  /** Unique project ID. */
  readonly projectId: string;

  /** Human-readable project name. */
  readonly name: string;

  /** Optional description / notes. */
  readonly description: string;

  /** Primary genre. */
  readonly genre: string;

  /** Optional sub-genre / style. */
  readonly subGenre: string;

  /** Tempo in BPM (null if not set). */
  readonly tempo: number | null;

  /** Musical key (null if not set). */
  readonly key: MusicalKey | null;

  /** Time signature (default 4/4). */
  readonly timeSignature: TimeSignature;

  /** Free-form tags for organisation. */
  readonly tags: readonly string[];

  /** User-assigned star rating (1-5, null if unrated). */
  readonly rating: number | null;

  /** Whether this project is a favorite. */
  readonly favorite: boolean;

  /** Optional collection name. */
  readonly collection: string | null;

  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;

  /** ISO-8601 last-modified timestamp. */
  readonly updatedAt: string;

  /** Board ID last used with this project. */
  readonly lastBoardId: string | null;

  /** Workspace template ID last used (if any). */
  readonly lastTemplateId: string | null;
}

/** Criteria for searching/filtering projects. */
export interface ProjectSearchCriteria {
  /** Free-text query matching name, description, tags, genre. */
  readonly query?: string;
  /** Filter by genre (exact match). */
  readonly genre?: string;
  /** Filter by tag (any match). */
  readonly tags?: readonly string[];
  /** Filter by minimum rating. */
  readonly minRating?: number;
  /** Filter favorites only. */
  readonly favoritesOnly?: boolean;
  /** Filter by collection name. */
  readonly collection?: string;
  /** Filter by tempo range. */
  readonly tempoRange?: { readonly min: number; readonly max: number };
  /** Filter by key root. */
  readonly keyRoot?: string;
  /** Filter by key mode. */
  readonly keyMode?: string;
  /** Sort order. */
  readonly sortBy?: 'name' | 'updatedAt' | 'createdAt' | 'rating' | 'tempo';
  /** Sort direction (default 'desc' for date fields, 'asc' for name). */
  readonly sortDirection?: 'asc' | 'desc';
}

/** Partial update to project metadata. */
export type ProjectMetadataUpdate = Partial<
  Pick<
    ProjectMetadata,
    | 'name' | 'description' | 'genre' | 'subGenre' | 'tempo'
    | 'key' | 'timeSignature' | 'tags' | 'rating' | 'favorite'
    | 'collection' | 'lastBoardId' | 'lastTemplateId'
  >
>;

// =============================================================================
// Store
// =============================================================================

/**
 * In-memory project metadata store.
 * Local-only — no network calls.
 */
class ProjectMetadataStore {
  private projects: Map<string, ProjectMetadata> = new Map();
  private nextId = 1;

  /**
   * M372: Create project metadata for a new project.
   */
  create(
    name: string,
    opts: ProjectMetadataUpdate = {},
  ): ProjectMetadata {
    const projectId = `proj_${this.nextId++}_${Date.now()}`;
    const now = new Date().toISOString();
    const metadata: ProjectMetadata = {
      projectId,
      name,
      description: opts.description ?? '',
      genre: opts.genre ?? '',
      subGenre: opts.subGenre ?? '',
      tempo: opts.tempo ?? null,
      key: opts.key ?? null,
      timeSignature: opts.timeSignature ?? { numerator: 4, denominator: 4 },
      tags: opts.tags ?? [],
      rating: opts.rating ?? null,
      favorite: opts.favorite ?? false,
      collection: opts.collection ?? null,
      createdAt: now,
      updatedAt: now,
      lastBoardId: opts.lastBoardId ?? null,
      lastTemplateId: opts.lastTemplateId ?? null,
    };
    this.projects.set(projectId, metadata);
    return metadata;
  }

  /**
   * Get project metadata by ID.
   */
  get(projectId: string): ProjectMetadata | null {
    return this.projects.get(projectId) ?? null;
  }

  /**
   * Update project metadata.
   */
  update(projectId: string, updates: ProjectMetadataUpdate): ProjectMetadata | null {
    const existing = this.projects.get(projectId);
    if (!existing) return null;

    const updated: ProjectMetadata = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(projectId, updated);
    return updated;
  }

  /**
   * Delete project metadata.
   */
  delete(projectId: string): boolean {
    return this.projects.delete(projectId);
  }

  /**
   * M373: Search and filter projects.
   */
  search(criteria?: ProjectSearchCriteria): ProjectMetadata[] {
    let results = [...this.projects.values()];

    if (criteria) {
      if (criteria.genre) {
        results = results.filter(p => p.genre.toLowerCase() === criteria.genre!.toLowerCase());
      }
      if (criteria.tags && criteria.tags.length > 0) {
        const requiredTags = new Set(criteria.tags.map(t => t.toLowerCase()));
        results = results.filter(p =>
          p.tags.some(tag => requiredTags.has(tag.toLowerCase()))
        );
      }
      if (criteria.minRating != null) {
        results = results.filter(p => p.rating != null && p.rating >= criteria.minRating!);
      }
      if (criteria.favoritesOnly) {
        results = results.filter(p => p.favorite);
      }
      if (criteria.collection) {
        results = results.filter(p => p.collection === criteria.collection);
      }
      if (criteria.tempoRange) {
        const { min, max } = criteria.tempoRange;
        results = results.filter(p => p.tempo != null && p.tempo >= min && p.tempo <= max);
      }
      if (criteria.keyRoot) {
        results = results.filter(
          p => p.key != null && p.key.root.toLowerCase() === criteria.keyRoot!.toLowerCase()
        );
      }
      if (criteria.keyMode) {
        results = results.filter(
          p => p.key != null && p.key.mode.toLowerCase() === criteria.keyMode!.toLowerCase()
        );
      }
      if (criteria.query) {
        const q = criteria.query.toLowerCase();
        results = results.filter(
          p =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.genre.toLowerCase().includes(q) ||
            p.subGenre.toLowerCase().includes(q) ||
            p.tags.some(tag => tag.toLowerCase().includes(q))
        );
      }

      // Sort
      const sortBy = criteria.sortBy ?? 'updatedAt';
      const sortDir = criteria.sortDirection ?? (sortBy === 'name' ? 'asc' : 'desc');
      const mult = sortDir === 'asc' ? 1 : -1;

      results.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return mult * a.name.localeCompare(b.name);
          case 'createdAt':
            return mult * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          case 'updatedAt':
            return mult * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
          case 'rating':
            return mult * ((a.rating ?? 0) - (b.rating ?? 0));
          case 'tempo':
            return mult * ((a.tempo ?? 0) - (b.tempo ?? 0));
          default:
            return 0;
        }
      });
    }

    return results;
  }

  /**
   * M374: Toggle favorite status.
   */
  toggleFavorite(projectId: string): boolean {
    const existing = this.projects.get(projectId);
    if (!existing) return false;
    this.update(projectId, { favorite: !existing.favorite });
    return true;
  }

  /**
   * M374: Get all unique collection names.
   */
  getCollections(): string[] {
    const collections = new Set<string>();
    for (const p of this.projects.values()) {
      if (p.collection) collections.add(p.collection);
    }
    return [...collections].sort();
  }

  /**
   * Get all unique genres.
   */
  getGenres(): string[] {
    const genres = new Set<string>();
    for (const p of this.projects.values()) {
      if (p.genre) genres.add(p.genre);
    }
    return [...genres].sort();
  }

  /**
   * Get all unique tags.
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    for (const p of this.projects.values()) {
      for (const tag of p.tags) tags.add(tag);
    }
    return [...tags].sort();
  }

  /** Count of projects. */
  count(): number {
    return this.projects.size;
  }

  /** Reset all data (for testing). */
  reset(): void {
    this.projects.clear();
    this.nextId = 1;
  }

  /** Export all metadata. */
  exportAll(): ProjectMetadata[] {
    return [...this.projects.values()];
  }

  /** Import metadata (additive, skip duplicates). */
  importAll(metadata: ProjectMetadata[]): number {
    let imported = 0;
    for (const m of metadata) {
      if (!this.projects.has(m.projectId)) {
        this.projects.set(m.projectId, m);
        imported++;
      }
    }
    return imported;
  }
}

// =============================================================================
// Singleton & Public API
// =============================================================================

const metadataStore = new ProjectMetadataStore();

/**
 * M372: Create project metadata for a new project.
 */
export function createProjectMetadata(
  name: string,
  opts?: ProjectMetadataUpdate,
): ProjectMetadata {
  return metadataStore.create(name, opts);
}

/**
 * Get project metadata by ID.
 */
export function getProjectMetadata(projectId: string): ProjectMetadata | null {
  return metadataStore.get(projectId);
}

/**
 * Update project metadata.
 */
export function updateProjectMetadata(
  projectId: string,
  updates: ProjectMetadataUpdate,
): ProjectMetadata | null {
  return metadataStore.update(projectId, updates);
}

/**
 * Delete project metadata.
 */
export function deleteProjectMetadata(projectId: string): boolean {
  return metadataStore.delete(projectId);
}

/**
 * M373: Search and filter projects by criteria.
 */
export function searchProjects(
  criteria?: ProjectSearchCriteria,
): ProjectMetadata[] {
  return metadataStore.search(criteria);
}

/**
 * M374: Toggle project favorite status.
 */
export function toggleProjectFavorite(projectId: string): boolean {
  return metadataStore.toggleFavorite(projectId);
}

/**
 * M374: Get all unique collection names.
 */
export function getProjectCollections(): string[] {
  return metadataStore.getCollections();
}

/**
 * Get all unique genres across projects.
 */
export function getProjectGenres(): string[] {
  return metadataStore.getGenres();
}

/**
 * Get all unique tags across projects.
 */
export function getAllProjectTags(): string[] {
  return metadataStore.getAllTags();
}

/**
 * Get the count of stored projects.
 */
export function getProjectMetadataCount(): number {
  return metadataStore.count();
}

/**
 * Reset all project metadata (for testing).
 */
export function resetProjectMetadata(): void {
  metadataStore.reset();
}

/**
 * Export all project metadata.
 */
export function exportProjectMetadata(): ProjectMetadata[] {
  return metadataStore.exportAll();
}

/**
 * Import project metadata (additive, skips duplicates).
 */
export function importProjectMetadata(metadata: ProjectMetadata[]): number {
  return metadataStore.importAll(metadata);
}
