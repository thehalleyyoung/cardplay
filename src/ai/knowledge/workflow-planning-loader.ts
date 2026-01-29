/**
 * @fileoverview Workflow Planning KB Loader
 *
 * Loads the workflow-planning.pl knowledge base for board-centric
 * workflow decomposition, deck sequencing, and routing templates.
 *
 * N001-N050: Board-centric workflow planning
 *
 * @module @cardplay/ai/knowledge/workflow-planning-loader
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';

import workflowPlanningKB from './workflow-planning.pl?raw';

let kbLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load the workflow planning knowledge base.
 */
export async function loadWorkflowPlanningKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (kbLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = adapter
    .loadProgram(workflowPlanningKB, 'workflow-planning')
    .then(() => {
      kbLoaded = true;
    });

  await loadPromise;
}

/**
 * Check if the workflow planning KB is loaded.
 */
export function isWorkflowPlanningLoaded(): boolean {
  return kbLoaded;
}

/**
 * Reset the loader state (for testing).
 */
export function resetWorkflowPlanningLoader(): void {
  kbLoaded = false;
  loadPromise = null;
}

/**
 * Get raw source of the workflow planning KB.
 */
export function getWorkflowPlanningSource(): string {
  return workflowPlanningKB;
}
