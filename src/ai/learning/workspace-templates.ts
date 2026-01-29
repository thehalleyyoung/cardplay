/**
 * @fileoverview Workspace Templates System
 *
 * M344: Workspace Templates — save, load, and share complete board+deck+routing configurations.
 * M345: Save current board + deck + routing as a reusable template.
 * M346: Load templates with optional parameter preset application.
 * M347: Ship default templates for common tasks (beat making, mixing, scoring, etc.).
 *
 * Local-only, in-memory store (no network calls).
 * Templates capture the full board configuration including deck layout, routing,
 * and optionally persisted deck settings so workspaces can be instantly recreated.
 *
 * @module @cardplay/ai/learning/workspace-templates
 */

import type {
  BoardId,
  BoardDeck,
  BoardConnection,
  BoardLayout,
  ControlLevel,
  DeckType,
} from '../../boards/types';

// =============================================================================
// Types
// =============================================================================

/** A saved workspace template capturing board + deck + routing configuration. */
export interface WorkspaceTemplate {
  readonly templateId: string;
  readonly name: string;
  readonly description: string;
  readonly category: WorkspaceTemplateCategory;
  readonly tags: readonly string[];

  /** The board this template was derived from (or a custom layout). */
  readonly baseBoardId: BoardId | null;

  /** Control level of the workspace. */
  readonly controlLevel: ControlLevel;

  /** Layout configuration. */
  readonly layout: BoardLayout;

  /** Deck configurations. */
  readonly decks: readonly BoardDeck[];

  /** Routing connections. */
  readonly connections: readonly BoardConnection[];

  /** Optional per-deck parameter presets (deck ID → settings snapshot). */
  readonly deckPresets: Readonly<Record<string, Record<string, unknown>>>;

  /** Who created this template. */
  readonly author: 'builtin' | 'user';

  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;

  /** ISO-8601 last-modified timestamp. */
  readonly updatedAt: string;
}

/** Categories for organising templates. */
export type WorkspaceTemplateCategory =
  | 'beat-making'
  | 'mixing'
  | 'mastering'
  | 'scoring'
  | 'sound-design'
  | 'live-performance'
  | 'recording'
  | 'general'
  | 'custom';

/** Options when loading/applying a template. */
export interface ApplyTemplateOptions {
  /** Whether to apply persisted deck presets (default: true). */
  readonly applyPresets?: boolean;
  /** Whether to apply routing connections (default: true). */
  readonly applyRouting?: boolean;
  /** Whether to reset existing deck state before applying (default: false). */
  readonly resetExistingState?: boolean;
}

/** Result of applying a template. */
export interface ApplyTemplateResult {
  readonly success: boolean;
  readonly templateId: string;
  readonly appliedDecks: readonly string[];
  readonly appliedConnections: number;
  readonly appliedPresets: number;
  readonly warnings: readonly string[];
}

/** Criteria for searching/filtering templates. */
export interface TemplateSearchCriteria {
  readonly query?: string;
  readonly category?: WorkspaceTemplateCategory;
  readonly tags?: readonly string[];
  readonly author?: 'builtin' | 'user' | 'all';
  readonly controlLevel?: ControlLevel;
  readonly hasDeckType?: DeckType;
}

// =============================================================================
// Store
// =============================================================================

/**
 * In-memory workspace template store.
 * Local-only — no network calls.
 */
class WorkspaceTemplateStore {
  private templates: Map<string, WorkspaceTemplate> = new Map();
  private nextId = 1;

  /**
   * M345: Save a workspace as a reusable template.
   */
  save(
    name: string,
    description: string,
    category: WorkspaceTemplateCategory,
    baseBoardId: BoardId | null,
    controlLevel: ControlLevel,
    layout: BoardLayout,
    decks: readonly BoardDeck[],
    connections: readonly BoardConnection[],
    deckPresets: Record<string, Record<string, unknown>> = {},
    tags: string[] = [],
  ): WorkspaceTemplate {
    const templateId = `wst_${this.nextId++}_${Date.now()}`;
    const now = new Date().toISOString();
    const template: WorkspaceTemplate = {
      templateId,
      name,
      description,
      category,
      tags,
      baseBoardId,
      controlLevel,
      layout: deepClone(layout),
      decks: deepClone(decks) as BoardDeck[],
      connections: deepClone(connections) as BoardConnection[],
      deckPresets: deepClone(deckPresets) as Record<string, Record<string, unknown>>,
      author: 'user',
      createdAt: now,
      updatedAt: now,
    };
    this.templates.set(templateId, template);
    return template;
  }

  /**
   * Register a builtin (shipped) template.
   */
  registerBuiltin(template: WorkspaceTemplate): void {
    this.templates.set(template.templateId, template);
  }

  /**
   * Get a template by ID.
   */
  get(templateId: string): WorkspaceTemplate | null {
    return this.templates.get(templateId) ?? null;
  }

  /**
   * List all templates, optionally filtered.
   */
  list(criteria?: TemplateSearchCriteria): WorkspaceTemplate[] {
    let results = [...this.templates.values()];

    if (criteria) {
      if (criteria.author && criteria.author !== 'all') {
        results = results.filter(t => t.author === criteria.author);
      }
      if (criteria.category) {
        results = results.filter(t => t.category === criteria.category);
      }
      if (criteria.controlLevel) {
        results = results.filter(t => t.controlLevel === criteria.controlLevel);
      }
      if (criteria.tags && criteria.tags.length > 0) {
        const requiredTags = new Set(criteria.tags);
        results = results.filter(t => t.tags.some(tag => requiredTags.has(tag)));
      }
      if (criteria.hasDeckType) {
        results = results.filter(t =>
          t.decks.some(d => d.type === criteria.hasDeckType)
        );
      }
      if (criteria.query) {
        const q = criteria.query.toLowerCase();
        results = results.filter(
          t =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q))
        );
      }
    }

    // Sort: builtins first, then by updated date descending.
    return results.sort((a, b) => {
      if (a.author !== b.author) return a.author === 'builtin' ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  /**
   * Delete a user template.
   * Builtin templates cannot be deleted.
   */
  delete(templateId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template || template.author === 'builtin') return false;
    return this.templates.delete(templateId);
  }

  /**
   * Update a user template's metadata.
   */
  update(
    templateId: string,
    updates: Partial<Pick<WorkspaceTemplate, 'name' | 'description' | 'category' | 'tags'>>,
  ): WorkspaceTemplate | null {
    const existing = this.templates.get(templateId);
    if (!existing || existing.author === 'builtin') return null;

    const updated: WorkspaceTemplate = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.templates.set(templateId, updated);
    return updated;
  }

  /**
   * M346: Apply a template, returning an action plan.
   */
  apply(
    templateId: string,
    options: ApplyTemplateOptions = {},
  ): ApplyTemplateResult | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const { applyPresets = true, applyRouting = true } = options;
    const warnings: string[] = [];

    const appliedDecks = template.decks.map(d => d.id);
    const appliedConnections = applyRouting ? template.connections.length : 0;
    const appliedPresets = applyPresets ? Object.keys(template.deckPresets).length : 0;

    if (!applyRouting && template.connections.length > 0) {
      warnings.push(`Skipped ${template.connections.length} routing connections`);
    }
    if (!applyPresets && Object.keys(template.deckPresets).length > 0) {
      warnings.push(`Skipped ${Object.keys(template.deckPresets).length} deck presets`);
    }

    return {
      success: true,
      templateId,
      appliedDecks,
      appliedConnections,
      appliedPresets,
      warnings,
    };
  }

  /** Get count of stored templates. */
  count(): number {
    return this.templates.size;
  }

  /** Clear all user templates (builtins preserved). */
  resetUserTemplates(): void {
    for (const [id, t] of this.templates) {
      if (t.author === 'user') {
        this.templates.delete(id);
      }
    }
  }

  /** Clear everything (including builtins — for testing). */
  resetAll(): void {
    this.templates.clear();
    this.nextId = 1;
  }

  /** Export all templates as JSON-serialisable data. */
  exportAll(): WorkspaceTemplate[] {
    return this.list();
  }

  /** Import templates (additive, skip duplicates by ID). */
  importTemplates(templates: WorkspaceTemplate[]): number {
    let imported = 0;
    for (const t of templates) {
      if (!this.templates.has(t.templateId)) {
        this.templates.set(t.templateId, t);
        imported++;
      }
    }
    return imported;
  }
}

// =============================================================================
// Builtin Templates (M347)
// =============================================================================

const BUILTIN_TEMPLATES: readonly WorkspaceTemplate[] = [
  makeBuiltinTemplate({
    templateId: 'builtin_beat_making',
    name: 'Beat Making',
    description: 'Session-focused layout for beat making with pattern editor, sample browser, and mixer.',
    category: 'beat-making',
    tags: ['hip-hop', 'electronic', 'drums', 'samples'],
    controlLevel: 'manual-with-hints',
    deckTypes: ['pattern-deck', 'samples-deck', 'mixer-deck', 'effects-deck'],
  }),
  makeBuiltinTemplate({
    templateId: 'builtin_mixing',
    name: 'Mixing Session',
    description: 'Mixer-focused layout with DSP chains, automation, and metering.',
    category: 'mixing',
    tags: ['mix', 'eq', 'compression', 'automation'],
    controlLevel: 'full-manual',
    deckTypes: ['mixer-deck', 'dsp-chain', 'automation-deck', 'properties-deck'],
  }),
  makeBuiltinTemplate({
    templateId: 'builtin_mastering',
    name: 'Mastering Suite',
    description: 'Mastering-oriented layout with master DSP chain and metering.',
    category: 'mastering',
    tags: ['master', 'loudness', 'limiting', 'eq'],
    controlLevel: 'full-manual',
    deckTypes: ['mixer-deck', 'dsp-chain', 'properties-deck'],
  }),
  makeBuiltinTemplate({
    templateId: 'builtin_scoring',
    name: 'Score Writing',
    description: 'Notation-focused layout for composing scores with instrument browser and properties.',
    category: 'scoring',
    tags: ['notation', 'orchestration', 'classical', 'film'],
    controlLevel: 'manual-with-hints',
    deckTypes: ['notation-deck', 'instruments-deck', 'properties-deck', 'harmony-deck'],
  }),
  makeBuiltinTemplate({
    templateId: 'builtin_sound_design',
    name: 'Sound Design Lab',
    description: 'Modular sound design layout with DSP chains, effects, and routing.',
    category: 'sound-design',
    tags: ['synthesis', 'effects', 'modular', 'patches'],
    controlLevel: 'full-manual',
    deckTypes: ['dsp-chain', 'effects-deck', 'routing-deck', 'properties-deck'],
  }),
  makeBuiltinTemplate({
    templateId: 'builtin_live_performance',
    name: 'Live Performance',
    description: 'Session grid layout optimised for live triggering and performance.',
    category: 'live-performance',
    tags: ['live', 'performance', 'clips', 'scenes'],
    controlLevel: 'full-manual',
    deckTypes: ['session-deck', 'mixer-deck', 'effects-deck'],
  }),
  makeBuiltinTemplate({
    templateId: 'builtin_ai_composer',
    name: 'AI Composer',
    description: 'Generative composition layout with AI advisor, generators, and harmony explorer.',
    category: 'general',
    tags: ['ai', 'generative', 'composition', 'harmony'],
    controlLevel: 'collaborative',
    deckTypes: ['ai-advisor-deck', 'generators-deck', 'harmony-deck', 'arrangement-deck'],
  }),
  makeBuiltinTemplate({
    templateId: 'builtin_tracker_classic',
    name: 'Classic Tracker',
    description: 'Traditional tracker layout with pattern editor and sample browser.',
    category: 'beat-making',
    tags: ['tracker', 'chiptune', 'retro', 'patterns'],
    controlLevel: 'full-manual',
    deckTypes: ['pattern-deck', 'samples-deck', 'effects-deck', 'properties-deck'],
  }),
];

/** Helper to construct a builtin template with sane defaults. */
function makeBuiltinTemplate(opts: {
  templateId: string;
  name: string;
  description: string;
  category: WorkspaceTemplateCategory;
  tags: string[];
  controlLevel: ControlLevel;
  deckTypes: DeckType[];
}): WorkspaceTemplate {
  const now = new Date().toISOString();
  return {
    templateId: opts.templateId,
    name: opts.name,
    description: opts.description,
    category: opts.category,
    tags: opts.tags,
    baseBoardId: null,
    controlLevel: opts.controlLevel,
    layout: { type: 'dock', panels: [] },
    decks: opts.deckTypes.map((type, i) => ({
      id: `${opts.templateId}_deck_${i}`,
      type,
      cardLayout: 'stack' as const,
      allowReordering: true,
      allowDragOut: true,
    })),
    connections: [],
    deckPresets: {},
    author: 'builtin',
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// Deep Clone Utility
// =============================================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// =============================================================================
// Singleton & Public API
// =============================================================================

const templateStore = new WorkspaceTemplateStore();

// Register builtins on module load.
for (const t of BUILTIN_TEMPLATES) {
  templateStore.registerBuiltin(t);
}

/**
 * M345: Save the current workspace (board + decks + routing) as a reusable template.
 */
export function saveWorkspaceTemplate(
  name: string,
  description: string,
  category: WorkspaceTemplateCategory,
  baseBoardId: BoardId | null,
  controlLevel: ControlLevel,
  layout: BoardLayout,
  decks: readonly BoardDeck[],
  connections: readonly BoardConnection[],
  deckPresets?: Record<string, Record<string, unknown>>,
  tags?: string[],
): WorkspaceTemplate {
  return templateStore.save(
    name, description, category, baseBoardId, controlLevel,
    layout, decks, connections, deckPresets ?? {}, tags ?? [],
  );
}

/**
 * Get a workspace template by ID.
 */
export function getWorkspaceTemplate(templateId: string): WorkspaceTemplate | null {
  return templateStore.get(templateId);
}

/**
 * List workspace templates, optionally filtered.
 */
export function listWorkspaceTemplates(
  criteria?: TemplateSearchCriteria,
): WorkspaceTemplate[] {
  return templateStore.list(criteria);
}

/**
 * M346: Apply a workspace template, returning an action plan.
 */
export function applyWorkspaceTemplate(
  templateId: string,
  options?: ApplyTemplateOptions,
): ApplyTemplateResult | null {
  return templateStore.apply(templateId, options);
}

/**
 * Delete a user-created workspace template (builtins cannot be deleted).
 */
export function deleteWorkspaceTemplate(templateId: string): boolean {
  return templateStore.delete(templateId);
}

/**
 * Update a user-created workspace template's metadata.
 */
export function updateWorkspaceTemplate(
  templateId: string,
  updates: Partial<Pick<WorkspaceTemplate, 'name' | 'description' | 'category' | 'tags'>>,
): WorkspaceTemplate | null {
  return templateStore.update(templateId, updates);
}

/**
 * Get the count of stored templates.
 */
export function getWorkspaceTemplateCount(): number {
  return templateStore.count();
}

/**
 * Reset all user-created templates (builtins preserved).
 */
export function resetUserWorkspaceTemplates(): void {
  templateStore.resetUserTemplates();
}

/**
 * Reset everything including builtins (for testing).
 */
export function resetAllWorkspaceTemplates(): void {
  templateStore.resetAll();
  // Re-register builtins.
  for (const t of BUILTIN_TEMPLATES) {
    templateStore.registerBuiltin(t);
  }
}

/**
 * Export all workspace templates as JSON-serialisable data.
 */
export function exportWorkspaceTemplates(): WorkspaceTemplate[] {
  return templateStore.exportAll();
}

/**
 * Import previously exported workspace templates (additive).
 */
export function importWorkspaceTemplates(templates: WorkspaceTemplate[]): number {
  return templateStore.importTemplates(templates);
}

/**
 * M347: Get all builtin (shipped) template IDs.
 */
export function getBuiltinTemplateIds(): readonly string[] {
  return BUILTIN_TEMPLATES.map(t => t.templateId);
}
