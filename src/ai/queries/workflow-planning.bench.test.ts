/**
 * @fileoverview Workflow planning performance benchmarks
 *
 * N048: Benchmark workflow planning (<200ms).
 */

import { describe, it, expect } from 'vitest';
import { createPrologAdapter } from '../engine/prolog-adapter';
import { resetWorkflowPlanningLoader } from '../knowledge/workflow-planning-loader';
import { planWorkflow } from './workflow-queries';

describe('Workflow planning performance (N048)', () => {
  it('cold planWorkflow(make_beat, producer) completes in <200ms', async () => {
    resetWorkflowPlanningLoader();
    const adapter = createPrologAdapter({ enableCache: false });

    const start = performance.now();
    const plan = await planWorkflow('make_beat', 'producer', adapter);
    const end = performance.now();

    const totalMs = end - start;
    console.log(`Workflow planning cold planWorkflow(make_beat, producer): ${totalMs.toFixed(2)}ms`);

    expect(plan).not.toBeNull();
    expect(plan!.steps.length).toBeGreaterThan(0);
    expect(totalMs).toBeLessThan(200);
  });
});

