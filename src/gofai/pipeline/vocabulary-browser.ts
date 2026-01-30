/**
 * GOFAI Pipeline — Vocabulary Browser UI
 *
 * Designs a UI panel that lists all known terms and their meanings,
 * organized by vocabulary category with search, filtering, and
 * extension namespace support.
 *
 * ## Purpose
 *
 * The vocabulary browser answers the question: "What words does the
 * system understand?" It provides:
 *
 * 1. **Discovery** — Users can browse all recognized terms
 * 2. **Exploration** — Click a term to see its meaning, synonyms, examples
 * 3. **Extension visibility** — Extension-added terms are namespaced and
 *    visually distinguished from core vocabulary
 * 4. **Search** — Full-text search across all vocabulary tables
 * 5. **Categorization** — Terms grouped by domain (axes, sections, layers, etc.)
 *
 * ## Panel Layout
 *
 * ```
 * ┌──────────────────────────────────────────────────┐
 * │ Vocabulary Browser                         [×]   │
 * ├──────────────────────────────────────────────────┤
 * │ 🔍 [Search terms...]                  [Filters ▾]│
 * │                                                  │
 * │ ┌─ Categories ─┐ ┌─ Term Detail ──────────────┐ │
 * │ │ ▸ Axes (28)  │ │ "brighter"                 │ │
 * │ │ ▾ Sections   │ │ Category: Perceptual Axis  │ │
 * │ │   verse      │ │ Canonical: brightness       │ │
 * │ │   chorus ←   │ │ Direction: increase          │ │
 * │ │   bridge     │ │ Synonyms: shinier, more     │ │
 * │ │   intro      │ │   sparkle, lighter          │ │
 * │ │   outro      │ │ Antonym: darker              │ │
 * │ │   ...        │ │ Examples:                    │ │
 * │ │ ▸ Layers(12) │ │   "make it brighter"        │ │
 * │ │ ▸ Actions    │ │   "brighten the chorus"     │ │
 * │ │ ▸ Nouns      │ │ Source: core/canon           │ │
 * │ │ ▸ Units      │ │ ─────────────────────────── │ │
 * │ │ ▸ Extensions │ │ Related:                     │ │
 * │ │   ▸ ext/jazz │ │   warmth, shimmer, presence │ │
 * │ │   ▸ ext/edm  │ │                             │ │
 * │ └─────────────┘ └─────────────────────────────┘ │
 * │                                                  │
 * │ 347 terms • 12 categories • 3 extensions         │
 * └──────────────────────────────────────────────────┘
 * ```
 *
 * @module gofai/pipeline/vocabulary-browser
 * @see gofai_goalA.md Step 097
 */

// =============================================================================
// VOCABULARY ENTRY — a single term in the browser
// =============================================================================

/**
 * A vocabulary entry displayed in the browser.
 */
export interface VocabularyEntry {
  /** Unique ID */
  readonly id: string;

  /** The canonical term */
  readonly term: string;

  /** Category this term belongs to */
  readonly category: VocabularyCategory;

  /** Sub-category (if any) */
  readonly subcategory?: string;

  /** Human-readable definition */
  readonly definition: string;

  /** Known synonyms */
  readonly synonyms: readonly string[];

  /** Known antonyms (if applicable) */
  readonly antonyms: readonly string[];

  /** Example usages in natural language */
  readonly examples: readonly string[];

  /** Related terms */
  readonly relatedTerms: readonly string[];

  /** Source: core canon or extension namespace */
  readonly source: VocabularySource;

  /** Additional metadata specific to the category */
  readonly metadata: VocabularyMetadata;

  /** Whether this term is deprecated */
  readonly deprecated: boolean;

  /** Tags for filtering */
  readonly tags: readonly string[];
}

/**
 * Categories of vocabulary.
 */
export type VocabularyCategory =
  | 'perceptual_axis'   // brightness, energy, tension, etc.
  | 'section'           // verse, chorus, bridge, etc.
  | 'layer'             // drums, bass, lead, etc.
  | 'edit_action'       // boost, cut, add, remove, etc.
  | 'constraint'        // preserve, only_change, etc.
  | 'unit'              // bars, beats, semitones, etc.
  | 'degree'            // a little, a lot, slightly, etc.
  | 'domain_noun'       // chord, melody, groove, etc.
  | 'temporal'          // now, then, before, after, etc.
  | 'demonstrative'     // this, that, these, those
  | 'conjunction'       // and, but, or, then
  | 'modifier'          // more, less, very, slightly
  | 'instrument'        // piano, guitar, synth, etc.
  | 'genre'             // jazz, electronic, classical, etc.
  | 'effect'            // reverb, delay, compression, etc.
  | 'structure'         // phrase, motif, theme, etc.
  | 'extension';        // Terms from extension namespaces

/**
 * Source of a vocabulary entry.
 */
export type VocabularySource =
  | CoreSource
  | ExtensionSource;

export interface CoreSource {
  readonly type: 'core';
  /** Which canon module defines this term */
  readonly module: string;
  /** The canon table name */
  readonly table: string;
}

export interface ExtensionSource {
  readonly type: 'extension';
  /** The extension namespace */
  readonly namespace: string;
  /** The extension display name */
  readonly extensionName: string;
  /** The extension version */
  readonly version: string;
}

/**
 * Additional metadata for vocabulary entries, varying by category.
 */
export type VocabularyMetadata =
  | AxisMetadata
  | SectionMetadata
  | LayerMetadata
  | ActionMetadata
  | UnitMetadata
  | NounMetadata
  | GenericMetadata;

export interface AxisMetadata {
  readonly type: 'axis';
  readonly axisId: string;
  readonly range: { readonly min: number; readonly max: number };
  readonly defaultValue: number;
  readonly musicalDimensions: readonly string[];
}

export interface SectionMetadata {
  readonly type: 'section';
  readonly sectionId: string;
  readonly typicalPosition: string;
  readonly typicalLength: string;
}

export interface LayerMetadata {
  readonly type: 'layer';
  readonly layerId: string;
  readonly instrumentFamily: string;
  readonly typicalRole: string;
}

export interface ActionMetadata {
  readonly type: 'action';
  readonly opcodeId: string;
  readonly effectCategory: string;
  readonly reversible: boolean;
}

export interface UnitMetadata {
  readonly type: 'unit';
  readonly unitId: string;
  readonly dimension: string;
  readonly isMusical: boolean;
}

export interface NounMetadata {
  readonly type: 'noun';
  readonly nounId: string;
  readonly tradition: string;
  readonly nounCategory: string;
}

export interface GenericMetadata {
  readonly type: 'generic';
  readonly properties: Readonly<Record<string, string>>;
}

// =============================================================================
// VOCABULARY CATEGORY UI — category panel in the sidebar
// =============================================================================

/**
 * A category in the vocabulary browser sidebar.
 */
export interface VocabularyCategoryNode {
  /** Category key */
  readonly category: VocabularyCategory;

  /** Display name */
  readonly displayName: string;

  /** Number of terms in this category */
  readonly count: number;

  /** Whether this category is currently expanded */
  readonly expanded: boolean;

  /** Sub-categories (if any) */
  readonly subcategories: readonly VocabularySubcategoryNode[];

  /** Icon (emoji or icon name) */
  readonly icon: string;

  /** Sort order */
  readonly sortOrder: number;
}

export interface VocabularySubcategoryNode {
  readonly name: string;
  readonly count: number;
  readonly expanded: boolean;
}

/**
 * Canonical category display configuration.
 */
export const VOCABULARY_CATEGORY_CONFIG: readonly VocabularyCategoryDisplay[] = [
  {
    category: 'perceptual_axis',
    displayName: 'Perceptual Axes',
    icon: 'slider',
    description: 'Brightness, energy, tension, and other perceptual dimensions.',
    sortOrder: 1,
  },
  {
    category: 'section',
    displayName: 'Song Sections',
    icon: 'layout',
    description: 'Verse, chorus, bridge, intro, outro, and other structural sections.',
    sortOrder: 2,
  },
  {
    category: 'layer',
    displayName: 'Layers / Tracks',
    icon: 'layers',
    description: 'Drums, bass, lead, pad, and other track/layer types.',
    sortOrder: 3,
  },
  {
    category: 'edit_action',
    displayName: 'Edit Actions',
    icon: 'edit',
    description: 'Boost, cut, add, remove, transpose, and other operations.',
    sortOrder: 4,
  },
  {
    category: 'constraint',
    displayName: 'Constraints',
    icon: 'lock',
    description: 'Preserve, only_change, and other constraint types.',
    sortOrder: 5,
  },
  {
    category: 'unit',
    displayName: 'Units',
    icon: 'ruler',
    description: 'Bars, beats, semitones, dB, BPM, and other measurement units.',
    sortOrder: 6,
  },
  {
    category: 'degree',
    displayName: 'Degree Words',
    icon: 'gauge',
    description: 'A little, a lot, slightly, much, somewhat — scalar modifiers.',
    sortOrder: 7,
  },
  {
    category: 'domain_noun',
    displayName: 'Musical Terms',
    icon: 'music',
    description: 'Chord, melody, groove, timbre, and other domain nouns.',
    sortOrder: 8,
  },
  {
    category: 'temporal',
    displayName: 'Temporal Words',
    icon: 'clock',
    description: 'Now, then, before, after, first, next — time references.',
    sortOrder: 9,
  },
  {
    category: 'demonstrative',
    displayName: 'Demonstratives',
    icon: 'pointer',
    description: 'This, that, these, those — reference expressions.',
    sortOrder: 10,
  },
  {
    category: 'conjunction',
    displayName: 'Conjunctions',
    icon: 'link',
    description: 'And, but, or, then — coordination words.',
    sortOrder: 11,
  },
  {
    category: 'modifier',
    displayName: 'Modifiers',
    icon: 'tune',
    description: 'More, less, very, slightly, much — intensity modifiers.',
    sortOrder: 12,
  },
  {
    category: 'instrument',
    displayName: 'Instruments',
    icon: 'instrument',
    description: 'Piano, guitar, synth, drums — instrument names.',
    sortOrder: 13,
  },
  {
    category: 'genre',
    displayName: 'Genres / Styles',
    icon: 'genre',
    description: 'Jazz, electronic, classical, hip-hop — genre vocabulary.',
    sortOrder: 14,
  },
  {
    category: 'effect',
    displayName: 'Effects',
    icon: 'effect',
    description: 'Reverb, delay, compression, EQ — audio effects.',
    sortOrder: 15,
  },
  {
    category: 'structure',
    displayName: 'Musical Structures',
    icon: 'structure',
    description: 'Phrase, motif, theme, progression — structural concepts.',
    sortOrder: 16,
  },
  {
    category: 'extension',
    displayName: 'Extensions',
    icon: 'plugin',
    description: 'Terms added by extension packages.',
    sortOrder: 17,
  },
];

export interface VocabularyCategoryDisplay {
  readonly category: VocabularyCategory;
  readonly displayName: string;
  readonly icon: string;
  readonly description: string;
  readonly sortOrder: number;
}

// =============================================================================
// EXTENSION NAMESPACE — terms from extensions
// =============================================================================

/**
 * An extension namespace in the vocabulary browser.
 */
export interface ExtensionNamespace {
  /** The namespace identifier (e.g., "ext/jazz", "ext/edm") */
  readonly namespace: string;

  /** Display name */
  readonly displayName: string;

  /** Extension version */
  readonly version: string;

  /** Description */
  readonly description: string;

  /** Number of terms contributed */
  readonly termCount: number;

  /** Categories the extension contributes to */
  readonly categories: readonly VocabularyCategory[];

  /** Whether the extension is active */
  readonly active: boolean;

  /** Extension author */
  readonly author: string;
}

// =============================================================================
// SEARCH AND FILTERING
// =============================================================================

/**
 * Search query for the vocabulary browser.
 */
export interface VocabularySearchQuery {
  /** Free-text search term */
  readonly searchText: string;

  /** Category filter (show only these categories) */
  readonly categoryFilter: readonly VocabularyCategory[];

  /** Source filter (core, extension, or specific namespace) */
  readonly sourceFilter: VocabularySourceFilter;

  /** Tag filter */
  readonly tagFilter: readonly string[];

  /** Whether to include deprecated terms */
  readonly includeDeprecated: boolean;

  /** Sort order */
  readonly sortBy: VocabularySortKey;

  /** Sort direction */
  readonly sortDirection: 'asc' | 'desc';

  /** Pagination offset */
  readonly offset: number;

  /** Page size */
  readonly limit: number;
}

export type VocabularySourceFilter =
  | 'all'                 // Show everything
  | 'core_only'           // Only core canon terms
  | 'extensions_only'     // Only extension terms
  | { readonly namespace: string };  // Specific extension namespace

export type VocabularySortKey =
  | 'term'        // Alphabetical by term
  | 'category'    // Grouped by category
  | 'source'      // Grouped by source
  | 'relevance';  // By search relevance

/**
 * Search result from the vocabulary browser.
 */
export interface VocabularySearchResult {
  /** The matching entries */
  readonly entries: readonly VocabularyEntry[];

  /** Total matches (for pagination) */
  readonly totalMatches: number;

  /** The query that produced this result */
  readonly query: VocabularySearchQuery;

  /** Facets for filtering */
  readonly facets: VocabularyFacets;

  /** Time taken for the search */
  readonly searchTimeMs: number;
}

/**
 * Facet counts for filtering.
 */
export interface VocabularyFacets {
  readonly byCategory: Readonly<Record<string, number>>;
  readonly bySource: Readonly<Record<string, number>>;
  readonly byTag: Readonly<Record<string, number>>;
}

/**
 * Default search query.
 */
export const DEFAULT_SEARCH_QUERY: VocabularySearchQuery = {
  searchText: '',
  categoryFilter: [],
  sourceFilter: 'all',
  tagFilter: [],
  includeDeprecated: false,
  sortBy: 'category',
  sortDirection: 'asc',
  offset: 0,
  limit: 50,
};

// =============================================================================
// VOCABULARY BROWSER PANEL — UI configuration
// =============================================================================

/**
 * Configuration for the vocabulary browser panel.
 */
export interface VocabularyBrowserConfig {
  /** Whether the panel is enabled */
  readonly enabled: boolean;

  /** Position */
  readonly position: VocabBrowserPosition;

  /** Whether to show the category sidebar */
  readonly showCategorySidebar: boolean;

  /** Whether to show the detail panel */
  readonly showDetailPanel: boolean;

  /** Whether to show related terms */
  readonly showRelatedTerms: boolean;

  /** Whether to show extension namespaces */
  readonly showExtensions: boolean;

  /** Whether to show example usages */
  readonly showExamples: boolean;

  /** Whether to show synonym count badges */
  readonly showSynonymBadges: boolean;

  /** Maximum examples to show per term */
  readonly maxExamples: number;

  /** Whether to highlight new/recently added terms */
  readonly highlightNew: boolean;

  /** Number of recent terms to highlight */
  readonly recentDays: number;
}

export type VocabBrowserPosition =
  | 'modal'    // Full modal dialog
  | 'panel'    // Side panel
  | 'drawer'   // Bottom drawer
  | 'popup';   // Popup window

/**
 * Default vocabulary browser configuration.
 */
export const DEFAULT_VOCABULARY_BROWSER_CONFIG: VocabularyBrowserConfig = {
  enabled: true,
  position: 'panel',
  showCategorySidebar: true,
  showDetailPanel: true,
  showRelatedTerms: true,
  showExtensions: true,
  showExamples: true,
  showSynonymBadges: true,
  maxExamples: 5,
  highlightNew: true,
  recentDays: 7,
};

// =============================================================================
// VOCABULARY BROWSER STATE — runtime state
// =============================================================================

/**
 * Runtime state of the vocabulary browser.
 */
export interface VocabularyBrowserState {
  /** Whether the browser is open */
  readonly open: boolean;

  /** Current search query */
  readonly query: VocabularySearchQuery;

  /** Current search results */
  readonly results: VocabularySearchResult | null;

  /** Currently selected entry (for detail view) */
  readonly selectedEntryId: string | null;

  /** Category tree state (expansion) */
  readonly categoryTree: readonly VocabularyCategoryNode[];

  /** Known extension namespaces */
  readonly extensions: readonly ExtensionNamespace[];

  /** Total vocabulary size */
  readonly totalTerms: number;

  /** Recent searches */
  readonly recentSearches: readonly string[];
}

// =============================================================================
// VOCABULARY BROWSER ACTIONS
// =============================================================================

/**
 * Actions the user can take in the vocabulary browser.
 */
export type VocabularyBrowserAction =
  | OpenBrowserAction
  | CloseBrowserAction
  | SearchAction
  | SelectEntryAction
  | ExpandCategoryAction
  | CollapseCategoryAction
  | FilterByCategoryAction
  | FilterBySourceAction
  | ClearFiltersAction
  | SortByAction
  | NextPageAction
  | PreviousPageAction
  | InsertTermAction
  | CopyTermAction
  | ShowSynonymsAction;

export interface OpenBrowserAction {
  readonly type: 'open_browser';
}

export interface CloseBrowserAction {
  readonly type: 'close_browser';
}

export interface SearchAction {
  readonly type: 'search';
  readonly searchText: string;
}

export interface SelectEntryAction {
  readonly type: 'select_entry';
  readonly entryId: string;
}

export interface ExpandCategoryAction {
  readonly type: 'expand_category';
  readonly category: VocabularyCategory;
}

export interface CollapseCategoryAction {
  readonly type: 'collapse_category';
  readonly category: VocabularyCategory;
}

export interface FilterByCategoryAction {
  readonly type: 'filter_by_category';
  readonly categories: readonly VocabularyCategory[];
}

export interface FilterBySourceAction {
  readonly type: 'filter_by_source';
  readonly source: VocabularySourceFilter;
}

export interface ClearFiltersAction {
  readonly type: 'clear_filters';
}

export interface SortByAction {
  readonly type: 'sort_by';
  readonly key: VocabularySortKey;
}

export interface NextPageAction {
  readonly type: 'next_page';
}

export interface PreviousPageAction {
  readonly type: 'previous_page';
}

export interface InsertTermAction {
  readonly type: 'insert_term';
  readonly entryId: string;
}

export interface CopyTermAction {
  readonly type: 'copy_term';
  readonly entryId: string;
  readonly format: 'text' | 'json';
}

export interface ShowSynonymsAction {
  readonly type: 'show_synonyms';
  readonly entryId: string;
}

/**
 * Result of a vocabulary browser action.
 */
export interface VocabularyBrowserActionResult {
  readonly action: VocabularyBrowserAction;
  readonly success: boolean;
  readonly newState: VocabularyBrowserState;
  readonly message?: string;
}

// =============================================================================
// SEARCH IMPLEMENTATION
// =============================================================================

/**
 * Search the vocabulary entries.
 * Uses simple substring and synonym matching for deterministic results.
 */
export function searchVocabulary(
  entries: readonly VocabularyEntry[],
  query: VocabularySearchQuery,
): VocabularySearchResult {
  const startTime = Date.now();

  let filtered = [...entries];

  // Category filter
  if (query.categoryFilter.length > 0) {
    filtered = filtered.filter(e => query.categoryFilter.includes(e.category));
  }

  // Source filter
  if (query.sourceFilter !== 'all') {
    if (query.sourceFilter === 'core_only') {
      filtered = filtered.filter(e => e.source.type === 'core');
    } else if (query.sourceFilter === 'extensions_only') {
      filtered = filtered.filter(e => e.source.type === 'extension');
    } else {
      const ns = query.sourceFilter.namespace;
      filtered = filtered.filter(
        e => e.source.type === 'extension' && e.source.namespace === ns,
      );
    }
  }

  // Tag filter
  if (query.tagFilter.length > 0) {
    filtered = filtered.filter(e =>
      query.tagFilter.some(tag => e.tags.includes(tag)),
    );
  }

  // Deprecated filter
  if (!query.includeDeprecated) {
    filtered = filtered.filter(e => !e.deprecated);
  }

  // Text search
  if (query.searchText.length > 0) {
    const lower = query.searchText.toLowerCase();
    filtered = filtered.filter(e =>
      e.term.toLowerCase().includes(lower) ||
      e.definition.toLowerCase().includes(lower) ||
      e.synonyms.some(s => s.toLowerCase().includes(lower)) ||
      e.tags.some(t => t.toLowerCase().includes(lower)),
    );
  }

  // Sort
  filtered.sort((a, b) => {
    let cmp = 0;
    switch (query.sortBy) {
      case 'term':
        cmp = a.term.localeCompare(b.term);
        break;
      case 'category':
        cmp = a.category.localeCompare(b.category) || a.term.localeCompare(b.term);
        break;
      case 'source':
        cmp = a.source.type.localeCompare(b.source.type) || a.term.localeCompare(b.term);
        break;
      case 'relevance': {
        // Simple relevance: exact match > prefix match > contains
        const q = query.searchText.toLowerCase();
        const aExact = a.term.toLowerCase() === q ? 3 : 0;
        const bExact = b.term.toLowerCase() === q ? 3 : 0;
        const aPrefix = a.term.toLowerCase().startsWith(q) ? 2 : 0;
        const bPrefix = b.term.toLowerCase().startsWith(q) ? 2 : 0;
        const aContains = a.term.toLowerCase().includes(q) ? 1 : 0;
        const bContains = b.term.toLowerCase().includes(q) ? 1 : 0;
        cmp = (bExact + bPrefix + bContains) - (aExact + aPrefix + aContains);
        break;
      }
    }
    return query.sortDirection === 'desc' ? -cmp : cmp;
  });

  const totalMatches = filtered.length;

  // Pagination
  const paged = filtered.slice(query.offset, query.offset + query.limit);

  // Compute facets
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byTag: Record<string, number> = {};

  for (const e of filtered) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
    const sourceKey = e.source.type === 'core' ? 'core' : e.source.namespace;
    bySource[sourceKey] = (bySource[sourceKey] ?? 0) + 1;
    for (const t of e.tags) {
      byTag[t] = (byTag[t] ?? 0) + 1;
    }
  }

  return {
    entries: paged,
    totalMatches,
    query,
    facets: { byCategory, bySource, byTag },
    searchTimeMs: Date.now() - startTime,
  };
}

// =============================================================================
// FORMATTING AND DISPLAY
// =============================================================================

/**
 * Format a vocabulary entry for display.
 */
export function formatVocabularyEntry(entry: VocabularyEntry): string {
  const lines: string[] = [];
  lines.push(`${entry.term}`);
  lines.push(`  Category: ${entry.category}`);
  lines.push(`  Definition: ${entry.definition}`);

  if (entry.synonyms.length > 0) {
    lines.push(`  Synonyms: ${entry.synonyms.join(', ')}`);
  }
  if (entry.antonyms.length > 0) {
    lines.push(`  Antonyms: ${entry.antonyms.join(', ')}`);
  }
  if (entry.examples.length > 0) {
    lines.push(`  Examples:`);
    for (const ex of entry.examples.slice(0, 3)) {
      lines.push(`    "${ex}"`);
    }
  }

  const sourceLabel = entry.source.type === 'core'
    ? `core/${entry.source.module}`
    : `ext/${entry.source.namespace}`;
  lines.push(`  Source: ${sourceLabel}`);

  if (entry.relatedTerms.length > 0) {
    lines.push(`  Related: ${entry.relatedTerms.join(', ')}`);
  }

  if (entry.deprecated) {
    lines.push(`  [DEPRECATED]`);
  }

  return lines.join('\n');
}

/**
 * Format a vocabulary category node for display.
 */
export function formatCategoryNode(node: VocabularyCategoryNode): string {
  const arrow = node.expanded ? '▾' : '▸';
  return `${arrow} ${node.displayName} (${node.count})`;
}

/**
 * Format the vocabulary browser status bar.
 */
export function formatStatusBar(
  state: VocabularyBrowserState,
): string {
  const extCount = state.extensions.filter(e => e.active).length;
  const catCount = state.categoryTree.length;
  return `${state.totalTerms} terms • ${catCount} categories • ${extCount} extensions`;
}

/**
 * Format a search result summary.
 */
export function formatSearchSummary(result: VocabularySearchResult): string {
  if (result.query.searchText.length === 0 && result.query.categoryFilter.length === 0) {
    return `Showing all ${result.totalMatches} terms`;
  }

  const parts: string[] = [];
  if (result.query.searchText.length > 0) {
    parts.push(`matching "${result.query.searchText}"`);
  }
  if (result.query.categoryFilter.length > 0) {
    parts.push(`in ${result.query.categoryFilter.join(', ')}`);
  }

  return `${result.totalMatches} terms ${parts.join(' ')} (${result.searchTimeMs}ms)`;
}

// =============================================================================
// INITIAL STATE FACTORY
// =============================================================================

/**
 * Create the initial state for the vocabulary browser.
 */
export function createInitialVocabularyBrowserState(): VocabularyBrowserState {
  const categoryTree: VocabularyCategoryNode[] = VOCABULARY_CATEGORY_CONFIG.map(c => ({
    category: c.category,
    displayName: c.displayName,
    count: 0,
    expanded: false,
    subcategories: [],
    icon: c.icon,
    sortOrder: c.sortOrder,
  }));

  return {
    open: false,
    query: DEFAULT_SEARCH_QUERY,
    results: null,
    selectedEntryId: null,
    categoryTree,
    extensions: [],
    totalTerms: 0,
    recentSearches: [],
  };
}

/**
 * Build the category tree from vocabulary entries.
 */
export function buildCategoryTree(
  entries: readonly VocabularyEntry[],
): readonly VocabularyCategoryNode[] {
  const counts: Record<string, number> = {};
  const subcats: Record<string, Record<string, number>> = {};

  for (const e of entries) {
    counts[e.category] = (counts[e.category] ?? 0) + 1;
    if (e.subcategory) {
      if (!subcats[e.category]) subcats[e.category] = {};
      const sub = subcats[e.category]!;
      sub[e.subcategory] = (sub[e.subcategory] ?? 0) + 1;
    }
  }

  return VOCABULARY_CATEGORY_CONFIG.map(c => ({
    category: c.category,
    displayName: c.displayName,
    count: counts[c.category] ?? 0,
    expanded: false,
    subcategories: Object.entries(subcats[c.category] ?? {}).map(([name, count]) => ({
      name,
      count,
      expanded: false,
    })),
    icon: c.icon,
    sortOrder: c.sortOrder,
  }));
}

/**
 * Collect extension namespaces from vocabulary entries.
 */
export function collectExtensionNamespaces(
  entries: readonly VocabularyEntry[],
): readonly ExtensionNamespace[] {
  const nsMap = new Map<string, {
    namespace: string;
    displayName: string;
    version: string;
    count: number;
    categories: Set<VocabularyCategory>;
  }>();

  for (const e of entries) {
    if (e.source.type === 'extension') {
      const existing = nsMap.get(e.source.namespace);
      if (existing) {
        existing.count++;
        existing.categories.add(e.category);
      } else {
        nsMap.set(e.source.namespace, {
          namespace: e.source.namespace,
          displayName: e.source.extensionName,
          version: e.source.version,
          count: 1,
          categories: new Set([e.category]),
        });
      }
    }
  }

  return Array.from(nsMap.values()).map(ns => ({
    namespace: ns.namespace,
    displayName: ns.displayName,
    version: ns.version,
    description: `Extension providing ${ns.count} terms.`,
    termCount: ns.count,
    categories: Array.from(ns.categories),
    active: true,
    author: '',
  }));
}

// =============================================================================
// VOCABULARY STATISTICS
// =============================================================================

export interface VocabularyBrowserStats {
  readonly totalEntries: number;
  readonly coreEntries: number;
  readonly extensionEntries: number;
  readonly categoryCounts: Readonly<Record<string, number>>;
  readonly totalSynonyms: number;
  readonly totalExamples: number;
  readonly extensionNamespaces: number;
  readonly deprecatedEntries: number;
}

export function getVocabularyBrowserStats(
  entries: readonly VocabularyEntry[],
): VocabularyBrowserStats {
  let core = 0;
  let ext = 0;
  let totalSyn = 0;
  let totalEx = 0;
  let depr = 0;
  const catCounts: Record<string, number> = {};
  const namespaces = new Set<string>();

  for (const e of entries) {
    if (e.source.type === 'core') core++;
    else {
      ext++;
      namespaces.add(e.source.namespace);
    }
    totalSyn += e.synonyms.length;
    totalEx += e.examples.length;
    if (e.deprecated) depr++;
    catCounts[e.category] = (catCounts[e.category] ?? 0) + 1;
  }

  return {
    totalEntries: entries.length,
    coreEntries: core,
    extensionEntries: ext,
    categoryCounts: catCounts,
    totalSynonyms: totalSyn,
    totalExamples: totalEx,
    extensionNamespaces: namespaces.size,
    deprecatedEntries: depr,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const VOCABULARY_BROWSER_RULES = [
  'Rule VOCAB-001: The vocabulary browser lists ALL recognized terms, ' +
  'grouped by category. Every term shows its canonical form, definition, ' +
  'synonyms, and source.',

  'Rule VOCAB-002: Extension-contributed terms are visually distinct from ' +
  'core canon terms. They show the extension namespace as a badge.',

  'Rule VOCAB-003: Search is deterministic: substring matching on term, ' +
  'definition, synonyms, and tags. No AI/LLM-based search.',

  'Rule VOCAB-004: The category sidebar shows expandable tree with counts. ' +
  'Clicking a category filters the main list to that category.',

  'Rule VOCAB-005: The detail panel shows full information about the selected ' +
  'term, including all synonyms, antonyms, examples, related terms, and metadata.',

  'Rule VOCAB-006: Deprecated terms are hidden by default but can be shown ' +
  'with a toggle. They appear with a strikethrough style.',

  'Rule VOCAB-007: The "Insert" action inserts the canonical term into ' +
  'the current command input at the cursor position.',

  'Rule VOCAB-008: Related terms are hyperlinked: clicking navigates to ' +
  'the related term\'s detail view.',

  'Rule VOCAB-009: Faceted filtering shows counts per category, source, ' +
  'and tag. Filters combine with AND logic.',

  'Rule VOCAB-010: The status bar shows total term count, category count, ' +
  'and active extension count at all times.',

  'Rule VOCAB-011: Recent searches are persisted and shown as suggestions ' +
  'when the search field is focused.',

  'Rule VOCAB-012: The vocabulary browser can be opened from the binding ' +
  'inspector by clicking a binding\'s source label.',
] as const;
