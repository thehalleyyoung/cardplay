/**
 * @fileoverview Beginner-Friendly UI Components.
 * 
 * This module provides UI components and systems designed to make the
 * application accessible and easy to learn for beginners, including
 * tutorials, contextual help, tooltips, and simplified modes.
 */

// ============================================================================
// WELCOME SCREEN
// ============================================================================

/**
 * Welcome screen template.
 */
export interface WelcomeTemplate {
  /** Template ID */
  readonly id: string;
  /** Template name */
  readonly name: string;
  /** Template description */
  readonly description: string;
  /** Thumbnail URL */
  readonly thumbnail: string;
  /** Category */
  readonly category: string;
  /** Difficulty level */
  readonly difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Estimated time to complete */
  readonly estimatedMinutes: number;
  /** Tags */
  readonly tags: readonly string[];
  /** Whether this is a featured template */
  readonly featured: boolean;
}

/**
 * Welcome screen configuration.
 */
export interface WelcomeScreenConfig {
  /** Application name */
  readonly appName: string;
  /** Welcome title */
  readonly title: string;
  /** Welcome subtitle */
  readonly subtitle: string;
  /** Show recent projects */
  readonly showRecent: boolean;
  /** Maximum recent projects */
  readonly maxRecent: number;
  /** Show templates */
  readonly showTemplates: boolean;
  /** Show tutorial link */
  readonly showTutorial: boolean;
  /** Show tips */
  readonly showTips: boolean;
  /** Show version */
  readonly showVersion: boolean;
  /** Version string */
  readonly version: string;
}

/**
 * Default welcome config.
 */
export const DEFAULT_WELCOME_CONFIG: WelcomeScreenConfig = {
  appName: 'CardPlay',
  title: 'Welcome to CardPlay',
  subtitle: 'Create music with cards',
  showRecent: true,
  maxRecent: 5,
  showTemplates: true,
  showTutorial: true,
  showTips: true,
  showVersion: true,
  version: '1.0.0',
};

/**
 * Recent project entry.
 */
export interface RecentProject {
  /** Project ID */
  readonly id: string;
  /** Project name */
  readonly name: string;
  /** Last modified timestamp */
  readonly lastModified: number;
  /** Thumbnail data URL */
  readonly thumbnail: string | null;
  /** File path */
  readonly path: string;
}

/**
 * Welcome screen state.
 */
export interface WelcomeScreenState {
  /** Whether visible */
  readonly visible: boolean;
  /** Recent projects */
  readonly recentProjects: readonly RecentProject[];
  /** Available templates */
  readonly templates: readonly WelcomeTemplate[];
  /** Selected category filter */
  readonly categoryFilter: string | null;
  /** Search query */
  readonly searchQuery: string;
  /** Current tip index */
  readonly currentTipIndex: number;
}

/**
 * Create initial welcome state.
 */
export function createWelcomeScreenState(): WelcomeScreenState {
  return {
    visible: true,
    recentProjects: [],
    templates: [],
    categoryFilter: null,
    searchQuery: '',
    currentTipIndex: 0,
  };
}

/**
 * Filter templates by category and search.
 */
export function filterTemplates(
  templates: readonly WelcomeTemplate[],
  category: string | null,
  query: string
): readonly WelcomeTemplate[] {
  let result = [...templates];
  
  if (category) {
    result = result.filter(t => t.category === category);
  }
  
  if (query) {
    const lower = query.toLowerCase();
    result = result.filter(t =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.tags.some(tag => tag.toLowerCase().includes(lower))
    );
  }
  
  return result;
}

// ============================================================================
// TUTORIAL SYSTEM
// ============================================================================

/**
 * Tutorial step type.
 */
export type TutorialStepType = 
  | 'highlight'    // Highlight an element
  | 'tooltip'      // Show tooltip near element
  | 'modal'        // Show modal dialog
  | 'action'       // Wait for user action
  | 'video'        // Show video
  | 'celebration'; // Celebrate completion

/**
 * Element targeting method.
 */
export type ElementTarget = 
  | { type: 'id'; id: string }
  | { type: 'selector'; selector: string }
  | { type: 'coords'; x: number; y: number }
  | { type: 'none' };

/**
 * Tutorial step.
 */
export interface TutorialStep {
  /** Step ID */
  readonly id: string;
  /** Step type */
  readonly type: TutorialStepType;
  /** Title */
  readonly title: string;
  /** Content (markdown supported) */
  readonly content: string;
  /** Target element */
  readonly target: ElementTarget;
  /** Highlight style */
  readonly highlightStyle: 'spotlight' | 'border' | 'glow';
  /** Position relative to target */
  readonly position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Action to wait for (for action type) */
  readonly waitForAction: string | null;
  /** Media URL (for video type) */
  readonly mediaUrl: string | null;
  /** Can skip */
  readonly skippable: boolean;
  /** Auto-advance after ms (0 = manual) */
  readonly autoAdvance: number;
}

/**
 * Tutorial configuration.
 */
export interface TutorialConfig {
  /** Tutorial ID */
  readonly id: string;
  /** Tutorial name */
  readonly name: string;
  /** Tutorial description */
  readonly description: string;
  /** Steps */
  readonly steps: readonly TutorialStep[];
  /** Allow skipping entire tutorial */
  readonly skippable: boolean;
  /** Show progress indicator */
  readonly showProgress: boolean;
  /** Overlay opacity */
  readonly overlayOpacity: number;
  /** Completion callback */
  readonly onComplete: (() => void) | null;
}

/**
 * Tutorial state.
 */
export interface TutorialState {
  /** Tutorial ID */
  readonly tutorialId: string | null;
  /** Current step index */
  readonly currentStep: number;
  /** Whether tutorial is active */
  readonly active: boolean;
  /** Whether paused */
  readonly paused: boolean;
  /** Completed step IDs */
  readonly completedSteps: readonly string[];
  /** Started timestamp */
  readonly startedAt: number | null;
}

/**
 * Create initial tutorial state.
 */
export function createTutorialState(): TutorialState {
  return {
    tutorialId: null,
    currentStep: 0,
    active: false,
    paused: false,
    completedSteps: [],
    startedAt: null,
  };
}

/**
 * Start a tutorial.
 */
export function startTutorial(
  state: TutorialState,
  tutorialId: string
): TutorialState {
  return {
    ...state,
    tutorialId,
    currentStep: 0,
    active: true,
    paused: false,
    completedSteps: [],
    startedAt: Date.now(),
  };
}

/**
 * Advance to next step.
 */
export function nextTutorialStep(
  state: TutorialState,
  tutorial: TutorialConfig
): TutorialState {
  const currentStepId = tutorial.steps[state.currentStep]?.id;
  const nextStep = state.currentStep + 1;
  
  if (nextStep >= tutorial.steps.length) {
    return {
      ...state,
      active: false,
      completedSteps: currentStepId 
        ? [...state.completedSteps, currentStepId]
        : state.completedSteps,
    };
  }
  
  return {
    ...state,
    currentStep: nextStep,
    completedSteps: currentStepId
      ? [...state.completedSteps, currentStepId]
      : state.completedSteps,
  };
}

/**
 * Go to previous step.
 */
export function previousTutorialStep(state: TutorialState): TutorialState {
  if (state.currentStep <= 0) return state;
  return { ...state, currentStep: state.currentStep - 1 };
}

/**
 * Skip tutorial.
 */
export function skipTutorial(state: TutorialState): TutorialState {
  return {
    ...state,
    active: false,
    tutorialId: null,
  };
}

/**
 * Pause/resume tutorial.
 */
export function toggleTutorialPause(state: TutorialState): TutorialState {
  return { ...state, paused: !state.paused };
}

// ============================================================================
// TOOLTIP TOUR
// ============================================================================

/**
 * Tooltip tour stop.
 */
export interface TourStop {
  /** Stop ID */
  readonly id: string;
  /** Target element selector */
  readonly target: string;
  /** Title */
  readonly title: string;
  /** Description */
  readonly description: string;
  /** Position */
  readonly position: 'top' | 'bottom' | 'left' | 'right';
  /** Arrow offset */
  readonly arrowOffset: number;
}

/**
 * Tooltip tour configuration.
 */
export interface TooltipTourConfig {
  /** Tour ID */
  readonly id: string;
  /** Tour name */
  readonly name: string;
  /** Stops in order */
  readonly stops: readonly TourStop[];
  /** Loop tour */
  readonly loop: boolean;
  /** Auto-start on first visit */
  readonly autoStart: boolean;
}

/**
 * Tooltip tour state.
 */
export interface TooltipTourState {
  /** Current tour ID */
  readonly tourId: string | null;
  /** Current stop index */
  readonly currentStop: number;
  /** Whether tour is active */
  readonly active: boolean;
  /** Visited stop IDs */
  readonly visited: readonly string[];
}

/**
 * Create initial tour state.
 */
export function createTooltipTourState(): TooltipTourState {
  return {
    tourId: null,
    currentStop: 0,
    active: false,
    visited: [],
  };
}

/**
 * Start tour.
 */
export function startTour(
  state: TooltipTourState,
  tourId: string
): TooltipTourState {
  return {
    ...state,
    tourId,
    currentStop: 0,
    active: true,
  };
}

/**
 * Next tour stop.
 */
export function nextTourStop(
  state: TooltipTourState,
  tour: TooltipTourConfig
): TooltipTourState {
  const currentStopId = tour.stops[state.currentStop]?.id;
  const nextStop = state.currentStop + 1;
  
  if (nextStop >= tour.stops.length) {
    if (tour.loop) {
      return {
        ...state,
        currentStop: 0,
        visited: currentStopId 
          ? [...state.visited, currentStopId]
          : state.visited,
      };
    }
    return {
      ...state,
      active: false,
      visited: currentStopId
        ? [...state.visited, currentStopId]
        : state.visited,
    };
  }
  
  return {
    ...state,
    currentStop: nextStop,
    visited: currentStopId
      ? [...state.visited, currentStopId]
      : state.visited,
  };
}

/**
 * Previous tour stop.
 */
export function previousTourStop(
  state: TooltipTourState,
  tour: TooltipTourConfig
): TooltipTourState {
  if (state.currentStop <= 0) {
    if (tour.loop) {
      return { ...state, currentStop: tour.stops.length - 1 };
    }
    return state;
  }
  return { ...state, currentStop: state.currentStop - 1 };
}

/**
 * End tour.
 */
export function endTour(state: TooltipTourState): TooltipTourState {
  return { ...state, active: false, tourId: null };
}

// ============================================================================
// HELP PANEL
// ============================================================================

/**
 * Help article.
 */
export interface HelpArticle {
  /** Article ID */
  readonly id: string;
  /** Article title */
  readonly title: string;
  /** Article content (markdown) */
  readonly content: string;
  /** Category */
  readonly category: string;
  /** Tags */
  readonly tags: readonly string[];
  /** Related article IDs */
  readonly relatedArticles: readonly string[];
  /** Last updated */
  readonly lastUpdated: number;
}

/**
 * Help panel configuration.
 */
export interface HelpPanelConfig {
  /** Panel title */
  readonly title: string;
  /** Show search */
  readonly showSearch: boolean;
  /** Show categories */
  readonly showCategories: boolean;
  /** Show recent */
  readonly showRecent: boolean;
  /** Maximum recent articles */
  readonly maxRecent: number;
  /** Context-sensitive */
  readonly contextSensitive: boolean;
}

/**
 * Default help panel config.
 */
export const DEFAULT_HELP_PANEL_CONFIG: HelpPanelConfig = {
  title: 'Help',
  showSearch: true,
  showCategories: true,
  showRecent: true,
  maxRecent: 5,
  contextSensitive: true,
};

/**
 * Help panel state.
 */
export interface HelpPanelState {
  /** Whether panel is open */
  readonly open: boolean;
  /** Search query */
  readonly searchQuery: string;
  /** Selected category */
  readonly selectedCategory: string | null;
  /** Current article ID */
  readonly currentArticleId: string | null;
  /** Navigation history */
  readonly history: readonly string[];
  /** History index */
  readonly historyIndex: number;
  /** Recently viewed article IDs */
  readonly recentArticles: readonly string[];
}

/**
 * Create initial help panel state.
 */
export function createHelpPanelState(): HelpPanelState {
  return {
    open: false,
    searchQuery: '',
    selectedCategory: null,
    currentArticleId: null,
    history: [],
    historyIndex: -1,
    recentArticles: [],
  };
}

/**
 * Open help panel.
 */
export function openHelpPanel(
  state: HelpPanelState,
  articleId?: string
): HelpPanelState {
  if (articleId) {
    return navigateToArticle(
      { ...state, open: true },
      articleId
    );
  }
  return { ...state, open: true };
}

/**
 * Close help panel.
 */
export function closeHelpPanel(state: HelpPanelState): HelpPanelState {
  return { ...state, open: false };
}

/**
 * Navigate to article.
 */
export function navigateToArticle(
  state: HelpPanelState,
  articleId: string
): HelpPanelState {
  const newHistory = [
    ...state.history.slice(0, state.historyIndex + 1),
    articleId,
  ];
  
  const recentArticles = [
    articleId,
    ...state.recentArticles.filter(id => id !== articleId),
  ].slice(0, 10);
  
  return {
    ...state,
    currentArticleId: articleId,
    history: newHistory,
    historyIndex: newHistory.length - 1,
    recentArticles,
  };
}

/**
 * Go back in history.
 */
export function goBackInHelp(state: HelpPanelState): HelpPanelState {
  if (state.historyIndex <= 0) return state;
  
  const newIndex = state.historyIndex - 1;
  return {
    ...state,
    historyIndex: newIndex,
    currentArticleId: state.history[newIndex] ?? null,
  };
}

/**
 * Go forward in history.
 */
export function goForwardInHelp(state: HelpPanelState): HelpPanelState {
  if (state.historyIndex >= state.history.length - 1) return state;
  
  const newIndex = state.historyIndex + 1;
  return {
    ...state,
    historyIndex: newIndex,
    currentArticleId: state.history[newIndex] ?? null,
  };
}

/**
 * Search help articles.
 */
export function searchHelpArticles(
  articles: readonly HelpArticle[],
  query: string
): readonly HelpArticle[] {
  if (!query) return articles;
  
  const lower = query.toLowerCase();
  return articles.filter(article =>
    article.title.toLowerCase().includes(lower) ||
    article.content.toLowerCase().includes(lower) ||
    article.tags.some(tag => tag.toLowerCase().includes(lower))
  );
}

// ============================================================================
// GLOSSARY
// ============================================================================

/**
 * Glossary term.
 */
export interface GlossaryTerm {
  /** Term */
  readonly term: string;
  /** Definition */
  readonly definition: string;
  /** Category */
  readonly category: string;
  /** Related terms */
  readonly relatedTerms: readonly string[];
  /** See also (links to articles) */
  readonly seeAlso: readonly string[];
  /** Example usage */
  readonly example: string | null;
  /** Pronunciation (for audio terms) */
  readonly pronunciation: string | null;
}

/**
 * Glossary configuration.
 */
export interface GlossaryConfig {
  /** All terms */
  readonly terms: readonly GlossaryTerm[];
  /** Show pronunciation */
  readonly showPronunciation: boolean;
  /** Show examples */
  readonly showExamples: boolean;
}

/**
 * Create glossary lookup.
 */
export function createGlossaryLookup(
  terms: readonly GlossaryTerm[]
): Map<string, GlossaryTerm> {
  const lookup = new Map<string, GlossaryTerm>();
  for (const term of terms) {
    lookup.set(term.term.toLowerCase(), term);
  }
  return lookup;
}

/**
 * Find term in glossary.
 */
export function findGlossaryTerm(
  lookup: Map<string, GlossaryTerm>,
  term: string
): GlossaryTerm | undefined {
  return lookup.get(term.toLowerCase());
}

/**
 * Get terms by category.
 */
export function getTermsByCategory(
  terms: readonly GlossaryTerm[],
  category: string
): readonly GlossaryTerm[] {
  return terms.filter(t => t.category === category);
}

/**
 * Get all categories.
 */
export function getGlossaryCategories(
  terms: readonly GlossaryTerm[]
): readonly string[] {
  const categories = new Set<string>();
  for (const term of terms) {
    categories.add(term.category);
  }
  return Array.from(categories).sort();
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/**
 * Keyboard shortcut.
 */
export interface KeyboardShortcut {
  /** Shortcut ID */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Description */
  readonly description: string;
  /** Category */
  readonly category: string;
  /** Key combination */
  readonly keys: string;
  /** Alternative keys */
  readonly altKeys: string | null;
  /** Whether customizable */
  readonly customizable: boolean;
  /** Whether global (works when not focused) */
  readonly global: boolean;
}

/**
 * Keyboard shortcuts configuration.
 */
export interface KeyboardShortcutsConfig {
  /** All shortcuts */
  readonly shortcuts: readonly KeyboardShortcut[];
  /** Whether to show categories */
  readonly showCategories: boolean;
  /** Allow search */
  readonly allowSearch: boolean;
  /** Allow customization */
  readonly allowCustomization: boolean;
}

/**
 * Default keyboard shortcuts categories.
 */
export const DEFAULT_SHORTCUT_CATEGORIES = [
  'General',
  'Transport',
  'Editing',
  'View',
  'Cards',
  'Selection',
  'Playback',
] as const;

/**
 * Parse key combination for display.
 */
export function parseKeyDisplay(keys: string): readonly string[] {
  return keys.split('+').map(key => {
    switch (key.toLowerCase()) {
      case 'cmd': return '⌘';
      case 'ctrl': return '⌃';
      case 'alt': return '⌥';
      case 'shift': return '⇧';
      case 'enter': return '↵';
      case 'backspace': return '⌫';
      case 'delete': return '⌦';
      case 'escape': return '⎋';
      case 'tab': return '⇥';
      case 'space': return '␣';
      case 'up': return '↑';
      case 'down': return '↓';
      case 'left': return '←';
      case 'right': return '→';
      default: return key.toUpperCase();
    }
  });
}

/**
 * Search shortcuts.
 */
export function searchShortcuts(
  shortcuts: readonly KeyboardShortcut[],
  query: string
): readonly KeyboardShortcut[] {
  if (!query) return shortcuts;
  
  const lower = query.toLowerCase();
  return shortcuts.filter(s =>
    s.name.toLowerCase().includes(lower) ||
    s.description.toLowerCase().includes(lower) ||
    s.keys.toLowerCase().includes(lower)
  );
}

/**
 * Group shortcuts by category.
 */
export function groupShortcutsByCategory(
  shortcuts: readonly KeyboardShortcut[]
): Map<string, readonly KeyboardShortcut[]> {
  const groups = new Map<string, KeyboardShortcut[]>();
  
  for (const shortcut of shortcuts) {
    const existing = groups.get(shortcut.category) ?? [];
    groups.set(shortcut.category, [...existing, shortcut]);
  }
  
  return groups;
}

// ============================================================================
// SEARCH EVERYTHING (Cmd+K)
// ============================================================================

/**
 * Search result type.
 */
export type SearchResultType = 
  | 'command'
  | 'card'
  | 'preset'
  | 'help'
  | 'setting'
  | 'recent'
  | 'action';

/**
 * Search result.
 */
export interface SearchResult {
  /** Result ID */
  readonly id: string;
  /** Result type */
  readonly type: SearchResultType;
  /** Display title */
  readonly title: string;
  /** Subtitle/description */
  readonly subtitle: string;
  /** Icon name */
  readonly icon: string;
  /** Keyboard shortcut (if applicable) */
  readonly shortcut: string | null;
  /** Score (for sorting) */
  readonly score: number;
  /** Action to perform */
  readonly action: string;
  /** Action payload */
  readonly payload: unknown;
}

/**
 * Search everything configuration.
 */
export interface SearchEverythingConfig {
  /** Placeholder text */
  readonly placeholder: string;
  /** Maximum results */
  readonly maxResults: number;
  /** Show categories */
  readonly showCategories: boolean;
  /** Show shortcuts */
  readonly showShortcuts: boolean;
  /** Show recent */
  readonly showRecent: boolean;
  /** Maximum recent */
  readonly maxRecent: number;
  /** Debounce delay */
  readonly debounceMs: number;
}

/**
 * Default search config.
 */
export const DEFAULT_SEARCH_EVERYTHING_CONFIG: SearchEverythingConfig = {
  placeholder: 'Search commands, cards, help...',
  maxResults: 10,
  showCategories: true,
  showShortcuts: true,
  showRecent: true,
  maxRecent: 5,
  debounceMs: 100,
};

/**
 * Search everything state.
 */
export interface SearchEverythingState {
  /** Whether open */
  readonly open: boolean;
  /** Query */
  readonly query: string;
  /** Results */
  readonly results: readonly SearchResult[];
  /** Selected index */
  readonly selectedIndex: number;
  /** Is loading */
  readonly loading: boolean;
  /** Recent searches */
  readonly recentSearches: readonly string[];
}

/**
 * Create initial search state.
 */
export function createSearchEverythingState(): SearchEverythingState {
  return {
    open: false,
    query: '',
    results: [],
    selectedIndex: 0,
    loading: false,
    recentSearches: [],
  };
}

/**
 * Open search.
 */
export function openSearchEverything(
  state: SearchEverythingState
): SearchEverythingState {
  return { ...state, open: true, query: '', results: [], selectedIndex: 0 };
}

/**
 * Close search.
 */
export function closeSearchEverything(
  state: SearchEverythingState
): SearchEverythingState {
  return { ...state, open: false };
}

/**
 * Update search query.
 */
export function updateSearchEverythingQuery(
  state: SearchEverythingState,
  query: string
): SearchEverythingState {
  return { ...state, query, loading: query.length > 0, selectedIndex: 0 };
}

/**
 * Set search results.
 */
export function setSearchEverythingResults(
  state: SearchEverythingState,
  results: readonly SearchResult[]
): SearchEverythingState {
  return { ...state, results, loading: false };
}

/**
 * Navigate results.
 */
export function navigateSearchResults(
  state: SearchEverythingState,
  direction: 'up' | 'down'
): SearchEverythingState {
  const count = state.results.length;
  if (count === 0) return state;
  
  let newIndex = state.selectedIndex;
  if (direction === 'down') {
    newIndex = (newIndex + 1) % count;
  } else {
    newIndex = (newIndex - 1 + count) % count;
  }
  
  return { ...state, selectedIndex: newIndex };
}

/**
 * Add to recent searches.
 */
export function addRecentSearch(
  state: SearchEverythingState,
  query: string,
  maxRecent: number = 10
): SearchEverythingState {
  if (!query.trim()) return state;
  
  const recent = [
    query,
    ...state.recentSearches.filter(q => q !== query),
  ].slice(0, maxRecent);
  
  return { ...state, recentSearches: recent };
}

// ============================================================================
// SUGGESTED ACTIONS
// ============================================================================

/**
 * Suggested action.
 */
export interface SuggestedAction {
  /** Action ID */
  readonly id: string;
  /** Display text */
  readonly text: string;
  /** Icon name */
  readonly icon: string;
  /** Priority (higher = shown first) */
  readonly priority: number;
  /** Context conditions */
  readonly conditions: readonly string[];
  /** Action to perform */
  readonly action: string;
  /** Dismissible */
  readonly dismissible: boolean;
}

/**
 * Suggested actions state.
 */
export interface SuggestedActionsState {
  /** All suggestions */
  readonly suggestions: readonly SuggestedAction[];
  /** Dismissed IDs */
  readonly dismissed: readonly string[];
  /** Active context */
  readonly context: readonly string[];
}

/**
 * Create initial suggestions state.
 */
export function createSuggestedActionsState(): SuggestedActionsState {
  return {
    suggestions: [],
    dismissed: [],
    context: [],
  };
}

/**
 * Get visible suggestions.
 */
export function getVisibleSuggestions(
  state: SuggestedActionsState
): readonly SuggestedAction[] {
  return state.suggestions
    .filter(s => !state.dismissed.includes(s.id))
    .filter(s => s.conditions.every(c => state.context.includes(c)))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Dismiss suggestion.
 */
export function dismissSuggestion(
  state: SuggestedActionsState,
  suggestionId: string
): SuggestedActionsState {
  return {
    ...state,
    dismissed: [...state.dismissed, suggestionId],
  };
}

/**
 * Update context.
 */
export function updateSuggestionContext(
  state: SuggestedActionsState,
  context: readonly string[]
): SuggestedActionsState {
  return { ...state, context };
}

// ============================================================================
// ERROR EXPLAINER
// ============================================================================

/**
 * Error explanation.
 */
export interface ErrorExplanation {
  /** Error code */
  readonly code: string;
  /** Friendly title */
  readonly title: string;
  /** Friendly description */
  readonly description: string;
  /** Suggested fixes */
  readonly suggestions: readonly string[];
  /** Help article ID */
  readonly helpArticleId: string | null;
  /** Severity */
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Error explainer configuration.
 */
export interface ErrorExplainerConfig {
  /** Error explanations */
  readonly explanations: Map<string, ErrorExplanation>;
  /** Default explanation for unknown errors */
  readonly defaultExplanation: ErrorExplanation;
  /** Show stack trace */
  readonly showStackTrace: boolean;
  /** Show error code */
  readonly showErrorCode: boolean;
}

/**
 * Default explanation for unknown errors.
 */
export const DEFAULT_ERROR_EXPLANATION: ErrorExplanation = {
  code: 'UNKNOWN',
  title: 'Something went wrong',
  description: 'An unexpected error occurred. Please try again.',
  suggestions: [
    'Refresh the page',
    'Check your internet connection',
    'Contact support if the problem persists',
  ],
  helpArticleId: null,
  severity: 'error',
};

/**
 * Get error explanation.
 */
export function getErrorExplanation(
  config: ErrorExplainerConfig,
  errorCode: string
): ErrorExplanation {
  return config.explanations.get(errorCode) ?? config.defaultExplanation;
}

// ============================================================================
// UNDO HISTORY TIMELINE
// ============================================================================

/**
 * History entry.
 */
export interface HistoryEntry {
  /** Entry ID */
  readonly id: string;
  /** Action name */
  readonly actionName: string;
  /** Description */
  readonly description: string;
  /** Icon */
  readonly icon: string;
  /** Timestamp */
  readonly timestamp: number;
  /** Whether this is current state */
  readonly isCurrent: boolean;
  /** Preview data */
  readonly preview: unknown | null;
}

/**
 * Undo history state.
 */
export interface UndoHistoryState {
  /** All entries */
  readonly entries: readonly HistoryEntry[];
  /** Current index */
  readonly currentIndex: number;
  /** Is panel open */
  readonly open: boolean;
  /** Selected entry for preview */
  readonly selectedEntryId: string | null;
}

/**
 * Create initial undo history state.
 */
export function createUndoHistoryState(): UndoHistoryState {
  return {
    entries: [],
    currentIndex: -1,
    open: false,
    selectedEntryId: null,
  };
}

/**
 * Add history entry.
 */
export function addHistoryEntry(
  state: UndoHistoryState,
  entry: Omit<HistoryEntry, 'id' | 'isCurrent'>
): UndoHistoryState {
  const newEntry: HistoryEntry = {
    ...entry,
    id: `history-${Date.now()}-${Math.random()}`,
    isCurrent: true,
  };
  
  // Remove entries after current index
  const entries = state.entries
    .slice(0, state.currentIndex + 1)
    .map(e => ({ ...e, isCurrent: false }));
  
  return {
    ...state,
    entries: [...entries, newEntry],
    currentIndex: entries.length,
  };
}

/**
 * Jump to history entry.
 */
export function jumpToHistoryEntry(
  state: UndoHistoryState,
  entryId: string
): UndoHistoryState {
  const index = state.entries.findIndex(e => e.id === entryId);
  if (index === -1) return state;
  
  const entries = state.entries.map((e, i) => ({
    ...e,
    isCurrent: i === index,
  }));
  
  return {
    ...state,
    entries,
    currentIndex: index,
  };
}

// ============================================================================
// SIMPLIFIED MODE
// ============================================================================

/**
 * Simplified mode configuration.
 */
export interface SimplifiedModeConfig {
  /** Hidden features */
  readonly hiddenFeatures: readonly string[];
  /** Simplified labels */
  readonly labels: Map<string, string>;
  /** Reduced options per setting */
  readonly reducedOptions: Map<string, readonly string[]>;
  /** Default preset to use */
  readonly defaultPreset: string;
}

/**
 * Simplified mode state.
 */
export interface SimplifiedModeState {
  /** Whether enabled */
  readonly enabled: boolean;
  /** Experience level */
  readonly level: 'beginner' | 'intermediate' | 'advanced';
  /** Features to show anyway */
  readonly showFeatures: readonly string[];
}

/**
 * Create initial simplified mode state.
 */
export function createSimplifiedModeState(): SimplifiedModeState {
  return {
    enabled: false,
    level: 'beginner',
    showFeatures: [],
  };
}

/**
 * Toggle simplified mode.
 */
export function toggleSimplifiedMode(
  state: SimplifiedModeState
): SimplifiedModeState {
  return { ...state, enabled: !state.enabled };
}

/**
 * Set experience level.
 */
export function setExperienceLevel(
  state: SimplifiedModeState,
  level: 'beginner' | 'intermediate' | 'advanced'
): SimplifiedModeState {
  return { ...state, level };
}

/**
 * Check if feature is visible.
 */
export function isFeatureVisible(
  state: SimplifiedModeState,
  config: SimplifiedModeConfig,
  feature: string
): boolean {
  if (!state.enabled) return true;
  if (state.showFeatures.includes(feature)) return true;
  return !config.hiddenFeatures.includes(feature);
}

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

/**
 * Progress step.
 */
export interface ProgressStep {
  /** Step ID */
  readonly id: string;
  /** Step label */
  readonly label: string;
  /** Step status */
  readonly status: 'pending' | 'active' | 'completed' | 'skipped';
  /** Optional percentage (0-100) */
  readonly percentage: number | null;
}

/**
 * Progress indicator state.
 */
export interface ProgressIndicatorState {
  /** Steps */
  readonly steps: readonly ProgressStep[];
  /** Current step index */
  readonly currentStep: number;
  /** Overall progress (0-100) */
  readonly overallProgress: number;
  /** Is visible */
  readonly visible: boolean;
}

/**
 * Create initial progress state.
 */
export function createProgressIndicatorState(
  steps: readonly Omit<ProgressStep, 'status'>[]
): ProgressIndicatorState {
  return {
    steps: steps.map((s, i) => ({
      ...s,
      status: i === 0 ? 'active' : 'pending',
    })),
    currentStep: 0,
    overallProgress: 0,
    visible: true,
  };
}

/**
 * Advance progress.
 */
export function advanceProgress(
  state: ProgressIndicatorState
): ProgressIndicatorState {
  const newSteps = state.steps.map((s, i) => {
    if (i < state.currentStep) return { ...s, status: 'completed' as const };
    if (i === state.currentStep) return { ...s, status: 'completed' as const };
    if (i === state.currentStep + 1) return { ...s, status: 'active' as const };
    return s;
  });
  
  const newCurrentStep = Math.min(state.currentStep + 1, state.steps.length - 1);
  const overallProgress = ((newCurrentStep + 1) / state.steps.length) * 100;
  
  return {
    ...state,
    steps: newSteps,
    currentStep: newCurrentStep,
    overallProgress,
  };
}

/**
 * Complete all progress.
 */
export function completeProgress(
  state: ProgressIndicatorState
): ProgressIndicatorState {
  return {
    ...state,
    steps: state.steps.map(s => ({ ...s, status: 'completed' as const })),
    currentStep: state.steps.length - 1,
    overallProgress: 100,
  };
}

// ============================================================================
// ONBOARDING CHECKLIST
// ============================================================================

/**
 * Onboarding task.
 */
export interface OnboardingTask {
  /** Task ID */
  readonly id: string;
  /** Task title */
  readonly title: string;
  /** Task description */
  readonly description: string;
  /** Icon */
  readonly icon: string;
  /** Is completed */
  readonly completed: boolean;
  /** Optional action to trigger */
  readonly action: string | null;
  /** Reward (e.g., achievement, feature unlock) */
  readonly reward: string | null;
}

/**
 * Onboarding checklist state.
 */
export interface OnboardingChecklistState {
  /** Tasks */
  readonly tasks: readonly OnboardingTask[];
  /** Is visible */
  readonly visible: boolean;
  /** Is expanded */
  readonly expanded: boolean;
  /** Completed count */
  readonly completedCount: number;
}

/**
 * Create initial onboarding state.
 */
export function createOnboardingChecklistState(
  tasks: readonly Omit<OnboardingTask, 'completed'>[]
): OnboardingChecklistState {
  return {
    tasks: tasks.map(t => ({ ...t, completed: false })),
    visible: true,
    expanded: true,
    completedCount: 0,
  };
}

/**
 * Complete onboarding task.
 */
export function completeOnboardingTask(
  state: OnboardingChecklistState,
  taskId: string
): OnboardingChecklistState {
  const tasks = state.tasks.map(t =>
    t.id === taskId ? { ...t, completed: true } : t
  );
  
  return {
    ...state,
    tasks,
    completedCount: tasks.filter(t => t.completed).length,
  };
}

/**
 * Get onboarding progress.
 */
export function getOnboardingProgress(
  state: OnboardingChecklistState
): { completed: number; total: number; percentage: number } {
  const total = state.tasks.length;
  const completed = state.completedCount;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  return { completed, total, percentage };
}

/**
 * Dismiss onboarding.
 */
export function dismissOnboarding(
  state: OnboardingChecklistState
): OnboardingChecklistState {
  return { ...state, visible: false };
}
