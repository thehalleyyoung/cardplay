/**
 * @fileoverview Advisor Telemetry & Feedback Log
 *
 * L311: Dev-only, privacy-safe telemetry for question patterns.
 * L312: Uses telemetry to improve NL→query translator weights.
 * L313: "Report incorrect answer" feedback tracking.
 * L314: Feedback log for KB improvement.
 *
 * All data is local-only — never sent to a network.
 *
 * @module @cardplay/ai/advisor/advisor-telemetry
 */

import type { QuestionCategory } from './advisor-interface';

// =============================================================================
// Types
// =============================================================================

/** A single question event recorded by telemetry. */
export interface QuestionEvent {
  readonly question: string;
  readonly category: QuestionCategory;
  readonly confidence: number;
  readonly canAnswer: boolean;
  readonly source: string;
  readonly timestampMs: number;
  readonly durationMs: number;
}

/** Aggregated statistics for a question category. */
export interface CategoryStats {
  readonly category: QuestionCategory;
  readonly count: number;
  readonly averageConfidence: number;
  readonly canAnswerRate: number;
  readonly topSources: readonly string[];
}

/** Feedback entry for an incorrect / unhelpful answer. */
export interface AnswerFeedback {
  readonly question: string;
  readonly category: QuestionCategory;
  readonly originalAnswer: string;
  readonly feedbackType: 'incorrect' | 'unhelpful' | 'misleading';
  readonly userComment?: string | undefined;
  readonly timestampMs: number;
}

/** Pattern weight derived from telemetry for improving NL→query routing. */
export interface PatternWeight {
  readonly category: QuestionCategory;
  readonly patternRegex: string;
  readonly weight: number;
}

/** Summary of all telemetry data. */
export interface TelemetrySummary {
  readonly totalQuestions: number;
  readonly categoryBreakdown: readonly CategoryStats[];
  readonly averageConfidence: number;
  readonly canAnswerRate: number;
  readonly feedbackCount: number;
  readonly recentFeedback: readonly AnswerFeedback[];
}

// =============================================================================
// Telemetry Store
// =============================================================================

/** Maximum events to keep in the telemetry ring buffer. */
const MAX_EVENTS = 1000;

/** Maximum feedback entries to keep. */
const MAX_FEEDBACK = 200;

/**
 * Local-only telemetry store for advisor question patterns.
 * L311: All data stays in-process; no network calls.
 */
class AdvisorTelemetryStore {
  private events: QuestionEvent[] = [];
  private feedback: AnswerFeedback[] = [];
  private enabled = false;

  // ---------------------------------------------------------------------------
  // Enable / Disable (dev-only toggle)
  // ---------------------------------------------------------------------------

  /** Enable telemetry collection (dev-only). */
  enable(): void {
    this.enabled = true;
  }

  /** Disable telemetry collection. */
  disable(): void {
    this.enabled = false;
  }

  /** Check if telemetry is currently collecting. */
  isEnabled(): boolean {
    return this.enabled;
  }

  // ---------------------------------------------------------------------------
  // Event Recording (L311)
  // ---------------------------------------------------------------------------

  /**
   * Record a question event.
   * No-op when telemetry is disabled.
   */
  recordQuestion(event: QuestionEvent): void {
    if (!this.enabled) return;

    this.events.push(event);

    // Ring buffer — drop oldest events when over limit
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(this.events.length - MAX_EVENTS);
    }
  }

  // ---------------------------------------------------------------------------
  // Feedback Recording (L313, L314)
  // ---------------------------------------------------------------------------

  /**
   * L313: Record user feedback about an incorrect/unhelpful answer.
   * Always recorded (regardless of telemetry enabled flag) because
   * feedback is an explicit user action.
   */
  reportIncorrectAnswer(
    question: string,
    category: QuestionCategory,
    originalAnswer: string,
    feedbackType: 'incorrect' | 'unhelpful' | 'misleading',
    userComment?: string
  ): void {
    this.feedback.push({
      question,
      category,
      originalAnswer,
      feedbackType,
      userComment,
      timestampMs: Date.now(),
    });

    // Keep feedback bounded
    if (this.feedback.length > MAX_FEEDBACK) {
      this.feedback = this.feedback.slice(this.feedback.length - MAX_FEEDBACK);
    }
  }

  // ---------------------------------------------------------------------------
  // Queries (L311, L312)
  // ---------------------------------------------------------------------------

  /**
   * Get aggregated statistics by question category.
   */
  getCategoryStats(): CategoryStats[] {
    const buckets = new Map<
      QuestionCategory,
      { count: number; totalConf: number; canAnswerCount: number; sources: Map<string, number> }
    >();

    for (const ev of this.events) {
      const bucket = buckets.get(ev.category) ?? {
        count: 0,
        totalConf: 0,
        canAnswerCount: 0,
        sources: new Map(),
      };
      bucket.count += 1;
      bucket.totalConf += ev.confidence;
      if (ev.canAnswer) bucket.canAnswerCount += 1;
      bucket.sources.set(ev.source, (bucket.sources.get(ev.source) ?? 0) + 1);
      buckets.set(ev.category, bucket);
    }

    const stats: CategoryStats[] = [];
    for (const [category, bucket] of buckets) {
      const sortedSources = [...bucket.sources.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([src]) => src);

      stats.push({
        category,
        count: bucket.count,
        averageConfidence: bucket.count > 0 ? bucket.totalConf / bucket.count : 0,
        canAnswerRate: bucket.count > 0 ? bucket.canAnswerCount / bucket.count : 0,
        topSources: sortedSources,
      });
    }

    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * L312: Derive pattern weights from telemetry to improve NL→query routing.
   *
   * Categories that frequently receive low-confidence answers indicate the
   * pattern matcher may be miscategorising questions. This function returns
   * per-category weights that the advisor can use to boost or suppress
   * routing decisions.
   *
   * Weight > 1 means the category produces good answers (boost).
   * Weight < 1 means the category often fails (suppress / re-route).
   */
  derivePatternWeights(): PatternWeight[] {
    const stats = this.getCategoryStats();
    const weights: PatternWeight[] = [];

    for (const stat of stats) {
      if (stat.count < 5) continue; // too few samples to adjust

      // Combine canAnswer rate and confidence into a weight
      const quality = stat.canAnswerRate * 0.6 + (stat.averageConfidence / 100) * 0.4;
      const weight = Math.max(0.1, Math.min(2.0, quality * 2));

      weights.push({
        category: stat.category,
        patternRegex: `(category: ${stat.category})`,
        weight,
      });
    }

    return weights;
  }

  /**
   * L314: Get the full feedback log for KB improvement analysis.
   */
  getFeedbackLog(): readonly AnswerFeedback[] {
    return [...this.feedback];
  }

  /**
   * Get feedback entries filtered by type.
   */
  getFeedbackByType(
    feedbackType: 'incorrect' | 'unhelpful' | 'misleading'
  ): readonly AnswerFeedback[] {
    return this.feedback.filter((f) => f.feedbackType === feedbackType);
  }

  /**
   * L314: Get feedback entries grouped by category for KB improvement.
   *
   * Returns categories ranked by feedback count — the category with the
   * most "incorrect" reports should be prioritised for KB updates.
   */
  getFeedbackPriorities(): Array<{ category: QuestionCategory; count: number; examples: string[] }> {
    const buckets = new Map<QuestionCategory, { count: number; examples: string[] }>();

    for (const fb of this.feedback) {
      const bucket = buckets.get(fb.category) ?? { count: 0, examples: [] };
      bucket.count += 1;
      if (bucket.examples.length < 3) {
        bucket.examples.push(fb.question);
      }
      buckets.set(fb.category, bucket);
    }

    return [...buckets.entries()]
      .map(([category, bucket]) => ({ category, ...bucket }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get a full telemetry summary.
   */
  getSummary(): TelemetrySummary {
    const totalQuestions = this.events.length;
    const averageConfidence =
      totalQuestions > 0
        ? this.events.reduce((sum, ev) => sum + ev.confidence, 0) / totalQuestions
        : 0;
    const canAnswerRate =
      totalQuestions > 0
        ? this.events.filter((ev) => ev.canAnswer).length / totalQuestions
        : 0;

    return {
      totalQuestions,
      categoryBreakdown: this.getCategoryStats(),
      averageConfidence,
      canAnswerRate,
      feedbackCount: this.feedback.length,
      recentFeedback: this.feedback.slice(-5),
    };
  }

  // ---------------------------------------------------------------------------
  // Export / Import (JSON-serialisable)
  // ---------------------------------------------------------------------------

  /**
   * Export telemetry data as JSON-serialisable object.
   */
  exportData(): { events: QuestionEvent[]; feedback: AnswerFeedback[] } {
    return {
      events: [...this.events],
      feedback: [...this.feedback],
    };
  }

  /**
   * Import previously exported telemetry data.
   */
  importData(data: { events?: QuestionEvent[]; feedback?: AnswerFeedback[] }): void {
    if (data.events) {
      this.events = [...data.events].slice(-MAX_EVENTS);
    }
    if (data.feedback) {
      this.feedback = [...data.feedback].slice(-MAX_FEEDBACK);
    }
  }

  /**
   * Clear all telemetry and feedback data.
   */
  reset(): void {
    this.events = [];
    this.feedback = [];
  }

  /**
   * Privacy check — always returns true.
   * L335/L354: All telemetry is local-only.
   */
  isLocalOnly(): boolean {
    return true;
  }
}

// =============================================================================
// Singleton & API
// =============================================================================

const telemetryStore = new AdvisorTelemetryStore();

/** Enable advisor telemetry collection (dev-only). */
export function enableAdvisorTelemetry(): void {
  telemetryStore.enable();
}

/** Disable advisor telemetry collection. */
export function disableAdvisorTelemetry(): void {
  telemetryStore.disable();
}

/** Check if advisor telemetry is enabled. */
export function isAdvisorTelemetryEnabled(): boolean {
  return telemetryStore.isEnabled();
}

/**
 * L311: Record an advisor question event.
 */
export function recordAdvisorQuestion(event: QuestionEvent): void {
  telemetryStore.recordQuestion(event);
}

/**
 * L313: Report an incorrect/unhelpful answer for KB improvement.
 */
export function reportIncorrectAnswer(
  question: string,
  category: QuestionCategory,
  originalAnswer: string,
  feedbackType: 'incorrect' | 'unhelpful' | 'misleading',
  userComment?: string
): void {
  telemetryStore.reportIncorrectAnswer(
    question,
    category,
    originalAnswer,
    feedbackType,
    userComment
  );
}

/**
 * L311: Get aggregated question category statistics.
 */
export function getAdvisorCategoryStats(): CategoryStats[] {
  return telemetryStore.getCategoryStats();
}

/**
 * L312: Derive pattern weights from telemetry to improve routing.
 */
export function deriveAdvisorPatternWeights(): PatternWeight[] {
  return telemetryStore.derivePatternWeights();
}

/**
 * L314: Get the full feedback log for KB improvement.
 */
export function getAdvisorFeedbackLog(): readonly AnswerFeedback[] {
  return telemetryStore.getFeedbackLog();
}

/**
 * L314: Get feedback grouped by category, ranked by priority.
 */
export function getAdvisorFeedbackPriorities(): Array<{
  category: QuestionCategory;
  count: number;
  examples: string[];
}> {
  return telemetryStore.getFeedbackPriorities();
}

/**
 * Get a full advisor telemetry summary.
 */
export function getAdvisorTelemetrySummary(): TelemetrySummary {
  return telemetryStore.getSummary();
}

/**
 * Export advisor telemetry data.
 */
export function exportAdvisorTelemetry(): {
  events: QuestionEvent[];
  feedback: AnswerFeedback[];
} {
  return telemetryStore.exportData();
}

/**
 * Import advisor telemetry data.
 */
export function importAdvisorTelemetry(data: {
  events?: QuestionEvent[];
  feedback?: AnswerFeedback[];
}): void {
  telemetryStore.importData(data);
}

/**
 * Reset all advisor telemetry data.
 */
export function resetAdvisorTelemetry(): void {
  telemetryStore.reset();
}
