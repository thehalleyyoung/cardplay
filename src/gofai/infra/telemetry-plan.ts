/**
 * @file Local-Only Telemetry Plan
 * @gofai_goalB Step 046 [Infra]
 * 
 * This module defines an optional, local-only telemetry system for capturing
 * anonymized compiler events to support iterative improvement. Key principles:
 * 
 * - **Opt-in only:** Users must explicitly enable telemetry
 * - **Local-first:** Data stays on device unless user exports
 * - **Privacy-preserving:** No personally identifiable information
 * - **Offline-capable:** Never blocks compilation
 * - **Minimal overhead:** Async logging, no performance impact
 * - **User-controlled:** Users can view, export, or delete any time
 * 
 * **Purpose:**
 * - Identify ambiguous utterances for vocabulary expansion
 * - Track clarification rates for UX improvement
 * - Detect parser/planner failures
 * - Measure feature adoption
 * - Support bug reports with context
 * 
 * **Non-goals:**
 * - User tracking or profiling
 * - Network transmission (unless explicit export)
 * - Detailed project content (only structure/stats)
 * - Real-time analytics
 */

/**
 * =============================================================================
 * TELEMETRY PRINCIPLES
 * =============================================================================
 */

/**
 * Core principles for GOFAI telemetry.
 */
export const TELEMETRY_PRINCIPLES = {
  /**
   * Principle 1: Opt-in only.
   * Telemetry is disabled by default. Users must explicitly enable it.
   */
  OPT_IN_ONLY: 'opt_in_only' as const,

  /**
   * Principle 2: Local-first.
   * All telemetry data is stored locally. No automatic transmission.
   */
  LOCAL_FIRST: 'local_first' as const,

  /**
   * Principle 3: Privacy-preserving.
   * No personally identifiable information (PII) is collected.
   * No audio content, no project details (only structure/metrics).
   */
  PRIVACY_PRESERVING: 'privacy_preserving' as const,

  /**
   * Principle 4: User-controlled.
   * Users can view, export, or delete telemetry data at any time.
   */
  USER_CONTROLLED: 'user_controlled' as const,

  /**
   * Principle 5: Never blocks execution.
   * Telemetry is async and never affects compilation or UX responsiveness.
   */
  NON_BLOCKING: 'non_blocking' as const,

  /**
   * Principle 6: Minimal overhead.
   * Telemetry adds < 1% performance overhead.
   */
  MINIMAL_OVERHEAD: 'minimal_overhead' as const,
} as const;

/**
 * =============================================================================
 * TELEMETRY EVENT TYPES
 * =============================================================================
 */

/**
 * Base telemetry event.
 */
export interface TelemetryEvent {
  /** Event type discriminator */
  readonly type: string;
  /** Event ID (for deduplication) */
  readonly id: string;
  /** Timestamp (epoch milliseconds) */
  readonly timestamp: number;
  /** Session ID (user-local) */
  readonly sessionId: string;
}

/**
 * Parse event (utterance → CPL).
 */
export interface ParseEvent extends TelemetryEvent {
  readonly type: 'parse';
  /** Utterance length (characters) */
  readonly utteranceLength: number;
  /** Whether parse succeeded */
  readonly success: boolean;
  /** Number of parse candidates */
  readonly numParses: number;
  /** Parse time (milliseconds) */
  readonly parseTimeMs: number;
  /** Error type (if failed) */
  readonly errorType?: string;
}

/**
 * Ambiguity event (multiple valid interpretations).
 */
export interface AmbiguityEvent extends TelemetryEvent {
  readonly type: 'ambiguity';
  /** Ambiguity type (parse, anaphora, plan) */
  readonly ambiguityType: 'parse' | 'anaphora' | 'plan' | 'underspecified';
  /** Number of candidates */
  readonly numCandidates: number;
  /** User action (chose, clarified, cancelled) */
  readonly userAction: 'chose' | 'clarified' | 'cancelled';
  /** Time to resolution (milliseconds) */
  readonly resolutionTimeMs: number;
}

/**
 * Clarification event (system asks user for input).
 */
export interface ClarificationEvent extends TelemetryEvent {
  readonly type: 'clarification';
  /** Clarification reason (ambiguous, unresolved, underspecified) */
  readonly reason: 'ambiguous' | 'unresolved' | 'underspecified' | 'conflict';
  /** Question type (choice, fill, confirm) */
  readonly questionType: 'choice' | 'fill' | 'confirm';
  /** Number of options (for choice) */
  readonly numOptions?: number;
  /** User action (answered, skipped, cancelled) */
  readonly userAction: 'answered' | 'skipped' | 'cancelled';
  /** Time to response (milliseconds) */
  readonly responseTimeMs: number;
}

/**
 * Planning event (CPL-Intent → CPL-Plan).
 */
export interface PlanningEvent extends TelemetryEvent {
  readonly type: 'planning';
  /** Whether planning succeeded */
  readonly success: boolean;
  /** Number of candidate plans */
  readonly numPlans: number;
  /** Planning time (milliseconds) */
  readonly planningTimeMs: number;
  /** Plan cost (selected plan) */
  readonly planCost?: number;
  /** Number of opcodes in plan */
  readonly numOpcodes?: number;
  /** Error type (if failed) */
  readonly errorType?: string;
}

/**
 * Execution event (CPL-Plan → applied edits).
 */
export interface ExecutionEvent extends TelemetryEvent {
  readonly type: 'execution';
  /** Whether execution succeeded */
  readonly success: boolean;
  /** Execution mode (preview, apply) */
  readonly mode: 'preview' | 'apply';
  /** Number of opcodes executed */
  readonly numOpcodes: number;
  /** Execution time (milliseconds) */
  readonly executionTimeMs: number;
  /** Number of events modified */
  readonly numEventsModified?: number;
  /** Error type (if failed) */
  readonly errorType?: string;
}

/**
 * Constraint violation event.
 */
export interface ConstraintViolationEvent extends TelemetryEvent {
  readonly type: 'constraint_violation';
  /** Constraint type that was violated */
  readonly constraintType: 'preserve' | 'only-change' | 'range' | 'capability';
  /** Stage where violation detected (planning, execution, validation) */
  readonly stage: 'planning' | 'execution' | 'validation';
  /** User action (relaxed, cancelled, retried) */
  readonly userAction: 'relaxed' | 'cancelled' | 'retried';
}

/**
 * Undo/redo event.
 */
export interface UndoRedoEvent extends TelemetryEvent {
  readonly type: 'undo_redo';
  /** Action (undo, redo) */
  readonly action: 'undo' | 'redo';
  /** Edit package age (turns since applied) */
  readonly age: number;
  /** Success */
  readonly success: boolean;
}

/**
 * Feature adoption event (tracks which features are used).
 */
export interface FeatureAdoptionEvent extends TelemetryEvent {
  readonly type: 'feature_adoption';
  /** Feature name */
  readonly feature: string;
  /** First use (for this session) */
  readonly firstUse: boolean;
}

/**
 * Error event (uncaught errors).
 */
export interface ErrorEvent extends TelemetryEvent {
  readonly type: 'error';
  /** Error message (sanitized) */
  readonly errorMessage: string;
  /** Stack trace (sanitized) */
  readonly stackTrace?: string;
  /** Stage where error occurred */
  readonly stage: string;
}

/**
 * Union of all telemetry event types.
 */
export type AnyTelemetryEvent =
  | ParseEvent
  | AmbiguityEvent
  | ClarificationEvent
  | PlanningEvent
  | ExecutionEvent
  | ConstraintViolationEvent
  | UndoRedoEvent
  | FeatureAdoptionEvent
  | ErrorEvent;

/**
 * =============================================================================
 * TELEMETRY CONFIGURATION
 * =============================================================================
 */

/**
 * Telemetry configuration.
 */
export interface TelemetryConfig {
  /** Whether telemetry is enabled */
  readonly enabled: boolean;
  /** Maximum events to store (oldest deleted first) */
  readonly maxEvents: number;
  /** Sampling rate (0-1, 1=all events) */
  readonly samplingRate: number;
  /** Events to capture (empty = all) */
  readonly captureEvents: readonly string[];
  /** Auto-export interval (0 = never) */
  readonly autoExportIntervalMs: number;
}

/**
 * Default telemetry configuration (disabled).
 */
export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  enabled: false,
  maxEvents: 10000,
  samplingRate: 1.0,
  captureEvents: [],
  autoExportIntervalMs: 0,
};

/**
 * =============================================================================
 * TELEMETRY LOGGER
 * =============================================================================
 */

/**
 * Telemetry logger (local-only, async).
 */
export class TelemetryLogger {
  private events: AnyTelemetryEvent[] = [];
  private sessionId: string;
  private nextEventId: number = 0;

  constructor(
    private config: TelemetryConfig = DEFAULT_TELEMETRY_CONFIG,
    sessionId?: string
  ) {
    this.sessionId = sessionId ?? this.generateSessionId();
  }

  /**
   * Log a telemetry event.
   */
  public log(event: Omit<AnyTelemetryEvent, 'id' | 'timestamp' | 'sessionId'>): void {
    if (!this.config.enabled) {
      return;
    }

    // Sampling
    if (Math.random() > this.config.samplingRate) {
      return;
    }

    // Event filtering
    if (
      this.config.captureEvents.length > 0 &&
      !this.config.captureEvents.includes(event.type)
    ) {
      return;
    }

    // Create full event
    const fullEvent: AnyTelemetryEvent = {
      ...event,
      id: `evt-${this.nextEventId++}`,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    } as AnyTelemetryEvent;

    // Store (async, non-blocking)
    setTimeout(() => {
      this.events.push(fullEvent);

      // Prune old events
      if (this.events.length > this.config.maxEvents) {
        this.events = this.events.slice(-this.config.maxEvents);
      }
    }, 0);
  }

  /**
   * Get all events.
   */
  public getEvents(): readonly AnyTelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type.
   */
  public getEventsByType(type: string): readonly AnyTelemetryEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  /**
   * Get event count by type.
   */
  public getEventCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of this.events) {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
    }
    return counts;
  }

  /**
   * Clear all events.
   */
  public clear(): void {
    this.events = [];
  }

  /**
   * Export events as JSON.
   */
  public exportJSON(): string {
    return JSON.stringify(
      {
        sessionId: this.sessionId,
        exportTimestamp: Date.now(),
        eventCount: this.events.length,
        events: this.events,
      },
      null,
      2
    );
  }

  /**
   * Export summary statistics.
   */
  public exportSummary(): string {
    const counts = this.getEventCounts();
    const parseEvents = this.getEventsByType('parse') as ParseEvent[];
    const clarificationEvents = this.getEventsByType('clarification') as ClarificationEvent[];

    const parseSuccessRate =
      parseEvents.length > 0
        ? parseEvents.filter((e) => e.success).length / parseEvents.length
        : 0;

    const clarificationRate =
      parseEvents.length > 0 ? clarificationEvents.length / parseEvents.length : 0;

    return JSON.stringify(
      {
        sessionId: this.sessionId,
        totalEvents: this.events.length,
        eventCounts: counts,
        parseSuccessRate,
        clarificationRate,
        avgParseTimeMs: this.average(parseEvents.map((e) => e.parseTimeMs)),
        avgClarificationResponseTimeMs: this.average(
          clarificationEvents.map((e) => e.responseTimeMs)
        ),
      },
      null,
      2
    );
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

/**
 * =============================================================================
 * GLOBAL TELEMETRY INSTANCE
 * =============================================================================
 */

/**
 * Global telemetry logger instance.
 * 
 * **Important:** This is disabled by default. Users must explicitly enable
 * telemetry via settings UI or configuration.
 */
let globalTelemetry: TelemetryLogger | null = null;

/**
 * Initialize global telemetry.
 */
export function initTelemetry(config: TelemetryConfig): void {
  globalTelemetry = new TelemetryLogger(config);
}

/**
 * Get global telemetry logger.
 */
export function getTelemetry(): TelemetryLogger | null {
  return globalTelemetry;
}

/**
 * Log a telemetry event (convenience function).
 */
export function logTelemetry(
  event: Omit<AnyTelemetryEvent, 'id' | 'timestamp' | 'sessionId'>
): void {
  globalTelemetry?.log(event);
}

/**
 * =============================================================================
 * PRIVACY SANITIZATION
 * =============================================================================
 */

/**
 * Sanitize a string for telemetry (remove PII).
 */
export function sanitizeString(str: string): string {
  // Remove anything that looks like an email
  str = str.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');

  // Remove anything that looks like a URL
  str = str.replace(/https?:\/\/[^\s]+/g, '[URL]');

  // Remove anything that looks like a file path
  str = str.replace(/\/[^\s/]+(?:\/[^\s/]+)+/g, '[PATH]');

  // Remove anything that looks like an IP address
  str = str.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]');

  return str;
}

/**
 * Sanitize an error for telemetry.
 */
export function sanitizeError(error: Error): { message: string; stack?: string } {
  return {
    message: sanitizeString(error.message),
    stack: error.stack ? sanitizeString(error.stack) : undefined,
  };
}

/**
 * =============================================================================
 * TELEMETRY HELPERS
 * =============================================================================
 */

/**
 * Measure execution time and log.
 */
export async function measureAndLog<T>(
  fn: () => Promise<T> | T,
  createEvent: (timeMs: number, result: T) => Omit<AnyTelemetryEvent, 'id' | 'timestamp' | 'sessionId'>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const timeMs = performance.now() - start;
    logTelemetry(createEvent(timeMs, result));
    return result;
  } catch (error) {
    const timeMs = performance.now() - start;
    logTelemetry({
      type: 'error',
      errorMessage: error instanceof Error ? sanitizeString(error.message) : String(error),
      stage: 'unknown',
    });
    throw error;
  }
}

/**
 * =============================================================================
 * TELEMETRY UI / EXPORT
 * =============================================================================
 */

/**
 * Export telemetry for bug reports.
 * 
 * This creates a sanitized export that users can attach to bug reports.
 * It contains no PII, no audio, no project content.
 */
export function exportForBugReport(): string {
  const telemetry = getTelemetry();
  if (!telemetry) {
    return JSON.stringify({ error: 'Telemetry not enabled' });
  }

  return JSON.stringify(
    {
      summary: JSON.parse(telemetry.exportSummary()),
      recentErrors: telemetry.getEventsByType('error').slice(-10),
      recentClarifications: telemetry.getEventsByType('clarification').slice(-10),
    },
    null,
    2
  );
}

/**
 * =============================================================================
 * SUMMARY
 * =============================================================================
 * 
 * This module defines a privacy-preserving telemetry system for GOFAI:
 * 
 * **Principles:**
 * - Opt-in only (disabled by default)
 * - Local-first (no automatic transmission)
 * - Privacy-preserving (no PII, no content)
 * - User-controlled (view, export, delete)
 * - Non-blocking (async, minimal overhead)
 * 
 * **Event types:**
 * - Parse events (success/failure, timing)
 * - Ambiguity events (type, resolution)
 * - Clarification events (reason, response time)
 * - Planning events (success, cost, timing)
 * - Execution events (mode, success, timing)
 * - Constraint violations
 * - Undo/redo actions
 * - Feature adoption
 * - Errors
 * 
 * **Usage:**
 * 1. User enables telemetry via settings
 * 2. System logs events asynchronously
 * 3. User can view summary stats
 * 4. User can export for bug reports
 * 5. User can clear at any time
 * 
 * **Benefits:**
 * - Identify ambiguous utterances
 * - Measure clarification rates
 * - Detect parser failures
 * - Track feature adoption
 * - Support debugging
 * 
 * **Guarantees:**
 * - No network transmission without explicit export
 * - No PII collection
 * - No project content
 * - < 1% performance overhead
 * - User has full control
 * 
 * **Cross-references:**
 * - Step 020: Success metrics (what to measure)
 * - Step 022: Risk register (error tracking)
 * - Step 047: Evaluation harness (offline testing)
 * - Step 349: Bug report export (diagnostics)
 * - Step 495: Clarification load tracking (UX metrics)
 */
