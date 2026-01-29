/**
 * @fileoverview User Preferences Tests
 *
 * L321-L323: Tests for user preference tracking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initializePreferences,
  getPreferences,
  recordBoardUsage,
  recordBoardTransition,
  setFavoriteDeckLayout,
  addFavoriteSeed,
  recordGeneratorStyle,
  saveConstraintTemplate,
  useConstraintTemplate,
  getRecommendedBoards,
  getRecommendedNextBoard,
  getRecommendedGeneratorStyle,
  serializePreferences,
  deserializePreferences,
  resetPreferences,
  updateUserPreferences,
  isLearningLocal,
  exportPreferences,
  importPreferences,
  getLearningSummary,
  // N101-N111: Enhanced learning
  trackDeckOpening,
  trackParameterAdjustment,
  trackRoutingCreation,
  trackBoardConfiguration,
  detectWorkflowPatterns,
  getParameterPreferences,
  suggestFromLearnedPatterns,
  getLearnedRoutingPatterns,
  getLearnedBoardConfigurations,
  resetLearnedPatterns,
  // N122: Teach patterns manually
  teachWorkflowPattern,
  teachRoutingPattern,
  // N136-N137: Error pattern tracking
  trackErrorPattern,
  getErrorPatterns,
  getProactiveCorrections,
  type UserAction,
} from './user-preferences';

// ============================================================================
// Test Setup
// ============================================================================

describe('User Preferences', () => {
  beforeEach(() => {
    resetPreferences();
    initializePreferences('test-user');
  });

  afterEach(() => {
    resetPreferences();
  });

  // ==========================================================================
  // Initialization
  // ==========================================================================

  describe('initialization', () => {
    it('should initialize preferences for a user', () => {
      const prefs = getPreferences();

      expect(prefs).toBeDefined();
      expect(prefs?.userId).toBe('test-user');
      expect(prefs?.boards.frequentBoards).toEqual([]);
      expect(prefs?.generators.favoriteSeeds).toEqual([]);
    });

    it('should have version number', () => {
      const prefs = getPreferences();

      expect(prefs?.version).toBe(1);
    });
  });

  // ==========================================================================
  // L322: Board Preference Tracking
  // ==========================================================================

  describe('board preferences (L322)', () => {
    it('should record board usage', () => {
      recordBoardUsage('notation-board', 'Notation Board', 300, ['composition']);

      const prefs = getPreferences();
      expect(prefs?.boards.frequentBoards).toHaveLength(1);
      expect(prefs?.boards.frequentBoards[0].boardId).toBe('notation-board');
      expect(prefs?.boards.frequentBoards[0].useCount).toBe(1);
      expect(prefs?.boards.frequentBoards[0].workflows).toContain('composition');
    });

    it('should track multiple board usages', () => {
      recordBoardUsage('board-a', 'Board A', 100, ['workflow1']);
      recordBoardUsage('board-b', 'Board B', 200, ['workflow2']);
      recordBoardUsage('board-a', 'Board A', 150, ['workflow1', 'workflow3']);

      const prefs = getPreferences();
      expect(prefs?.boards.frequentBoards).toHaveLength(2);

      const boardA = prefs?.boards.frequentBoards.find((b) => b.boardId === 'board-a');
      expect(boardA?.useCount).toBe(2);
      expect(boardA?.averageSessionDuration).toBe(125); // (100 + 150) / 2
    });

    it('should sort boards by frequency', () => {
      recordBoardUsage('board-a', 'Board A', 100, []);
      recordBoardUsage('board-b', 'Board B', 100, []);
      recordBoardUsage('board-b', 'Board B', 100, []);

      const prefs = getPreferences();
      expect(prefs?.boards.frequentBoards[0].boardId).toBe('board-b'); // used twice
      expect(prefs?.boards.frequentBoards[1].boardId).toBe('board-a'); // used once
    });

    it('should record board transitions', () => {
      recordBoardTransition('board-a', 'board-b', 30);
      recordBoardTransition('board-a', 'board-b', 50);

      const prefs = getPreferences();
      const transition = prefs?.boards.boardSwitchPatterns.find(
        (p) => p.fromBoard === 'board-a' && p.toBoard === 'board-b'
      );

      expect(transition?.count).toBe(2);
      expect(transition?.averageTimeBetween).toBe(40); // (30 + 50) / 2
    });

    it('should set favorite deck layout', () => {
      setFavoriteDeckLayout('board-1', 'layout-grid', 'Grid Layout', false, 5);

      const prefs = getPreferences();
      const layout = prefs?.boards.favoriteLayouts.get('board-1');

      expect(layout?.layoutId).toBe('layout-grid');
      expect(layout?.rating).toBe(5);
      expect(layout?.customized).toBe(false);
    });

    it('should track time per board', () => {
      recordBoardUsage('board-1', 'Board 1', 300, []);
      recordBoardUsage('board-1', 'Board 1', 200, []);

      const prefs = getPreferences();
      const totalTime = prefs?.boards.timePerBoard.get('board-1');

      expect(totalTime).toBe(500);
    });
  });

  // ==========================================================================
  // L323: Generator Preference Tracking
  // ==========================================================================

  describe('generator preferences (L323)', () => {
    it('should add favorite seeds', () => {
      addFavoriteSeed(12345);
      addFavoriteSeed(67890);

      const prefs = getPreferences();
      expect(prefs?.generators.favoriteSeeds).toContain(12345);
      expect(prefs?.generators.favoriteSeeds).toContain(67890);
    });

    it('should not duplicate seeds', () => {
      addFavoriteSeed(12345);
      addFavoriteSeed(12345);

      const prefs = getPreferences();
      expect(prefs?.generators.favoriteSeeds).toHaveLength(1);
    });

    it('should record generator style usage', () => {
      recordGeneratorStyle('melody', 'jazz', true, 5);

      const prefs = getPreferences();
      const style = prefs?.generators.stylePreferences.get('melody');

      expect(style?.style).toBe('jazz');
      expect(style?.useCount).toBe(1);
      expect(style?.successRate).toBe(1);
      expect(style?.averageRating).toBe(5);
    });

    it('should track success rate correctly', () => {
      recordGeneratorStyle('bass', 'funk', true);
      recordGeneratorStyle('bass', 'funk', false);
      recordGeneratorStyle('bass', 'funk', true);

      const prefs = getPreferences();
      const style = prefs?.generators.stylePreferences.get('bass');

      expect(style?.useCount).toBe(3);
      expect(style?.successRate).toBeCloseTo(0.666, 2); // 2 successes out of 3
    });

    it('should save constraint templates', () => {
      const templateId = saveConstraintTemplate('My Template', 'chord', {
        key: 'C',
        mode: 'major',
        complexity: 0.7,
      });

      const prefs = getPreferences();
      const template = prefs?.generators.constraintTemplates.find((t) => t.id === templateId);

      expect(template).toBeDefined();
      expect(template?.name).toBe('My Template');
      expect(template?.generator).toBe('chord');
      expect(template?.constraints.get('key')).toBe('C');
    });

    it('should increment template use count', () => {
      const templateId = saveConstraintTemplate('Test Template', 'drum', {});

      useConstraintTemplate(templateId);
      useConstraintTemplate(templateId);

      const prefs = getPreferences();
      const template = prefs?.generators.constraintTemplates.find((t) => t.id === templateId);

      expect(template?.useCount).toBe(3); // 1 from save + 2 from use
    });
  });

  // ==========================================================================
  // Recommendations
  // ==========================================================================

  describe('recommendations', () => {
    it('should recommend frequently used boards', () => {
      recordBoardUsage('board-a', 'Board A', 100, []);
      recordBoardUsage('board-b', 'Board B', 100, []);
      recordBoardUsage('board-a', 'Board A', 100, []);

      const recommended = getRecommendedBoards(5);

      expect(recommended).toHaveLength(2);
      expect(recommended[0].boardId).toBe('board-a'); // most frequent
    });

    it('should recommend next board based on transitions', () => {
      recordBoardTransition('board-a', 'board-b', 10);
      recordBoardTransition('board-a', 'board-c', 10);
      recordBoardTransition('board-a', 'board-b', 10); // board-b twice

      const nextBoard = getRecommendedNextBoard('board-a');

      expect(nextBoard).toBe('board-b');
    });

    it('should recommend generator style', () => {
      recordGeneratorStyle('melody', 'classical', true);

      const style = getRecommendedGeneratorStyle('melody');

      expect(style).toBe('classical');
    });

    it('should return null for unknown generator', () => {
      const style = getRecommendedGeneratorStyle('arpeggio');

      expect(style).toBeNull();
    });
  });

  // ==========================================================================
  // Persistence
  // ==========================================================================

  describe('persistence', () => {
    it('should serialize preferences to JSON', () => {
      recordBoardUsage('test-board', 'Test Board', 100, ['workflow']);
      addFavoriteSeed(12345);

      const json = serializePreferences();

      expect(json).toBeDefined();
      expect(json).toContain('test-user');
      expect(json).toContain('test-board');
      expect(json).toContain('12345');
    });

    it('should deserialize preferences from JSON', () => {
      recordBoardUsage('original-board', 'Original', 100, []);
      const json = serializePreferences();

      // Reset and deserialize
      resetPreferences();
      deserializePreferences(json!);

      const prefs = getPreferences();
      expect(prefs?.userId).toBe('test-user');
      expect(prefs?.boards.frequentBoards).toHaveLength(1);
      expect(prefs?.boards.frequentBoards[0].boardId).toBe('original-board');
    });

    it('should preserve all data through serialization', () => {
      // Create complex preferences
      recordBoardUsage('board-1', 'Board 1', 300, ['comp', 'arr']);
      recordBoardTransition('board-1', 'board-2', 50);
      setFavoriteDeckLayout('board-1', 'layout-1', 'Layout 1', true, 5);
      addFavoriteSeed(999);
      recordGeneratorStyle('melody', 'jazz', true, 4);
      const templateId = saveConstraintTemplate('Template', 'bass', { key: 'C' });

      const json = serializePreferences();
      resetPreferences();
      deserializePreferences(json!);

      const prefs = getPreferences();

      // Verify all data preserved
      expect(prefs?.boards.frequentBoards).toHaveLength(1);
      expect(prefs?.boards.boardSwitchPatterns).toHaveLength(1);
      expect(prefs?.boards.favoriteLayouts.size).toBe(1);
      expect(prefs?.generators.favoriteSeeds).toContain(999);
      expect(prefs?.generators.stylePreferences.size).toBe(1);
      expect(prefs?.generators.constraintTemplates).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty preferences', () => {
      const recommended = getRecommendedBoards();
      expect(recommended).toEqual([]);

      const nextBoard = getRecommendedNextBoard('board-1');
      expect(nextBoard).toBeNull();
    });

    it('should handle uninitialized preferences', () => {
      resetPreferences();

      const prefs = getPreferences();
      expect(prefs).toBeNull();

      const json = serializePreferences();
      expect(json).toBeNull();
    });

    it('should handle very large use counts', () => {
      for (let i = 0; i < 1000; i++) {
        recordBoardUsage('popular-board', 'Popular', 100, []);
      }

      const prefs = getPreferences();
      const board = prefs?.boards.frequentBoards[0];

      expect(board?.useCount).toBe(1000);
    });
  });

  // ==========================================================================
  // L341: Preference Tracking Correctness
  // ==========================================================================

  describe('preference tracking correctness (L341)', () => {
    it('should track via updateUserPreferences for board-switch', async () => {
      const action: UserAction = {
        type: 'board-switch',
        boardId: 'tracker-board',
        boardName: 'Tracker',
        sessionDuration: 120,
        workflows: ['pattern-edit'],
      };

      await updateUserPreferences(action);

      const prefs = getPreferences();
      expect(prefs?.boards.frequentBoards).toHaveLength(1);
      expect(prefs?.boards.frequentBoards[0].boardId).toBe('tracker-board');
    });

    it('should track via updateUserPreferences for generator-use', async () => {
      const action: UserAction = {
        type: 'generator-use',
        generator: 'melody',
        style: 'jazz',
        success: true,
        rating: 4,
      };

      await updateUserPreferences(action);

      const prefs = getPreferences();
      const style = prefs?.generators.stylePreferences.get('melody');
      expect(style?.style).toBe('jazz');
      expect(style?.successRate).toBe(1);
    });

    it('should track board transitions via updateUserPreferences', async () => {
      const action: UserAction = {
        type: 'board-switch',
        boardId: 'mixer-board',
        boardName: 'Mixer',
        previousBoardId: 'tracker-board',
        timeBetween: 45,
        sessionDuration: 60,
        workflows: [],
      };

      await updateUserPreferences(action);

      const prefs = getPreferences();
      const transition = prefs?.boards.boardSwitchPatterns.find(
        (p) => p.fromBoard === 'tracker-board' && p.toBoard === 'mixer-board'
      );
      expect(transition?.count).toBe(1);
      expect(transition?.averageTimeBetween).toBe(45);
    });
  });

  // ==========================================================================
  // L342: Learned Prefs Improve Recommendations
  // ==========================================================================

  describe('learned preferences improve recommendations (L342)', () => {
    it('should recommend boards in order of use frequency', () => {
      recordBoardUsage('board-a', 'A', 100, []);
      recordBoardUsage('board-b', 'B', 100, []);
      recordBoardUsage('board-b', 'B', 100, []);
      recordBoardUsage('board-c', 'C', 100, []);
      recordBoardUsage('board-c', 'C', 100, []);
      recordBoardUsage('board-c', 'C', 100, []);

      const recommended = getRecommendedBoards(3);
      expect(recommended[0].boardId).toBe('board-c');
      expect(recommended[1].boardId).toBe('board-b');
      expect(recommended[2].boardId).toBe('board-a');
    });

    it('should recommend generator style based on most used', () => {
      recordGeneratorStyle('bass', 'funk', true);
      recordGeneratorStyle('bass', 'funk', true);

      const style = getRecommendedGeneratorStyle('bass');
      expect(style).toBe('funk');
    });
  });

  // ==========================================================================
  // L343: Privacy Controls
  // ==========================================================================

  describe('privacy controls (L343)', () => {
    it('L335: all learning is local-only', () => {
      expect(isLearningLocal()).toBe(true);
    });

    it('L336: reset clears all data', () => {
      recordBoardUsage('board-1', 'Board', 100, []);
      addFavoriteSeed(42);

      resetPreferences();

      expect(getPreferences()).toBeNull();
    });

    it('L337: export produces valid JSON', () => {
      recordBoardUsage('board-1', 'Board', 100, ['workflow']);
      const json = exportPreferences();

      expect(json).toBeTruthy();
      expect(() => JSON.parse(json!)).not.toThrow();
    });

    it('L338: import restores preferences', () => {
      recordBoardUsage('board-x', 'Board X', 500, ['mixing']);
      addFavoriteSeed(77);
      const json = exportPreferences();

      resetPreferences();
      initializePreferences('import-user');
      importPreferences(json!);

      const prefs = getPreferences();
      expect(prefs?.boards.frequentBoards).toHaveLength(1);
      expect(prefs?.boards.frequentBoards[0].boardId).toBe('board-x');
      expect(prefs?.generators.favoriteSeeds).toContain(77);
    });
  });

  // ==========================================================================
  // L339-L340: Learning Summary & Correction
  // ==========================================================================

  describe('learning summary (L339-L340)', () => {
    it('L339: should return learning summary', () => {
      recordBoardUsage('notation-board', 'Notation', 300, ['composition']);
      recordBoardUsage('tracker-board', 'Tracker', 200, ['pattern-edit']);
      recordBoardUsage('notation-board', 'Notation', 250, ['composition']);
      recordGeneratorStyle('melody', 'classical', true);

      const summary = getLearningSummary();

      expect(summary).not.toBeNull();
      expect(summary!.userId).toBe('test-user');
      expect(summary!.topBoards.length).toBeGreaterThan(0);
      expect(summary!.totalBoardSessions).toBe(3);
      expect(summary!.estimatedSkillLevel).toBe('beginner'); // only 3 sessions
    });

    it('L339: should estimate skill level based on usage', () => {
      // Simulate 15 sessions
      for (let i = 0; i < 15; i++) {
        recordBoardUsage('board-1', 'Board', 60, []);
      }

      const summary = getLearningSummary();
      expect(summary!.estimatedSkillLevel).toBe('intermediate');
    });

    it('L339: should return null when no preferences', () => {
      resetPreferences();
      const summary = getLearningSummary();
      expect(summary).toBeNull();
    });
  });

  // ==========================================================================
  // Enhanced Learning (N101-N111)
  // ==========================================================================

  describe('enhanced learning (N101-N111)', () => {
    beforeEach(() => {
      resetLearnedPatterns();
    });

    afterEach(() => {
      resetLearnedPatterns();
    });

    it('N102: trackDeckOpening records deck openings', () => {
      trackDeckOpening('pattern_editor', 'beat_making');
      trackDeckOpening('pattern_editor', 'beat_making');
      trackDeckOpening('mixer', 'mixing');

      // Verify via workflow pattern detection (pattern needs >= 1 freq)
      // The log should have 3 entries
      const patterns = detectWorkflowPatterns(1);
      // With 3 log entries of [pattern_editor, pattern_editor, mixer], we get
      // subsequences: [pattern_editor, pattern_editor], [pattern_editor, mixer]
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('N103: trackParameterAdjustment records params', () => {
      trackParameterAdjustment('cutoff', 800, 'synth');
      trackParameterAdjustment('cutoff', 1200, 'synth');
      trackParameterAdjustment('volume', 0.8, 'mixer');

      const prefs = getParameterPreferences();
      expect(prefs.length).toBe(2); // cutoff::synth and volume::mixer
      // cutoff was adjusted twice, so it should rank first
      expect(prefs[0]!.paramName).toBe('cutoff');
      expect(prefs[0]!.frequency).toBe(2);
    });

    it('N103: getParameterPreferences filters by deckType', () => {
      trackParameterAdjustment('cutoff', 800, 'synth');
      trackParameterAdjustment('volume', 0.8, 'mixer');

      const synthPrefs = getParameterPreferences('synth');
      expect(synthPrefs.length).toBe(1);
      expect(synthPrefs[0]!.paramName).toBe('cutoff');
    });

    it('N104: trackRoutingCreation records routes', () => {
      trackRoutingCreation('synth', 'reverb', 'send_effect');
      trackRoutingCreation('synth', 'reverb', 'send_effect');
      trackRoutingCreation('drums', 'compressor', 'insert');

      const routes = getLearnedRoutingPatterns();
      expect(routes.length).toBe(2);
      // synth->reverb has frequency 2, should be first
      expect(routes[0]!.from).toBe('synth');
      expect(routes[0]!.frequency).toBe(2);
    });

    it('N104: getLearnedRoutingPatterns filters by source', () => {
      trackRoutingCreation('synth', 'reverb', 'send');
      trackRoutingCreation('drums', 'compressor', 'insert');

      const drumsOnly = getLearnedRoutingPatterns('drums');
      expect(drumsOnly.length).toBe(1);
      expect(drumsOnly[0]!.from).toBe('drums');
    });

    it('N105: trackBoardConfiguration records configs', () => {
      trackBoardConfiguration('tracker-board', ['pattern_editor', 'sample_browser']);
      trackBoardConfiguration('tracker-board', ['pattern_editor', 'sample_browser', 'mixer']);

      const configs = getLearnedBoardConfigurations('tracker-board');
      expect(configs.length).toBe(1);
      expect(configs[0]!.count).toBe(2);
      // Should reflect the latest deck types
      expect(configs[0]!.deckTypes).toContain('mixer');
    });

    it('N105: getLearnedBoardConfigurations returns all when no filter', () => {
      trackBoardConfiguration('tracker-board', ['pattern_editor']);
      trackBoardConfiguration('notation-board', ['notation_editor']);

      const all = getLearnedBoardConfigurations();
      expect(all.length).toBe(2);
    });

    it('N109: detectWorkflowPatterns finds recurring sequences', () => {
      // Simulate a recurring workflow: pattern -> sample -> mixer
      for (let i = 0; i < 5; i++) {
        trackDeckOpening('pattern_editor', 'beat');
        trackDeckOpening('sample_browser', 'beat');
        trackDeckOpening('mixer', 'beat');
      }

      const patterns = detectWorkflowPatterns(3);
      expect(patterns.length).toBeGreaterThan(0);
      // The sequence [pattern_editor, sample_browser] should appear 5 times
      const patternEditorToSample = patterns.find(
        (p) =>
          p.deckSequence.length === 2 &&
          p.deckSequence[0] === 'pattern_editor' &&
          p.deckSequence[1] === 'sample_browser'
      );
      expect(patternEditorToSample).toBeDefined();
      expect(patternEditorToSample!.frequency).toBeGreaterThanOrEqual(4);
    });

    it('N111: suggestFromLearnedPatterns predicts next deck', () => {
      // Build up a pattern: pattern -> sample -> mixer (repeated)
      for (let i = 0; i < 5; i++) {
        trackDeckOpening('pattern_editor', 'beat');
        trackDeckOpening('sample_browser', 'beat');
        trackDeckOpening('mixer', 'beat');
      }

      const suggestions = suggestFromLearnedPatterns(['pattern_editor']);
      // Should suggest 'sample_browser' since that always follows pattern_editor
      expect(suggestions).toContain('sample_browser');
    });

    it('N101: resetLearnedPatterns clears all stores including errors', () => {
      trackDeckOpening('a', 'ctx');
      trackParameterAdjustment('x', 1, 'deck');
      trackRoutingCreation('a', 'b', 'purpose');
      trackBoardConfiguration('board', ['deck']);
      trackErrorPattern('parallel_fifths', 'measure 1');

      resetLearnedPatterns();

      expect(detectWorkflowPatterns(1)).toEqual([]);
      expect(getParameterPreferences()).toEqual([]);
      expect(getLearnedRoutingPatterns()).toEqual([]);
      expect(getLearnedBoardConfigurations()).toEqual([]);
      expect(getErrorPatterns()).toEqual([]);
    });
  });

  // ==========================================================================
  // Error Pattern Tracking (N136-N137)
  // ==========================================================================

  describe('error pattern tracking (N136-N137)', () => {
    beforeEach(() => {
      resetLearnedPatterns();
    });

    afterEach(() => {
      resetLearnedPatterns();
    });

    it('N136: trackErrorPattern records occurrences', () => {
      trackErrorPattern('parallel_fifths', 'measure 4');
      trackErrorPattern('parallel_fifths', 'measure 12');
      trackErrorPattern('clipping_output');

      const patterns = getErrorPatterns();
      expect(patterns.length).toBe(2);
      // parallel_fifths has 2 occurrences, should be first
      expect(patterns[0]!.errorType).toBe('parallel_fifths');
      expect(patterns[0]!.count).toBe(2);
      expect(patterns[0]!.contexts).toEqual(['measure 4', 'measure 12']);
    });

    it('N136: getErrorPatterns filters by minCount', () => {
      trackErrorPattern('parallel_fifths');
      trackErrorPattern('parallel_fifths');
      trackErrorPattern('parallel_fifths');
      trackErrorPattern('clipping_output');

      const frequent = getErrorPatterns(3);
      expect(frequent.length).toBe(1);
      expect(frequent[0]!.errorType).toBe('parallel_fifths');
    });

    it('N139: error patterns are detected correctly', () => {
      // Track same error multiple times in different contexts
      for (let i = 0; i < 5; i++) {
        trackErrorPattern('voice_crossing', `beat ${i}`);
      }

      const patterns = getErrorPatterns(1);
      const voiceCrossing = patterns.find((p) => p.errorType === 'voice_crossing');
      expect(voiceCrossing).toBeDefined();
      expect(voiceCrossing!.count).toBe(5);
      expect(voiceCrossing!.contexts.length).toBe(5);
    });

    it('N137: getProactiveCorrections returns suggestions for frequent errors', async () => {
      // Track enough occurrences to exceed threshold
      for (let i = 0; i < 4; i++) {
        trackErrorPattern('parallel_fifths');
      }
      trackErrorPattern('clipping_output'); // only 1, below threshold

      const corrections = await getProactiveCorrections(3);
      expect(corrections.length).toBe(1);
      expect(corrections[0]!.errorType).toBe('parallel_fifths');
      expect(corrections[0]!.occurrences).toBe(4);
      expect(corrections[0]!.suggestion).toContain('contrary');
    });

    it('N140: corrective suggestions reduce errors (API surface)', async () => {
      // This tests the integration: track error -> get suggestion -> verify it's actionable
      for (let i = 0; i < 5; i++) {
        trackErrorPattern('feedback_loop');
      }

      const corrections = await getProactiveCorrections(3);
      const fbCorrection = corrections.find((c) => c.errorType === 'feedback_loop');
      expect(fbCorrection).toBeDefined();
      expect(fbCorrection!.suggestion).toContain('routing');
    });
  });

  // ==========================================================================
  // N122: Teach Action — Manual Pattern Addition
  // ==========================================================================

  describe('teach action (N122)', () => {
    beforeEach(() => {
      resetLearnedPatterns();
    });

    afterEach(() => {
      resetLearnedPatterns();
    });

    it('N122: teachWorkflowPattern adds a detectable pattern', () => {
      const patternId = teachWorkflowPattern(
        'my_beat_workflow',
        ['drum_machine', 'sample_browser', 'mixer'],
        'beat_making'
      );

      expect(patternId).toContain('taught_my_beat_workflow');

      // The pattern should be detectable
      const patterns = detectWorkflowPatterns(1);
      expect(patterns.length).toBeGreaterThan(0);
      const found = patterns.find(
        (p) =>
          p.deckSequence.includes('drum_machine') &&
          p.deckSequence.includes('sample_browser')
      );
      expect(found).toBeDefined();
    });

    it('N122: taught pattern shows up in suggestions', () => {
      teachWorkflowPattern(
        'scoring_workflow',
        ['notation_editor', 'orchestration_browser', 'mixer'],
        'scoring'
      );

      const suggestions = suggestFromLearnedPatterns(['notation_editor']);
      // Should suggest the next deck in the taught sequence
      expect(suggestions).toContain('orchestration_browser');
    });

    it('N122: teachWorkflowPattern requires at least 2 decks', () => {
      expect(() => {
        teachWorkflowPattern('too_short', ['single_deck']);
      }).toThrow('at least 2');
    });

    it('N122: teachRoutingPattern creates a learned route', () => {
      teachRoutingPattern('synth', 'chorus', 'modulation_effect');

      const routes = getLearnedRoutingPatterns('synth');
      expect(routes.length).toBe(1);
      expect(routes[0]!.to).toBe('chorus');
      expect(routes[0]!.frequency).toBeGreaterThanOrEqual(3);
    });

    it('N122: multiple taught patterns coexist', () => {
      teachWorkflowPattern('workflow_a', ['a', 'b', 'c']);
      teachWorkflowPattern('workflow_b', ['x', 'y', 'z']);

      const patterns = detectWorkflowPatterns(1);
      // Should detect subsequences from both taught patterns
      const hasAB = patterns.some(
        (p) => p.deckSequence.includes('a') && p.deckSequence.includes('b')
      );
      const hasXY = patterns.some(
        (p) => p.deckSequence.includes('x') && p.deckSequence.includes('y')
      );
      expect(hasAB).toBe(true);
      expect(hasXY).toBe(true);
    });
  });

  // ==========================================================================
  // L357: Performance Test — Preference Queries < 5ms
  // ==========================================================================

  describe('performance: preference queries (L357)', () => {
    it('L357: getRecommendedBoards completes in < 5ms', () => {
      // Setup realistic data
      for (let i = 0; i < 20; i++) {
        recordBoardUsage(`board-${i}`, `Board ${i}`, 100, ['workflow']);
      }

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        getRecommendedBoards(5);
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / 100;
      expect(avgMs).toBeLessThan(5);
    });

    it('L357: getRecommendedNextBoard completes in < 5ms', () => {
      for (let i = 0; i < 20; i++) {
        recordBoardTransition(`board-${i}`, `board-${(i + 1) % 20}`, 10);
      }

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        getRecommendedNextBoard('board-0');
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / 100;
      expect(avgMs).toBeLessThan(5);
    });

    it('L357: detectWorkflowPatterns completes in < 5ms for typical log', () => {
      // Build up a realistic log (50 entries)
      const decks = ['pattern_editor', 'sample_browser', 'mixer', 'effect_chain', 'automation'];
      for (let i = 0; i < 50; i++) {
        trackDeckOpening(decks[i % decks.length]!, 'perf_test');
      }

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        detectWorkflowPatterns(3);
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / 100;
      expect(avgMs).toBeLessThan(5);
    });

    it('L357: suggestFromLearnedPatterns completes in < 5ms', () => {
      // Build up patterns
      for (let i = 0; i < 10; i++) {
        trackDeckOpening('pattern_editor', 'beat');
        trackDeckOpening('sample_browser', 'beat');
        trackDeckOpening('mixer', 'beat');
      }

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        suggestFromLearnedPatterns(['pattern_editor']);
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / 100;
      expect(avgMs).toBeLessThan(5);
    });

    it('L357: getParameterPreferences completes in < 5ms', () => {
      for (let i = 0; i < 50; i++) {
        trackParameterAdjustment(`param_${i}`, i, 'deck');
      }

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        getParameterPreferences();
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / 100;
      expect(avgMs).toBeLessThan(5);
    });
  });
});
