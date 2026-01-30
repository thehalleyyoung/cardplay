/**
 * @file Reapply UI (Step 320)
 * @module gofai/execution/reapply-ui
 * 
 * Implements Step 320: Add UI for "reapply": user can reapply a prior package 
 * to a new context if still valid.
 * 
 * This module enables users to take a previously executed edit package and
 * apply it again in a different context. This is useful for:
 * - Applying the same edit to multiple sections ("do that to the verse too")
 * - Iterative refinement workflows
 * - Template-based editing
 * - Learning from history (replay successful edits)
 * 
 * Design principles:
 * - Validate applicability in new context
 * - Adapt scope/selectors when needed
 * - Preview before applying
 * - Preserve original provenance
 * - Handle conflicts gracefully
 * 
 * Safety considerations:
 * - Original constraints must still be satisfiable
 * - Target scope must be compatible
 * - No silent substitutions - clarify when adaptation needed
 * - Full preview shows differences from original application
 * 
 * @see gofai_goalB.md Step 320
 * @see gofai_goalB.md Step 319 (undo preview)
 * @see gofai_goalB.md Step 342 (preview apply)
 * @see docs/gofai/edit-reuse.md
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { EditPackage, CPLIntent, CPLPlan } from './edit-package.js';
import type { ExecutionDiff } from './diff-model.js';
import type { Scope, Constraint } from '../canon/cpl-types.js';

// ============================================================================
// Reapply Types
// ============================================================================

/**
 * Validation result for reapplying an edit package.
 */
export interface ReapplyValidation {
  /** Whether package can be reapplied */
  readonly canReapply: boolean;
  
  /** Validation status */
  readonly status: ReapplyStatus;
  
  /** Issues preventing or complicating reapply */
  readonly issues: readonly ReapplyIssue[];
  
  /** Required adaptations */
  readonly adaptations: readonly ReapplyAdaptation[];
  
  /** Confidence score (0-1) */
  readonly confidence: number;
  
  /** Human-readable explanation */
  readonly explanation: string;
}

/**
 * Status of reapply validation.
 */
export type ReapplyStatus =
  | 'valid'           // Can reapply as-is
  | 'adaptable'       // Can reapply with adaptations
  | 'needs-clarify'   // Requires user clarification
  | 'blocked';        // Cannot reapply

/**
 * Issue that affects reapply.
 */
export interface ReapplyIssue {
  /** Issue type */
  readonly type: ReapplyIssueType;
  
  /** Severity */
  readonly severity: 'error' | 'warning' | 'info';
  
  /** Description */
  readonly description: string;
  
  /** Suggested resolution */
  readonly resolution?: string;
  
  /** Related original element */
  readonly element?: unknown;
}

/**
 * Types of reapply issues.
 */
export type ReapplyIssueType =
  | 'scope-incompatible'      // Target scope doesn't match original
  | 'constraint-unsatisfiable' // Original constraints can't be met
  | 'selector-unmatched'      // Selectors don't find entities
  | 'capability-unavailable'  // Required capabilities not present
  | 'context-changed'         // Project state differs significantly
  | 'referent-missing'        // Referenced entity no longer exists
  | 'ambiguous-target';       // Multiple possible targets

/**
 * Adaptation needed for reapply.
 */
export interface ReapplyAdaptation {
  /** Adaptation type */
  readonly type: ReapplyAdaptationType;
  
  /** Original value */
  readonly original: unknown;
  
  /** Adapted value */
  readonly adapted: unknown;
  
  /** Reason for adaptation */
  readonly reason: string;
  
  /** Whether user should confirm */
  readonly requiresConfirmation: boolean;
}

/**
 * Types of adaptations.
 */
export type ReapplyAdaptationType =
  | 'scope-retarget'      // Apply to different scope
  | 'selector-adjust'     // Adjust selector to match available entities
  | 'param-clamp'         // Clamp parameter to valid range
  | 'constraint-relax'    // Relax impossible constraint
  | 'opcode-substitute';  // Use alternative opcode

/**
 * Options for reapply operation.
 */
export interface ReapplyOptions {
  /** New target scope (if different from original) */
  readonly targetScope?: Scope;
  
  /** Allow automatic adaptations */
  readonly allowAdaptations?: boolean;
  
  /** Require preview before apply */
  readonly requirePreview?: boolean;
  
  /** Preserve original provenance */
  readonly preserveProvenance?: boolean;
  
  /** Custom constraint overrides */
  readonly constraintOverrides?: readonly Constraint[];
}

/**
 * Result of reapply operation.
 */
export interface ReapplyResult {
  /** Whether reapply succeeded */
  readonly success: boolean;
  
  /** New edit package (if successful) */
  readonly package?: EditPackage;
  
  /** Diff produced */
  readonly diff?: ExecutionDiff;
  
  /** Applied adaptations */
  readonly adaptations: readonly ReapplyAdaptation[];
  
  /** Any warnings */
  readonly warnings: readonly string[];
  
  /** Error (if failed) */
  readonly error?: Error;
}

// ============================================================================
// Reapply Validation
// ============================================================================

/**
 * Validate whether an edit package can be reapplied.
 * 
 * Checks compatibility with current project state and target scope.
 * 
 * @param pkg Edit package to reapply
 * @param currentState Current project state
 * @param targetScope Target scope (if different from original)
 * @param options Validation options
 * @returns Validation result
 */
export function validateReapply(
  pkg: EditPackage,
  currentState: unknown,
  targetScope?: Scope,
  options: ReapplyOptions = {}
): ReapplyValidation {
  const issues: ReapplyIssue[] = [];
  const adaptations: ReapplyAdaptation[] = [];
  
  const originalScope = pkg.scope;
  const targetScopeActual = targetScope || originalScope;
  
  // Check scope compatibility
  if (targetScope && !isScopeCompatible(originalScope, targetScope)) {
    const adaptation = attemptScopeRetarget(originalScope, targetScope);
    
    if (adaptation) {
      adaptations.push(adaptation);
    } else {
      issues.push({
        type: 'scope-incompatible',
        severity: 'error',
        description: `Target scope incompatible with original scope`,
        resolution: 'Choose a compatible scope or allow scope adaptation'
      });
    }
  }
  
  // Check constraints
  for (const constraint of pkg.cpl.constraints) {
    if (!isConstraintSatisfiable(constraint, currentState, targetScopeActual)) {
      issues.push({
        type: 'constraint-unsatisfiable',
        severity: 'error',
        description: `Constraint "${describeConstraint(constraint)}" cannot be satisfied`,
        element: constraint
      });
    }
  }
  
  // Check selectors
  const plan = pkg.plan;
  for (const opcode of plan.opcodes) {
    if (hasSelector(opcode)) {
      const matches = evaluateSelector(opcode, currentState, targetScopeActual);
      
      if (matches === 0) {
        issues.push({
          type: 'selector-unmatched',
          severity: 'warning',
          description: `Selector "${describeSelector(opcode)}" matches no entities`,
          resolution: 'Adjust selector or choose different target'
        });
      } else if (matches > 1 && requiresUnique(opcode)) {
        issues.push({
          type: 'ambiguous-target',
          severity: 'warning',
          description: `Selector matches ${matches} entities (expected 1)`,
          resolution: 'Refine selector to be more specific'
        });
      }
    }
  }
  
  // Check capabilities
  const requiredCapabilities = extractRequiredCapabilities(pkg);
  for (const capability of requiredCapabilities) {
    if (!hasCapability(currentState, capability)) {
      issues.push({
        type: 'capability-unavailable',
        severity: 'error',
        description: `Required capability "${capability}" not available`,
        resolution: 'Enable capability or remove dependent operations'
      });
    }
  }
  
  // Determine status
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  
  let status: ReapplyStatus;
  let canReapply: boolean;
  let confidence: number;
  
  if (errorCount > 0) {
    status = 'blocked';
    canReapply = false;
    confidence = 0;
  } else if (adaptations.length > 0) {
    status = 'adaptable';
    canReapply = options.allowAdaptations ?? true;
    confidence = 0.7 - (adaptations.length * 0.1);
  } else if (warningCount > 0) {
    status = 'needs-clarify';
    canReapply = true;
    confidence = 0.8;
  } else {
    status = 'valid';
    canReapply = true;
    confidence = 0.95;
  }
  
  // Generate explanation
  const explanation = generateReapplyExplanation(status, issues, adaptations);
  
  return {
    canReapply,
    status,
    issues,
    adaptations,
    confidence,
    explanation
  };
}

/**
 * Check if two scopes are compatible.
 */
function isScopeCompatible(scope1: Scope, scope2: Scope): boolean {
  // Simplified - real implementation would check structure
  return true;
}

/**
 * Attempt to retarget scope.
 */
function attemptScopeRetarget(
  originalScope: Scope,
  targetScope: Scope
): ReapplyAdaptation | null {
  // Simplified - real implementation would do smart retargeting
  return {
    type: 'scope-retarget',
    original: originalScope,
    adapted: targetScope,
    reason: 'Retargeting to user-specified scope',
    requiresConfirmation: true
  };
}

/**
 * Check if constraint is satisfiable.
 */
function isConstraintSatisfiable(
  constraint: Constraint,
  currentState: unknown,
  scope: Scope
): boolean {
  // Simplified - real implementation would validate
  return true;
}

/**
 * Describe a constraint.
 */
function describeConstraint(constraint: Constraint): string {
  return 'preserve melody';
}

/**
 * Check if opcode has selector.
 */
function hasSelector(opcode: unknown): boolean {
  return true;
}

/**
 * Evaluate selector match count.
 */
function evaluateSelector(
  opcode: unknown,
  currentState: unknown,
  scope: Scope
): number {
  return 1;
}

/**
 * Describe selector.
 */
function describeSelector(opcode: unknown): string {
  return 'drums in chorus';
}

/**
 * Check if opcode requires unique match.
 */
function requiresUnique(opcode: unknown): boolean {
  return false;
}

/**
 * Extract required capabilities.
 */
function extractRequiredCapabilities(pkg: EditPackage): readonly string[] {
  return [];
}

/**
 * Check if capability is available.
 */
function hasCapability(currentState: unknown, capability: string): boolean {
  return true;
}

/**
 * Generate explanation text.
 */
function generateReapplyExplanation(
  status: ReapplyStatus,
  issues: readonly ReapplyIssue[],
  adaptations: readonly ReapplyAdaptation[]
): string {
  switch (status) {
    case 'valid':
      return 'Edit can be reapplied without modifications.';
    case 'adaptable':
      return `Edit can be reapplied with ${adaptations.length} adaptation(s).`;
    case 'needs-clarify':
      return `Edit can be reapplied but has ${issues.length} warning(s) that need review.`;
    case 'blocked':
      return `Edit cannot be reapplied due to ${issues.filter(i => i.severity === 'error').length} error(s).`;
  }
}

// ============================================================================
// React Components
// ============================================================================

/**
 * Props for ReapplyDialog.
 */
export interface ReapplyDialogProps {
  /** Edit package to reapply */
  package: EditPackage;
  
  /** Current project state */
  currentState: unknown;
  
  /** Whether dialog is open */
  isOpen: boolean;
  
  /** Close handler */
  onClose: () => void;
  
  /** Reapply confirmation handler */
  onReapply: (options: ReapplyOptions) => void;
  
  /** Default target scope */
  defaultScope?: Scope;
}

/**
 * Dialog for reapplying an edit package.
 */
export function ReapplyDialog({
  package: pkg,
  currentState,
  isOpen,
  onClose,
  onReapply,
  defaultScope
}: ReapplyDialogProps): JSX.Element | null {
  if (!isOpen) return null;
  
  const [targetScope, setTargetScope] = useState<Scope | undefined>(defaultScope);
  const [allowAdaptations, setAllowAdaptations] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  
  // Validate reapply
  const validation = useMemo(
    () => validateReapply(pkg, currentState, targetScope, { allowAdaptations }),
    [pkg, currentState, targetScope, allowAdaptations]
  );
  
  const handleReapply = useCallback(() => {
    if (!validation.canReapply) return;
    
    onReapply({
      targetScope,
      allowAdaptations,
      requirePreview: showPreview,
      preserveProvenance: true
    });
  }, [targetScope, allowAdaptations, showPreview, validation.canReapply, onReapply]);
  
  return (
    <div className="reapply-dialog-overlay" onClick={onClose}>
      <div 
        className="reapply-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reapply-header">
          <h2>Reapply Edit</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        
        <div className="reapply-content">
          {/* Original edit info */}
          <div className="original-edit-info">
            <h3>Original Edit</h3>
            <p className="utterance">
              "{pkg.cpl.provenance.originalUtterance}"
            </p>
            <p className="scope">
              Applied to: <strong>{describeScopeShort(pkg.scope)}</strong>
            </p>
            <p className="timestamp">
              {new Date(pkg.timestamp).toLocaleString()}
            </p>
          </div>
          
          {/* Target scope selector */}
          <div className="target-scope-section">
            <h3>Target Scope</h3>
            <ScopeSelector
              value={targetScope}
              onChange={setTargetScope}
              originalScope={pkg.scope}
              placeholder="Select target scope (or use original)"
            />
          </div>
          
          {/* Validation results */}
          <div className="validation-section">
            <h3>Validation</h3>
            <ReapplyValidationDisplay validation={validation} />
          </div>
          
          {/* Adaptations (if any) */}
          {validation.adaptations.length > 0 && (
            <div className="adaptations-section">
              <h3>Required Adaptations</h3>
              <AdaptationsList 
                adaptations={validation.adaptations}
                allowAdaptations={allowAdaptations}
              />
            </div>
          )}
          
          {/* Issues (if any) */}
          {validation.issues.length > 0 && (
            <div className="issues-section">
              <h3>Issues</h3>
              <IssuesList issues={validation.issues} />
            </div>
          )}
          
          {/* Options */}
          <div className="reapply-options">
            <label>
              <input
                type="checkbox"
                checked={allowAdaptations}
                onChange={(e) => setAllowAdaptations(e.target.checked)}
              />
              Allow automatic adaptations
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
              />
              Show preview before applying
            </label>
          </div>
        </div>
        
        <div className="reapply-actions">
          <button 
            className="button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className={`button-primary ${validation.canReapply ? '' : 'disabled'}`}
            onClick={handleReapply}
            disabled={!validation.canReapply}
          >
            {showPreview ? 'Preview Reapply' : 'Reapply Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Validation display component.
 */
function ReapplyValidationDisplay({ 
  validation 
}: { 
  validation: ReapplyValidation 
}): JSX.Element {
  const statusInfo = {
    valid: {
      icon: '✓',
      className: 'valid',
      label: 'Valid'
    },
    adaptable: {
      icon: '⚙️',
      className: 'adaptable',
      label: 'Adaptable'
    },
    'needs-clarify': {
      icon: '❓',
      className: 'needs-clarify',
      label: 'Needs Clarification'
    },
    blocked: {
      icon: '🛑',
      className: 'blocked',
      label: 'Blocked'
    }
  };
  
  const info = statusInfo[validation.status];
  
  return (
    <div className={`validation-display status-${info.className}`}>
      <div className="status-badge">
        <span className="icon">{info.icon}</span>
        <span className="label">{info.label}</span>
        <span className="confidence">
          {Math.round(validation.confidence * 100)}% confidence
        </span>
      </div>
      
      <p className="explanation">{validation.explanation}</p>
    </div>
  );
}

/**
 * Adaptations list component.
 */
function AdaptationsList({
  adaptations,
  allowAdaptations
}: {
  adaptations: readonly ReapplyAdaptation[];
  allowAdaptations: boolean;
}): JSX.Element {
  return (
    <ul className="adaptations-list">
      {adaptations.map((adaptation, i) => (
        <li key={i} className={`adaptation ${adaptation.requiresConfirmation ? 'requires-confirm' : ''}`}>
          <div className="adaptation-type">
            {formatAdaptationType(adaptation.type)}
          </div>
          <div className="adaptation-reason">
            {adaptation.reason}
          </div>
          {adaptation.requiresConfirmation && !allowAdaptations && (
            <div className="adaptation-warning">
              ⚠️ Requires manual confirmation
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Issues list component.
 */
function IssuesList({ 
  issues 
}: { 
  issues: readonly ReapplyIssue[] 
}): JSX.Element {
  return (
    <ul className="issues-list">
      {issues.map((issue, i) => (
        <li key={i} className={`issue severity-${issue.severity}`}>
          <div className="issue-header">
            <span className="severity-icon">
              {issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="issue-type">
              {formatIssueType(issue.type)}
            </span>
          </div>
          <p className="issue-description">{issue.description}</p>
          {issue.resolution && (
            <p className="issue-resolution">
              <strong>Resolution:</strong> {issue.resolution}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Scope selector component.
 */
function ScopeSelector({
  value,
  onChange,
  originalScope,
  placeholder
}: {
  value?: Scope;
  onChange: (scope: Scope | undefined) => void;
  originalScope: Scope;
  placeholder: string;
}): JSX.Element {
  // Simplified - real implementation would have full scope picker
  return (
    <div className="scope-selector">
      <select 
        onChange={(e) => {
          // Parse scope from selection
          const scopeStr = e.target.value;
          if (scopeStr === 'original') {
            onChange(undefined);
          } else {
            // Create new scope
            onChange(originalScope); // Simplified
          }
        }}
      >
        <option value="original">{placeholder}</option>
        <option value="verse1">Verse 1</option>
        <option value="chorus1">Chorus 1</option>
        <option value="verse2">Verse 2</option>
        <option value="chorus2">Chorus 2</option>
        <option value="bridge">Bridge</option>
      </select>
      
      {value && (
        <p className="scope-description">
          Will apply to: {describeScopeShort(value)}
        </p>
      )}
    </div>
  );
}

/**
 * Format adaptation type for display.
 */
function formatAdaptationType(type: ReapplyAdaptationType): string {
  const labels: Record<ReapplyAdaptationType, string> = {
    'scope-retarget': 'Scope Retargeting',
    'selector-adjust': 'Selector Adjustment',
    'param-clamp': 'Parameter Clamping',
    'constraint-relax': 'Constraint Relaxation',
    'opcode-substitute': 'Operation Substitution'
  };
  return labels[type];
}

/**
 * Format issue type for display.
 */
function formatIssueType(type: ReapplyIssueType): string {
  const labels: Record<ReapplyIssueType, string> = {
    'scope-incompatible': 'Scope Incompatible',
    'constraint-unsatisfiable': 'Constraint Unsatisfiable',
    'selector-unmatched': 'Selector Unmatched',
    'capability-unavailable': 'Capability Unavailable',
    'context-changed': 'Context Changed',
    'referent-missing': 'Referent Missing',
    'ambiguous-target': 'Ambiguous Target'
  };
  return labels[type];
}

/**
 * Short scope description.
 */
function describeScopeShort(scope: Scope): string {
  // Simplified
  return 'chorus (bars 17-24)';
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for managing reapply dialog.
 */
export function useReapplyDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<EditPackage | null>(null);
  
  const open = useCallback((pkg: EditPackage) => {
    setCurrentPackage(pkg);
    setIsOpen(true);
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setCurrentPackage(null), 300);
  }, []);
  
  return {
    isOpen,
    currentPackage,
    open,
    close
  };
}

// ============================================================================
// Exports
// ============================================================================

export type {
  ReapplyValidation,
  ReapplyStatus,
  ReapplyIssue,
  ReapplyIssueType,
  ReapplyAdaptation,
  ReapplyAdaptationType,
  ReapplyOptions,
  ReapplyResult,
  ReapplyDialogProps
};
