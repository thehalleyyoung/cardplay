/**
 * @file Transaction Log (Step 341)
 * @module gofai/execution/transaction-log
 * 
 * Implements Step 341: Add a "transaction log" type that records each micro-step
 * for debugging without exposing internal mutable state.
 * 
 * The transaction log provides a detailed, immutable audit trail of execution
 * without leaking mutable references or enabling state corruption. It's designed
 * for debugging, provenance tracking, and replay.
 * 
 * Design principles:
 * - Logs are append-only and immutable
 * - No mutable state references in logs
 * - Structured entries for programmatic analysis
 * - Human-readable summaries
 * - Efficient serialization
 * - Privacy-aware (can filter sensitive data)
 * 
 * Use cases:
 * - Debugging execution failures
 * - Understanding why edits behaved unexpectedly
 * - Generating provenance reports
 * - Replaying executions for testing
 * - Performance profiling
 * - Audit compliance
 * 
 * @see gofai_goalB.md Step 341
 * @see gofai_goalB.md Step 350 (replay runner)
 * @see gofai_goalB.md Step 349 (bug-report export)
 * @see docs/gofai/transaction-log.md
 */

import type {
  CPLPlan,
  PlanOpcode,
  EditPackage,
} from './edit-package.js';
import type { CanonicalDiff } from './diff-model.js';

// ============================================================================
// Transaction Log Types
// ============================================================================

/**
 * Complete transaction log for a plan execution.
 */
export interface TransactionLog {
  /** Unique log ID */
  readonly id: string;
  
  /** When execution started */
  readonly startedAt: number;
  
  /** When execution completed (or failed) */
  readonly completedAt?: number;
  
  /** Plan being executed */
  readonly plan: CPLPlan;
  
  /** Log entries in chronological order */
  readonly entries: readonly LogEntry[];
  
  /** Final outcome */
  readonly outcome: ExecutionOutcome;
  
  /** Summary statistics */
  readonly stats: LogStatistics;
  
  /** Log metadata */
  readonly metadata: LogMetadata;
}

/**
 * Single log entry.
 */
export interface LogEntry {
  /** Entry type */
  readonly type: LogEntryType;
  
  /** Timestamp relative to log start (ms) */
  readonly timestamp: number;
  
  /** Sequence number */
  readonly sequence: number;
  
  /** Entry data */
  readonly data: LogEntryData;
  
  /** Optional tags for filtering */
  readonly tags?: readonly string[];
}

/**
 * Log entry type.
 */
export type LogEntryType =
  | 'execution_start'
  | 'execution_end'
  | 'opcode_start'
  | 'opcode_end'
  | 'state_snapshot'
  | 'constraint_check'
  | 'query'
  | 'mutation'
  | 'error'
  | 'warning'
  | 'info'
  | 'debug';

/**
 * Log entry data (discriminated union by type).
 */
export type LogEntryData =
  | ExecutionStartData
  | ExecutionEndData
  | OpcodeStartData
  | OpcodeEndData
  | StateSnapshotData
  | ConstraintCheckData
  | QueryData
  | MutationData
  | ErrorData
  | WarningData
  | InfoData
  | DebugData;

/**
 * Execution start data.
 */
export interface ExecutionStartData {
  readonly type: 'execution_start';
  readonly planId: string;
  readonly opcodeCount: number;
  readonly options: Record<string, unknown>;
}

/**
 * Execution end data.
 */
export interface ExecutionEndData {
  readonly type: 'execution_end';
  readonly success: boolean;
  readonly duration: number;
  readonly editPackageId?: string;
}

/**
 * Opcode start data.
 */
export interface OpcodeStartData {
  readonly type: 'opcode_start';
  readonly opcode: PlanOpcode;
  readonly position: number;
}

/**
 * Opcode end data.
 */
export interface OpcodeEndData {
  readonly type: 'opcode_end';
  readonly opcode: PlanOpcode;
  readonly position: number;
  readonly success: boolean;
  readonly duration: number;
  readonly changesApplied: number;
}

/**
 * State snapshot data (no mutable references).
 */
export interface StateSnapshotData {
  readonly type: 'state_snapshot';
  readonly reason: string;
  readonly eventCount: number;
  readonly trackCount: number;
  readonly cardCount: number;
  readonly stateHash: string;
}

/**
 * Constraint check data.
 */
export interface ConstraintCheckData {
  readonly type: 'constraint_check';
  readonly constraintId: string;
  readonly constraintType: string;
  readonly passed: boolean;
  readonly violations?: readonly string[];
}

/**
 * Query data.
 */
export interface QueryData {
  readonly type: 'query';
  readonly queryType: string;
  readonly selector: string;
  readonly resultCount: number;
}

/**
 * Mutation data.
 */
export interface MutationData {
  readonly type: 'mutation';
  readonly mutationType: 'add' | 'remove' | 'modify';
  readonly entityType: string;
  readonly entityId: string;
  readonly fieldPath?: string;
}

/**
 * Error data.
 */
export interface ErrorData {
  readonly type: 'error';
  readonly errorCode: string;
  readonly message: string;
  readonly recoverable: boolean;
}

/**
 * Warning data.
 */
export interface WarningData {
  readonly type: 'warning';
  readonly warningCode: string;
  readonly message: string;
}

/**
 * Info data.
 */
export interface InfoData {
  readonly type: 'info';
  readonly message: string;
}

/**
 * Debug data.
 */
export interface DebugData {
  readonly type: 'debug';
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Execution outcome.
 */
export type ExecutionOutcome =
  | { readonly status: 'success'; readonly editPackage: EditPackage }
  | { readonly status: 'failure'; readonly errorCode: string; readonly message: string }
  | { readonly status: 'cancelled'; readonly reason: string };

/**
 * Log statistics.
 */
export interface LogStatistics {
  /** Total entries */
  readonly totalEntries: number;
  
  /** Entries by type */
  readonly entriesByType: Record<LogEntryType, number>;
  
  /** Total duration (ms) */
  readonly totalDuration: number;
  
  /** Opcodes executed */
  readonly opcodesExecuted: number;
  
  /** Constraints checked */
  readonly constraintsChecked: number;
  
  /** Mutations applied */
  readonly mutationsApplied: number;
  
  /** Errors encountered */
  readonly errorsEncountered: number;
  
  /** Warnings issued */
  readonly warningsIssued: number;
}

/**
 * Log metadata.
 */
export interface LogMetadata {
  /** GOFAI compiler version */
  readonly compilerVersion: string;
  
  /** Enabled extensions */
  readonly enabledExtensions: readonly string[];
  
  /** Board context */
  readonly boardType?: string;
  
  /** User-provided tags */
  readonly customTags?: readonly string[];
}

// ============================================================================
// Transaction Logger
// ============================================================================

/**
 * Builds transaction logs during execution.
 */
export class TransactionLogger {
  private entries: LogEntry[] = [];
  private startTime: number;
  private sequence = 0;
  
  constructor(
    private readonly logId: string,
    private readonly plan: CPLPlan,
    private readonly metadata: LogMetadata
  ) {
    this.startTime = Date.now();
  }
  
  /**
   * Log execution start.
   */
  logExecutionStart(options: Record<string, unknown>): void {
    this.addEntry({
      type: 'execution_start',
      data: {
        type: 'execution_start',
        planId: this.plan.type as string,
        opcodeCount: this.plan.opcodes.length,
        options,
      },
    });
  }
  
  /**
   * Log execution end.
   */
  logExecutionEnd(success: boolean, editPackageId?: string): void {
    const now = Date.now();
    this.addEntry({
      type: 'execution_end',
      data: {
        type: 'execution_end',
        success,
        duration: now - this.startTime,
        editPackageId,
      },
    });
  }
  
  /**
   * Log opcode start.
   */
  logOpcodeStart(opcode: PlanOpcode, position: number): void {
    this.addEntry({
      type: 'opcode_start',
      data: {
        type: 'opcode_start',
        opcode,
        position,
      },
    });
  }
  
  /**
   * Log opcode end.
   */
  logOpcodeEnd(
    opcode: PlanOpcode,
    position: number,
    success: boolean,
    startTime: number,
    changesApplied: number
  ): void {
    this.addEntry({
      type: 'opcode_end',
      data: {
        type: 'opcode_end',
        opcode,
        position,
        success,
        duration: Date.now() - startTime,
        changesApplied,
      },
    });
  }
  
  /**
   * Log state snapshot.
   */
  logStateSnapshot(
    reason: string,
    eventCount: number,
    trackCount: number,
    cardCount: number,
    stateHash: string
  ): void {
    this.addEntry({
      type: 'state_snapshot',
      data: {
        type: 'state_snapshot',
        reason,
        eventCount,
        trackCount,
        cardCount,
        stateHash,
      },
    });
  }
  
  /**
   * Log constraint check.
   */
  logConstraintCheck(
    constraintId: string,
    constraintType: string,
    passed: boolean,
    violations?: readonly string[]
  ): void {
    this.addEntry({
      type: 'constraint_check',
      data: {
        type: 'constraint_check',
        constraintId,
        constraintType,
        passed,
        violations,
      },
    });
  }
  
  /**
   * Log query.
   */
  logQuery(queryType: string, selector: string, resultCount: number): void {
    this.addEntry({
      type: 'query',
      data: {
        type: 'query',
        queryType,
        selector,
        resultCount,
      },
    });
  }
  
  /**
   * Log mutation.
   */
  logMutation(
    mutationType: 'add' | 'remove' | 'modify',
    entityType: string,
    entityId: string,
    fieldPath?: string
  ): void {
    this.addEntry({
      type: 'mutation',
      data: {
        type: 'mutation',
        mutationType,
        entityType,
        entityId,
        fieldPath,
      },
    });
  }
  
  /**
   * Log error.
   */
  logError(errorCode: string, message: string, recoverable: boolean): void {
    this.addEntry({
      type: 'error',
      data: {
        type: 'error',
        errorCode,
        message,
        recoverable,
      },
    });
  }
  
  /**
   * Log warning.
   */
  logWarning(warningCode: string, message: string): void {
    this.addEntry({
      type: 'warning',
      data: {
        type: 'warning',
        warningCode,
        message,
      },
    });
  }
  
  /**
   * Log info.
   */
  logInfo(message: string): void {
    this.addEntry({
      type: 'info',
      data: {
        type: 'info',
        message,
      },
    });
  }
  
  /**
   * Log debug.
   */
  logDebug(message: string, context?: Record<string, unknown>): void {
    this.addEntry({
      type: 'debug',
      data: {
        type: 'debug',
        message,
        context,
      },
    });
  }
  
  /**
   * Add an entry to the log.
   */
  private addEntry(partial: Omit<LogEntry, 'timestamp' | 'sequence'>): void {
    this.entries.push({
      ...partial,
      timestamp: Date.now() - this.startTime,
      sequence: this.sequence++,
    });
  }
  
  /**
   * Finalize and return the complete log.
   */
  finalize(outcome: ExecutionOutcome): TransactionLog {
    const stats = this.computeStatistics();
    
    return {
      id: this.logId,
      startedAt: this.startTime,
      completedAt: Date.now(),
      plan: this.plan,
      entries: [...this.entries],
      outcome,
      stats,
      metadata: this.metadata,
    };
  }
  
  /**
   * Compute log statistics.
   */
  private computeStatistics(): LogStatistics {
    const entriesByType: Partial<Record<LogEntryType, number>> = {};
    
    let opcodesExecuted = 0;
    let constraintsChecked = 0;
    let mutationsApplied = 0;
    let errorsEncountered = 0;
    let warningsIssued = 0;
    
    for (const entry of this.entries) {
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
      
      switch (entry.type) {
        case 'opcode_end':
          opcodesExecuted++;
          break;
        case 'constraint_check':
          constraintsChecked++;
          break;
        case 'mutation':
          mutationsApplied++;
          break;
        case 'error':
          errorsEncountered++;
          break;
        case 'warning':
          warningsIssued++;
          break;
      }
    }
    
    const lastEntry = this.entries[this.entries.length - 1];
    const totalDuration = lastEntry ? lastEntry.timestamp : 0;
    
    return {
      totalEntries: this.entries.length,
      entriesByType: entriesByType as Record<LogEntryType, number>,
      totalDuration,
      opcodesExecuted,
      constraintsChecked,
      mutationsApplied,
      errorsEncountered,
      warningsIssued,
    };
  }
}

// ============================================================================
// Log Analysis
// ============================================================================

/**
 * Analyzes transaction logs.
 */
export class LogAnalyzer {
  /**
   * Filter log entries by type.
   */
  static filterByType(log: TransactionLog, type: LogEntryType): readonly LogEntry[] {
    return log.entries.filter(entry => entry.type === type);
  }
  
  /**
   * Filter log entries by time range.
   */
  static filterByTimeRange(
    log: TransactionLog,
    startMs: number,
    endMs: number
  ): readonly LogEntry[] {
    return log.entries.filter(
      entry => entry.timestamp >= startMs && entry.timestamp <= endMs
    );
  }
  
  /**
   * Get entries related to a specific opcode.
   */
  static getOpcodeEntries(log: TransactionLog, position: number): readonly LogEntry[] {
    const opcodeStart = log.entries.find(
      entry => entry.type === 'opcode_start' && 
               (entry.data as OpcodeStartData).position === position
    );
    
    if (!opcodeStart) {
      return [];
    }
    
    const opcodeEnd = log.entries.find(
      entry => entry.type === 'opcode_end' &&
               (entry.data as OpcodeEndData).position === position
    );
    
    const startTimestamp = opcodeStart.timestamp;
    const endTimestamp = opcodeEnd?.timestamp ?? log.entries[log.entries.length - 1].timestamp;
    
    return log.entries.filter(
      entry => entry.timestamp >= startTimestamp && entry.timestamp <= endTimestamp
    );
  }
  
  /**
   * Generate human-readable summary.
   */
  static generateSummary(log: TransactionLog): string {
    const { stats, outcome } = log;
    
    let summary = `Transaction Log Summary\n`;
    summary += `========================\n\n`;
    summary += `Log ID: ${log.id}\n`;
    summary += `Started: ${new Date(log.startedAt).toISOString()}\n`;
    if (log.completedAt) {
      summary += `Completed: ${new Date(log.completedAt).toISOString()}\n`;
    }
    summary += `Duration: ${stats.totalDuration}ms\n\n`;
    
    summary += `Outcome: ${outcome.status}\n`;
    if (outcome.status === 'failure') {
      summary += `Error: ${outcome.errorCode} - ${outcome.message}\n`;
    }
    summary += `\n`;
    
    summary += `Statistics:\n`;
    summary += `  Total Entries: ${stats.totalEntries}\n`;
    summary += `  Opcodes Executed: ${stats.opcodesExecuted}\n`;
    summary += `  Constraints Checked: ${stats.constraintsChecked}\n`;
    summary += `  Mutations Applied: ${stats.mutationsApplied}\n`;
    summary += `  Errors: ${stats.errorsEncountered}\n`;
    summary += `  Warnings: ${stats.warningsIssued}\n`;
    
    return summary;
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  TransactionLog,
  LogEntry,
  LogEntryType,
  LogEntryData,
  ExecutionOutcome,
  LogStatistics,
  LogMetadata,
};

export {
  TransactionLogger,
  LogAnalyzer,
};
