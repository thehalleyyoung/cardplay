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

let kbLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load the project analysis knowledge base.
 */
export async function loadProjectAnalysisKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (kbLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = adapter
    .loadProgram(projectAnalysisKB, 'project-analysis')
    .then(() => {
      kbLoaded = true;
    });

  await loadPromise;
}

/**
 * Check if the project analysis KB is loaded.
 */
export function isProjectAnalysisLoaded(): boolean {
  return kbLoaded;
}

/**
 * Reset the loader state (for testing).
 */
export function resetProjectAnalysisLoader(): void {
  kbLoaded = false;
  loadPromise = null;
}

/**
 * Get raw source of the project analysis KB.
 */
export function getProjectAnalysisSource(): string {
  return projectAnalysisKB;
}
