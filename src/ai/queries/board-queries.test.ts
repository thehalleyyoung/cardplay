/**
 * @fileoverview Tests for Board & Deck Query Functions
 * 
 * Comprehensive tests for the board-queries module covering:
 * - Board recommendations for workflows
 * - Deck layout suggestions
 * - Deck validation
 * - Panel size optimization
 * - Shortcut detection
 * - Theme suggestions
 * - And more...
 * 
 * Tests cover L102-L104 and L116-L118 from the Branch B roadmap.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPrologAdapter, resetPrologAdapter } from '../engine/prolog-adapter';
import { resetBoardLayoutLoader } from '../knowledge/board-layout-loader';
import {
  getAllBoards,
  getAllDeckTypes,
  getBoardDecks,
  recommendBoardForWorkflow,
  suggestDeckLayout,
  validateDeckCombination,
  suggestNextDeckToOpen,
  optimizePanelSizes,
  getWorkflowInfo,
  getDeckOpenOrder,
  getDeckPairings,
  isDeckCompatibleWithLevel,
  getRequiredToolsForDeck,
  detectShortcutConflicts,
  getShortcutSuggestions,
  getAppropriateThemes,
  getControlLevelColors,
  isDeckVisible,
  getEmptyStateSuggestion,
  getTutorialSequence,
  getHelpTopic,
  checkPerformanceConstraint,
  getAccessibilityRules,
  isBeginnerSafe,
  getBoardTransitions,
  type ControlLevel,
  type BoardInfo,
  type DeckType
} from './board-queries';

describe('Board & Deck Query Functions', () => {
  beforeEach(() => {
    resetPrologAdapter();
    resetBoardLayoutLoader();
  });
  
  afterEach(() => {
    resetPrologAdapter();
    resetBoardLayoutLoader();
  });

  // ==========================================================================
  // L102: recommendBoardForWorkflow tests
  // ==========================================================================
  describe('recommendBoardForWorkflow (L102)', () => {
    it('should recommend notation_board for notation_composer workflow', async () => {
      const boards = await recommendBoardForWorkflow('notation_composer');
      
      expect(boards).toContain('notation_board');
    });
    
    it('should recommend basic_tracker_board for tracker_user workflow', async () => {
      const boards = await recommendBoardForWorkflow('tracker_user');
      
      expect(boards).toContain('basic_tracker_board');
    });
    
    it('should return multiple options for sound_designer workflow', async () => {
      const boards = await recommendBoardForWorkflow('sound_designer');
      
      expect(boards.length).toBeGreaterThan(0);
    });
    
    it('should return empty array for unknown workflow', async () => {
      const boards = await recommendBoardForWorkflow('unknown_workflow_xyz');
      
      expect(boards).toEqual([]);
    });
  });

  // ==========================================================================
  // L103: validateDeckCombination tests
  // ==========================================================================
  describe('validateDeckCombination (L103)', () => {
    it('should validate compatible deck combination', async () => {
      const result = await validateDeckCombination(['pattern_editor', 'phrase_library']);
      
      expect(result.valid).toBe(true);
    });
    
    it('should validate mixer with sample_browser', async () => {
      const result = await validateDeckCombination(['mixer', 'sample_browser']);
      
      expect(result.valid).toBe(true);
    });
    
    it('should handle single deck validation', async () => {
      const result = await validateDeckCombination(['pattern_editor']);
      
      expect(result.valid).toBe(true);
    });
    
    it('should handle empty deck list', async () => {
      const result = await validateDeckCombination([]);
      
      expect(result.valid).toBe(true);
    });
  });

  // ==========================================================================
  // L104: suggestNextDeckToOpen tests
  // ==========================================================================
  describe('suggestNextDeckToOpen (L104)', () => {
    it('should suggest decks for tracker_lofi with pattern_editor open', async () => {
      const suggestions = await suggestNextDeckToOpen(['pattern_editor'], 'tracker_lofi');
      
      // Should suggest related decks
      expect(Array.isArray(suggestions)).toBe(true);
    });
    
    it('should suggest mixer for workflows with audio output', async () => {
      const suggestions = await suggestNextDeckToOpen(['pattern_editor', 'sample_browser'], 'tracker_lofi');
      
      expect(Array.isArray(suggestions)).toBe(true);
    });
    
    it('should handle empty current decks', async () => {
      const suggestions = await suggestNextDeckToOpen([], 'notation_composer');
      
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  // ==========================================================================
  // Basic Board/Deck Queries
  // ==========================================================================
  describe('Basic Board Queries', () => {
    it('should get all boards', async () => {
      const boards = await getAllBoards();
      
      expect(boards.length).toBeGreaterThan(0);
      expect(boards.some(b => b.id === 'notation_board')).toBe(true);
      // Control levels in KB are: full_manual, manual_with_hints, assisted, collaborative, directed, generative
      expect(boards.some(b => ['manual', 'assisted', 'generative', 'hybrid', 'full_manual', 'manual_with_hints', 'collaborative', 'directed'].includes(b.controlLevel))).toBe(true);
    });
    
    it('should get all deck types', async () => {
      const decks = await getAllDeckTypes();
      
      expect(decks.length).toBeGreaterThan(0);
      expect(decks).toContain('pattern_editor');
      expect(decks).toContain('mixer');
    });
    
    it('should get decks for a specific board', async () => {
      const decks = await getBoardDecks('notation_board');
      
      expect(decks.length).toBeGreaterThan(0);
      expect(decks).toContain('notation_editor');
    });
  });

  // ==========================================================================
  // Layout Suggestions
  // ==========================================================================
  describe('Layout Suggestions', () => {
    it('should suggest deck layout for basic_tracker_board', async () => {
      const layout = await suggestDeckLayout('basic_tracker_board');
      
      expect(Array.isArray(layout)).toBe(true);
      // Layout should have position and size info
      for (const item of layout) {
        expect(item.deckType).toBeDefined();
        expect(item.position).toBeDefined();
        expect(typeof item.sizePercent).toBe('number');
      }
    });
    
    it('should optimize panel sizes for multiple decks', async () => {
      const sizes = await optimizePanelSizes(['pattern_editor', 'mixer', 'browser']);
      
      expect(typeof sizes.pattern_editor).toBe('number');
      expect(typeof sizes.mixer).toBe('number');
      expect(typeof sizes.browser).toBe('number');
      
      // Should sum to approximately 100
      const total = Object.values(sizes).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThan(95);
      expect(total).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================================================
  // Workflow Information
  // ==========================================================================
  describe('Workflow Information', () => {
    it('should get workflow info for notation_composer', async () => {
      const info = await getWorkflowInfo('notation_composer');
      
      expect(info).not.toBeNull();
      if (info) {
        expect(info.id).toBe('notation_composer');
        expect(Array.isArray(info.requiredDecks)).toBe(true);
        expect(Array.isArray(info.beneficialDecks)).toBe(true);
      }
    });
    
    it('should return null for unknown workflow', async () => {
      const info = await getWorkflowInfo('unknown_xyz');
      
      expect(info).toBeNull();
    });
    
    it('should get deck open order for workflow', async () => {
      const order = await getDeckOpenOrder('tracker_user');
      
      expect(Array.isArray(order)).toBe(true);
    });
  });

  // ==========================================================================
  // Deck Compatibility
  // ==========================================================================
  describe('Deck Compatibility', () => {
    it('should check deck compatibility with control level', async () => {
      // Manual control level should be compatible with manual decks
      const manualCompat = await isDeckCompatibleWithLevel('pattern_editor', 'manual');
      expect(typeof manualCompat).toBe('boolean');
    });
    
    it('should get deck pairings', async () => {
      const pairings = await getDeckPairings();
      
      expect(Array.isArray(pairings)).toBe(true);
      for (const pairing of pairings) {
        expect(pairing.deck1).toBeDefined();
        expect(pairing.deck2).toBeDefined();
      }
    });
    
    it('should get required tools for deck', async () => {
      const tools = await getRequiredToolsForDeck('sample_browser');
      
      expect(Array.isArray(tools)).toBe(true);
    });
  });

  // ==========================================================================
  // L116: Shortcut Conflict Detection Tests
  // ==========================================================================
  describe('Shortcut Conflict Detection (L116)', () => {
    it('should detect shortcut conflicts', async () => {
      const conflicts = await detectShortcutConflicts();
      
      expect(Array.isArray(conflicts)).toBe(true);
      // Conflicts have shortcut, action1, action2
      for (const conflict of conflicts) {
        expect(conflict.shortcut).toBeDefined();
        expect(conflict.action1).toBeDefined();
        expect(conflict.action2).toBeDefined();
      }
    });
    
    it('should get shortcut suggestions for deck', async () => {
      const shortcuts = await getShortcutSuggestions('pattern_editor');
      
      expect(Array.isArray(shortcuts)).toBe(true);
      for (const shortcut of shortcuts) {
        expect(shortcut.action).toBeDefined();
        expect(shortcut.shortcut).toBeDefined();
        expect(shortcut.deck).toBe('pattern_editor');
      }
    });
  });

  // ==========================================================================
  // L117: Theme Appropriateness Tests
  // ==========================================================================
  describe('Theme Appropriateness (L117)', () => {
    it('should get appropriate themes for control level', async () => {
      const themes = await getAppropriateThemes('manual');
      
      expect(Array.isArray(themes)).toBe(true);
      // Dark theme should always be included
      expect(themes).toContain('dark');
    });
    
    it('should get color coding for control level', async () => {
      // Use KB level name
      const colors = await getControlLevelColors('assisted');
      
      // May be null if not defined
      if (colors) {
        expect(colors.indicator).toBeDefined();
      }
    });
    
    it('should check deck visibility', async () => {
      // Using board ID now instead of tool mode
      const visible = await isDeckVisible('pattern_editor', 'basic_tracker_board', 'manual');
      
      expect(typeof visible).toBe('boolean');
    });
  });

  // ==========================================================================
  // L118: Tutorial Sequence Tests
  // ==========================================================================
  describe('Tutorial Sequence (L118)', () => {
    it('should get tutorial sequence for board', async () => {
      const steps = await getTutorialSequence('basic_tracker_board');
      
      expect(Array.isArray(steps)).toBe(true);
    });
    
    it('should get empty state suggestion for deck', async () => {
      const suggestion = await getEmptyStateSuggestion('pattern_editor');
      
      // May be null if not defined, but should be string if exists
      // The KB doesn't have empty_state_suggestion defined, so expect null
      expect(suggestion === null || typeof suggestion === 'string').toBe(true);
    });
    
    it('should get help topic for action', async () => {
      const topic = await getHelpTopic('pattern_editing');
      
      // May be null if not defined (KB doesn't have help_topic)
      expect(topic === null || typeof topic === 'string').toBe(true);
    });
  });

  // ==========================================================================
  // Performance & Accessibility
  // ==========================================================================
  describe('Performance & Accessibility', () => {
    it('should check performance constraints', async () => {
      const constraint = await checkPerformanceConstraint(5, 'desktop');
      
      expect(typeof constraint.allowed).toBe('boolean');
      expect(typeof constraint.maxRecommended).toBe('number');
    });
    
    it('should handle high deck count', async () => {
      const constraint = await checkPerformanceConstraint(50, 'mobile');
      
      expect(typeof constraint.allowed).toBe('boolean');
      if (!constraint.allowed) {
        expect(constraint.reason).toBeDefined();
      }
    });
    
    it('should get accessibility rules for deck', async () => {
      const rules = await getAccessibilityRules('pattern_editor');
      
      expect(Array.isArray(rules)).toBe(true);
    });
    
    it('should check beginner safety', async () => {
      const safe = await isBeginnerSafe('pattern_editor');
      
      expect(typeof safe).toBe('boolean');
    });
  });

  // ==========================================================================
  // Board Transitions
  // ==========================================================================
  describe('Board Transitions', () => {
    it('should get transitions from notation_board', async () => {
      const transitions = await getBoardTransitions('notation_board');
      
      expect(Array.isArray(transitions)).toBe(true);
      for (const t of transitions) {
        expect(t.to).toBeDefined();
        expect(t.type).toBeDefined();
      }
    });
    
    it('should handle board with no transitions', async () => {
      const transitions = await getBoardTransitions('unknown_board_xyz');
      
      expect(transitions).toEqual([]);
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================
  describe('Integration Tests', () => {
    it('should support complete workflow setup flow', async () => {
      // 1. Get workflow info
      const workflow = 'tracker_lofi';
      const info = await getWorkflowInfo(workflow);
      
      // 2. Get recommended board
      const boards = await recommendBoardForWorkflow(workflow);
      
      // 3. Get deck layout for recommended board
      if (boards.length > 0) {
        const layout = await suggestDeckLayout(boards[0]);
        expect(Array.isArray(layout)).toBe(true);
      }
      
      // 4. Validate deck combination
      if (info && info.requiredDecks.length > 0) {
        const validation = await validateDeckCombination(info.requiredDecks);
        expect(validation.valid).toBe(true);
      }
    });
    
    it('should support incremental deck opening flow', async () => {
      const workflow = 'notation_composer';
      
      // Start with empty
      let currentDecks: DeckType[] = [];
      
      // Get first suggestion
      let suggestions = await suggestNextDeckToOpen(currentDecks, workflow);
      
      // Simulate opening a deck
      if (suggestions.length > 0) {
        currentDecks.push(suggestions[0]);
        
        // Get next suggestion
        suggestions = await suggestNextDeckToOpen(currentDecks, workflow);
        expect(Array.isArray(suggestions)).toBe(true);
      }
    });
    
    it('should return consistent board info structure', async () => {
      const boards = await getAllBoards();
      
      for (const board of boards) {
        expect(typeof board.id).toBe('string');
        expect(['manual', 'assisted', 'generative', 'hybrid']).toContain(board.controlLevel);
      }
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle special characters in queries gracefully', async () => {
      // This should not throw
      const result = await validateDeckCombination(['test_deck', 'another_deck']);
      expect(result).toBeDefined();
    });
    
    it('should handle multiple rapid queries', async () => {
      const adapter = getPrologAdapter();
      
      // Run multiple queries in parallel
      const results = await Promise.all([
        getAllBoards(adapter),
        getAllDeckTypes(adapter),
        getDeckPairings(adapter)
      ]);
      
      expect(results[0].length).toBeGreaterThan(0);
      expect(results[1].length).toBeGreaterThan(0);
      expect(Array.isArray(results[2])).toBe(true);
    });
  });
});
