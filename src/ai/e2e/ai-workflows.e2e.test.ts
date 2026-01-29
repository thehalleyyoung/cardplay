/**
 * @fileoverview End-to-end AI workflow tests
 *
 * N182: Add end-to-end tests for AI workflows.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPrologAdapter, resetPrologAdapter } from '../engine/prolog-adapter';
import { loadAllKBs } from '../engine/kb-lifecycle';
import {
  planWorkflow,
  validateWorkflow,
  executeWorkflowStep,
  suggestRouting,
  validateSignalFlowGraph,
  analyzeProject,
} from '../queries/workflow-queries';
import {
  initializePreferences,
  resetPreferences,
  updateUserPreferences,
  syncPreferencesToKB,
  resetLearnedPatterns,
  trackDeckOpening,
  syncLearnedPatternsToKB,
} from '../learning/user-preferences';
import { resetWorkflowPlanningLoader } from '../knowledge/workflow-planning-loader';
import { resetProjectAnalysisLoader } from '../knowledge/project-analysis-loader';
import { resetUserPrefsLoader } from '../knowledge/user-prefs-loader';

describe('AI workflows end-to-end (N182)', () => {
  beforeEach(() => {
    resetPrologAdapter();
    resetPreferences();
    resetLearnedPatterns();
    resetWorkflowPlanningLoader();
    resetProjectAnalysisLoader();
    resetUserPrefsLoader();
  });

  afterEach(() => {
    resetPrologAdapter();
    resetPreferences();
    resetLearnedPatterns();
    resetWorkflowPlanningLoader();
    resetProjectAnalysisLoader();
    resetUserPrefsLoader();
  });

  it('runs workflow planning + routing + project analysis + learning on one adapter', async () => {
    const adapter = createPrologAdapter({ enableCache: false });
    await loadAllKBs(adapter, { includeOptional: true });

    // --- Workflow planning ---
    const goal = 'make_beat';
    const persona = 'producer';
    const plan = await planWorkflow(goal, persona, adapter);
    expect(plan).not.toBeNull();
    expect(plan!.steps.length).toBeGreaterThan(0);

    const availableDecks = [
      'pattern_editor',
      'sample_browser',
      'instrument_rack',
      'effect_chain',
      'mixer',
      'transport',
    ];
    const validation = await validateWorkflow(goal, persona, availableDecks, adapter);
    expect(validation.valid).toBe(true);

    const step0 = await executeWorkflowStep(goal, 0, availableDecks, adapter);
    expect(step0.status).not.toBe('failed');

    // --- Routing ---
    const routing = await suggestRouting('beat_making', ['drums', 'drum_bus', 'reverb', 'master'], adapter);
    const flow = await validateSignalFlowGraph(routing.connections, adapter);
    // Depending on selected nodes, this may be valid or produce actionable issues; it must not crash.
    expect(Array.isArray(flow.issues)).toBe(true);

    // --- Project analysis ---
    const analysis = await analyzeProject(
      {
        elements: ['drums', 'melody', 'harmony', 'intro', 'outro', 'transition', 'variation'],
        issueFlags: [{ category: 'technical', issueId: 'clipping' }],
        stats: { track_count: 8, effect_count: 10 },
      },
      adapter,
    );
    expect(analysis.issues.length).toBeGreaterThan(0);

    // --- Learning ---
    const userId = 'e2e_user';
    initializePreferences(userId);
    await updateUserPreferences({ type: 'board-switch', boardId: 'tracker', boardName: 'Tracker', sessionDuration: 15_000 }, false);
    await syncPreferencesToKB(adapter);

    // Train a simple deck-opening pattern and sync it into the KB
    for (let i = 0; i < 3; i++) {
      trackDeckOpening('pattern_editor', 'beat_making');
      trackDeckOpening('mixer', 'beat_making');
      trackDeckOpening('effect_chain', 'beat_making');
    }
    await syncLearnedPatternsToKB(userId, adapter);

    const kbSuggestion = await adapter.querySingle(
      `suggest_workflow(${userId}, [pattern_editor,mixer], Next)`
    );
    expect(kbSuggestion).not.toBeNull();
  });
});

