/**
 * @fileoverview Tutorial Progress Tracking System
 *
 * M352: Implement adaptive tutorials based on user skill level.
 * M353: Implement tutorial progress tracking.
 * M354: Implement tutorial hints appearing in context.
 *
 * Tracks per-user tutorial progress, integrating with the existing Prolog-based
 * adaptive tutorials (L349) and learning paths (M350). Progress is local-only
 * and in-memory, following the same pattern as other learning stores.
 *
 * @module @cardplay/ai/learning/tutorial-progress
 */

import type { PrologAdapter } from '../engine/prolog-adapter';
import { getAdaptiveTutorial } from '../queries/persona-queries';
// Future integrations (currently not fully used):
// import { getLearningPath, type AdaptiveTutorial } from '../queries/persona-queries';

// =============================================================================
// Types
// =============================================================================

/** Status of a single tutorial step. */
export type TutorialStepStatus = 'not-started' | 'in-progress' | 'completed' | 'skipped';

/** Tracked state of a single tutorial step. */
export interface TrackedTutorialStep {
  readonly stepId: string;
  readonly stepDescription: string;
  readonly status: TutorialStepStatus;
  readonly completedAt: string | null;
}

/** Progress for an entire tutorial. */
export interface TutorialProgress {
  readonly tutorialId: string;
  readonly skillLevel: string;
  readonly steps: readonly TrackedTutorialStep[];
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly completionPercent: number;
}

/** Summary of all tutorial progress. */
export interface TutorialProgressSummary {
  readonly totalTutorials: number;
  readonly completedTutorials: number;
  readonly inProgressTutorials: number;
  readonly overallCompletionPercent: number;
  readonly recentActivity: readonly TutorialActivityEntry[];
}

/** A single activity log entry. */
export interface TutorialActivityEntry {
  readonly tutorialId: string;
  readonly stepId: string;
  readonly action: 'started' | 'completed' | 'skipped';
  readonly timestamp: string;
}

/** A contextual hint for the current UI state. */
export interface TutorialHint {
  readonly tutorialId: string;
  readonly stepId: string;
  readonly hintText: string;
  readonly context: string;
}

// =============================================================================
// Store
// =============================================================================

/**
 * In-memory tutorial progress store.
 * Local-only — no network calls.
 */
class TutorialProgressStore {
  /** tutorial ID → progress */
  private progress: Map<string, TutorialProgress> = new Map();

  /** Activity log (most recent first, capped at 100 entries). */
  private activityLog: TutorialActivityEntry[] = [];
  private readonly MAX_ACTIVITY = 100;

  /**
   * M352: Start a tutorial, initialising progress tracking for all steps.
   */
  async startTutorial(
    tutorialId: string,
    skillLevel: string,
    adapter?: PrologAdapter,
  ): Promise<TutorialProgress | null> {
    // If already started, return existing progress.
    const existing = this.progress.get(tutorialId);
    if (existing) return existing;

    // Query the Prolog KB for tutorial steps.
    const tutorial = await getAdaptiveTutorial(tutorialId, skillLevel, adapter);
    if (!tutorial || tutorial.steps.length === 0) return null;

    const now = new Date().toISOString();
    const progress: TutorialProgress = {
      tutorialId,
      skillLevel,
      steps: tutorial.steps.map((step, i) => ({
        stepId: `${tutorialId}_step_${i}`,
        stepDescription: step,
        status: 'not-started' as TutorialStepStatus,
        completedAt: null,
      })),
      startedAt: now,
      completedAt: null,
      completionPercent: 0,
    };

    this.progress.set(tutorialId, progress);
    this.logActivity(tutorialId, `${tutorialId}_step_0`, 'started');
    return progress;
  }

  /**
   * Start tutorial with explicit steps (no Prolog query needed).
   * Used when tutorial steps are already known.
   */
  startTutorialWithSteps(
    tutorialId: string,
    skillLevel: string,
    steps: readonly string[],
  ): TutorialProgress | null {
    const existing = this.progress.get(tutorialId);
    if (existing) return existing;
    if (steps.length === 0) return null;

    const now = new Date().toISOString();
    const progress: TutorialProgress = {
      tutorialId,
      skillLevel,
      steps: steps.map((step, i) => ({
        stepId: `${tutorialId}_step_${i}`,
        stepDescription: step,
        status: 'not-started' as TutorialStepStatus,
        completedAt: null,
      })),
      startedAt: now,
      completedAt: null,
      completionPercent: 0,
    };

    this.progress.set(tutorialId, progress);
    this.logActivity(tutorialId, `${tutorialId}_step_0`, 'started');
    return progress;
  }

  /**
   * M353: Mark a step as completed.
   */
  completeStep(tutorialId: string, stepId: string): TutorialProgress | null {
    return this.updateStepStatus(tutorialId, stepId, 'completed');
  }

  /**
   * Mark a step as skipped.
   */
  skipStep(tutorialId: string, stepId: string): TutorialProgress | null {
    return this.updateStepStatus(tutorialId, stepId, 'skipped');
  }

  /**
   * Mark a step as in-progress.
   */
  beginStep(tutorialId: string, stepId: string): TutorialProgress | null {
    return this.updateStepStatus(tutorialId, stepId, 'in-progress');
  }

  /**
   * Get progress for a specific tutorial.
   */
  getProgress(tutorialId: string): TutorialProgress | null {
    return this.progress.get(tutorialId) ?? null;
  }

  /**
   * Get all tracked tutorials.
   */
  getAllProgress(): TutorialProgress[] {
    return [...this.progress.values()];
  }

  /**
   * Get overall progress summary.
   */
  getSummary(): TutorialProgressSummary {
    const all = this.getAllProgress();
    const completed = all.filter(p => p.completedAt !== null);
    const inProgress = all.filter(p => p.completedAt === null && p.completionPercent > 0);

    const totalSteps = all.reduce((sum, p) => sum + p.steps.length, 0);
    const completedSteps = all.reduce(
      (sum, p) => sum + p.steps.filter(s => s.status === 'completed').length,
      0
    );

    return {
      totalTutorials: all.length,
      completedTutorials: completed.length,
      inProgressTutorials: inProgress.length,
      overallCompletionPercent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      recentActivity: this.activityLog.slice(0, 10),
    };
  }

  /**
   * M354: Get contextual hints for a given UI context.
   * Returns hints from in-progress tutorials that match the context.
   */
  getContextualHints(context: string): TutorialHint[] {
    const hints: TutorialHint[] = [];
    const contextLower = context.toLowerCase();

    for (const progress of this.progress.values()) {
      if (progress.completedAt !== null) continue;

      for (const step of progress.steps) {
        if (step.status !== 'not-started' && step.status !== 'in-progress') continue;

        // Simple context matching: check if step description relates to context
        if (step.stepDescription.toLowerCase().includes(contextLower)) {
          hints.push({
            tutorialId: progress.tutorialId,
            stepId: step.stepId,
            hintText: step.stepDescription,
            context,
          });
        }
      }
    }

    return hints;
  }

  /**
   * Get the next uncompleted step for a tutorial.
   */
  getNextStep(tutorialId: string): TrackedTutorialStep | null {
    const progress = this.progress.get(tutorialId);
    if (!progress) return null;
    return progress.steps.find(s => s.status === 'not-started' || s.status === 'in-progress') ?? null;
  }

  /**
   * Reset progress for a specific tutorial.
   */
  resetTutorial(tutorialId: string): boolean {
    return this.progress.delete(tutorialId);
  }

  /** Reset all progress (for testing). */
  resetAll(): void {
    this.progress.clear();
    this.activityLog = [];
  }

  /** Export all progress data. */
  exportAll(): { progress: TutorialProgress[]; activity: TutorialActivityEntry[] } {
    return {
      progress: this.getAllProgress(),
      activity: [...this.activityLog],
    };
  }

  /** Import progress data (replaces existing). */
  importAll(data: { progress: TutorialProgress[]; activity: TutorialActivityEntry[] }): void {
    this.progress.clear();
    for (const p of data.progress) {
      this.progress.set(p.tutorialId, p);
    }
    this.activityLog = [...data.activity];
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private updateStepStatus(
    tutorialId: string,
    stepId: string,
    newStatus: TutorialStepStatus,
  ): TutorialProgress | null {
    const progress = this.progress.get(tutorialId);
    if (!progress) return null;

    const stepIndex = progress.steps.findIndex(s => s.stepId === stepId);
    if (stepIndex < 0) return null;

    const now = new Date().toISOString();
    const updatedSteps = progress.steps.map((s, i) => {
      if (i !== stepIndex) return s;
      return {
        ...s,
        status: newStatus,
        completedAt: newStatus === 'completed' ? now : s.completedAt,
      };
    });

    const doneCount = updatedSteps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
    const completionPercent = Math.round((doneCount / updatedSteps.length) * 100);
    const allDone = doneCount === updatedSteps.length;

    const updated: TutorialProgress = {
      ...progress,
      steps: updatedSteps,
      completionPercent,
      completedAt: allDone ? now : null,
    };

    this.progress.set(tutorialId, updated);

    if (newStatus === 'completed') {
      this.logActivity(tutorialId, stepId, 'completed');
    } else if (newStatus === 'skipped') {
      this.logActivity(tutorialId, stepId, 'skipped');
    }

    return updated;
  }

  private logActivity(
    tutorialId: string,
    stepId: string,
    action: 'started' | 'completed' | 'skipped',
  ): void {
    this.activityLog.unshift({
      tutorialId,
      stepId,
      action,
      timestamp: new Date().toISOString(),
    });
    if (this.activityLog.length > this.MAX_ACTIVITY) {
      this.activityLog.length = this.MAX_ACTIVITY;
    }
  }
}

// =============================================================================
// Singleton & Public API
// =============================================================================

const progressStore = new TutorialProgressStore();

/**
 * M352: Start an adaptive tutorial, querying the Prolog KB for steps.
 */
export async function startTutorial(
  tutorialId: string,
  skillLevel: string,
  adapter?: PrologAdapter,
): Promise<TutorialProgress | null> {
  return progressStore.startTutorial(tutorialId, skillLevel, adapter);
}

/**
 * Start a tutorial with explicit steps (no Prolog query needed).
 */
export function startTutorialWithSteps(
  tutorialId: string,
  skillLevel: string,
  steps: readonly string[],
): TutorialProgress | null {
  return progressStore.startTutorialWithSteps(tutorialId, skillLevel, steps);
}

/**
 * M353: Mark a tutorial step as completed.
 */
export function completeTutorialStep(
  tutorialId: string,
  stepId: string,
): TutorialProgress | null {
  return progressStore.completeStep(tutorialId, stepId);
}

/**
 * Skip a tutorial step.
 */
export function skipTutorialStep(
  tutorialId: string,
  stepId: string,
): TutorialProgress | null {
  return progressStore.skipStep(tutorialId, stepId);
}

/**
 * Mark a tutorial step as in-progress.
 */
export function beginTutorialStep(
  tutorialId: string,
  stepId: string,
): TutorialProgress | null {
  return progressStore.beginStep(tutorialId, stepId);
}

/**
 * Get progress for a specific tutorial.
 */
export function getTutorialProgress(tutorialId: string): TutorialProgress | null {
  return progressStore.getProgress(tutorialId);
}

/**
 * Get all tracked tutorial progress.
 */
export function getAllTutorialProgress(): TutorialProgress[] {
  return progressStore.getAllProgress();
}

/**
 * Get overall tutorial progress summary.
 */
export function getTutorialProgressSummary(): TutorialProgressSummary {
  return progressStore.getSummary();
}

/**
 * M354: Get contextual hints for a given UI context.
 */
export function getTutorialHints(context: string): TutorialHint[] {
  return progressStore.getContextualHints(context);
}

/**
 * Get the next uncompleted step for a tutorial.
 */
export function getNextTutorialStep(tutorialId: string): TrackedTutorialStep | null {
  return progressStore.getNextStep(tutorialId);
}

/**
 * Reset progress for a specific tutorial.
 */
export function resetTutorialProgress(tutorialId: string): boolean {
  return progressStore.resetTutorial(tutorialId);
}

/**
 * Reset all tutorial progress (for testing).
 */
export function resetAllTutorialProgress(): void {
  progressStore.resetAll();
}

/**
 * Export all tutorial progress data.
 */
export function exportTutorialProgress(): { progress: TutorialProgress[]; activity: TutorialActivityEntry[] } {
  return progressStore.exportAll();
}

/**
 * Import tutorial progress data.
 */
export function importTutorialProgress(
  data: { progress: TutorialProgress[]; activity: TutorialActivityEntry[] },
): void {
  progressStore.importAll(data);
}
