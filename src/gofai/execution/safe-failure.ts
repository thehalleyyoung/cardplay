/**
 * @file Safe Failure with Rollback (Step 334)
 * @module gofai/execution/safe-failure
 * 
 * Implements Step 334: Implement "safe failure": if execution fails mid-transaction,
 * rollback and show a structured error with context and suggested fixes.
 * 
 * This module ensures that execution failures never corrupt project state and
 * always provide actionable information to users for debugging and recovery.
 * 
 * Design principles:
 * - All mutations are transactional (all-or-nothing)
 * - Failed executions rollback completely
 * - Errors are structured with context
 * - Suggestions for fixes are always provided
 * - State snapshots enable debugging
 * - Partial progress is never committed
 * 
 * Error categories:
 * 1. Precondition failures (selector empty, entity missing)
 * 2. Constraint violations (preserve exact melody failed)
 * 3. Runtime errors (extension handler threw)
 * 4. System errors (out of memory, timeout)
 * 5. Invalid operations (incompatible types)
 * 
 * @see gofai_goalB.md Step 334
 * @see gofai_goalB.md Step 302 (transactional execution)
 * @see src/gofai/execution/transactional-execution.ts
 * @see docs/gofai/error-handling.md
 */

import type {
  CPLPlan,
  PlanOpcode,
} from './edit-package.js';
import type { ProjectState } from './transactional-execution.js';
import type { CanonicalDiff } from './diff-model.js';

// ============================================================================
// Structured Error Types
// ============================================================================

/**
 * Structured execution error with context and suggestions.
 */
export interface StructuredExecutionError {
  /** Error code for programmatic handling */
  readonly code: ErrorCode;
  
  /** Human-readable message */
  readonly message: string;
  
  /** Severity level */
  readonly severity: ErrorSeverity;
  
  /** Which opcode failed */
  readonly failedOpcode?: PlanOpcode;
  
  /** Position in plan */
  readonly failedPosition?: number;
  
  /** Context at time of failure */
  readonly context: ErrorContext;
  
  /** Suggested fixes */
  readonly suggestions: readonly Suggestion[];
  
  /** Technical details for debugging */
  readonly details?: ErrorDetails;
  
  /** Can this be recovered from? */
  readonly recoverable: boolean;
}

/**
 * Error codes for programmatic handling.
 */
export type ErrorCode =
  | 'PRECONDITION_FAILED'
  | 'CONSTRAINT_VIOLATION'
  | 'INVALID_SELECTOR'
  | 'ENTITY_NOT_FOUND'
  | 'TYPE_ERROR'
  | 'CAPABILITY_DENIED'
  | 'HANDLER_EXCEPTION'
  | 'TIMEOUT'
  | 'OUT_OF_MEMORY'
  | 'UNKNOWN_OPCODE'
  | 'INVALID_PARAMETER'
  | 'STATE_CONFLICT';

/**
 * Error severity.
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning';

/**
 * Error context - state at time of failure.
 */
export interface ErrorContext {
  /** Project state snapshot (before any changes) */
  readonly initialState: StateSnapshot;
  
  /** Opcodes that succeeded before failure */
  readonly succeededOpcodes: readonly PlanOpcode[];
  
  /** Partial changes (rolled back) */
  readonly rolledBackChanges?: CanonicalDiff;
  
  /** Execution options */
  readonly options: Record<string, unknown>;
  
  /** Timestamp */
  readonly timestamp: number;
}

/**
 * State snapshot for debugging.
 */
export interface StateSnapshot {
  /** Number of events */
  readonly eventCount: number;
  
  /** Number of tracks */
  readonly trackCount: number;
  
  /** Number of cards */
  readonly cardCount: number;
  
  /** Hash of state for comparison */
  readonly stateHash: string;
  
  /** Key entities involved */
  readonly keyEntities: readonly string[];
}

/**
 * Suggested fix.
 */
export interface Suggestion {
  /** Suggestion type */
  readonly type: SuggestionType;
  
  /** Human-readable description */
  readonly description: string;
  
  /** Can this be applied automatically? */
  readonly automatic: boolean;
  
  /** Action to apply suggestion */
  readonly action?: SuggestionAction;
  
  /** Priority (higher = more likely to help) */
  readonly priority: 'high' | 'medium' | 'low';
}

/**
 * Suggestion type.
 */
export type SuggestionType =
  | 'modify_selector'
  | 'add_missing_entity'
  | 'relax_constraint'
  | 'fix_parameter'
  | 'retry_with_different_opcode'
  | 'install_extension'
  | 'enable_capability'
  | 'reduce_scope'
  | 'contact_support';

/**
 * Action to apply a suggestion.
 */
export interface SuggestionAction {
  readonly type: string;
  readonly params: Record<string, unknown>;
}

/**
 * Technical error details.
 */
export interface ErrorDetails {
  /** Stack trace if available */
  readonly stackTrace?: string;
  
  /** Original exception */
  readonly originalError?: unknown;
  
  /** Internal state for debugging */
  readonly internalState?: Record<string, unknown>;
}

// ============================================================================
// Safe Execution Wrapper
// ============================================================================

/**
 * Result of safe execution.
 */
export type SafeExecutionResult =
  | {
      readonly status: 'success';
      readonly state: ProjectState;
      readonly diff: CanonicalDiff;
    }
  | {
      readonly status: 'failure';
      readonly error: StructuredExecutionError;
      readonly state: ProjectState; // Original state (rolled back)
    };

/**
 * Wraps execution to ensure safe failure.
 */
export class SafeExecutionWrapper {
  /**
   * Execute a plan safely with automatic rollback on failure.
   */
  static async executeSafely(
    plan: CPLPlan,
    initialState: ProjectState,
    executor: (state: ProjectState, plan: CPLPlan) => Promise<{ state: ProjectState; diff: CanonicalDiff }>,
    options: Record<string, unknown> = {}
  ): Promise<SafeExecutionResult> {
    // Capture initial state snapshot
    const snapshot = this.captureSnapshot(initialState);
    
    // Track succeeded opcodes for context
    const succeededOpcodes: PlanOpcode[] = [];
    
    try {
      // Execute plan
      const result = await executor(initialState, plan);
      
      return {
        status: 'success',
        state: result.state,
        diff: result.diff,
      };
    } catch (error) {
      // Execution failed - rollback and structure error
      const structuredError = this.structureError(
        error,
        plan,
        snapshot,
        succeededOpcodes,
        options
      );
      
      return {
        status: 'failure',
        error: structuredError,
        state: initialState, // Rolled back to initial
      };
    }
  }
  
  /**
   * Capture state snapshot.
   */
  private static captureSnapshot(state: ProjectState): StateSnapshot {
    const events = state.events.getAll();
    const tracks = state.tracks.getAll();
    const cards = state.cards.getAll();
    
    return {
      eventCount: events.length,
      trackCount: tracks.length,
      cardCount: cards.length,
      stateHash: this.computeStateHash(state),
      keyEntities: [
        ...events.slice(0, 10).map(e => e.id),
        ...tracks.slice(0, 5).map(t => t.id),
        ...cards.slice(0, 5).map(c => c.id),
      ],
    };
  }
  
  /**
   * Compute a hash of project state for comparison.
   */
  private static computeStateHash(state: ProjectState): string {
    const content = JSON.stringify({
      events: state.events.getAll().length,
      tracks: state.tracks.getAll().length,
      cards: state.cards.getAll().length,
    });
    
    // Simple hash (in practice, use crypto hash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Structure an error with context and suggestions.
   */
  private static structureError(
    error: unknown,
    plan: CPLPlan,
    snapshot: StateSnapshot,
    succeededOpcodes: readonly PlanOpcode[],
    options: Record<string, unknown>
  ): StructuredExecutionError {
    // Extract error information
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stackTrace = error instanceof Error ? error.stack : undefined;
    
    // Determine error code
    const code = this.inferErrorCode(message, error);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(code, message, plan);
    
    return {
      code,
      message,
      severity: 'error',
      context: {
        initialState: snapshot,
        succeededOpcodes,
        options,
        timestamp: Date.now(),
      },
      suggestions,
      details: {
        stackTrace,
        originalError: error,
      },
      recoverable: this.isRecoverable(code),
    };
  }
  
  /**
   * Infer error code from message.
   */
  private static inferErrorCode(message: string, error: unknown): ErrorCode {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('precondition')) return 'PRECONDITION_FAILED';
    if (lowerMessage.includes('constraint')) return 'CONSTRAINT_VIOLATION';
    if (lowerMessage.includes('selector')) return 'INVALID_SELECTOR';
    if (lowerMessage.includes('not found')) return 'ENTITY_NOT_FOUND';
    if (lowerMessage.includes('type')) return 'TYPE_ERROR';
    if (lowerMessage.includes('capability')) return 'CAPABILITY_DENIED';
    if (lowerMessage.includes('timeout')) return 'TIMEOUT';
    if (lowerMessage.includes('memory')) return 'OUT_OF_MEMORY';
    if (lowerMessage.includes('unknown opcode')) return 'UNKNOWN_OPCODE';
    if (lowerMessage.includes('parameter')) return 'INVALID_PARAMETER';
    if (lowerMessage.includes('conflict')) return 'STATE_CONFLICT';
    
    return 'HANDLER_EXCEPTION';
  }
  
  /**
   * Generate suggestions based on error code.
   */
  private static generateSuggestions(
    code: ErrorCode,
    message: string,
    plan: CPLPlan
  ): readonly Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    switch (code) {
      case 'PRECONDITION_FAILED':
        suggestions.push({
          type: 'modify_selector',
          description: 'Try broadening the selector to include more entities',
          automatic: false,
          priority: 'high',
        });
        suggestions.push({
          type: 'reduce_scope',
          description: 'Reduce the scope of the operation',
          automatic: false,
          priority: 'medium',
        });
        break;
        
      case 'CONSTRAINT_VIOLATION':
        suggestions.push({
          type: 'relax_constraint',
          description: 'Consider relaxing the constraint from "exact" to "similar"',
          automatic: false,
          priority: 'high',
        });
        break;
        
      case 'INVALID_SELECTOR':
        suggestions.push({
          type: 'modify_selector',
          description: 'Check that the selector references existing entities',
          automatic: false,
          priority: 'high',
        });
        break;
        
      case 'ENTITY_NOT_FOUND':
        suggestions.push({
          type: 'add_missing_entity',
          description: 'Ensure the required entity exists before running this operation',
          automatic: false,
          priority: 'high',
        });
        break;
        
      case 'CAPABILITY_DENIED':
        suggestions.push({
          type: 'enable_capability',
          description: 'Enable the required capability in board settings',
          automatic: false,
          priority: 'high',
        });
        break;
        
      case 'UNKNOWN_OPCODE':
        suggestions.push({
          type: 'install_extension',
          description: 'Install the required extension',
          automatic: false,
          priority: 'high',
        });
        break;
        
      case 'INVALID_PARAMETER':
        suggestions.push({
          type: 'fix_parameter',
          description: 'Check parameter values are within valid ranges',
          automatic: false,
          priority: 'high',
        });
        break;
        
      default:
        suggestions.push({
          type: 'contact_support',
          description: 'This error may require developer assistance',
          automatic: false,
          priority: 'low',
        });
    }
    
    return suggestions;
  }
  
  /**
   * Check if an error is recoverable.
   */
  private static isRecoverable(code: ErrorCode): boolean {
    const unrecoverable = new Set<ErrorCode>([
      'OUT_OF_MEMORY',
      'TIMEOUT',
      'STATE_CONFLICT',
    ]);
    
    return !unrecoverable.has(code);
  }
}

// ============================================================================
// Error Reporter
// ============================================================================

/**
 * Formats errors for display.
 */
export class ErrorReporter {
  /**
   * Format error as user-friendly message.
   */
  static formatForUser(error: StructuredExecutionError): string {
    let message = `❌ Execution failed: ${error.message}\n\n`;
    
    if (error.failedOpcode) {
      message += `Failed at opcode: ${error.failedOpcode.type}\n`;
      if (error.failedPosition !== undefined) {
        message += `Position in plan: ${error.failedPosition + 1}\n`;
      }
      message += `\n`;
    }
    
    message += `What can you do?\n\n`;
    
    for (let i = 0; i < error.suggestions.length; i++) {
      const suggestion = error.suggestions[i];
      message += `${i + 1}. ${suggestion.description}`;
      if (suggestion.automatic) {
        message += ` (can be applied automatically)`;
      }
      message += `\n`;
    }
    
    if (error.recoverable) {
      message += `\nThis error is recoverable. Try one of the suggestions above.\n`;
    } else {
      message += `\n⚠️  This error may not be recoverable without system intervention.\n`;
    }
    
    return message;
  }
  
  /**
   * Format error as technical debug message.
   */
  static formatForDebug(error: StructuredExecutionError): string {
    let message = `Error Code: ${error.code}\n`;
    message += `Severity: ${error.severity}\n`;
    message += `Message: ${error.message}\n`;
    message += `Recoverable: ${error.recoverable}\n\n`;
    
    message += `Context:\n`;
    message += `  Initial state hash: ${error.context.initialState.stateHash}\n`;
    message += `  Event count: ${error.context.initialState.eventCount}\n`;
    message += `  Track count: ${error.context.initialState.trackCount}\n`;
    message += `  Card count: ${error.context.initialState.cardCount}\n`;
    message += `  Succeeded opcodes: ${error.context.succeededOpcodes.length}\n`;
    message += `  Timestamp: ${new Date(error.context.timestamp).toISOString()}\n\n`;
    
    if (error.details?.stackTrace) {
      message += `Stack Trace:\n${error.details.stackTrace}\n\n`;
    }
    
    if (error.suggestions.length > 0) {
      message += `Suggestions:\n`;
      for (const suggestion of error.suggestions) {
        message += `  - [${suggestion.priority}] ${suggestion.description}\n`;
      }
    }
    
    return message;
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  StructuredExecutionError,
  ErrorCode,
  ErrorSeverity,
  ErrorContext,
  StateSnapshot,
  Suggestion,
  SuggestionType,
  SuggestionAction,
  SafeExecutionResult,
};

export {
  SafeExecutionWrapper,
  ErrorReporter,
};
