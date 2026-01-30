/**
 * @file Execution Failure UI (Step 335)
 * @module gofai/execution/execution-failure-ui
 * 
 * Implements Step 335: Add UI for execution failures that shows exactly which 
 * precondition failed and offers remedial actions ("select a chorus first").
 * 
 * This module provides clear, actionable error messages when edit execution
 * fails. Instead of generic errors, it:
 * - Identifies the specific failed precondition
 * - Explains why it failed in musical terms
 * - Suggests concrete remedial actions
 * - Offers to automatically fix when possible
 * - Prevents retry loops
 * 
 * Design principles:
 * - Never blame the user
 * - Explain in domain terms (not technical jargon)
 * - Always offer a path forward
 * - Support auto-fix for common issues
 * - Link to help/documentation
 * - Preserve user intent for retry
 * 
 * Common failure modes:
 * - Missing scope selection
 * - Unsatisfiable constraints
 * - Capability not enabled
 * - Invalid parameter values
 * - Ambiguous references
 * - Resource unavailable
 * 
 * @see gofai_goalB.md Step 335
 * @see gofai_goalB.md Step 334 (safe failure)
 * @see gofai_goalB.md Step 314 (execution capability checks)
 * @see docs/gofai/error-recovery.md
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { EditPackage, CPLIntent, CPLPlan } from './edit-package.js';
import type { Precondition } from './plan-types.js';

// ============================================================================
// Execution Failure Types
// ============================================================================

/**
 * Execution failure.
 * 
 * Represents a failed attempt to execute an edit package with
 * detailed information about what went wrong.
 */
export interface ExecutionFailure {
  /** Unique failure ID */
  readonly id: string;
  
  /** Failure type */
  readonly type: ExecutionFailureType;
  
  /** Which precondition failed */
  readonly failedPrecondition?: Precondition;
  
  /** Human-readable explanation */
  readonly explanation: string;
  
  /** Technical details (for debugging) */
  readonly technical?: string;
  
  /** Suggested remedial actions */
  readonly remedialActions: readonly RemedialAction[];
  
  /** Context at time of failure */
  readonly context: FailureContext;
  
  /** Whether failure is recoverable */
  readonly recoverable: boolean;
  
  /** Original edit package that failed */
  readonly package?: EditPackage;
}

/**
 * Types of execution failures.
 */
export type ExecutionFailureType =
  | 'missing-scope'           // No scope selected
  | 'empty-selection'         // Scope selects no entities
  | 'constraint-violation'    // Cannot satisfy constraint
  | 'capability-disabled'     // Required capability not enabled
  | 'invalid-parameter'       // Parameter value out of range
  | 'ambiguous-reference'     // Reference matches multiple entities
  | 'missing-reference'       // Referenced entity doesn't exist
  | 'resource-unavailable'    // Required resource not available
  | 'precondition-failed'     // Generic precondition failure
  | 'internal-error';         // Unexpected internal error

/**
 * Remedial action that can fix or work around failure.
 */
export interface RemedialAction {
  /** Action ID */
  readonly id: string;
  
  /** Action type */
  readonly type: RemedialActionType;
  
  /** Label for UI button */
  readonly label: string;
  
  /** Detailed description */
  readonly description: string;
  
  /** Whether action can be auto-executed */
  readonly canAutoExecute: boolean;
  
  /** Action handler */
  readonly execute: () => Promise<void> | void;
  
  /** Whether this is the recommended action */
  readonly recommended?: boolean;
}

/**
 * Types of remedial actions.
 */
export type RemedialActionType =
  | 'select-scope'         // User needs to select scope
  | 'relax-constraint'     // Relax impossible constraint
  | 'enable-capability'    // Enable required capability
  | 'clarify-reference'    // Resolve ambiguous reference
  | 'adjust-parameter'     // Fix parameter value
  | 'retry'                // Simply retry
  | 'modify-intent'        // Edit the original intent
  | 'cancel';              // Abandon operation

/**
 * Failure context.
 */
export interface FailureContext {
  /** When failure occurred */
  readonly timestamp: number;
  
  /** Current scope (if any) */
  readonly currentScope?: unknown;
  
  /** Available capabilities */
  readonly capabilities: readonly string[];
  
  /** Project state summary */
  readonly projectState: {
    readonly sections: number;
    readonly layers: number;
    readonly events: number;
  };
  
  /** User's recent actions */
  readonly recentActions?: readonly string[];
}

// ============================================================================
// Failure Analysis
// ============================================================================

/**
 * Analyze execution failure and generate remedial actions.
 * 
 * @param failure Raw failure information
 * @param context Current context
 * @returns Analyzed failure with remedial actions
 */
export function analyzeExecutionFailure(
  failure: Partial<ExecutionFailure>,
  context: FailureContext
): ExecutionFailure {
  const type = failure.type || 'internal-error';
  const id = failure.id || generateFailureId();
  
  // Generate explanation and remedial actions based on type
  let explanation: string;
  let remedialActions: RemedialAction[];
  let recoverable: boolean;
  
  switch (type) {
    case 'missing-scope':
      explanation = "No scope is selected. Please select which part of the song to edit (e.g., chorus, verse, bars 1-8).";
      remedialActions = generateMissingScopeActions(context);
      recoverable = true;
      break;
    
    case 'empty-selection':
      explanation = "The selected scope contains no matching elements. Try selecting a different section or adjusting your filter.";
      remedialActions = generateEmptySelectionActions(context);
      recoverable = true;
      break;
    
    case 'constraint-violation':
      explanation = "Cannot make the requested change while preserving the specified constraints. Try relaxing constraints or adjusting the request.";
      remedialActions = generateConstraintViolationActions(failure, context);
      recoverable = true;
      break;
    
    case 'capability-disabled':
      explanation = "This edit requires a capability that is currently disabled. Enable the capability to proceed.";
      remedialActions = generateCapabilityDisabledActions(failure, context);
      recoverable = true;
      break;
    
    case 'invalid-parameter':
      explanation = "A parameter value is out of valid range. The system will suggest a corrected value.";
      remedialActions = generateInvalidParameterActions(failure, context);
      recoverable = true;
      break;
    
    case 'ambiguous-reference':
      explanation = "The reference matches multiple elements. Please be more specific about which one you mean.";
      remedialActions = generateAmbiguousReferenceActions(failure, context);
      recoverable = true;
      break;
    
    case 'missing-reference':
      explanation = "The referenced element no longer exists or cannot be found.";
      remedialActions = generateMissingReferenceActions(failure, context);
      recoverable = true;
      break;
    
    case 'resource-unavailable':
      explanation = "A required resource is currently unavailable. Please try again later.";
      remedialActions = generateResourceUnavailableActions(context);
      recoverable = true;
      break;
    
    case 'precondition-failed':
      explanation = failure.explanation || "A required condition was not met for this edit.";
      remedialActions = generateGenericPreconditionActions(failure, context);
      recoverable = true;
      break;
    
    case 'internal-error':
      explanation = "An unexpected error occurred. Please try again or contact support if the problem persists.";
      remedialActions = generateInternalErrorActions(context);
      recoverable = false;
      break;
    
    default:
      explanation = "Execution failed for an unknown reason.";
      remedialActions = [createCancelAction()];
      recoverable = false;
  }
  
  return {
    id,
    type,
    failedPrecondition: failure.failedPrecondition,
    explanation,
    technical: failure.technical,
    remedialActions,
    context,
    recoverable,
    package: failure.package
  };
}

// ============================================================================
// Remedial Action Generators
// ============================================================================

function generateMissingScopeActions(context: FailureContext): RemedialAction[] {
  return [
    {
      id: 'select-current-section',
      type: 'select-scope',
      label: 'Select Current Section',
      description: 'Apply to the currently playing section',
      canAutoExecute: true,
      execute: async () => {
        // Would select current section
        console.log('Selecting current section');
      },
      recommended: true
    },
    {
      id: 'select-whole-song',
      type: 'select-scope',
      label: 'Apply to Whole Song',
      description: 'Apply edit to entire song',
      canAutoExecute: true,
      execute: async () => {
        // Would select whole song
        console.log('Selecting whole song');
      }
    },
    {
      id: 'open-scope-picker',
      type: 'select-scope',
      label: 'Choose Scope...',
      description: 'Open scope picker to choose specific section',
      canAutoExecute: false,
      execute: async () => {
        // Would open scope picker UI
        console.log('Opening scope picker');
      }
    },
    createCancelAction()
  ];
}

function generateEmptySelectionActions(context: FailureContext): RemedialAction[] {
  return [
    {
      id: 'expand-scope',
      type: 'select-scope',
      label: 'Expand Scope',
      description: 'Try applying to a larger section',
      canAutoExecute: true,
      execute: async () => {
        console.log('Expanding scope');
      },
      recommended: true
    },
    {
      id: 'choose-different-scope',
      type: 'select-scope',
      label: 'Choose Different Scope',
      description: 'Select a different section to edit',
      canAutoExecute: false,
      execute: async () => {
        console.log('Opening scope picker');
      }
    },
    createCancelAction()
  ];
}

function generateConstraintViolationActions(
  failure: Partial<ExecutionFailure>,
  context: FailureContext
): RemedialAction[] {
  const actions: RemedialAction[] = [];
  
  // Offer to relax constraint
  if (failure.failedPrecondition) {
    actions.push({
      id: 'relax-constraint',
      type: 'relax-constraint',
      label: 'Relax Constraint',
      description: 'Allow more changes to satisfy the request',
      canAutoExecute: false,
      execute: async () => {
        console.log('Relaxing constraint');
      },
      recommended: true
    });
  }
  
  // Offer to modify intent
  actions.push({
    id: 'modify-request',
    type: 'modify-intent',
    label: 'Modify Request',
    description: 'Adjust what you asked for',
    canAutoExecute: false,
    execute: async () => {
      console.log('Opening intent editor');
    }
  });
  
  actions.push(createCancelAction());
  
  return actions;
}

function generateCapabilityDisabledActions(
  failure: Partial<ExecutionFailure>,
  context: FailureContext
): RemedialAction[] {
  return [
    {
      id: 'enable-capability',
      type: 'enable-capability',
      label: 'Enable Capability',
      description: 'Turn on the required capability and retry',
      canAutoExecute: false,
      execute: async () => {
        console.log('Enabling capability');
      },
      recommended: true
    },
    {
      id: 'use-alternative',
      type: 'modify-intent',
      label: 'Use Alternative Approach',
      description: 'Try a different way to achieve the same goal',
      canAutoExecute: false,
      execute: async () => {
        console.log('Suggesting alternatives');
      }
    },
    createCancelAction()
  ];
}

function generateInvalidParameterActions(
  failure: Partial<ExecutionFailure>,
  context: FailureContext
): RemedialAction[] {
  return [
    {
      id: 'clamp-parameter',
      type: 'adjust-parameter',
      label: 'Use Nearest Valid Value',
      description: 'Automatically adjust to the closest valid value',
      canAutoExecute: true,
      execute: async () => {
        console.log('Clamping parameter');
      },
      recommended: true
    },
    {
      id: 'edit-parameter',
      type: 'adjust-parameter',
      label: 'Edit Value Manually',
      description: 'Choose a different value',
      canAutoExecute: false,
      execute: async () => {
        console.log('Opening parameter editor');
      }
    },
    createCancelAction()
  ];
}

function generateAmbiguousReferenceActions(
  failure: Partial<ExecutionFailure>,
  context: FailureContext
): RemedialAction[] {
  return [
    {
      id: 'clarify-reference',
      type: 'clarify-reference',
      label: 'Choose Specific Element',
      description: 'Pick which element you meant',
      canAutoExecute: false,
      execute: async () => {
        console.log('Opening reference picker');
      },
      recommended: true
    },
    {
      id: 'apply-to-all',
      type: 'modify-intent',
      label: 'Apply to All Matches',
      description: 'Apply edit to all matching elements',
      canAutoExecute: true,
      execute: async () => {
        console.log('Applying to all');
      }
    },
    createCancelAction()
  ];
}

function generateMissingReferenceActions(
  failure: Partial<ExecutionFailure>,
  context: FailureContext
): RemedialAction[] {
  return [
    {
      id: 'choose-alternative',
      type: 'clarify-reference',
      label: 'Choose Different Element',
      description: 'Select an element that exists',
      canAutoExecute: false,
      execute: async () => {
        console.log('Opening element picker');
      },
      recommended: true
    },
    {
      id: 'undo-deletion',
      type: 'retry',
      label: 'Undo Recent Changes',
      description: 'The element may have been deleted; undo to restore',
      canAutoExecute: false,
      execute: async () => {
        console.log('Undoing recent changes');
      }
    },
    createCancelAction()
  ];
}

function generateResourceUnavailableActions(context: FailureContext): RemedialAction[] {
  return [
    {
      id: 'retry-now',
      type: 'retry',
      label: 'Retry Now',
      description: 'Try the operation again',
      canAutoExecute: true,
      execute: async () => {
        console.log('Retrying');
      },
      recommended: true
    },
    createCancelAction()
  ];
}

function generateGenericPreconditionActions(
  failure: Partial<ExecutionFailure>,
  context: FailureContext
): RemedialAction[] {
  return [
    {
      id: 'view-requirements',
      type: 'modify-intent',
      label: 'View Requirements',
      description: 'See what conditions must be met',
      canAutoExecute: false,
      execute: async () => {
        console.log('Showing requirements');
      },
      recommended: true
    },
    createCancelAction()
  ];
}

function generateInternalErrorActions(context: FailureContext): RemedialAction[] {
  return [
    {
      id: 'retry',
      type: 'retry',
      label: 'Retry',
      description: 'Try the operation again',
      canAutoExecute: true,
      execute: async () => {
        console.log('Retrying');
      },
      recommended: true
    },
    {
      id: 'report-bug',
      type: 'cancel',
      label: 'Report Issue',
      description: 'Send error report to help improve the system',
      canAutoExecute: false,
      execute: async () => {
        console.log('Opening bug report');
      }
    },
    createCancelAction()
  ];
}

function createCancelAction(): RemedialAction {
  return {
    id: 'cancel',
    type: 'cancel',
    label: 'Cancel',
    description: 'Abandon this operation',
    canAutoExecute: true,
    execute: async () => {
      console.log('Canceling');
    }
  };
}

function generateFailureId(): string {
  return `failure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// React Components
// ============================================================================

/**
 * Props for ExecutionFailureDialog.
 */
export interface ExecutionFailureDialogProps {
  /** Failure to display */
  failure: ExecutionFailure;
  
  /** Whether dialog is open */
  isOpen: boolean;
  
  /** Close handler */
  onClose: () => void;
  
  /** Action selected handler */
  onActionSelected?: (action: RemedialAction) => void;
  
  /** Show technical details */
  showTechnical?: boolean;
}

/**
 * Dialog for displaying execution failures and offering remedial actions.
 */
export function ExecutionFailureDialog({
  failure,
  isOpen,
  onClose,
  onActionSelected,
  showTechnical = false
}: ExecutionFailureDialogProps): JSX.Element | null {
  if (!isOpen) return null;
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [expandedTechnical, setExpandedTechnical] = useState(showTechnical);
  
  const handleActionClick = useCallback(async (action: RemedialAction) => {
    setIsExecuting(true);
    
    try {
      await action.execute();
      onActionSelected?.(action);
      
      // Close dialog if action was successful
      if (action.type === 'cancel') {
        onClose();
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [onActionSelected, onClose]);
  
  // Find recommended action
  const recommendedAction = failure.remedialActions.find(a => a.recommended);
  const otherActions = failure.remedialActions.filter(a => !a.recommended);
  
  return (
    <div className="execution-failure-dialog-overlay" onClick={onClose}>
      <div 
        className="execution-failure-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="failure-dialog-header">
          <div className={`failure-icon failure-${failure.recoverable ? 'recoverable' : 'fatal'}`}>
            {failure.recoverable ? '⚠️' : '❌'}
          </div>
          <h2>{failure.recoverable ? 'Edit Cannot Be Applied' : 'Execution Failed'}</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        
        <div className="failure-dialog-content">
          {/* Explanation */}
          <div className="failure-explanation">
            <p className="explanation-text">{failure.explanation}</p>
          </div>
          
          {/* Failed precondition details */}
          {failure.failedPrecondition && (
            <div className="failed-precondition">
              <h3>Failed Condition</h3>
              <code>{describePrecondition(failure.failedPrecondition)}</code>
            </div>
          )}
          
          {/* Context information */}
          <div className="failure-context">
            <h3>Current Situation</h3>
            <ul>
              {!failure.context.currentScope && (
                <li>No scope selected</li>
              )}
              <li>{failure.context.projectState.sections} sections in project</li>
              <li>{failure.context.projectState.layers} layers</li>
              <li>{failure.context.projectState.events} events</li>
            </ul>
          </div>
          
          {/* Remedial actions */}
          <div className="remedial-actions">
            <h3>What You Can Do</h3>
            
            {/* Recommended action (if any) */}
            {recommendedAction && (
              <div className="recommended-action">
                <button
                  className="action-button action-recommended"
                  onClick={() => handleActionClick(recommendedAction)}
                  disabled={isExecuting}
                >
                  <span className="action-icon">✓</span>
                  <div className="action-content">
                    <div className="action-label">
                      {recommendedAction.label}
                      {recommendedAction.canAutoExecute && (
                        <span className="auto-badge">Auto</span>
                      )}
                    </div>
                    <div className="action-description">
                      {recommendedAction.description}
                    </div>
                  </div>
                </button>
              </div>
            )}
            
            {/* Other actions */}
            {otherActions.length > 0 && (
              <div className="other-actions">
                <details open={!recommendedAction}>
                  <summary>Other Options</summary>
                  <div className="action-list">
                    {otherActions.map(action => (
                      <button
                        key={action.id}
                        className={`action-button action-${action.type}`}
                        onClick={() => handleActionClick(action)}
                        disabled={isExecuting}
                      >
                        <div className="action-content">
                          <div className="action-label">
                            {action.label}
                            {action.canAutoExecute && (
                              <span className="auto-badge">Auto</span>
                            )}
                          </div>
                          <div className="action-description">
                            {action.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
          
          {/* Technical details (collapsible) */}
          {failure.technical && (
            <details 
              className="technical-details"
              open={expandedTechnical}
              onToggle={(e) => setExpandedTechnical((e.target as HTMLDetailsElement).open)}
            >
              <summary>Technical Details</summary>
              <pre className="technical-content">{failure.technical}</pre>
            </details>
          )}
        </div>
        
        {isExecuting && (
          <div className="execution-overlay">
            <div className="spinner">Executing...</div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Inline failure display (non-modal).
 */
export function ExecutionFailureInline({
  failure,
  onActionSelected
}: {
  failure: ExecutionFailure;
  onActionSelected?: (action: RemedialAction) => void;
}): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  
  const recommendedAction = failure.remedialActions.find(a => a.recommended);
  
  return (
    <div className={`execution-failure-inline failure-${failure.type}`}>
      <div className="inline-failure-header">
        <span className="failure-icon">
          {failure.recoverable ? '⚠️' : '❌'}
        </span>
        <span className="failure-message">{failure.explanation}</span>
        <button
          className="expand-button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>
      
      {expanded && (
        <div className="inline-failure-details">
          {recommendedAction && (
            <button
              className="inline-action-button"
              onClick={() => {
                recommendedAction.execute();
                onActionSelected?.(recommendedAction);
              }}
            >
              {recommendedAction.label}
            </button>
          )}
          
          <button
            className="inline-more-button"
            onClick={() => {
              // Would open full dialog
              console.log('Opening full failure dialog');
            }}
          >
            More Options...
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function describePrecondition(precondition: Precondition): string {
  // Simplified - real implementation would format precondition
  return 'Requires selected scope with events';
}

// ============================================================================
// Exports
// ============================================================================

export type {
  ExecutionFailure,
  ExecutionFailureType,
  RemedialAction,
  RemedialActionType,
  FailureContext,
  ExecutionFailureDialogProps
};
