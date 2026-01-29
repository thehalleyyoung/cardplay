/**
 * @fileoverview Privacy/offline assertions for the AI subsystem
 *
 * N148: Verify privacy protections work (no network calls).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPrologAdapter, resetPrologAdapter } from '../engine/prolog-adapter';
import { loadAllKBs } from '../engine/kb-lifecycle';
import { planWorkflow, analyzeProject } from '../queries/workflow-queries';
import {
  initializePreferences,
  updateUserPreferences,
  syncPreferencesToKB,
  resetPreferences,
} from './user-preferences';

describe('AI privacy: no network calls (N148)', () => {
  let originalFetch: typeof globalThis.fetch | undefined;

  beforeEach(() => {
    resetPrologAdapter();
    resetPreferences();

    originalFetch = globalThis.fetch;
    // If any AI module tries to call fetch, fail loudly.
    globalThis.fetch = vi.fn(async () => {
      throw new Error('Network call blocked in offline test (fetch)');
    }) as unknown as typeof globalThis.fetch;
  });

  afterEach(() => {
    resetPrologAdapter();
    resetPreferences();

    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      // In runtimes without fetch, remove any stub we added.
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (globalThis as any).fetch;
    }
  });

  it('does not call fetch during KB load + representative AI queries', async () => {
    const adapter = createPrologAdapter({ enableCache: false });

    await loadAllKBs(adapter, { includeOptional: true });
    await planWorkflow('make_beat', 'producer', adapter);

    await analyzeProject(
      {
        elements: ['drums', 'melody', 'harmony', 'intro', 'outro', 'transition', 'variation'],
        issueFlags: [{ category: 'technical', issueId: 'clipping' }],
        stats: { track_count: 8, effect_count: 10 },
      },
      adapter,
    );

    initializePreferences('offline_user');
    await updateUserPreferences(
      { type: 'board-switch', boardId: 'tracker', boardName: 'Tracker', sessionDuration: 60_000 },
      false,
    );
    await syncPreferencesToKB(adapter);

    expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled();
  });
});

