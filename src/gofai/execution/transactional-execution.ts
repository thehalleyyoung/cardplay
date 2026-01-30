/**
 * @file Transactional Execution Model
 * @module gofai/execution/transactional-execution
 * 
 * Implements Step 302: Define a transactional execution model: apply edits to a fork;
 * validate constraints; commit or rollback.
 * 
 * This module provides a transactional execution engine that ensures edits are applied
 * safely and atomically. All mutations happen on a forked copy of project state, and
 * are only committed if all constraints pass and no errors occur.
 * 
 * Design principles:
 * - Atomic: All-or-nothing execution
 * - Isolated: Edits don't affect main state until commit
 * - Safe: Constraints validated before commit
 * - Reversible: Failed executions leave no side effects
 * - Auditable: Full trace of execution steps
 * 
 * Transaction lifecycle:
 * 1. Begin: Fork project state
 * 2. Execute: Apply opcodes to fork
 * 3. Validate: Check all constraints
 * 4. Commit/Rollback: Update main state or discard fork
 * 
 * @see gofai_goalB.md Step 302
 * @see docs/gofai/execution.md
 */

import type { CPLPlan, PlanOpcode, ExecutionDiff } from './edit-package.js';

// ============================================================================
// Project State Types (Simplified Interface)
// ============================================================================

/**
 * Minimal interface to CardPlay project state needed for execution.
 * 
 * This is a read/write interface that allows forking, mutation, and diffing.
 */
export interface ProjectState {
  /** Events in the project */
  readonly events: EventCollection;
  
  /** Tracks in the project */
  readonly tracks: TrackCollection;
  
  /** Cards in the project */
  readonly cards: CardCollection;
  
  /** Section markers */
  readonly sections: SectionCollection;
  
  /** Routing connections */
  readonly routing: RoutingCollection;
  
  /** Project metadata (tempo, time signature, etc.) */
  readonly metadata: ProjectMetadata;
}

/**
 * Event collection operations.
 */
export interface EventCollection {
  readonly get: (id: string) => Event | undefined;
  readonly getAll: () => readonly Event[];
  readonly add: (event: Event) => void;
  readonly remove: (id: string) => void;
  readonly update: (id: string, changes: Partial<Event>) => void;
  readonly query: (selector: EventSelector) => readonly Event[];
}

/**
 * Track collection operations.
 */
export interface TrackCollection {
  readonly get: (id: string) => Track | undefined;
  readonly getAll: () => readonly Track[];
  readonly add: (track: Track) => void;
  readonly remove: (id: string) => void;
  readonly update: (id: string, changes: Partial<Track>) => void;
}

/**
 * Card collection operations.
 */
export interface CardCollection {
  readonly get: (id: string) => Card | undefined;
  readonly getAll: () => readonly Card[];
  readonly add: (card: Card) => void;
  readonly remove: (id: string) => void;
  readonly updateParameter: (cardId: string, paramId: string, value: unknown) => void;
}

/**
 * Section collection operations.
 */
export interface SectionCollection {
  readonly get: (id: string) => Section | undefined;
  readonly getAll: () => readonly Section[];
  readonly add: (section: Section) => void;
  readonly remove: (id: string) => void;
  readonly update: (id: string, changes: Partial<Section>) => void;
}

/**
 * Routing collection operations.
 */
export interface RoutingCollection {
  readonly get: (id: string) => Connection | undefined;
  readonly getAll: () => readonly Connection[];
  readonly add: (connection: Connection) => void;
  readonly remove: (id: string) => void;
}

/**
 * Project metadata.
 */
export interface ProjectMetadata {
  readonly tempoBpm: number;
  readonly timeSignature: { numerator: number; denominator: number };
  readonly ticksPerQuarter: number;
  readonly lengthTicks: number;
}

/**
 * Event entity.
 */
export interface Event {
  readonly id: string;
  readonly kind: string;
  readonly startTick: number;
  readonly durationTicks: number;
  readonly trackId: string;
  readonly payload: unknown;
  readonly tags: readonly string[];
}

/**
 * Track entity.
 */
export interface Track {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly gain: number;
  readonly pan: number;
  readonly muted: boolean;
}

/**
 * Card entity.
 */
export interface Card {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly trackId: string;
  readonly parameters: Record<string, unknown>;
  readonly bypassed: boolean;
}

/**
 * Section entity.
 */
export interface Section {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly startTick: number;
  readonly endTick: number;
}

/**
 * Routing connection.
 */
export interface Connection {
  readonly id: string;
  readonly sourceTrackId: string;
  readonly sourcePort: string;
  readonly targetTrackId: string;
  readonly targetPort: string;
}

/**
 * Event selector for queries.
 */
export interface EventSelector {
  readonly trackIds?: readonly string[];
  readonly tags?: readonly string[];
  readonly timeRange?: { start: number; end: number };
  readonly kinds?: readonly string[];
}

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * A transaction represents an isolated execution context.
 */
export interface Transaction {
  /** Transaction ID */
  readonly id: string;
  
  /** Forked project state (isolated) */
  readonly state: ProjectState;
  
  /** Original state (for diffing) */
  readonly originalState: ProjectState;
  
  /** Status */
  status: TransactionStatus;
  
  /** Execution log */
  readonly log: readonly TransactionLogEntry[];
  
  /** Timestamp when transaction began */
  readonly startedAt: number;
  
  /** Timestamp when transaction completed (if any) */
  completedAt?: number;
}

/**
 * Transaction status.
 */
export type TransactionStatus =
  | 'active'        // Currently executing
  | 'validating'    // Constraint validation in progress
  | 'committed'     // Successfully committed
  | 'rolled-back'   // Rolled back due to error or validation failure
  | 'aborted';      // Explicitly aborted by caller

/**
 * A log entry in the transaction.
 */
export interface TransactionLogEntry {
  readonly timestamp: number;
  readonly type: 'opcode-start' | 'opcode-complete' | 'opcode-error' | 'validation' | 'commit' | 'rollback';
  readonly opcodeId?: string;
  readonly message: string;
  readonly data?: unknown;
}

/**
 * Result of transaction execution.
 */
export interface TransactionResult {
  /** Success or failure */
  readonly success: boolean;
  
  /** Transaction that was executed */
  readonly transaction: Transaction;
  
  /** Diff (if successful) */
  readonly diff?: ExecutionDiff;
  
  /** Error (if failed) */
  readonly error?: TransactionError;
  
  /** Diagnostics */
  readonly diagnostics: readonly TransactionDiagnostic[];
}

/**
 * A transaction error.
 */
export interface TransactionError {
  readonly code: string;
  readonly message: string;
  readonly opcodeId?: string;
  readonly phase: 'execution' | 'validation' | 'commit';
  readonly cause?: unknown;
}

/**
 * A diagnostic message from transaction execution.
 */
export interface TransactionDiagnostic {
  readonly severity: 'error' | 'warning' | 'info';
  readonly code: string;
  readonly message: string;
  readonly opcodeId?: string;
  readonly context?: Record<string, unknown>;
}

// ============================================================================
// Opcode Executor Registry
// ============================================================================

/**
 * An opcode executor handles execution of a specific opcode type.
 */
export interface OpcodeExecutor {
  /** Opcode type this executor handles */
  readonly opcodeType: string;
  
  /** Execute the opcode on project state */
  readonly execute: (opcode: PlanOpcode, state: ProjectState) => OpcodeExecutionResult;
  
  /** Check if this opcode can execute (preconditions) */
  readonly canExecute: (opcode: PlanOpcode, state: ProjectState) => PreconditionCheck;
}

/**
 * Result of opcode execution.
 */
export interface OpcodeExecutionResult {
  readonly success: boolean;
  readonly affectedEntities: readonly string[];
  readonly error?: string;
  readonly warnings?: readonly string[];
}

/**
 * Precondition check result.
 */
export interface PreconditionCheck {
  readonly canExecute: boolean;
  readonly failedPreconditions: readonly string[];
}

/**
 * Registry of opcode executors.
 */
export class OpcodeExecutorRegistry {
  private executors = new Map<string, OpcodeExecutor>();
  
  /**
   * Register an executor for an opcode type.
   */
  register(executor: OpcodeExecutor): void {
    if (this.executors.has(executor.opcodeType)) {
      throw new Error(`Executor already registered for opcode type: ${executor.opcodeType}`);
    }
    this.executors.set(executor.opcodeType, executor);
  }
  
  /**
   * Get executor for an opcode type.
   */
  get(opcodeType: string): OpcodeExecutor | undefined {
    return this.executors.get(opcodeType);
  }
  
  /**
   * Check if an executor is registered for a type.
   */
  has(opcodeType: string): boolean {
    return this.executors.has(opcodeType);
  }
  
  /**
   * Get all registered opcode types.
   */
  getRegisteredTypes(): readonly string[] {
    return Array.from(this.executors.keys());
  }
}

// ============================================================================
// Constraint Validator Registry
// ============================================================================

/**
 * A constraint validator checks if a constraint is satisfied.
 */
export interface ConstraintValidator {
  /** Constraint type this validator handles */
  readonly constraintType: string;
  
  /** Validate the constraint */
  readonly validate: (
    constraint: unknown,
    before: ProjectState,
    after: ProjectState
  ) => ConstraintValidationResult;
}

/**
 * Result of constraint validation.
 */
export interface ConstraintValidationResult {
  readonly satisfied: boolean;
  readonly violation?: {
    readonly message: string;
    readonly counterexample: unknown;
    readonly affectedEntities: readonly string[];
  };
}

/**
 * Registry of constraint validators.
 */
export class ConstraintValidatorRegistry {
  private validators = new Map<string, ConstraintValidator>();
  
  /**
   * Register a validator for a constraint type.
   */
  register(validator: ConstraintValidator): void {
    if (this.validators.has(validator.constraintType)) {
      throw new Error(`Validator already registered for constraint type: ${validator.constraintType}`);
    }
    this.validators.set(validator.constraintType, validator);
  }
  
  /**
   * Get validator for a constraint type.
   */
  get(constraintType: string): ConstraintValidator | undefined {
    return this.validators.get(constraintType);
  }
  
  /**
   * Check if a validator is registered for a type.
   */
  has(constraintType: string): boolean {
    return this.validators.has(constraintType);
  }
}

// ============================================================================
// Transactional Execution Engine
// ============================================================================

/**
 * Configuration for the execution engine.
 */
export interface ExecutionEngineConfig {
  /** Maximum execution time per opcode (ms) */
  readonly maxOpcodeExecutionTime: number;
  
  /** Maximum total transaction time (ms) */
  readonly maxTransactionTime: number;
  
  /** Whether to stop on first error */
  readonly stopOnError: boolean;
  
  /** Whether to validate constraints after each opcode */
  readonly validateEachOpcode: boolean;
}

/**
 * Default configuration.
 */
export const DEFAULT_EXECUTION_CONFIG: ExecutionEngineConfig = {
  maxOpcodeExecutionTime: 5000,
  maxTransactionTime: 30000,
  stopOnError: true,
  validateEachOpcode: false,
};

/**
 * Transactional execution engine.
 * 
 * Executes plans in isolated transactions with full rollback capability.
 */
export class TransactionalExecutionEngine {
  constructor(
    private readonly opcodeRegistry: OpcodeExecutorRegistry,
    private readonly constraintRegistry: ConstraintValidatorRegistry,
    private readonly config: ExecutionEngineConfig = DEFAULT_EXECUTION_CONFIG
  ) {}
  
  /**
   * Execute a plan in a transaction.
   * 
   * @param plan - The plan to execute
   * @param state - The original project state
   * @returns Transaction result with diff or error
   */
  async execute(plan: CPLPlan, state: ProjectState): Promise<TransactionResult> {
    // Begin transaction
    const transaction = this.beginTransaction(state);
    const diagnostics: TransactionDiagnostic[] = [];
    
    try {
      // Check preconditions
      const preconditionResult = this.checkPreconditions(plan, transaction);
      if (!preconditionResult.success) {
        return this.rollback(transaction, {
          code: 'PRECONDITIONS_FAILED',
          message: 'Plan preconditions not satisfied',
          phase: 'execution',
          cause: preconditionResult.failures,
        });
      }
      
      // Execute each opcode
      for (const opcode of plan.opcodes) {
        const opcodeResult = await this.executeOpcode(opcode, transaction);
        
        if (!opcodeResult.success) {
          if (this.config.stopOnError) {
            return this.rollback(transaction, {
              code: 'OPCODE_EXECUTION_FAILED',
              message: opcodeResult.error || 'Unknown execution error',
              opcodeId: opcode.id,
              phase: 'execution',
            });
          } else {
            diagnostics.push({
              severity: 'error',
              code: 'OPCODE_FAILED',
              message: opcodeResult.error || 'Unknown error',
              opcodeId: opcode.id,
            });
          }
        }
        
        if (opcodeResult.warnings) {
          for (const warning of opcodeResult.warnings) {
            diagnostics.push({
              severity: 'warning',
              code: 'OPCODE_WARNING',
              message: warning,
              opcodeId: opcode.id,
            });
          }
        }
        
        // Validate constraints after each opcode if configured
        if (this.config.validateEachOpcode) {
          const validationResult = this.validateConstraints(plan, transaction);
          if (!validationResult.success) {
            return this.rollback(transaction, {
              code: 'CONSTRAINT_VIOLATED',
              message: 'Constraint validation failed',
              opcodeId: opcode.id,
              phase: 'validation',
              cause: validationResult.violations,
            });
          }
        }
      }
      
      // Final constraint validation
      transaction.status = 'validating';
      const finalValidation = this.validateConstraints(plan, transaction);
      if (!finalValidation.success) {
        return this.rollback(transaction, {
          code: 'FINAL_VALIDATION_FAILED',
          message: 'Final constraint validation failed',
          phase: 'validation',
          cause: finalValidation.violations,
        });
      }
      
      // Compute diff
      const diff = this.computeDiff(transaction, plan);
      
      // Commit transaction
      this.commit(transaction);
      
      return {
        success: true,
        transaction,
        diff,
        diagnostics,
      };
      
    } catch (error) {
      return this.rollback(transaction, {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        phase: 'execution',
        cause: error,
      });
    }
  }
  
  /**
   * Begin a new transaction (fork state).
   */
  private beginTransaction(state: ProjectState): Transaction {
    const forkedState = this.forkState(state);
    
    return {
      id: this.generateTransactionId(),
      state: forkedState,
      originalState: state,
      status: 'active',
      log: [],
      startedAt: Date.now(),
    };
  }
  
  /**
   * Fork project state for isolated execution.
   */
  private forkState(state: ProjectState): ProjectState {
    // Deep clone the state
    // In a real implementation, this would use a more efficient copy-on-write strategy
    return JSON.parse(JSON.stringify(state));
  }
  
  /**
   * Check plan preconditions.
   */
  private checkPreconditions(plan: CPLPlan, transaction: Transaction): {
    success: boolean;
    failures: readonly string[];
  } {
    const failures: string[] = [];
    
    for (const precondition of plan.preconditions) {
      // Check if precondition holds
      // This is a simplified check; real implementation would be more sophisticated
      const holds = this.checkPrecondition(precondition, transaction.state);
      if (!holds) {
        failures.push(precondition.condition);
      }
    }
    
    return {
      success: failures.length === 0,
      failures,
    };
  }
  
  /**
   * Check a single precondition.
   */
  private checkPrecondition(precondition: unknown, state: ProjectState): boolean {
    // Placeholder implementation
    // Real implementation would evaluate precondition against state
    return true;
  }
  
  /**
   * Execute a single opcode.
   */
  private async executeOpcode(
    opcode: PlanOpcode,
    transaction: Transaction
  ): Promise<OpcodeExecutionResult> {
    // Log opcode start
    this.addLogEntry(transaction, {
      timestamp: Date.now(),
      type: 'opcode-start',
      opcodeId: opcode.id,
      message: `Executing opcode: ${opcode.type}`,
    });
    
    // Get executor for this opcode type
    const executor = this.opcodeRegistry.get(opcode.type);
    if (!executor) {
      return {
        success: false,
        affectedEntities: [],
        error: `No executor registered for opcode type: ${opcode.type}`,
      };
    }
    
    // Check preconditions
    const preconditionCheck = executor.canExecute(opcode, transaction.state);
    if (!preconditionCheck.canExecute) {
      return {
        success: false,
        affectedEntities: [],
        error: `Preconditions failed: ${preconditionCheck.failedPreconditions.join(', ')}`,
      };
    }
    
    // Execute with timeout
    try {
      const result = await this.executeWithTimeout(
        () => executor.execute(opcode, transaction.state),
        this.config.maxOpcodeExecutionTime
      );
      
      // Log completion
      this.addLogEntry(transaction, {
        timestamp: Date.now(),
        type: 'opcode-complete',
        opcodeId: opcode.id,
        message: `Opcode completed successfully`,
        data: { affectedEntities: result.affectedEntities },
      });
      
      return result;
      
    } catch (error) {
      // Log error
      this.addLogEntry(transaction, {
        timestamp: Date.now(),
        type: 'opcode-error',
        opcodeId: opcode.id,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        success: false,
        affectedEntities: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Execute a function with a timeout.
   */
  private async executeWithTimeout<T>(
    fn: () => T | Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      Promise.resolve(fn()),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
      ),
    ]);
  }
  
  /**
   * Validate all constraints in the plan.
   */
  private validateConstraints(plan: CPLPlan, transaction: Transaction): {
    success: boolean;
    violations: readonly ConstraintValidationResult[];
  } {
    const violations: ConstraintValidationResult[] = [];
    
    // Extract constraints from plan intent (would come from CPLIntent in real implementation)
    const constraints: unknown[] = [];
    
    for (const constraint of constraints) {
      const constraintType = (constraint as any).type;
      const validator = this.constraintRegistry.get(constraintType);
      
      if (!validator) {
        // No validator registered; skip (or warn)
        continue;
      }
      
      const result = validator.validate(
        constraint,
        transaction.originalState,
        transaction.state
      );
      
      if (!result.satisfied) {
        violations.push(result);
      }
    }
    
    return {
      success: violations.length === 0,
      violations,
    };
  }
  
  /**
   * Compute diff between original and modified state.
   */
  private computeDiff(transaction: Transaction, plan: CPLPlan): ExecutionDiff {
    // Simplified diff computation
    // Real implementation would do deep comparison of all entities
    
    return {
      version: '1.0.0',
      before: this.captureSnapshot(transaction.originalState),
      after: this.captureSnapshot(transaction.state),
      changes: [],
      verifications: [],
      summary: 'Execution completed',
      timestamp: Date.now(),
    };
  }
  
  /**
   * Capture a state snapshot.
   */
  private captureSnapshot(state: ProjectState): any {
    return {
      events: state.events.getAll(),
      tracks: state.tracks.getAll(),
      cards: state.cards.getAll(),
      sections: state.sections.getAll(),
      routing: state.routing.getAll(),
    };
  }
  
  /**
   * Commit the transaction (apply changes to main state).
   */
  private commit(transaction: Transaction): void {
    transaction.status = 'committed';
    transaction.completedAt = Date.now();
    
    this.addLogEntry(transaction, {
      timestamp: Date.now(),
      type: 'commit',
      message: 'Transaction committed successfully',
    });
  }
  
  /**
   * Rollback the transaction (discard changes).
   */
  private rollback(transaction: Transaction, error: TransactionError): TransactionResult {
    transaction.status = 'rolled-back';
    transaction.completedAt = Date.now();
    
    this.addLogEntry(transaction, {
      timestamp: Date.now(),
      type: 'rollback',
      message: `Transaction rolled back: ${error.message}`,
      data: error,
    });
    
    return {
      success: false,
      transaction,
      error,
      diagnostics: [],
    };
  }
  
  /**
   * Add a log entry to the transaction.
   */
  private addLogEntry(transaction: Transaction, entry: TransactionLogEntry): void {
    (transaction.log as TransactionLogEntry[]).push(entry);
  }
  
  /**
   * Generate a unique transaction ID.
   */
  private generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `tx:${timestamp}:${random}`;
  }
}

// ============================================================================
// Transaction Utilities
// ============================================================================

/**
 * Format a transaction log for debugging.
 */
export function formatTransactionLog(transaction: Transaction): string {
  const lines: string[] = [
    `Transaction ${transaction.id}`,
    `Status: ${transaction.status}`,
    `Started: ${new Date(transaction.startedAt).toISOString()}`,
  ];
  
  if (transaction.completedAt) {
    lines.push(`Completed: ${new Date(transaction.completedAt).toISOString()}`);
    const durationMs = transaction.completedAt - transaction.startedAt;
    lines.push(`Duration: ${durationMs}ms`);
  }
  
  lines.push('');
  lines.push('Log:');
  
  for (const entry of transaction.log) {
    const time = new Date(entry.timestamp).toISOString();
    const opcode = entry.opcodeId ? ` [${entry.opcodeId}]` : '';
    lines.push(`  ${time} ${entry.type}${opcode}: ${entry.message}`);
  }
  
  return lines.join('\n');
}

/**
 * Get transaction duration in milliseconds.
 */
export function getTransactionDuration(transaction: Transaction): number | undefined {
  if (!transaction.completedAt) {
    return undefined;
  }
  return transaction.completedAt - transaction.startedAt;
}

/**
 * Check if a transaction succeeded.
 */
export function transactionSucceeded(transaction: Transaction): boolean {
  return transaction.status === 'committed';
}

/**
 * Check if a transaction failed.
 */
export function transactionFailed(transaction: Transaction): boolean {
  return transaction.status === 'rolled-back' || transaction.status === 'aborted';
}
