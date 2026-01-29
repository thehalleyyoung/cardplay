/**
 * @fileoverview Slow Query Logger (Dev-Only)
 *
 * N162: Add slow query logging (dev-only)
 *
 * Logs slow queries during development for debugging and optimization.
 * Provides detailed information about query execution and suggestions.
 *
 * @module @cardplay/ai/engine/slow-query-logger
 */

import { getQueryProfiler, type QueryPathProfile, type SlowQueryReport } from './query-profiler';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Log entry for a slow query.
 */
export interface SlowQueryLogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly query: string;
  readonly durationMs: number;
  readonly exceededBy: number;
  readonly source: string;
  readonly suggestions: string[];
  readonly stackTrace?: string;
}

/**
 * Logger configuration.
 */
export interface SlowQueryLoggerConfig {
  /** Threshold in ms for logging (default 50) */
  readonly thresholdMs: number;
  /** Whether to log to console */
  readonly logToConsole: boolean;
  /** Whether to capture stack traces */
  readonly captureStackTrace: boolean;
  /** Max entries to keep in memory */
  readonly maxEntries: number;
  /** Whether enabled (should be false in production) */
  readonly enabled: boolean;
}

const DEFAULT_CONFIG: SlowQueryLoggerConfig = {
  thresholdMs: 50,
  logToConsole: true,
  captureStackTrace: true,
  maxEntries: 500,
  enabled: process.env.NODE_ENV !== 'production',
};

/**
 * Alert callback for slow queries.
 */
export type SlowQueryAlertCallback = (entry: SlowQueryLogEntry) => void;

// ============================================================================
// SLOW QUERY LOGGER
// ============================================================================

/**
 * Logger for slow AI queries.
 * N162: Slow query logging for development.
 */
class SlowQueryLogger {
  private config: SlowQueryLoggerConfig = DEFAULT_CONFIG;
  private entries: SlowQueryLogEntry[] = [];
  private alertCallbacks: SlowQueryAlertCallback[] = [];
  private entryIdCounter = 0;

  /**
   * Configure the logger.
   */
  configure(config: Partial<SlowQueryLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enable the logger.
   */
  enable(): void {
    this.config = { ...this.config, enabled: true };
  }

  /**
   * Disable the logger.
   */
  disable(): void {
    this.config = { ...this.config, enabled: false };
  }

  /**
   * Check if enabled.
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Log a query if it exceeds threshold.
   */
  logIfSlow(profile: QueryPathProfile): SlowQueryLogEntry | null {
    if (!this.config.enabled) return null;
    if (profile.durationMs <= this.config.thresholdMs) return null;

    const entry = this.createEntry(profile);
    this.addEntry(entry);

    if (this.config.logToConsole) {
      this.logToConsole(entry);
    }

    // Alert callbacks
    for (const callback of this.alertCallbacks) {
      try {
        callback(entry);
      } catch {
        // Ignore callback errors
      }
    }

    return entry;
  }

  /**
   * Log a slow query report from the profiler.
   */
  logReport(report: SlowQueryReport): SlowQueryLogEntry {
    const stackTrace = this.config.captureStackTrace ? new Error().stack : undefined;
    const entry: SlowQueryLogEntry = {
      id: `slow_${++this.entryIdCounter}`,
      timestamp: Date.now(),
      query: report.query.queryString,
      durationMs: report.query.durationMs,
      exceededBy: report.exceededBudgetBy,
      source: report.query.source,
      suggestions: report.suggestions.map(s => s.description),
      ...(stackTrace !== undefined ? { stackTrace } : {}),
    };

    this.addEntry(entry);

    if (this.config.logToConsole) {
      this.logToConsole(entry);
    }

    return entry;
  }

  /**
   * Create a log entry from a profile.
   */
  private createEntry(profile: QueryPathProfile): SlowQueryLogEntry {
    const profiler = getQueryProfiler();
    const reports = profiler.getSlowQueries(this.config.thresholdMs);
    const report = reports.find(r => r.query === profile);
    const suggestions = report?.suggestions.map(s => s.description) ?? [];
    const stackTrace = this.config.captureStackTrace ? new Error().stack : undefined;

    return {
      id: `slow_${++this.entryIdCounter}`,
      timestamp: profile.timestamp,
      query: profile.queryString,
      durationMs: profile.durationMs,
      exceededBy: profile.durationMs - this.config.thresholdMs,
      source: profile.source,
      suggestions,
      ...(stackTrace !== undefined ? { stackTrace } : {}),
    };
  }

  /**
   * Add entry to log.
   */
  private addEntry(entry: SlowQueryLogEntry): void {
    this.entries.push(entry);

    // Limit entries
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries);
    }
  }

  /**
   * Log to console with formatting.
   */
  private logToConsole(entry: SlowQueryLogEntry): void {
    const timeStr = new Date(entry.timestamp).toISOString();
    const queryPreview = entry.query.slice(0, 80);

    console.warn(
      `[SlowQuery] ${entry.durationMs.toFixed(1)}ms (+${entry.exceededBy.toFixed(1)}ms over budget)`,
      `\n  Query: ${queryPreview}${entry.query.length > 80 ? '...' : ''}`,
      `\n  Source: ${entry.source}`,
      `\n  Time: ${timeStr}`
    );

    if (entry.suggestions.length > 0) {
      console.info('[SlowQuery] Suggestions:', entry.suggestions.join('; '));
    }
  }

  /**
   * Register an alert callback.
   */
  onSlowQuery(callback: SlowQueryAlertCallback): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const idx = this.alertCallbacks.indexOf(callback);
      if (idx >= 0) {
        this.alertCallbacks.splice(idx, 1);
      }
    };
  }

  /**
   * Get all logged entries.
   */
  getEntries(): SlowQueryLogEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries above a specific duration.
   */
  getEntriesAbove(durationMs: number): SlowQueryLogEntry[] {
    return this.entries.filter(e => e.durationMs > durationMs);
  }

  /**
   * Get most recent entries.
   */
  getRecentEntries(count: number): SlowQueryLogEntry[] {
    return this.entries.slice(-count);
  }

  /**
   * Get entries from a specific source.
   */
  getEntriesFromSource(source: string): SlowQueryLogEntry[] {
    return this.entries.filter(e => e.source === source);
  }

  /**
   * Get summary statistics.
   */
  getSummary(): {
    totalSlowQueries: number;
    avgDurationMs: number;
    maxDurationMs: number;
    avgExceededBy: number;
    bySource: Record<string, number>;
  } {
    if (this.entries.length === 0) {
      return {
        totalSlowQueries: 0,
        avgDurationMs: 0,
        maxDurationMs: 0,
        avgExceededBy: 0,
        bySource: {},
      };
    }

    const bySource: Record<string, number> = {};
    let totalDuration = 0;
    let totalExceeded = 0;
    let maxDuration = 0;

    for (const entry of this.entries) {
      totalDuration += entry.durationMs;
      totalExceeded += entry.exceededBy;
      maxDuration = Math.max(maxDuration, entry.durationMs);
      bySource[entry.source] = (bySource[entry.source] ?? 0) + 1;
    }

    return {
      totalSlowQueries: this.entries.length,
      avgDurationMs: totalDuration / this.entries.length,
      maxDurationMs: maxDuration,
      avgExceededBy: totalExceeded / this.entries.length,
      bySource,
    };
  }

  /**
   * Export entries as JSON.
   */
  exportJSON(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      config: this.config,
      entries: this.entries,
      summary: this.getSummary(),
    }, null, 2);
  }

  /**
   * Format a human-readable report.
   */
  formatReport(): string {
    const lines: string[] = [];
    const summary = this.getSummary();

    lines.push('=== Slow Query Report ===');
    lines.push(`Total slow queries: ${summary.totalSlowQueries}`);
    lines.push(`Avg duration: ${summary.avgDurationMs.toFixed(1)}ms`);
    lines.push(`Max duration: ${summary.maxDurationMs.toFixed(1)}ms`);
    lines.push(`Avg exceeded by: ${summary.avgExceededBy.toFixed(1)}ms`);
    lines.push('');
    lines.push('By source:');

    for (const [source, count] of Object.entries(summary.bySource)) {
      lines.push(`  ${source}: ${count}`);
    }

    if (this.entries.length > 0) {
      lines.push('');
      lines.push('Recent slow queries:');
      for (const entry of this.getRecentEntries(5)) {
        lines.push(`  ${entry.durationMs.toFixed(1)}ms: ${entry.query.slice(0, 60)}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Clear all entries.
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Reset logger (for testing).
   */
  reset(): void {
    this.clear();
    this.alertCallbacks = [];
    this.entryIdCounter = 0;
    this.config = DEFAULT_CONFIG;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let loggerInstance: SlowQueryLogger | null = null;

/**
 * Get the singleton slow query logger.
 */
export function getSlowQueryLogger(): SlowQueryLogger {
  if (!loggerInstance) {
    loggerInstance = new SlowQueryLogger();
  }
  return loggerInstance;
}

/**
 * Reset the slow query logger (for testing).
 */
export function resetSlowQueryLogger(): void {
  loggerInstance?.reset();
  loggerInstance = null;
}

export { SlowQueryLogger };
