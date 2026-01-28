/**
 * @fileoverview Tests for Beginner-Friendly UI Components.
 */

import { describe, it, expect } from 'vitest';
import {
  // Welcome Screen
  DEFAULT_WELCOME_CONFIG,
  createWelcomeScreenState,
  filterTemplates,
  
  // Tutorial System
  createTutorialState,
  startTutorial,
  nextTutorialStep,
  previousTutorialStep,
  skipTutorial,
  toggleTutorialPause,
  
  // Tooltip Tour
  createTooltipTourState,
  startTour,
  nextTourStop,
  previousTourStop,
  endTour,
  
  // Help Panel
  DEFAULT_HELP_PANEL_CONFIG,
  createHelpPanelState,
  openHelpPanel,
  closeHelpPanel,
  navigateToArticle,
  goBackInHelp,
  goForwardInHelp,
  searchHelpArticles,
  
  // Glossary
  createGlossaryLookup,
  findGlossaryTerm,
  getTermsByCategory,
  getGlossaryCategories,
  
  // Keyboard Shortcuts
  DEFAULT_SHORTCUT_CATEGORIES,
  parseKeyDisplay,
  searchShortcuts,
  groupShortcutsByCategory,
  
  // Search Everything
  DEFAULT_SEARCH_EVERYTHING_CONFIG,
  createSearchEverythingState,
  openSearchEverything,
  closeSearchEverything,
  updateSearchEverythingQuery,
  setSearchEverythingResults,
  navigateSearchResults,
  addRecentSearch,
  
  // Suggested Actions
  createSuggestedActionsState,
  getVisibleSuggestions,
  dismissSuggestion,
  updateSuggestionContext,
  
  // Error Explainer
  DEFAULT_ERROR_EXPLANATION,
  getErrorExplanation,
  
  // Undo History
  createUndoHistoryState,
  addHistoryEntry,
  jumpToHistoryEntry,
  
  // Simplified Mode
  createSimplifiedModeState,
  toggleSimplifiedMode,
  setExperienceLevel,
  isFeatureVisible,
  
  // Progress Indicator
  createProgressIndicatorState,
  advanceProgress,
  completeProgress,
  
  // Onboarding Checklist
  createOnboardingChecklistState,
  completeOnboardingTask,
  getOnboardingProgress,
  dismissOnboarding,
} from './beginner';

// ============================================================================
// WELCOME SCREEN TESTS
// ============================================================================

describe('Welcome Screen', () => {
  describe('DEFAULT_WELCOME_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_WELCOME_CONFIG.appName).toBe('CardPlay');
      expect(DEFAULT_WELCOME_CONFIG.showTemplates).toBe(true);
      expect(DEFAULT_WELCOME_CONFIG.showTutorial).toBe(true);
    });
  });

  describe('createWelcomeScreenState', () => {
    it('should create initial state', () => {
      const state = createWelcomeScreenState();
      
      expect(state.visible).toBe(true);
      expect(state.recentProjects).toEqual([]);
      expect(state.templates).toEqual([]);
      expect(state.currentTipIndex).toBe(0);
    });
  });

  describe('filterTemplates', () => {
    const templates = [
      { id: '1', name: 'Beat Maker', category: 'rhythm', tags: ['drums', 'beats'], description: 'Create drum patterns' } as any,
      { id: '2', name: 'Synth Pad', category: 'synth', tags: ['pads', 'ambient'], description: 'Ambient textures' } as any,
      { id: '3', name: 'Bass Line', category: 'bass', tags: ['bass', 'groove'], description: 'Deep bass' } as any,
    ];

    it('should filter by category', () => {
      const result = filterTemplates(templates, 'rhythm', '');
      expect(result.length).toBe(1);
      expect(result[0]!.id).toBe('1');
    });

    it('should filter by search query', () => {
      const result = filterTemplates(templates, null, 'ambient');
      expect(result.length).toBe(1);
      expect(result[0]!.id).toBe('2');
    });

    it('should filter by tag', () => {
      const result = filterTemplates(templates, null, 'drums');
      expect(result.length).toBe(1);
    });

    it('should combine filters', () => {
      const result = filterTemplates(templates, 'synth', 'pad');
      expect(result.length).toBe(1);
    });
  });
});

// ============================================================================
// TUTORIAL SYSTEM TESTS
// ============================================================================

describe('Tutorial System', () => {
  const mockTutorial = {
    id: 'intro',
    name: 'Introduction',
    description: 'Learn the basics',
    steps: [
      { id: 'step1', title: 'Step 1', content: 'First step' },
      { id: 'step2', title: 'Step 2', content: 'Second step' },
      { id: 'step3', title: 'Step 3', content: 'Third step' },
    ],
    skippable: true,
    showProgress: true,
    overlayOpacity: 0.5,
    onComplete: null,
  } as any;

  describe('createTutorialState', () => {
    it('should create initial state', () => {
      const state = createTutorialState();
      
      expect(state.tutorialId).toBe(null);
      expect(state.currentStep).toBe(0);
      expect(state.active).toBe(false);
      expect(state.paused).toBe(false);
    });
  });

  describe('startTutorial', () => {
    it('should start tutorial', () => {
      let state = createTutorialState();
      state = startTutorial(state, 'intro');
      
      expect(state.tutorialId).toBe('intro');
      expect(state.active).toBe(true);
      expect(state.currentStep).toBe(0);
      expect(state.startedAt).not.toBe(null);
    });
  });

  describe('nextTutorialStep', () => {
    it('should advance to next step', () => {
      let state = createTutorialState();
      state = startTutorial(state, 'intro');
      state = nextTutorialStep(state, mockTutorial);
      
      expect(state.currentStep).toBe(1);
      expect(state.completedSteps).toContain('step1');
    });

    it('should end tutorial on last step', () => {
      let state = createTutorialState();
      state = startTutorial(state, 'intro');
      state = nextTutorialStep(state, mockTutorial);
      state = nextTutorialStep(state, mockTutorial);
      state = nextTutorialStep(state, mockTutorial);
      
      expect(state.active).toBe(false);
    });
  });

  describe('previousTutorialStep', () => {
    it('should go back', () => {
      let state = createTutorialState();
      state = startTutorial(state, 'intro');
      state = nextTutorialStep(state, mockTutorial);
      state = previousTutorialStep(state);
      
      expect(state.currentStep).toBe(0);
    });

    it('should not go before first step', () => {
      let state = createTutorialState();
      state = startTutorial(state, 'intro');
      state = previousTutorialStep(state);
      
      expect(state.currentStep).toBe(0);
    });
  });

  describe('skipTutorial', () => {
    it('should skip and deactivate', () => {
      let state = createTutorialState();
      state = startTutorial(state, 'intro');
      state = skipTutorial(state);
      
      expect(state.active).toBe(false);
      expect(state.tutorialId).toBe(null);
    });
  });

  describe('toggleTutorialPause', () => {
    it('should toggle pause', () => {
      let state = createTutorialState();
      state = startTutorial(state, 'intro');
      state = toggleTutorialPause(state);
      
      expect(state.paused).toBe(true);
      
      state = toggleTutorialPause(state);
      expect(state.paused).toBe(false);
    });
  });
});

// ============================================================================
// TOOLTIP TOUR TESTS
// ============================================================================

describe('Tooltip Tour', () => {
  const mockTour = {
    id: 'feature-tour',
    name: 'Features',
    stops: [
      { id: 'stop1', target: '#btn1', title: 'First', description: 'First button' },
      { id: 'stop2', target: '#btn2', title: 'Second', description: 'Second button' },
    ],
    loop: false,
    autoStart: false,
  } as any;

  describe('createTooltipTourState', () => {
    it('should create initial state', () => {
      const state = createTooltipTourState();
      
      expect(state.tourId).toBe(null);
      expect(state.active).toBe(false);
      expect(state.visited).toEqual([]);
    });
  });

  describe('startTour', () => {
    it('should start tour', () => {
      let state = createTooltipTourState();
      state = startTour(state, 'feature-tour');
      
      expect(state.tourId).toBe('feature-tour');
      expect(state.active).toBe(true);
      expect(state.currentStop).toBe(0);
    });
  });

  describe('nextTourStop', () => {
    it('should advance to next stop', () => {
      let state = createTooltipTourState();
      state = startTour(state, 'feature-tour');
      state = nextTourStop(state, mockTour);
      
      expect(state.currentStop).toBe(1);
      expect(state.visited).toContain('stop1');
    });

    it('should end tour at last stop (no loop)', () => {
      let state = createTooltipTourState();
      state = startTour(state, 'feature-tour');
      state = nextTourStop(state, mockTour);
      state = nextTourStop(state, mockTour);
      
      expect(state.active).toBe(false);
    });

    it('should loop if enabled', () => {
      const loopTour = { ...mockTour, loop: true };
      let state = createTooltipTourState();
      state = startTour(state, 'feature-tour');
      state = nextTourStop(state, loopTour);
      state = nextTourStop(state, loopTour);
      
      expect(state.currentStop).toBe(0);
      expect(state.active).toBe(true);
    });
  });

  describe('endTour', () => {
    it('should end tour', () => {
      let state = createTooltipTourState();
      state = startTour(state, 'feature-tour');
      state = endTour(state);
      
      expect(state.active).toBe(false);
      expect(state.tourId).toBe(null);
    });
  });
});

// ============================================================================
// HELP PANEL TESTS
// ============================================================================

describe('Help Panel', () => {
  describe('DEFAULT_HELP_PANEL_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_HELP_PANEL_CONFIG.showSearch).toBe(true);
      expect(DEFAULT_HELP_PANEL_CONFIG.contextSensitive).toBe(true);
    });
  });

  describe('createHelpPanelState', () => {
    it('should create initial state', () => {
      const state = createHelpPanelState();
      
      expect(state.open).toBe(false);
      expect(state.currentArticleId).toBe(null);
      expect(state.history).toEqual([]);
    });
  });

  describe('openHelpPanel', () => {
    it('should open panel', () => {
      let state = createHelpPanelState();
      state = openHelpPanel(state);
      
      expect(state.open).toBe(true);
    });

    it('should open to specific article', () => {
      let state = createHelpPanelState();
      state = openHelpPanel(state, 'getting-started');
      
      expect(state.open).toBe(true);
      expect(state.currentArticleId).toBe('getting-started');
    });
  });

  describe('navigateToArticle', () => {
    it('should navigate and add to history', () => {
      let state = createHelpPanelState();
      state = navigateToArticle(state, 'article-1');
      state = navigateToArticle(state, 'article-2');
      
      expect(state.currentArticleId).toBe('article-2');
      expect(state.history).toEqual(['article-1', 'article-2']);
      expect(state.historyIndex).toBe(1);
    });

    it('should add to recent', () => {
      let state = createHelpPanelState();
      state = navigateToArticle(state, 'article-1');
      
      expect(state.recentArticles).toContain('article-1');
    });
  });

  describe('goBackInHelp', () => {
    it('should go back in history', () => {
      let state = createHelpPanelState();
      state = navigateToArticle(state, 'article-1');
      state = navigateToArticle(state, 'article-2');
      state = goBackInHelp(state);
      
      expect(state.currentArticleId).toBe('article-1');
      expect(state.historyIndex).toBe(0);
    });
  });

  describe('goForwardInHelp', () => {
    it('should go forward in history', () => {
      let state = createHelpPanelState();
      state = navigateToArticle(state, 'article-1');
      state = navigateToArticle(state, 'article-2');
      state = goBackInHelp(state);
      state = goForwardInHelp(state);
      
      expect(state.currentArticleId).toBe('article-2');
    });
  });

  describe('searchHelpArticles', () => {
    const articles = [
      { id: '1', title: 'Getting Started', content: 'Welcome guide', tags: ['beginner'] },
      { id: '2', title: 'Advanced Tips', content: 'Pro techniques', tags: ['advanced'] },
    ] as any[];

    it('should search by title', () => {
      const results = searchHelpArticles(articles, 'getting');
      expect(results.length).toBe(1);
    });

    it('should search by content', () => {
      const results = searchHelpArticles(articles, 'techniques');
      expect(results.length).toBe(1);
    });

    it('should search by tag', () => {
      const results = searchHelpArticles(articles, 'beginner');
      expect(results.length).toBe(1);
    });
  });
});

// ============================================================================
// GLOSSARY TESTS
// ============================================================================

describe('Glossary', () => {
  const terms = [
    { term: 'ADSR', definition: 'Attack, Decay, Sustain, Release', category: 'synthesis' },
    { term: 'BPM', definition: 'Beats Per Minute', category: 'tempo' },
    { term: 'LFO', definition: 'Low Frequency Oscillator', category: 'synthesis' },
  ] as any[];

  describe('createGlossaryLookup', () => {
    it('should create lookup map', () => {
      const lookup = createGlossaryLookup(terms);
      
      expect(lookup.size).toBe(3);
      expect(lookup.has('adsr')).toBe(true);
    });
  });

  describe('findGlossaryTerm', () => {
    it('should find term case-insensitive', () => {
      const lookup = createGlossaryLookup(terms);
      
      expect(findGlossaryTerm(lookup, 'ADSR')).toBeDefined();
      expect(findGlossaryTerm(lookup, 'adsr')).toBeDefined();
      expect(findGlossaryTerm(lookup, 'unknown')).toBeUndefined();
    });
  });

  describe('getTermsByCategory', () => {
    it('should filter by category', () => {
      const result = getTermsByCategory(terms, 'synthesis');
      expect(result.length).toBe(2);
    });
  });

  describe('getGlossaryCategories', () => {
    it('should get unique categories', () => {
      const categories = getGlossaryCategories(terms);
      expect(categories).toContain('synthesis');
      expect(categories).toContain('tempo');
      expect(categories.length).toBe(2);
    });
  });
});

// ============================================================================
// KEYBOARD SHORTCUTS TESTS
// ============================================================================

describe('Keyboard Shortcuts', () => {
  describe('DEFAULT_SHORTCUT_CATEGORIES', () => {
    it('should have categories', () => {
      expect(DEFAULT_SHORTCUT_CATEGORIES.length).toBeGreaterThan(0);
      expect(DEFAULT_SHORTCUT_CATEGORIES).toContain('General');
    });
  });

  describe('parseKeyDisplay', () => {
    it('should convert modifiers to symbols', () => {
      const result = parseKeyDisplay('cmd+shift+s');
      
      expect(result).toContain('⌘');
      expect(result).toContain('⇧');
      expect(result).toContain('S');
    });

    it('should convert special keys', () => {
      expect(parseKeyDisplay('enter')).toContain('↵');
      expect(parseKeyDisplay('escape')).toContain('⎋');
      expect(parseKeyDisplay('space')).toContain('␣');
    });
  });

  describe('searchShortcuts', () => {
    const shortcuts = [
      { id: '1', name: 'Save', description: 'Save file', keys: 'cmd+s', category: 'General' },
      { id: '2', name: 'Play', description: 'Start playback', keys: 'space', category: 'Transport' },
    ] as any[];

    it('should search by name', () => {
      const results = searchShortcuts(shortcuts, 'save');
      expect(results.length).toBe(1);
    });

    it('should search by keys', () => {
      const results = searchShortcuts(shortcuts, 'space');
      expect(results.length).toBe(1);
    });
  });

  describe('groupShortcutsByCategory', () => {
    const shortcuts = [
      { id: '1', name: 'Save', category: 'General' },
      { id: '2', name: 'Undo', category: 'General' },
      { id: '3', name: 'Play', category: 'Transport' },
    ] as any[];

    it('should group by category', () => {
      const groups = groupShortcutsByCategory(shortcuts);
      
      expect(groups.get('General')?.length).toBe(2);
      expect(groups.get('Transport')?.length).toBe(1);
    });
  });
});

// ============================================================================
// SEARCH EVERYTHING TESTS
// ============================================================================

describe('Search Everything', () => {
  describe('DEFAULT_SEARCH_EVERYTHING_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_SEARCH_EVERYTHING_CONFIG.maxResults).toBe(10);
      expect(DEFAULT_SEARCH_EVERYTHING_CONFIG.debounceMs).toBe(100);
    });
  });

  describe('createSearchEverythingState', () => {
    it('should create initial state', () => {
      const state = createSearchEverythingState();
      
      expect(state.open).toBe(false);
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
    });
  });

  describe('openSearchEverything', () => {
    it('should open and reset', () => {
      let state = createSearchEverythingState();
      state = { ...state, query: 'old', results: [{ id: '1' }] as any };
      state = openSearchEverything(state);
      
      expect(state.open).toBe(true);
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
    });
  });

  describe('updateSearchEverythingQuery', () => {
    it('should update query and set loading', () => {
      let state = createSearchEverythingState();
      state = updateSearchEverythingQuery(state, 'test');
      
      expect(state.query).toBe('test');
      expect(state.loading).toBe(true);
    });
  });

  describe('navigateSearchResults', () => {
    it('should navigate down', () => {
      let state = createSearchEverythingState();
      state = setSearchEverythingResults(state, [
        { id: '1' }, { id: '2' }, { id: '3' }
      ] as any);
      
      state = navigateSearchResults(state, 'down');
      expect(state.selectedIndex).toBe(1);
    });

    it('should wrap around', () => {
      let state = createSearchEverythingState();
      state = setSearchEverythingResults(state, [
        { id: '1' }, { id: '2' }
      ] as any);
      state = { ...state, selectedIndex: 1 };
      
      state = navigateSearchResults(state, 'down');
      expect(state.selectedIndex).toBe(0);
    });
  });

  describe('addRecentSearch', () => {
    it('should add to recent', () => {
      let state = createSearchEverythingState();
      state = addRecentSearch(state, 'test query');
      
      expect(state.recentSearches).toContain('test query');
    });

    it('should not add duplicates', () => {
      let state = createSearchEverythingState();
      state = addRecentSearch(state, 'test');
      state = addRecentSearch(state, 'test');
      
      expect(state.recentSearches.filter(s => s === 'test').length).toBe(1);
    });
  });
});

// ============================================================================
// SUGGESTED ACTIONS TESTS
// ============================================================================

describe('Suggested Actions', () => {
  describe('createSuggestedActionsState', () => {
    it('should create initial state', () => {
      const state = createSuggestedActionsState();
      
      expect(state.suggestions).toEqual([]);
      expect(state.dismissed).toEqual([]);
      expect(state.context).toEqual([]);
    });
  });

  describe('getVisibleSuggestions', () => {
    it('should filter by context and dismissed', () => {
      const state = {
        suggestions: [
          { id: '1', priority: 1, conditions: ['has-audio'] },
          { id: '2', priority: 2, conditions: ['has-midi'] },
          { id: '3', priority: 3, conditions: ['has-audio'] },
        ] as any,
        dismissed: ['1'],
        context: ['has-audio'],
      };
      
      const visible = getVisibleSuggestions(state);
      
      expect(visible.length).toBe(1);
      expect(visible[0]!.id).toBe('3');
    });

    it('should sort by priority', () => {
      const state = {
        suggestions: [
          { id: '1', priority: 1, conditions: [] },
          { id: '2', priority: 3, conditions: [] },
          { id: '3', priority: 2, conditions: [] },
        ] as any,
        dismissed: [],
        context: [],
      };
      
      const visible = getVisibleSuggestions(state);
      
      expect(visible[0]!.id).toBe('2');
    });
  });

  describe('dismissSuggestion', () => {
    it('should add to dismissed', () => {
      let state = createSuggestedActionsState();
      state = dismissSuggestion(state, 'suggestion-1');
      
      expect(state.dismissed).toContain('suggestion-1');
    });
  });
});

// ============================================================================
// ERROR EXPLAINER TESTS
// ============================================================================

describe('Error Explainer', () => {
  describe('DEFAULT_ERROR_EXPLANATION', () => {
    it('should have default explanation', () => {
      expect(DEFAULT_ERROR_EXPLANATION.code).toBe('UNKNOWN');
      expect(DEFAULT_ERROR_EXPLANATION.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('getErrorExplanation', () => {
    it('should return known error', () => {
      const explanations = new Map([
        ['AUTH_FAILED', { code: 'AUTH_FAILED', title: 'Authentication Failed' }],
      ]);
      const config = { explanations, defaultExplanation: DEFAULT_ERROR_EXPLANATION } as any;
      
      const result = getErrorExplanation(config, 'AUTH_FAILED');
      expect(result.code).toBe('AUTH_FAILED');
    });

    it('should return default for unknown', () => {
      const config = { explanations: new Map(), defaultExplanation: DEFAULT_ERROR_EXPLANATION } as any;
      
      const result = getErrorExplanation(config, 'UNKNOWN_CODE');
      expect(result.code).toBe('UNKNOWN');
    });
  });
});

// ============================================================================
// UNDO HISTORY TESTS
// ============================================================================

describe('Undo History', () => {
  describe('createUndoHistoryState', () => {
    it('should create initial state', () => {
      const state = createUndoHistoryState();
      
      expect(state.entries).toEqual([]);
      expect(state.currentIndex).toBe(-1);
    });
  });

  describe('addHistoryEntry', () => {
    it('should add entry and set current', () => {
      let state = createUndoHistoryState();
      state = addHistoryEntry(state, {
        actionName: 'Add Card',
        description: 'Added oscillator card',
        icon: 'plus',
        timestamp: Date.now(),
        preview: null,
      });
      
      expect(state.entries.length).toBe(1);
      expect(state.currentIndex).toBe(0);
      expect(state.entries[0]!.isCurrent).toBe(true);
    });

    it('should mark previous as not current', () => {
      let state = createUndoHistoryState();
      state = addHistoryEntry(state, { actionName: 'Action 1', description: '', icon: '', timestamp: 0, preview: null });
      state = addHistoryEntry(state, { actionName: 'Action 2', description: '', icon: '', timestamp: 0, preview: null });
      
      expect(state.entries[0]!.isCurrent).toBe(false);
      expect(state.entries[1]!.isCurrent).toBe(true);
    });
  });

  describe('jumpToHistoryEntry', () => {
    it('should jump to entry', () => {
      let state = createUndoHistoryState();
      state = addHistoryEntry(state, { actionName: 'Action 1', description: '', icon: '', timestamp: 0, preview: null });
      state = addHistoryEntry(state, { actionName: 'Action 2', description: '', icon: '', timestamp: 0, preview: null });
      
      const firstId = state.entries[0]!.id;
      state = jumpToHistoryEntry(state, firstId);
      
      expect(state.currentIndex).toBe(0);
      expect(state.entries[0]!.isCurrent).toBe(true);
      expect(state.entries[1]!.isCurrent).toBe(false);
    });
  });
});

// ============================================================================
// SIMPLIFIED MODE TESTS
// ============================================================================

describe('Simplified Mode', () => {
  describe('createSimplifiedModeState', () => {
    it('should create initial state', () => {
      const state = createSimplifiedModeState();
      
      expect(state.enabled).toBe(false);
      expect(state.level).toBe('beginner');
    });
  });

  describe('toggleSimplifiedMode', () => {
    it('should toggle enabled', () => {
      let state = createSimplifiedModeState();
      state = toggleSimplifiedMode(state);
      
      expect(state.enabled).toBe(true);
      
      state = toggleSimplifiedMode(state);
      expect(state.enabled).toBe(false);
    });
  });

  describe('setExperienceLevel', () => {
    it('should set level', () => {
      let state = createSimplifiedModeState();
      state = setExperienceLevel(state, 'advanced');
      
      expect(state.level).toBe('advanced');
    });
  });

  describe('isFeatureVisible', () => {
    const config = {
      hiddenFeatures: ['advanced-routing', 'modulation-matrix'],
      labels: new Map(),
      reducedOptions: new Map(),
      defaultPreset: 'simple',
    };

    it('should return true when simplified mode disabled', () => {
      const state = createSimplifiedModeState();
      expect(isFeatureVisible(state, config, 'advanced-routing')).toBe(true);
    });

    it('should hide features when enabled', () => {
      let state = createSimplifiedModeState();
      state = toggleSimplifiedMode(state);
      
      expect(isFeatureVisible(state, config, 'advanced-routing')).toBe(false);
    });

    it('should show features in showFeatures list', () => {
      let state = createSimplifiedModeState();
      state = toggleSimplifiedMode(state);
      state = { ...state, showFeatures: ['advanced-routing'] };
      
      expect(isFeatureVisible(state, config, 'advanced-routing')).toBe(true);
    });
  });
});

// ============================================================================
// PROGRESS INDICATOR TESTS
// ============================================================================

describe('Progress Indicator', () => {
  const steps = [
    { id: 'step1', label: 'Step 1', percentage: null },
    { id: 'step2', label: 'Step 2', percentage: null },
    { id: 'step3', label: 'Step 3', percentage: null },
  ];

  describe('createProgressIndicatorState', () => {
    it('should create with steps', () => {
      const state = createProgressIndicatorState(steps);
      
      expect(state.steps.length).toBe(3);
      expect(state.steps[0]!.status).toBe('active');
      expect(state.steps[1]!.status).toBe('pending');
      expect(state.overallProgress).toBe(0);
    });
  });

  describe('advanceProgress', () => {
    it('should advance and update progress', () => {
      let state = createProgressIndicatorState(steps);
      state = advanceProgress(state);
      
      expect(state.currentStep).toBe(1);
      expect(state.steps[0]!.status).toBe('completed');
      expect(state.steps[1]!.status).toBe('active');
      expect(state.overallProgress).toBeCloseTo(66.67, 0);
    });
  });

  describe('completeProgress', () => {
    it('should complete all', () => {
      let state = createProgressIndicatorState(steps);
      state = completeProgress(state);
      
      expect(state.overallProgress).toBe(100);
      expect(state.steps.every(s => s.status === 'completed')).toBe(true);
    });
  });
});

// ============================================================================
// ONBOARDING CHECKLIST TESTS
// ============================================================================

describe('Onboarding Checklist', () => {
  const tasks = [
    { id: 'task1', title: 'Add first card', description: 'Add a card', icon: 'plus', action: null, reward: null },
    { id: 'task2', title: 'Make a connection', description: 'Connect cards', icon: 'link', action: null, reward: null },
  ];

  describe('createOnboardingChecklistState', () => {
    it('should create with tasks', () => {
      const state = createOnboardingChecklistState(tasks);
      
      expect(state.tasks.length).toBe(2);
      expect(state.completedCount).toBe(0);
      expect(state.visible).toBe(true);
    });
  });

  describe('completeOnboardingTask', () => {
    it('should complete task', () => {
      let state = createOnboardingChecklistState(tasks);
      state = completeOnboardingTask(state, 'task1');
      
      expect(state.tasks[0]!.completed).toBe(true);
      expect(state.completedCount).toBe(1);
    });
  });

  describe('getOnboardingProgress', () => {
    it('should calculate progress', () => {
      let state = createOnboardingChecklistState(tasks);
      state = completeOnboardingTask(state, 'task1');
      
      const progress = getOnboardingProgress(state);
      
      expect(progress.completed).toBe(1);
      expect(progress.total).toBe(2);
      expect(progress.percentage).toBe(50);
    });
  });

  describe('dismissOnboarding', () => {
    it('should hide checklist', () => {
      let state = createOnboardingChecklistState(tasks);
      state = dismissOnboarding(state);
      
      expect(state.visible).toBe(false);
    });
  });
});
