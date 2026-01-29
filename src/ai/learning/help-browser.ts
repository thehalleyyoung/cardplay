/**
 * @fileoverview Context-Sensitive Help Browser System
 *
 * M338: Add context-sensitive help (shows relevant docs for active deck).
 * M339: Add search across all documentation.
 * M340-M341: Help content structured by deck type, board, and feature.
 * M342-M343: Tests verifying help relevance and context matching.
 *
 * Provides a local-only help content registry that maps deck types, board types,
 * and feature areas to help topics. Supports full-text search across help content
 * and context-aware suggestion of relevant help topics.
 *
 * @module @cardplay/ai/learning/help-browser
 */

// =============================================================================
// Types
// =============================================================================

/** A help topic with searchable content. */
export interface HelpTopic {
  /** Unique topic ID. */
  readonly topicId: string;
  /** Display title. */
  readonly title: string;
  /** Markdown content (brief summary). */
  readonly summary: string;
  /** Full markdown content. */
  readonly content: string;
  /** Category for grouping. */
  readonly category: HelpCategory;
  /** Deck types this topic relates to. */
  readonly relatedDeckTypes: readonly string[];
  /** Board types this topic relates to. */
  readonly relatedBoardTypes: readonly string[];
  /** Feature IDs this topic relates to (maps to persona feature matrix). */
  readonly relatedFeatures: readonly string[];
  /** Tags for search. */
  readonly tags: readonly string[];
}

/** Help topic categories. */
export type HelpCategory =
  | 'getting-started'
  | 'boards'
  | 'decks'
  | 'composition'
  | 'mixing'
  | 'sound-design'
  | 'performance'
  | 'ai-features'
  | 'workflow'
  | 'keyboard-shortcuts'
  | 'troubleshooting';

/** Context for help suggestions. */
export interface HelpContext {
  /** Currently active board type. */
  readonly boardType?: string;
  /** Currently active deck types. */
  readonly activeDeckTypes?: readonly string[];
  /** User's skill level. */
  readonly skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Current feature being used. */
  readonly activeFeature?: string;
}

/** Help search criteria. */
export interface HelpSearchCriteria {
  /** Free-text query. */
  readonly query?: string;
  /** Filter by category. */
  readonly category?: HelpCategory;
  /** Filter by related deck type. */
  readonly deckType?: string;
  /** Filter by related board type. */
  readonly boardType?: string;
  /** Limit results. */
  readonly limit?: number;
}

// =============================================================================
// Help Content Registry
// =============================================================================

/** In-memory help topic store. */
class HelpBrowserStore {
  private topics: Map<string, HelpTopic> = new Map();

  /**
   * Register a help topic.
   */
  register(topic: HelpTopic): void {
    this.topics.set(topic.topicId, topic);
  }

  /**
   * Get a help topic by ID.
   */
  get(topicId: string): HelpTopic | null {
    return this.topics.get(topicId) ?? null;
  }

  /**
   * M338: Get context-sensitive help topics for the current UI state.
   */
  getContextual(context: HelpContext): HelpTopic[] {
    const results: Array<{ topic: HelpTopic; score: number }> = [];

    for (const topic of this.topics.values()) {
      let score = 0;

      // Board match
      if (context.boardType && topic.relatedBoardTypes.length > 0) {
        if (topic.relatedBoardTypes.includes(context.boardType)) {
          score += 100;
        }
      }

      // Deck match
      if (context.activeDeckTypes && context.activeDeckTypes.length > 0) {
        for (const dt of context.activeDeckTypes) {
          if (topic.relatedDeckTypes.includes(dt)) {
            score += 80;
          }
        }
      }

      // Feature match
      if (context.activeFeature && topic.relatedFeatures.includes(context.activeFeature)) {
        score += 120;
      }

      // Skill level: boost getting-started for beginners, advanced topics for experts
      if (context.skillLevel === 'beginner' && topic.category === 'getting-started') {
        score += 50;
      }
      if (context.skillLevel === 'expert' && topic.category !== 'getting-started') {
        score += 10;
      }

      if (score > 0) {
        results.push({ topic, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .map(r => r.topic);
  }

  /**
   * M339: Search help topics by text query and/or filters.
   */
  search(criteria?: HelpSearchCriteria): HelpTopic[] {
    let results = [...this.topics.values()];

    if (criteria) {
      if (criteria.category) {
        results = results.filter(t => t.category === criteria.category);
      }
      if (criteria.deckType) {
        results = results.filter(t => t.relatedDeckTypes.includes(criteria.deckType!));
      }
      if (criteria.boardType) {
        results = results.filter(t => t.relatedBoardTypes.includes(criteria.boardType!));
      }
      if (criteria.query) {
        const q = criteria.query.toLowerCase();
        results = results.filter(
          t =>
            t.title.toLowerCase().includes(q) ||
            t.summary.toLowerCase().includes(q) ||
            t.content.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q))
        );
      }
      if (criteria.limit && criteria.limit > 0) {
        results = results.slice(0, criteria.limit);
      }
    }

    return results;
  }

  /**
   * Get all unique categories.
   */
  getCategories(): HelpCategory[] {
    const cats = new Set<HelpCategory>();
    for (const t of this.topics.values()) cats.add(t.category);
    return [...cats].sort();
  }

  /** Count of registered topics. */
  count(): number {
    return this.topics.size;
  }

  /** Reset all topics (for testing). */
  reset(): void {
    this.topics.clear();
  }
}

// =============================================================================
// Builtin Help Content
// =============================================================================

const BUILTIN_HELP_TOPICS: readonly HelpTopic[] = [
  // === Getting Started ===
  {
    topicId: 'help_getting_started',
    title: 'Getting Started with CardPlay',
    summary: 'Learn the basics of the board-centric music creation system.',
    content: 'CardPlay uses a board-centric architecture. Each board is a pre-configured workspace with decks (panels), tools, and routing. Choose a board that matches your workflow, then explore the decks available to you.',
    category: 'getting-started',
    relatedDeckTypes: [],
    relatedBoardTypes: [],
    relatedFeatures: [],
    tags: ['basics', 'introduction', 'onboarding', 'first-time'],
  },
  {
    topicId: 'help_choosing_board',
    title: 'Choosing the Right Board',
    summary: 'How to select a board that matches your creative workflow.',
    content: 'Boards come in different control levels from full-manual to generative. Beginners should start with "manual-with-hints" boards. Each board is optimised for a specific persona (notation composer, tracker user, sound designer, producer).',
    category: 'boards',
    relatedDeckTypes: [],
    relatedBoardTypes: [],
    relatedFeatures: ['workspace-templates'],
    tags: ['board', 'selection', 'control-level', 'persona'],
  },
  // === Deck Help ===
  {
    topicId: 'help_pattern_deck',
    title: 'Pattern Editor Deck',
    summary: 'Using the tracker-style pattern editor for sequencing.',
    content: 'The pattern deck provides a tracker-style grid for entering notes, effects, and parameter values. Use arrow keys to navigate, enter values directly. Supports groove templates, humanisation, and pattern variations.',
    category: 'decks',
    relatedDeckTypes: ['pattern-deck'],
    relatedBoardTypes: ['tracker'],
    relatedFeatures: ['pattern-editor', 'groove-templates', 'pattern-variations'],
    tags: ['pattern', 'tracker', 'sequencer', 'grid', 'notes'],
  },
  {
    topicId: 'help_notation_deck',
    title: 'Notation Editor Deck',
    summary: 'Score notation editing and engraving.',
    content: 'The notation deck provides traditional score notation editing. Enter notes on staves, add dynamics and articulations. Supports multi-part writing, transposing instruments, and score layout optimisation.',
    category: 'decks',
    relatedDeckTypes: ['notation-deck'],
    relatedBoardTypes: ['notation'],
    relatedFeatures: ['score-layout', 'counterpoint-analysis', 'orchestration'],
    tags: ['notation', 'score', 'staves', 'engraving'],
  },
  {
    topicId: 'help_mixer_deck',
    title: 'Mixer Deck',
    summary: 'Audio mixing with channel strips, sends, and buses.',
    content: 'The mixer deck shows channel strips with volume, pan, sends, and insert FX. Supports bus routing, automation lanes, and metering. Use for balancing levels, EQ, compression, and spatial placement.',
    category: 'decks',
    relatedDeckTypes: ['mixer-deck'],
    relatedBoardTypes: [],
    relatedFeatures: ['mix-checklist', 'bus-routing', 'automation-lanes'],
    tags: ['mixer', 'volume', 'pan', 'send', 'bus', 'metering'],
  },
  {
    topicId: 'help_dsp_chain_deck',
    title: 'DSP Chain Deck',
    summary: 'Audio effect processing chains.',
    content: 'The DSP chain deck shows audio effect processors in series. Drag effects to reorder, adjust parameters, and A/B compare. Supports parallel processing and preset management.',
    category: 'decks',
    relatedDeckTypes: ['dsp-chain'],
    relatedBoardTypes: [],
    relatedFeatures: ['effect-chains', 'frequency-balance'],
    tags: ['dsp', 'effects', 'chain', 'eq', 'compressor', 'reverb'],
  },
  {
    topicId: 'help_harmony_deck',
    title: 'Harmony Explorer Deck',
    summary: 'Explore chord progressions, modulations, and harmonic functions.',
    content: 'The harmony deck lets you explore scales, chords, progressions, and modulations. Suggests next chords based on harmonic function, identifies cadences, and supports modal interchange.',
    category: 'decks',
    relatedDeckTypes: ['harmony-deck'],
    relatedBoardTypes: [],
    relatedFeatures: ['harmony-explorer', 'cadence-suggestions'],
    tags: ['harmony', 'chords', 'progression', 'modulation', 'theory'],
  },
  {
    topicId: 'help_session_deck',
    title: 'Session Grid Deck',
    summary: 'Clip launching and scene-based arrangement.',
    content: 'The session deck shows a grid of clips organised by tracks and scenes. Launch clips individually or entire scenes. Supports loop modes, follow actions, and launch quantisation.',
    category: 'decks',
    relatedDeckTypes: ['session-deck'],
    relatedBoardTypes: ['session'],
    relatedFeatures: ['performance-mode', 'launch-quantization'],
    tags: ['session', 'clips', 'scenes', 'launch', 'live'],
  },
  // === Composition Help ===
  {
    topicId: 'help_counterpoint',
    title: 'Counterpoint Analysis',
    summary: 'Automatic counterpoint voice independence checking.',
    content: 'The counterpoint analysis tool checks voice independence, parallel motion, and spacing. Flags parallel fifths/octaves, voice crossings, and large leaps. Available in notation boards.',
    category: 'composition',
    relatedDeckTypes: ['notation-deck'],
    relatedBoardTypes: ['notation'],
    relatedFeatures: ['counterpoint-analysis'],
    tags: ['counterpoint', 'voice-leading', 'parallel', 'independence'],
  },
  // === Mixing Help ===
  {
    topicId: 'help_mixing_workflow',
    title: 'Mixing Workflow',
    summary: 'Step-by-step mixing process from gain staging to mastering.',
    content: 'A typical mixing workflow: 1) Gain staging, 2) EQ to carve space, 3) Compression for dynamics, 4) Spatial placement (pan, reverb, delay), 5) Automation for movement, 6) Reference against commercial tracks.',
    category: 'mixing',
    relatedDeckTypes: ['mixer-deck', 'dsp-chain', 'automation-deck'],
    relatedBoardTypes: [],
    relatedFeatures: ['mix-checklist', 'mastering-targets'],
    tags: ['mixing', 'gain-staging', 'eq', 'compression', 'automation'],
  },
  // === AI Features Help ===
  {
    topicId: 'help_ai_advisor',
    title: 'AI Advisor',
    summary: 'Using the AI advisor for context-aware musical guidance.',
    content: 'The AI advisor panel provides contextual suggestions based on your current board, deck, and musical content. It uses Prolog-based knowledge to suggest workflows, detect issues, and offer improvements.',
    category: 'ai-features',
    relatedDeckTypes: ['ai-advisor-deck'],
    relatedBoardTypes: [],
    relatedFeatures: ['ai-advisor', 'skill-estimation', 'progressive-disclosure'],
    tags: ['ai', 'advisor', 'suggestions', 'intelligence'],
  },
  // === Workflow Help ===
  {
    topicId: 'help_workspace_templates',
    title: 'Workspace Templates',
    summary: 'Save and load complete workspace configurations.',
    content: 'Workspace templates capture your board + deck + routing configuration. Save your current workspace as a template, or load from builtin templates for common tasks like beat making, mixing, or scoring.',
    category: 'workflow',
    relatedDeckTypes: [],
    relatedBoardTypes: [],
    relatedFeatures: ['workspace-templates'],
    tags: ['templates', 'workspace', 'save', 'load', 'configuration'],
  },
  {
    topicId: 'help_command_palette',
    title: 'Command Palette (Cmd+K)',
    summary: 'Quick access to any action via keyboard.',
    content: 'Press Cmd+K (Ctrl+K on Windows/Linux) to open the command palette. Type to search for any command. The palette is context-aware and suggests commands relevant to your current deck and board.',
    category: 'keyboard-shortcuts',
    relatedDeckTypes: [],
    relatedBoardTypes: [],
    relatedFeatures: ['command-palette'],
    tags: ['command', 'palette', 'keyboard', 'shortcut', 'cmd-k'],
  },
  {
    topicId: 'help_session_notes',
    title: 'Session Notes',
    summary: 'Take notes scoped to your project.',
    content: 'Session notes let you write markdown notes per project. Notes are tagged, searchable, and can be pinned. They persist across sessions and can be searched across all projects.',
    category: 'workflow',
    relatedDeckTypes: [],
    relatedBoardTypes: [],
    relatedFeatures: ['session-notes'],
    tags: ['notes', 'markdown', 'project', 'journal'],
  },
  {
    topicId: 'help_undo_branching',
    title: 'Undo History Branching',
    summary: 'Create alternate versions from your undo history.',
    content: 'CardPlay supports branching from any point in your undo history. Undo to a previous state, then branch to create an alternate version without losing your original work. Switch between branches at any time.',
    category: 'workflow',
    relatedDeckTypes: [],
    relatedBoardTypes: [],
    relatedFeatures: ['undo-branching'],
    tags: ['undo', 'branching', 'versions', 'history', 'alternate'],
  },
];

// =============================================================================
// Singleton & Public API
// =============================================================================

const helpStore = new HelpBrowserStore();

// Register builtins.
for (const t of BUILTIN_HELP_TOPICS) {
  helpStore.register(t);
}

/**
 * Register a custom help topic.
 */
export function registerHelpTopic(topic: HelpTopic): void {
  helpStore.register(topic);
}

/**
 * Get a help topic by ID.
 */
export function getHelpTopic(topicId: string): HelpTopic | null {
  return helpStore.get(topicId);
}

/**
 * M338: Get context-sensitive help topics for the current UI state.
 */
export function getContextualHelp(context: HelpContext): HelpTopic[] {
  return helpStore.getContextual(context);
}

/**
 * M339: Search help topics across all documentation.
 */
export function searchHelp(criteria?: HelpSearchCriteria): HelpTopic[] {
  return helpStore.search(criteria);
}

/**
 * Get all help categories.
 */
export function getHelpCategories(): HelpCategory[] {
  return helpStore.getCategories();
}

/**
 * Get help topic count.
 */
export function getHelpTopicCount(): number {
  return helpStore.count();
}

/**
 * Reset all help topics (for testing — re-registers builtins).
 */
export function resetHelp(): void {
  helpStore.reset();
  for (const t of BUILTIN_HELP_TOPICS) {
    helpStore.register(t);
  }
}

/**
 * Reset all help topics including builtins (for testing).
 */
export function resetHelpCompletely(): void {
  helpStore.reset();
}
