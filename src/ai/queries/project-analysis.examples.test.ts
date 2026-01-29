/**
 * @fileoverview Example project analysis scenarios
 *
 * N097: Run project analysis on example projects.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPrologAdapter, resetPrologAdapter } from '../engine/prolog-adapter';
import { resetProjectAnalysisLoader } from '../knowledge/project-analysis-loader';
import { analyzeProject } from './workflow-queries';

describe('Project analysis examples (N097)', () => {
  beforeEach(() => {
    resetPrologAdapter();
    resetProjectAnalysisLoader();
  });

  afterEach(() => {
    resetPrologAdapter();
    resetProjectAnalysisLoader();
  });

  it('flags missing bass and a technical clipping issue', async () => {
    const adapter = createPrologAdapter({ enableCache: false });

    const analysis = await analyzeProject(
      {
        elements: ['drums', 'melody', 'harmony', 'intro', 'outro', 'transition', 'variation'],
        issueFlags: [{ category: 'technical', issueId: 'clipping' }],
        stats: { track_count: 6, effect_count: 8, automation_lanes: 2 },
      },
      adapter,
    );

    const ids = analysis.issues.map((i) => `${i.category}:${i.issueId}`);
    expect(ids).toContain('missing:no_bass');
    expect(ids).toContain('technical:clipping');
    expect(ids).not.toContain('missing:no_drums');
    expect(ids).not.toContain('missing:no_melody');
    expect(analysis.complexity).toBeDefined();
    expect(analysis.complexity!.measurements.length).toBeGreaterThan(0);
  });

  it('surfaces flagged structural/overused/style issues when elements are complete', async () => {
    const adapter = createPrologAdapter({ enableCache: false });

    const analysis = await analyzeProject(
      {
        elements: ['bass', 'drums', 'melody', 'harmony', 'intro', 'outro', 'transition', 'variation'],
        issueFlags: [
          { category: 'structural', issueId: 'monotonic_energy' },
          { category: 'overused', issueId: 'overused_reverb' },
          { category: 'style', issueId: 'genre_mismatch' },
        ],
      },
      adapter,
    );

    const ids = analysis.issues.map((i) => `${i.category}:${i.issueId}`);
    expect(ids).not.toContain('missing:no_bass');
    expect(ids).toContain('structural:monotonic_energy');
    expect(ids).toContain('overused:overused_reverb');
    expect(ids).toContain('style:genre_mismatch');
  });
});

