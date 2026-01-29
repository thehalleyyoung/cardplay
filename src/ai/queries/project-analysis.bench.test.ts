/**
 * @fileoverview Project analysis performance benchmarks
 *
 * N098: Benchmark project analysis (<1s).
 */

import { describe, it, expect } from 'vitest';
import { createPrologAdapter } from '../engine/prolog-adapter';
import { resetProjectAnalysisLoader } from '../knowledge/project-analysis-loader';
import { analyzeProject } from './workflow-queries';

describe('Project analysis performance (N098)', () => {
  it('cold analyzeProject completes in <1s', async () => {
    resetProjectAnalysisLoader();
    const adapter = createPrologAdapter({ enableCache: false });

    const start = performance.now();
    const result = await analyzeProject(
      {
        elements: ['bass', 'drums', 'melody', 'harmony', 'intro', 'outro', 'transition', 'variation'],
        issueFlags: [
          { category: 'technical', issueId: 'mud_buildup' },
          { category: 'balance', issueId: 'frequency_masking' },
          { category: 'structural', issueId: 'weak_hook' },
        ],
        stats: {
          track_count: 12,
          unique_instruments: 7,
          effect_count: 18,
          automation_lanes: 6,
          routing_connections: 4,
          section_count: 6,
        },
      },
      adapter,
    );
    const end = performance.now();

    const totalMs = end - start;
    console.log(`Project analysis cold analyzeProject: ${totalMs.toFixed(2)}ms`);

    expect(result.issues.length).toBeGreaterThan(0);
    expect(totalMs).toBeLessThan(1000);
  });
});

