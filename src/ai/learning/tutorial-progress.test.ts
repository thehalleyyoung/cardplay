/**
 * @fileoverview Tutorial Progress Tracking Tests
 *
 * M352-M354: Tests for adaptive tutorial progress tracking.
 *
 * @module @cardplay/ai/learning/tutorial-progress.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  startTutorialWithSteps,
  completeTutorialStep,
  skipTutorialStep,
  beginTutorialStep,
  getTutorialProgress,
  getAllTutorialProgress,
  getTutorialProgressSummary,
  getTutorialHints,
  getNextTutorialStep,
  resetTutorialProgress,
  resetAllTutorialProgress,
  exportTutorialProgress,
  importTutorialProgress,
} from './tutorial-progress';

describe('TutorialProgress', () => {
  beforeEach(() => {
    resetAllTutorialProgress();
  });

  // ===========================================================================
  // M352: Start tutorials
  // ===========================================================================

  describe('start tutorial (M352)', () => {
    it('starts a tutorial with explicit steps', () => {
      const progress = startTutorialWithSteps('getting_started', 'beginner', [
        'Open a board',
        'Add a deck',
        'Create your first pattern',
      ]);

      expect(progress).not.toBeNull();
      expect(progress!.tutorialId).toBe('getting_started');
      expect(progress!.skillLevel).toBe('beginner');
      expect(progress!.steps).toHaveLength(3);
      expect(progress!.completionPercent).toBe(0);
      expect(progress!.completedAt).toBeNull();
      expect(progress!.steps[0].status).toBe('not-started');
    });

    it('returns existing progress if tutorial already started', () => {
      const p1 = startTutorialWithSteps('t1', 'beginner', ['Step 1', 'Step 2']);
      const p2 = startTutorialWithSteps('t1', 'beginner', ['Different steps']);
      expect(p1!.tutorialId).toBe(p2!.tutorialId);
      expect(p2!.steps).toHaveLength(2); // Original steps preserved
    });

    it('returns null for empty steps', () => {
      const p = startTutorialWithSteps('empty', 'beginner', []);
      expect(p).toBeNull();
    });
  });

  // ===========================================================================
  // M353: Track progress
  // ===========================================================================

  describe('progress tracking (M353)', () => {
    beforeEach(() => {
      startTutorialWithSteps('test_tutorial', 'beginner', [
        'Step 1: Open board',
        'Step 2: Add deck',
        'Step 3: Create pattern',
      ]);
    });

    it('marks a step as in-progress', () => {
      const p = beginTutorialStep('test_tutorial', 'test_tutorial_step_0');
      expect(p).not.toBeNull();
      expect(p!.steps[0].status).toBe('in-progress');
    });

    it('marks a step as completed', () => {
      const p = completeTutorialStep('test_tutorial', 'test_tutorial_step_0');
      expect(p).not.toBeNull();
      expect(p!.steps[0].status).toBe('completed');
      expect(p!.steps[0].completedAt).toBeTruthy();
      expect(p!.completionPercent).toBe(33); // 1/3
    });

    it('marks a step as skipped', () => {
      const p = skipTutorialStep('test_tutorial', 'test_tutorial_step_1');
      expect(p).not.toBeNull();
      expect(p!.steps[1].status).toBe('skipped');
    });

    it('tracks completion percentage', () => {
      completeTutorialStep('test_tutorial', 'test_tutorial_step_0');
      const p = completeTutorialStep('test_tutorial', 'test_tutorial_step_1');
      expect(p!.completionPercent).toBe(67); // 2/3
    });

    it('marks tutorial complete when all steps done', () => {
      completeTutorialStep('test_tutorial', 'test_tutorial_step_0');
      completeTutorialStep('test_tutorial', 'test_tutorial_step_1');
      const p = completeTutorialStep('test_tutorial', 'test_tutorial_step_2');
      expect(p!.completionPercent).toBe(100);
      expect(p!.completedAt).toBeTruthy();
    });

    it('counts skipped steps toward completion', () => {
      completeTutorialStep('test_tutorial', 'test_tutorial_step_0');
      skipTutorialStep('test_tutorial', 'test_tutorial_step_1');
      const p = completeTutorialStep('test_tutorial', 'test_tutorial_step_2');
      expect(p!.completionPercent).toBe(100);
      expect(p!.completedAt).toBeTruthy();
    });

    it('returns null for unknown tutorial', () => {
      expect(completeTutorialStep('nope', 'step_0')).toBeNull();
    });

    it('returns null for unknown step', () => {
      expect(completeTutorialStep('test_tutorial', 'nope')).toBeNull();
    });
  });

  // ===========================================================================
  // Summary and retrieval
  // ===========================================================================

  describe('summary and retrieval', () => {
    it('retrieves progress for a specific tutorial', () => {
      startTutorialWithSteps('t1', 'beginner', ['S1', 'S2']);
      const p = getTutorialProgress('t1');
      expect(p).not.toBeNull();
      expect(p!.tutorialId).toBe('t1');
    });

    it('returns null for untracked tutorial', () => {
      expect(getTutorialProgress('nonexistent')).toBeNull();
    });

    it('lists all tracked tutorials', () => {
      startTutorialWithSteps('t1', 'beginner', ['S1']);
      startTutorialWithSteps('t2', 'intermediate', ['S1', 'S2']);
      expect(getAllTutorialProgress()).toHaveLength(2);
    });

    it('provides overall summary', () => {
      startTutorialWithSteps('t1', 'beginner', ['S1', 'S2']);
      startTutorialWithSteps('t2', 'intermediate', ['S1']);
      completeTutorialStep('t2', 't2_step_0');

      const summary = getTutorialProgressSummary();
      expect(summary.totalTutorials).toBe(2);
      expect(summary.completedTutorials).toBe(1);
      expect(summary.inProgressTutorials).toBe(0); // t1 has 0% progress
      expect(summary.overallCompletionPercent).toBe(33); // 1 of 3 steps
    });

    it('tracks recent activity', () => {
      startTutorialWithSteps('t1', 'beginner', ['S1', 'S2']);
      completeTutorialStep('t1', 't1_step_0');

      const summary = getTutorialProgressSummary();
      // Activity: 1 'started' + 1 'completed' = 2 entries
      expect(summary.recentActivity.length).toBeGreaterThanOrEqual(2);
      expect(summary.recentActivity[0].action).toBe('completed');
    });
  });

  // ===========================================================================
  // M354: Contextual hints
  // ===========================================================================

  describe('contextual hints (M354)', () => {
    it('returns hints matching context from in-progress tutorials', () => {
      startTutorialWithSteps('mixing_tutorial', 'beginner', [
        'Open the mixer deck',
        'Adjust volume levels',
        'Add EQ to the bass track',
      ]);

      const hints = getTutorialHints('mixer');
      expect(hints.length).toBeGreaterThan(0);
      expect(hints[0].hintText).toContain('mixer');
    });

    it('returns no hints for completed tutorials', () => {
      startTutorialWithSteps('done_tutorial', 'beginner', ['Use the mixer']);
      completeTutorialStep('done_tutorial', 'done_tutorial_step_0');

      const hints = getTutorialHints('mixer');
      expect(hints).toHaveLength(0);
    });

    it('returns no hints for unmatched context', () => {
      startTutorialWithSteps('t1', 'beginner', ['Open notation editor']);
      const hints = getTutorialHints('xyz_nonexistent');
      expect(hints).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Next step
  // ===========================================================================

  describe('get next step', () => {
    it('returns first uncompleted step', () => {
      startTutorialWithSteps('t1', 'beginner', ['S1', 'S2', 'S3']);
      completeTutorialStep('t1', 't1_step_0');
      const next = getNextTutorialStep('t1');
      expect(next).not.toBeNull();
      expect(next!.stepId).toBe('t1_step_1');
    });

    it('returns null when all steps complete', () => {
      startTutorialWithSteps('t1', 'beginner', ['S1']);
      completeTutorialStep('t1', 't1_step_0');
      expect(getNextTutorialStep('t1')).toBeNull();
    });

    it('returns null for unknown tutorial', () => {
      expect(getNextTutorialStep('nope')).toBeNull();
    });
  });

  // ===========================================================================
  // Reset
  // ===========================================================================

  describe('reset', () => {
    it('resets a specific tutorial', () => {
      startTutorialWithSteps('t1', 'beginner', ['S1']);
      expect(resetTutorialProgress('t1')).toBe(true);
      expect(getTutorialProgress('t1')).toBeNull();
    });

    it('returns false for unknown tutorial', () => {
      expect(resetTutorialProgress('nope')).toBe(false);
    });
  });

  // ===========================================================================
  // Export / Import
  // ===========================================================================

  describe('export and import', () => {
    it('round-trips progress through export/import', () => {
      startTutorialWithSteps('t1', 'beginner', ['S1', 'S2']);
      completeTutorialStep('t1', 't1_step_0');

      const exported = exportTutorialProgress();
      expect(exported.progress).toHaveLength(1);
      expect(exported.activity.length).toBeGreaterThan(0);

      resetAllTutorialProgress();
      expect(getAllTutorialProgress()).toHaveLength(0);

      importTutorialProgress(exported);
      expect(getAllTutorialProgress()).toHaveLength(1);
      expect(getTutorialProgress('t1')!.completionPercent).toBe(50);
    });
  });
});
