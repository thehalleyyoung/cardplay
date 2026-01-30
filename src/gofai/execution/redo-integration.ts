/**
 * @file Redo Integration with Constraint Validation (Step 317)
 * @module gofai/execution/redo-integration
 * 
 * Implements Step 317: Implement redo integration; ensure redo re-validates
 * constraints if the world changed since original apply.
 * 
 * This module extends the basic undo-integration.ts with comprehensive redo
 * support that includes:
 * - Constraint re-validation before redo
 * - Detection of world state changes
 * - Safe degradation when constraints no longer hold
 * - Clear error reporting when redo is unsafe
 * 
 * Design principles:
 * - Redo is never automatic if constraints might fail
 * - World changes are detected via state fingerprints + constraint checks
 * - Redo can be attempted with constraint override (explicit user choice)
 * - Failed redo attempts don't corrupt state
 * - Redo history is preserved even if redo fails
 * 
 * Constraint validation scenarios:
 * 1. No world change → fast redo (fingerprint match)
 * 2. World changed, constraints still hold → safe redo with warning
 * 3. World changed, constraints violated → require user confirmation
 * 4. World changed incompatibly → block redo with explanation
 * 
 * @see gofai_goalB.md Step 317
 * @see src/gofai/execution/undo-integration.ts (base undo/redo)
 * @see src/gofai/execution/constraint-checkers.ts (validation)
 * @see docs/gofai/undo-redo.md
 */

import type {
  EditPackage,
  CPLIntent,
  CPLPlan,
  Constraint,
  Scope,
} from './edit-package.js';
import type {
  UndoEntry,
  RedoResult,
  StateFingerprint,
} from './undo-integration.js';
import type { CanonicalDiff } from './diff-model.js';
import type { ProjectState } from './transactional-execution.js';
import type { ConstraintCheckResult } from './preservation-checkers.js';

import {
  computeStateFingerprint,
  fingerprintsMatch,
} from './undo-integration.js';
import {
  checkConstraints,
  type ConstraintChecker,
} from './constraint-checkers.js';

// ============================================================================
// Redo Validation Types
// ============================================================================

/**
 * Result of validating a redo operation.
 */
export type RedoValidationResult =
  | { readonly status: 'safe'; readonly reason: 'fingerprint_match' }
  | { readonly status: 'safe'; readonly reason: 'constraints_pass'; readonly warnings: readonly string[] }
  | { readonly status: 'risky'; readonly violations: readonly ConstraintViolation[]; readonly canOverride: boolean }
  | { readonly status: 'blocked'; readonly reason: string; readonly violations: readonly ConstraintViolation[] };

/**
 * Constraint violation detected during redo validation.
 */
export interface ConstraintViolation {
  /** Which constraint was violated */
  readonly constraint: Constraint;
  
  /** Human-readable explanation */
  readonly message: string;
  
  /** Affected entities */
  readonly affectedEntities: readonly string[];
  
  /** Severity of the violation */
  readonly severity: 'error' | 'warning';
  
  /** Can this be overridden? */
  readonly canOverride: boolean;
  
  /** Suggested remediation */
  readonly remediation?: string;
}

/**
 * Enhanced redo result with validation information.
 */
export type EnhancedRedoResult =
  | {
      readonly status: 'success';
      readonly entry: UndoEntry;
      readonly diff: CanonicalDiff;
      readonly validation: RedoValidationResult;
    }
  | {
      readonly status: 'validation_failed';
      readonly entry: UndoEntry;
      readonly validation: RedoValidationResult;
      readonly canRetryWithOverride: boolean;
    }
  | {
      readonly status: 'noop';
      readonly reason: string;
    }
  | {
      readonly status: 'conflict';
      readonly reason: string;
      readonly expected: StateFingerprint;
      readonly actual: StateFingerprint;
    }
  | {
      readonly status: 'error';
      readonly reason: string;
      readonly error?: unknown;
    };

/**
 * Redo options.
 */
export interface RedoOptions {
  /** Force redo even if constraints are violated (user override) */
  readonly forceOverrideConstraints?: boolean;
  
  /** Skip validation if fingerprint matches (fast path) */
  readonly skipValidationOnMatch?: boolean;
  
  /** Custom constraint checkers to use */
  readonly customCheckers?: readonly ConstraintChecker[];
  
  /** Maximum number of warnings before requiring confirmation */
  readonly maxWarningsBeforeConfirm?: number;
}

// ============================================================================
// Redo Validator
// ============================================================================

/**
 * Validates a redo operation against current project state.
 */
export class RedoValidator {
  /**
   * Validate if a redo can safely proceed.
   */
  static async validate(
    entry: UndoEntry,
    currentState: ProjectState,
    options: RedoOptions = {}
  ): Promise<RedoValidationResult> {
    // Fast path: If fingerprint matches, redo is definitely safe
    const currentFingerprint = computeStateFingerprint(currentState);
    if (fingerprintsMatch(currentFingerprint, entry.beforeState)) {
      return {
        status: 'safe',
        reason: 'fingerprint_match',
      };
    }
    
    // World has changed since undo; need to validate constraints
    if (options.skipValidationOnMatch) {
      // Caller requested skip on mismatch (not recommended)
      return {
        status: 'safe',
        reason: 'constraints_pass',
        warnings: ['World state changed but validation was skipped'],
      };
    }
    
    // Extract constraints from all packages in the entry
    const constraints = this.extractConstraints(entry);
    
    if (constraints.length === 0) {
      // No constraints to validate
      return {
        status: 'safe',
        reason: 'constraints_pass',
        warnings: ['World state changed but no constraints to check'],
      };
    }
    
    // Check each constraint against current state
    const violations: ConstraintViolation[] = [];
    const warnings: string[] = [];
    
    for (const pkg of entry.packages) {
      const result = await this.validatePackageConstraints(
        pkg,
        currentState,
        options.customCheckers
      );
      
      if (result.status === 'fail') {
        violations.push(...result.violations.map(v => ({
          constraint: v.constraint,
          message: v.message,
          affectedEntities: v.affectedEntities || [],
          severity: v.severity || 'error',
          canOverride: v.canOverride ?? false,
          remediation: v.remediation,
        })));
      } else if (result.status === 'warning') {
        warnings.push(...result.warnings.map(w => w.message));
      }
    }
    
    // Determine overall validation status
    if (violations.length === 0) {
      return {
        status: 'safe',
        reason: 'constraints_pass',
        warnings,
      };
    }
    
    // Check if violations are all overridable
    const allOverridable = violations.every(v => v.canOverride);
    const maxWarnings = options.maxWarningsBeforeConfirm ?? 3;
    
    if (allOverridable && warnings.length <= maxWarnings) {
      return {
        status: 'risky',
        violations,
        canOverride: true,
      };
    }
    
    // Too many violations or non-overridable constraints
    return {
      status: 'blocked',
      reason: 'Constraints no longer hold in current project state',
      violations,
    };
  }
  
  /**
   * Extract all constraints from an undo entry.
   */
  private static extractConstraints(entry: UndoEntry): readonly Constraint[] {
    const constraints: Constraint[] = [];
    
    for (const pkg of entry.packages) {
      if (pkg.intent?.constraints) {
        constraints.push(...pkg.intent.constraints);
      }
    }
    
    return constraints;
  }
  
  /**
   * Validate constraints for a single package.
   */
  private static async validatePackageConstraints(
    pkg: EditPackage,
    currentState: ProjectState,
    customCheckers?: readonly ConstraintChecker[]
  ): Promise<ConstraintCheckResult> {
    if (!pkg.intent?.constraints || pkg.intent.constraints.length === 0) {
      return { status: 'pass' };
    }
    
    // Use constraint checkers to validate
    return checkConstraints(
      currentState,
      currentState, // We're checking if the *current* state satisfies constraints
      pkg.intent.constraints,
      pkg.intent.scope,
      customCheckers
    );
  }
}

// ============================================================================
// Enhanced Redo Manager
// ============================================================================

/**
 * Manages redo operations with full constraint validation.
 */
export class EnhancedRedoManager {
  /**
   * Attempt to redo with full validation.
   */
  static async attemptRedo(
    entry: UndoEntry,
    currentState: ProjectState,
    applyForward: (state: ProjectState, entry: UndoEntry) => Promise<CanonicalDiff>,
    options: RedoOptions = {}
  ): Promise<EnhancedRedoResult> {
    // Validate redo safety
    const validation = await RedoValidator.validate(entry, currentState, options);
    
    // Handle validation results
    switch (validation.status) {
      case 'safe':
        // Safe to redo
        try {
          const diff = await applyForward(currentState, entry);
          return {
            status: 'success',
            entry,
            diff,
            validation,
          };
        } catch (error) {
          return {
            status: 'error',
            reason: 'Failed to apply redo',
            error,
          };
        }
        
      case 'risky':
        // Risky but can override
        if (options.forceOverrideConstraints) {
          try {
            const diff = await applyForward(currentState, entry);
            return {
              status: 'success',
              entry,
              diff,
              validation,
            };
          } catch (error) {
            return {
              status: 'error',
              reason: 'Failed to apply redo with override',
              error,
            };
          }
        } else {
          return {
            status: 'validation_failed',
            entry,
            validation,
            canRetryWithOverride: true,
          };
        }
        
      case 'blocked':
        // Cannot redo
        return {
          status: 'validation_failed',
          entry,
          validation,
          canRetryWithOverride: false,
        };
    }
  }
  
  /**
   * Generate human-readable explanation of why redo failed.
   */
  static explainValidationFailure(validation: RedoValidationResult): string {
    if (validation.status === 'safe') {
      return 'Redo is safe to proceed.';
    }
    
    if (validation.status === 'risky') {
      const violationCount = validation.violations.length;
      const overridable = validation.canOverride;
      
      let explanation = `Redo may not be safe: ${violationCount} constraint ${violationCount === 1 ? 'violation' : 'violations'} detected.\n\n`;
      
      for (const violation of validation.violations.slice(0, 5)) {
        explanation += `• ${violation.message}\n`;
        if (violation.remediation) {
          explanation += `  Suggestion: ${violation.remediation}\n`;
        }
      }
      
      if (validation.violations.length > 5) {
        explanation += `\n...and ${validation.violations.length - 5} more.\n`;
      }
      
      if (overridable) {
        explanation += '\nYou can choose to proceed anyway by confirming the override.';
      }
      
      return explanation;
    }
    
    if (validation.status === 'blocked') {
      let explanation = `Redo is blocked: ${validation.reason}\n\n`;
      
      for (const violation of validation.violations.slice(0, 5)) {
        explanation += `• ${violation.message}\n`;
        if (violation.remediation) {
          explanation += `  Suggestion: ${violation.remediation}\n`;
        }
      }
      
      if (validation.violations.length > 5) {
        explanation += `\n...and ${validation.violations.length - 5} more.\n`;
      }
      
      return explanation;
    }
    
    return 'Unknown validation status.';
  }
  
  /**
   * Check if any redo would require confirmation.
   */
  static async wouldRequireConfirmation(
    entry: UndoEntry,
    currentState: ProjectState,
    options: RedoOptions = {}
  ): Promise<boolean> {
    const validation = await RedoValidator.validate(entry, currentState, options);
    return validation.status === 'risky' || validation.status === 'blocked';
  }
}

// ============================================================================
// Redo History Tracking
// ============================================================================

/**
 * Tracks redo attempts and outcomes for analysis.
 */
export interface RedoHistoryEntry {
  /** When was this attempted */
  readonly timestamp: number;
  
  /** Which undo entry was being redone */
  readonly undoEntryId: string;
  
  /** Validation result */
  readonly validation: RedoValidationResult;
  
  /** Outcome */
  readonly outcome: 'success' | 'failed' | 'cancelled_by_user';
  
  /** Was constraint override used? */
  readonly overrideUsed: boolean;
  
  /** State fingerprints */
  readonly fingerprints: {
    readonly expected: StateFingerprint;
    readonly actual: StateFingerprint;
    readonly afterRedo?: StateFingerprint;
  };
}

/**
 * Manages redo history for debugging and analysis.
 */
export class RedoHistoryTracker {
  private history: RedoHistoryEntry[] = [];
  
  /**
   * Record a redo attempt.
   */
  recordAttempt(entry: RedoHistoryEntry): void {
    this.history.push(entry);
    
    // Keep last 100 entries
    if (this.history.length > 100) {
      this.history.shift();
    }
  }
  
  /**
   * Get recent redo attempts.
   */
  getRecentAttempts(count: number = 10): readonly RedoHistoryEntry[] {
    return this.history.slice(-count);
  }
  
  /**
   * Get statistics on redo success rate.
   */
  getStatistics(): RedoStatistics {
    const total = this.history.length;
    const successful = this.history.filter(e => e.outcome === 'success').length;
    const failed = this.history.filter(e => e.outcome === 'failed').length;
    const cancelled = this.history.filter(e => e.outcome === 'cancelled_by_user').length;
    const overridden = this.history.filter(e => e.overrideUsed).length;
    
    return {
      total,
      successful,
      failed,
      cancelled,
      overridden,
      successRate: total > 0 ? successful / total : 0,
    };
  }
  
  /**
   * Clear history.
   */
  clear(): void {
    this.history = [];
  }
}

/**
 * Redo statistics.
 */
export interface RedoStatistics {
  readonly total: number;
  readonly successful: number;
  readonly failed: number;
  readonly cancelled: number;
  readonly overridden: number;
  readonly successRate: number;
}

// ============================================================================
// Exports
// ============================================================================

export type {
  RedoValidationResult,
  ConstraintViolation,
  EnhancedRedoResult,
  RedoOptions,
  RedoHistoryEntry,
  RedoStatistics,
};

export {
  RedoValidator,
  EnhancedRedoManager,
  RedoHistoryTracker,
};
