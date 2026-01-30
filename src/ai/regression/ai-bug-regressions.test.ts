/**
 * @fileoverview Regression tests for previously fixed AI bugs
 *
 * N183: Add regression tests for fixed bugs.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPrologAdapter, resetPrologAdapter } from '../engine/prolog-adapter';
import { loadMusicTheoryKB, resetMusicTheoryLoader } from '../knowledge/music-theory-loader';
import { loadWorkflowPlanningKB, resetWorkflowPlanningLoader } from '../knowledge/workflow-planning-loader';
import { loadProjectAnalysisKB, resetProjectAnalysisLoader } from '../knowledge/project-analysis-loader';
import { loadUserPrefsKB, resetUserPrefsLoader } from '../knowledge/user-prefs-loader';
import { isKBLoaded } from '../engine/kb-lifecycle';
import {
  resetLearnedPatterns,
  trackDeckOpening,
  syncLearnedPatternsToKB,
} from '../learning/user-preferences';

describe('AI bug regressions (N183)', () => {
  beforeEach(() => {
    resetPrologAdapter();
    resetMusicTheoryLoader();
    resetWorkflowPlanningLoader();
    resetProjectAnalysisLoader();
    resetUserPrefsLoader();
    resetLearnedPatterns();
  });

  afterEach(() => {
    resetPrologAdapter();
    resetMusicTheoryLoader();
    resetWorkflowPlanningLoader();
    resetProjectAnalysisLoader();
    resetUserPrefsLoader();
    resetLearnedPatterns();
  });

  it('KB loaders track loaded state per adapter (multi-adapter regression)', async () => {
    const adapter1 = createPrologAdapter({ enableCache: false });
    const adapter2 = createPrologAdapter({ enableCache: false });

    await loadWorkflowPlanningKB(adapter1);
    const plan1 = await adapter1.querySingle('task_decomposition(make_beat, producer, Steps)');
    expect(plan1).not.toBeNull();

    // Should not be blocked from loading into adapter2 after adapter1 has loaded.
    await loadWorkflowPlanningKB(adapter2);
    const plan2 = await adapter2.querySingle('task_decomposition(make_beat, producer, Steps)');
    expect(plan2).not.toBeNull();

    await loadProjectAnalysisKB(adapter1);
    const issue1 = await adapter1.querySingle('missing_element_detection(no_bass, Remedy)');
    expect(issue1).not.toBeNull();

    await loadProjectAnalysisKB(adapter2);
    const issue2 = await adapter2.querySingle('missing_element_detection(no_bass, Remedy)');
    expect(issue2).not.toBeNull();

    await loadUserPrefsKB(adapter1);
    await adapter1.assertz('user_prefers_board(test_user, tracker).');
    expect((await adapter1.queryAll('user_prefers_board(test_user, _)')).length).toBe(1);

    // Adapter2 is separate and must load KB independently.
    await loadUserPrefsKB(adapter2);
    expect((await adapter2.queryAll('user_prefers_board(test_user, _)')).length).toBe(0);
  });

  it('syncLearnedPatternsToKB is updateable (no stale learned facts)', async () => {
    const adapter = createPrologAdapter({ enableCache: false });
    await loadUserPrefsKB(adapter);

    const userId = 'sim_user';

    // Train pattern: pattern_editor -> mixer -> effect_chain
    for (let i = 0; i < 3; i++) {
      trackDeckOpening('pattern_editor', 'beat_making');
      trackDeckOpening('mixer', 'beat_making');
      trackDeckOpening('effect_chain', 'beat_making');
    }
    await syncLearnedPatternsToKB(userId, adapter);

    const first = await adapter.queryAll(`learned_workflow_pattern(${userId}, _, Seq)`);
    expect(first.length).toBeGreaterThan(0);

    // Replace learned data with a different sequence and re-sync.
    resetLearnedPatterns();
    for (let i = 0; i < 3; i++) {
      trackDeckOpening('pattern_editor', 'beat_making');
      trackDeckOpening('mixer', 'beat_making');
      trackDeckOpening('automation', 'beat_making');
    }
    await syncLearnedPatternsToKB(userId, adapter);

    // Old sequence should no longer be present.
    const old = await adapter.queryAll(
      `learned_workflow_pattern(${userId}, _, [pattern_editor,mixer,effect_chain])`
    );
    expect(old.length).toBe(0);

    const updated = await adapter.queryAll(
      `learned_workflow_pattern(${userId}, _, [pattern_editor,mixer,automation])`
    );
    expect(updated.length).toBeGreaterThan(0);
  });

  it('isKBLoaded uses the provided adapter (regression for getAdapter reference)', async () => {
    const adapter = createPrologAdapter({ enableCache: false });

    expect(isKBLoaded('music-theory', adapter)).toBe(false);
    await loadMusicTheoryKB(adapter);
    expect(isKBLoaded('music-theory', adapter)).toBe(true);

    expect(isKBLoaded('user-prefs', adapter)).toBe(false);
    await loadUserPrefsKB(adapter);
    expect(isKBLoaded('user-prefs', adapter)).toBe(true);
  });
});

