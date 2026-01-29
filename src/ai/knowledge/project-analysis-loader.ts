/**
 * @fileoverview Project Analysis KB Loader
 *
 * Loads the project-analysis.pl knowledge base for intelligent
 * project health checks, issue detection, and improvement suggestions.
 *
 * N051-N100: Intelligent project analysis
 *
 * @module @cardplay/ai/knowledge/project-analysis-loader
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';

import projectAnalysisKB from './project-analysis.pl?raw';

// Track KB load per adapter instance (important for tests / multi-adapter usage).
let loadedAdapters: WeakSet<PrologAdapter> = new WeakSet();
let loadPromises: WeakMap<PrologAdapter, Promise<void>> = new WeakMap();

/**
 * Load the project analysis knowledge base.
 */
export async function loadProjectAnalysisKB(
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
    .loadProgram(projectAnalysisKB, 'project-analysis')
    .then(() => {
      loadedAdapters.add(adapter);
      loadPromises.delete(adapter);
    });
  loadPromises.set(adapter, promise);
  await promise;
}

/**
 * Check if the project analysis KB is loaded.
 */
export function isProjectAnalysisLoaded(
  adapter: PrologAdapter = getPrologAdapter()
): boolean {
  return loadedAdapters.has(adapter);
}

/**
 * Reset the loader state (for testing).
 */
export function resetProjectAnalysisLoader(): void {
  loadedAdapters = new WeakSet();
  loadPromises = new WeakMap();
}

/**
 * Get raw source of the project analysis KB.
 */
export function getProjectAnalysisSource(): string {
  return projectAnalysisKB;
}
