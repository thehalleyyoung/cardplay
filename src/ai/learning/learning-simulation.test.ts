/**
 * @fileoverview Simulated usage tests for learning/adaptation
 *
 * N146: Run learning system over simulated usage.
 * N147: Verify learning improves suggestions measurably.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPrologAdapter, resetPrologAdapter } from '../engine/prolog-adapter';
import { resetUserPrefsLoader } from '../knowledge/user-prefs-loader';
import {
  initializePreferences,
  resetPreferences,
  updateUserPreferences,
  syncPreferencesToKB,
  getKBRecommendedBoards,
  shouldSimplifyForUser,
  trackDeckOpening,
  resetLearnedPatterns,
  suggestFromLearnedPatterns,
  syncLearnedPatternsToKB,
} from './user-preferences';

describe('Learning simulation (N146-N147)', () => {
  beforeEach(() => {
    resetPrologAdapter();
    resetUserPrefsLoader();
    resetPreferences();
    resetLearnedPatterns();
  });

  afterEach(() => {
    resetPrologAdapter();
    resetUserPrefsLoader();
    resetPreferences();
    resetLearnedPatterns();
  });

  it('N146: simulated usage produces recommendations and updates simplify policy', async () => {
    const adapter = createPrologAdapter({ enableCache: false });
    const userId = 'sim_user';
    initializePreferences(userId);

    // Simulate repeated board usage to move out of "beginner"
    for (let i = 0; i < 12; i++) {
      await updateUserPreferences(
        {
          type: 'board-switch',
          boardId: 'tracker',
          boardName: 'Tracker',
          sessionDuration: 30_000,
        },
        false,
      );
    }

    await syncPreferencesToKB(adapter);

    const boards = await getKBRecommendedBoards(userId, adapter);
    expect(boards.length).toBeGreaterThan(0);
    expect(boards).toContain('tracker');

    const simplify = await shouldSimplifyForUser(userId, adapter);
    expect(simplify).toBe(false);
  });

  it('N147: learned workflow patterns measurably improve next-deck predictions', async () => {
    const adapter = createPrologAdapter({ enableCache: false });
    const userId = 'sim_user';

    // Baseline: no training data containing the prefix [pattern_editor, mixer]
    const baseline = suggestFromLearnedPatterns(['pattern_editor', 'mixer']);
    expect(baseline).toEqual([]);

    // Train: repeat a workflow pattern so it becomes learnable
    resetLearnedPatterns();
    for (let i = 0; i < 6; i++) {
      trackDeckOpening('pattern_editor', 'beat_making');
      trackDeckOpening('mixer', 'beat_making');
      trackDeckOpening('effect_chain', 'beat_making');
    }

    const trained = suggestFromLearnedPatterns(['pattern_editor', 'mixer']);
    expect(trained.length).toBeGreaterThan(0);
    expect(trained[0]).toBe('effect_chain');

    // Also verify the Prolog-level inference path after syncing learned patterns.
    await syncLearnedPatternsToKB(userId, adapter);
    const kbResult = await adapter.querySingle(
      `suggest_workflow(${userId}, [pattern_editor,mixer], Next)`
    );
    expect(kbResult).not.toBeNull();
    expect(String(kbResult!.Next)).toBe('effect_chain');
  });
});

