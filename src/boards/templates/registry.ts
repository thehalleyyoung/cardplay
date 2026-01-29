/**
 * Template Registry
 *
 * Central registry for project templates. Manages template discovery,
 * loading, and filtering.
 */

import type {
  ProjectTemplate,
  TemplatePreview,
  TemplateSearchFilters,
  TemplateGenre,
  TemplateDifficulty,
} from './types';

/**
 * Template registry managing all available templates
 */
export class TemplateRegistry {
  private templates = new Map<string, ProjectTemplate>();

  /**
   * Register a template
   */
  register(template: ProjectTemplate): void {
    if (this.templates.has(template.metadata.id)) {
      console.warn(
        `Template ${template.metadata.id} already registered, replacing`
      );
    }
    this.templates.set(template.metadata.id, template);
  }

  /**
   * Get a specific template by ID
   */
  get(templateId: string): ProjectTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all registered templates
   */
  getAll(): readonly ProjectTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template previews (lightweight)
   */
  getPreviews(): readonly TemplatePreview[] {
    return Array.from(this.templates.values()).map((template) => ({
      metadata: template.metadata,
      streamCount: template.streams.length,
      clipCount: template.clips.length,
      boardId: template.board.boardId,
    }));
  }

  /**
   * Search templates with filters
   */
  search(filters: TemplateSearchFilters): readonly TemplatePreview[] {
    let results = this.getPreviews();

    // Filter by genre
    if (filters.genre) {
      results = results.filter((t) => t.metadata.genre === filters.genre);
    }

    // Filter by difficulty
    if (filters.difficulty) {
      results = results.filter(
        (t) => t.metadata.difficulty === filters.difficulty
      );
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((t) =>
        filters.tags!.some((tag) => t.metadata.tags.includes(tag))
      );
    }

    // Filter by search text
    if (filters.searchText) {
      const lowerSearch = filters.searchText.toLowerCase();
      results = results.filter(
        (t) =>
          t.metadata.name.toLowerCase().includes(lowerSearch) ||
          t.metadata.description.toLowerCase().includes(lowerSearch) ||
          t.metadata.tags.some((tag) => tag.toLowerCase().includes(lowerSearch))
      );
    }

    return results;
  }

  /**
   * Get templates by genre
   */
  getByGenre(genre: TemplateGenre): readonly TemplatePreview[] {
    return this.search({ genre });
  }

  /**
   * Get templates by difficulty
   */
  getByDifficulty(difficulty: TemplateDifficulty): readonly TemplatePreview[] {
    return this.search({ difficulty });
  }

  /**
   * Clear all templates
   */
  clear(): void {
    this.templates.clear();
  }
}

// Singleton instance
let templateRegistryInstance: TemplateRegistry | undefined;

/**
 * Get the global template registry instance
 */
export function getTemplateRegistry(): TemplateRegistry {
  if (!templateRegistryInstance) {
    templateRegistryInstance = new TemplateRegistry();
  }
  return templateRegistryInstance;
}

/**
 * Reset the global template registry (for testing)
 */
export function resetTemplateRegistry(): void {
  templateRegistryInstance = undefined;
}
