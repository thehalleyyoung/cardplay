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

// Track KB load per adapter instance (important for tests / multi-adapter usage).
let loadedAdapters: WeakSet<PrologAdapter> = new WeakSet();
let loadPromises: WeakMap<PrologAdapter, Promise<void>> = new WeakMap();

/**
 * Load the workflow planning knowledge base.
 */
export async function loadWorkflowPlanningKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (loadedAdapters.has(adapter)) {
    return;
  }

  const existing = loadPromises.get(adapter);
  if (existing) {
    return existing;
  }

  const promise = adapter
    .loadProgram(workflowPlanningKB, 'workflow-planning')
    .then(() => {
      loadedAdapters.add(adapter);
      loadPromises.delete(adapter);
    });
  loadPromises.set(adapter, promise);
  await promise;
}

/**
 * Check if the workflow planning KB is loaded.
 */
export function isWorkflowPlanningLoaded(
  adapter: PrologAdapter = getPrologAdapter()
): boolean {
  return loadedAdapters.has(adapter);
}

/**
 * Reset the loader state (for testing).
 */
export function resetWorkflowPlanningLoader(): void {
  loadedAdapters = new WeakSet();
  loadPromises = new WeakMap();
}

/**
 * Get raw source of the workflow planning KB.
 */
export function getWorkflowPlanningSource(): string {
  return workflowPlanningKB;
}
