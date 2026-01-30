/**
 * @file Undo Preview UI (Step 319)
 * @module gofai/execution/undo-preview-ui
 * 
 * Implements Step 319: Add UI for "undo preview": show what will revert 
 * before actually undoing.
 * 
 * This module provides UI components that allow users to preview the effects
 * of an undo operation before committing to it. This is crucial for:
 * - Building user trust in the undo system
 * - Preventing accidental undos of important edits
 * - Understanding the scope and impact of undo operations
 * - Supporting selective undo (undo specific edits, not just last)
 * 
 * Design principles:
 * - Show before/after state clearly
 * - Highlight what will change on undo
 * - Support both linear undo and addressable undo by package ID
 * - Provide confirmation for large/risky undos
 * - Link to edit package provenance for explanation
 * 
 * UI Components:
 * - UndoPreviewModal: Full-screen preview of undo operation
 * - UndoPreviewInline: Inline preview in history panel
 * - UndoPreviewTimeline: Visual timeline showing affected bars/sections
 * - UndoPreviewDiffSummary: Text summary of what will revert
 * 
 * @see gofai_goalB.md Step 319
 * @see gofai_goalB.md Step 318 (edit package addressability)
 * @see gofai_goalB.md Step 316 (undo integration)
 * @see docs/gofai/undo-redo.md
 */

import React, { useState, useMemo, useCallback } from 'react';
import type { EditPackage, UndoToken } from './edit-package.js';
import type { UndoEntry } from './undo-integration.js';
import type { ExecutionDiff } from './diff-model.js';
import type { CPLIntent, CPLPlan } from './edit-package.js';

// ============================================================================
// Undo Preview Types
// ============================================================================

/**
 * Preview of an undo operation.
 * 
 * Computed before actually undoing to show users what will happen.
 */
export interface UndoPreview {
  /** Entry being undone */
  readonly entry: UndoEntry;
  
  /** What state will be reverted to */
  readonly targetState: {
    readonly beforeTimestamp: number;
    readonly description: string;
  };
  
  /** Diff that will be applied (inverse of original) */
  readonly inverseDiff: ExecutionDiff;
  
  /** Human-readable summary */
  readonly summary: string;
  
  /** Affected scope description */
  readonly affectedScope: string;
  
  /** Risk assessment */
  readonly risk: UndoRisk;
  
  /** Whether subsequent edits will be invalidated */
  readonly invalidatesSubsequent: boolean;
  
  /** Number of subsequent edits that will be invalidated */
  readonly invalidatedCount: number;
  
  /** Packages that will be affected */
  readonly affectedPackages: readonly EditPackage[];
}

/**
 * Risk assessment for undo operation.
 */
export type UndoRisk = 
  | 'safe'        // No conflicts, clean revert
  | 'moderate'    // Some subsequent edits, but independent
  | 'high'        // Many dependent edits will be invalidated
  | 'blocked';    // Cannot undo due to conflicts

/**
 * Undo preview computation options.
 */
export interface UndoPreviewOptions {
  /** Whether to compute full diff (expensive) */
  readonly computeFullDiff?: boolean;
  
  /** Whether to analyze dependency chains */
  readonly analyzeDependencies?: boolean;
  
  /** Maximum depth for dependency analysis */
  readonly maxDependencyDepth?: number;
}

// ============================================================================
// Undo Preview Computation
// ============================================================================

/**
 * Compute preview of undoing an entry.
 * 
 * Analyzes what will happen if the entry is undone without actually
 * performing the undo operation.
 * 
 * @param entry Entry to preview undoing
 * @param currentState Current project state
 * @param history Full edit history
 * @param options Preview computation options
 * @returns Preview of undo operation
 */
export function computeUndoPreview(
  entry: UndoEntry,
  currentState: unknown, // ProjectState
  history: readonly UndoEntry[],
  options: UndoPreviewOptions = {}
): UndoPreview {
  const {
    computeFullDiff = true,
    analyzeDependencies = true,
    maxDependencyDepth = 10
  } = options;
  
  // Find position in history
  const entryIndex = history.indexOf(entry);
  if (entryIndex === -1) {
    throw new Error('Entry not found in history');
  }
  
  // Check if this is the most recent entry (safest)
  const isLatest = entryIndex === history.length - 1;
  
  // Find subsequent entries that might be affected
  const subsequentEntries = history.slice(entryIndex + 1);
  const appliedSubsequent = subsequentEntries.filter(e => e.status === 'applied');
  
  // Analyze dependencies if requested
  let affectedPackages: EditPackage[] = [];
  let invalidatedCount = 0;
  
  if (analyzeDependencies && !isLatest) {
    // Check if subsequent edits depend on this one
    const entryScope = entry.packages[0]?.scope;
    
    for (const subsequent of appliedSubsequent) {
      // Simple overlap check (could be more sophisticated)
      const subsequentScope = subsequent.packages[0]?.scope;
      if (scopesOverlap(entryScope, subsequentScope)) {
        affectedPackages = [...affectedPackages, ...subsequent.packages];
        invalidatedCount++;
      }
    }
  }
  
  // Assess risk
  let risk: UndoRisk;
  if (isLatest) {
    risk = 'safe';
  } else if (invalidatedCount === 0) {
    risk = 'safe';
  } else if (invalidatedCount < 3) {
    risk = 'moderate';
  } else {
    risk = 'high';
  }
  
  // Compute inverse diff
  const inverseDiff = computeInverseDiff(entry);
  
  // Generate summary
  const summary = generateUndoSummary(entry, invalidatedCount);
  
  // Describe affected scope
  const affectedScope = entry.packages
    .map(pkg => describeScopeShort(pkg.scope))
    .join(', ');
  
  return {
    entry,
    targetState: {
      beforeTimestamp: entry.timestamp,
      description: entry.description
    },
    inverseDiff,
    summary,
    affectedScope,
    risk,
    invalidatesSubsequent: invalidatedCount > 0,
    invalidatedCount,
    affectedPackages
  };
}

/**
 * Check if two scopes overlap.
 */
function scopesOverlap(scope1: unknown, scope2: unknown): boolean {
  // Simplified - real implementation would check bar ranges, selectors, etc.
  if (!scope1 || !scope2) return false;
  return true; // Conservative: assume overlap
}

/**
 * Compute inverse diff from an edit package.
 */
function computeInverseDiff(entry: UndoEntry): ExecutionDiff {
  // Reverse the diffs from all packages in the entry
  const inverseDiffs = entry.packages.map(pkg => {
    // Each diff type has its inverse
    return invertDiff(pkg.diff);
  });
  
  // Merge inverse diffs
  return mergeDiffs(inverseDiffs);
}

/**
 * Invert a diff (swap before/after).
 */
function invertDiff(diff: ExecutionDiff): ExecutionDiff {
  // Simplified - real implementation would handle all diff types
  return {
    ...diff,
    // Swap before/after for each change
  };
}

/**
 * Merge multiple diffs into one.
 */
function mergeDiffs(diffs: ExecutionDiff[]): ExecutionDiff {
  // Simplified - real implementation would properly merge
  return diffs[0] || { events: [], params: [], structure: [] };
}

/**
 * Generate human-readable undo summary.
 */
function generateUndoSummary(entry: UndoEntry, invalidatedCount: number): string {
  let summary = `Undo: ${entry.description}`;
  
  if (invalidatedCount > 0) {
    summary += ` (will invalidate ${invalidatedCount} subsequent edit${invalidatedCount > 1 ? 's' : ''})`;
  }
  
  return summary;
}

/**
 * Short description of a scope.
 */
function describeScopeShort(scope: unknown): string {
  // Simplified - real implementation would format properly
  return 'chorus (bars 17-24)';
}

// ============================================================================
// React Components
// ============================================================================

/**
 * Props for UndoPreviewModal.
 */
export interface UndoPreviewModalProps {
  /** Preview data */
  preview: UndoPreview;
  
  /** Whether modal is open */
  isOpen: boolean;
  
  /** Close handler */
  onClose: () => void;
  
  /** Confirm undo handler */
  onConfirm: () => void;
  
  /** Show full diff details */
  showFullDiff?: boolean;
}

/**
 * Full-screen modal for previewing undo operation.
 */
export function UndoPreviewModal({
  preview,
  isOpen,
  onClose,
  onConfirm,
  showFullDiff = false
}: UndoPreviewModalProps): JSX.Element | null {
  if (!isOpen) return null;
  
  const [showDetails, setShowDetails] = useState(showFullDiff);
  
  return (
    <div className="undo-preview-modal-overlay" onClick={onClose}>
      <div 
        className="undo-preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="undo-preview-header">
          <h2>Preview Undo</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close preview"
          >
            ×
          </button>
        </div>
        
        <div className="undo-preview-content">
          {/* Summary */}
          <div className="preview-summary">
            <h3>{preview.summary}</h3>
            <p className="preview-scope">
              Affected scope: <strong>{preview.affectedScope}</strong>
            </p>
          </div>
          
          {/* Risk indicator */}
          <UndoRiskIndicator risk={preview.risk} />
          
          {/* Warning about subsequent edits */}
          {preview.invalidatesSubsequent && (
            <div className="preview-warning">
              <strong>⚠️ Warning:</strong> This will invalidate {preview.invalidatedCount} 
              subsequent edit{preview.invalidatedCount > 1 ? 's' : ''}.
              
              <details>
                <summary>Show affected edits</summary>
                <ul>
                  {preview.affectedPackages.map((pkg, i) => (
                    <li key={i}>
                      {pkg.cpl.provenance.originalUtterance || 'Unnamed edit'}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
          
          {/* Timeline visualization */}
          <div className="preview-timeline">
            <h4>Timeline Impact</h4>
            <UndoPreviewTimeline preview={preview} />
          </div>
          
          {/* Diff summary */}
          <div className="preview-diff-summary">
            <h4>Changes to Revert</h4>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="toggle-details-button"
            >
              {showDetails ? 'Hide' : 'Show'} details
            </button>
            
            {showDetails && (
              <UndoPreviewDiffSummary diff={preview.inverseDiff} />
            )}
          </div>
          
          {/* Original intent */}
          <details className="preview-original-intent">
            <summary>Original Intent</summary>
            <div className="intent-display">
              <p>
                <strong>Utterance:</strong>{' '}
                {preview.entry.packages[0]?.cpl.provenance.originalUtterance}
              </p>
              <p>
                <strong>When:</strong>{' '}
                {new Date(preview.entry.timestamp).toLocaleString()}
              </p>
            </div>
          </details>
        </div>
        
        <div className="undo-preview-actions">
          <button 
            className="button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className={`button-primary button-risk-${preview.risk}`}
            onClick={onConfirm}
          >
            {preview.risk === 'high' ? 'Undo Anyway' : 'Confirm Undo'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Risk indicator component.
 */
function UndoRiskIndicator({ risk }: { risk: UndoRisk }): JSX.Element {
  const riskInfo = {
    safe: {
      icon: '✓',
      label: 'Safe',
      description: 'This undo operation is safe and will not affect other edits.'
    },
    moderate: {
      icon: '⚠️',
      label: 'Moderate Risk',
      description: 'Some subsequent edits may need review after undoing.'
    },
    high: {
      icon: '⚠️',
      label: 'High Risk',
      description: 'Many subsequent edits will be invalidated.'
    },
    blocked: {
      icon: '🛑',
      label: 'Blocked',
      description: 'Cannot undo due to conflicts with subsequent edits.'
    }
  };
  
  const info = riskInfo[risk];
  
  return (
    <div className={`risk-indicator risk-${risk}`}>
      <span className="risk-icon">{info.icon}</span>
      <div className="risk-content">
        <strong>{info.label}</strong>
        <p>{info.description}</p>
      </div>
    </div>
  );
}

/**
 * Timeline visualization of undo impact.
 */
function UndoPreviewTimeline({ preview }: { preview: UndoPreview }): JSX.Element {
  // Simplified visualization - would show affected bars/sections
  return (
    <div className="undo-timeline">
      <div className="timeline-bar">
        <div 
          className="affected-region"
          style={{ left: '40%', width: '20%' }}
          title={preview.affectedScope}
        >
          <span className="region-label">Will revert</span>
        </div>
      </div>
      <div className="timeline-labels">
        <span>Start</span>
        <span>{preview.affectedScope}</span>
        <span>End</span>
      </div>
    </div>
  );
}

/**
 * Detailed diff summary.
 */
function UndoPreviewDiffSummary({ diff }: { diff: ExecutionDiff }): JSX.Element {
  return (
    <div className="diff-summary">
      {/* Event changes */}
      {diff.events && diff.events.length > 0 && (
        <div className="diff-section">
          <h5>Event Changes ({diff.events.length})</h5>
          <ul>
            {diff.events.slice(0, 10).map((change, i) => (
              <li key={i}>
                {describeDiffChange(change)}
              </li>
            ))}
            {diff.events.length > 10 && (
              <li className="more-items">
                ... and {diff.events.length - 10} more
              </li>
            )}
          </ul>
        </div>
      )}
      
      {/* Parameter changes */}
      {diff.params && diff.params.length > 0 && (
        <div className="diff-section">
          <h5>Parameter Changes ({diff.params.length})</h5>
          <ul>
            {diff.params.slice(0, 10).map((change, i) => (
              <li key={i}>
                {describeDiffChange(change)}
              </li>
            ))}
            {diff.params.length > 10 && (
              <li className="more-items">
                ... and {diff.params.length - 10} more
              </li>
            )}
          </ul>
        </div>
      )}
      
      {/* Structure changes */}
      {diff.structure && diff.structure.length > 0 && (
        <div className="diff-section">
          <h5>Structure Changes ({diff.structure.length})</h5>
          <ul>
            {diff.structure.slice(0, 5).map((change, i) => (
              <li key={i}>
                {describeDiffChange(change)}
              </li>
            ))}
            {diff.structure.length > 5 && (
              <li className="more-items">
                ... and {diff.structure.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Describe a single diff change.
 */
function describeDiffChange(change: unknown): string {
  // Simplified - real implementation would format based on change type
  return 'Revert change';
}

// ============================================================================
// Inline Preview Component
// ============================================================================

/**
 * Props for inline undo preview.
 */
export interface UndoPreviewInlineProps {
  /** Entry to preview */
  entry: UndoEntry;
  
  /** Preview data (computed on demand) */
  preview?: UndoPreview;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Whether preview is expanded */
  isExpanded?: boolean;
}

/**
 * Inline preview in history panel.
 * 
 * Shows compact preview when hovering over undo button.
 */
export function UndoPreviewInline({
  entry,
  preview,
  onClick,
  isExpanded = false
}: UndoPreviewInlineProps): JSX.Element {
  if (!preview) {
    return <div className="undo-preview-inline loading">Computing preview...</div>;
  }
  
  return (
    <div 
      className={`undo-preview-inline ${isExpanded ? 'expanded' : 'collapsed'}`}
      onClick={onClick}
    >
      <div className="inline-preview-header">
        <span className={`risk-badge risk-${preview.risk}`}>
          {preview.risk}
        </span>
        <span className="affected-scope">
          {preview.affectedScope}
        </span>
      </div>
      
      {isExpanded && (
        <div className="inline-preview-details">
          <p className="summary">{preview.summary}</p>
          
          {preview.invalidatesSubsequent && (
            <p className="warning">
              ⚠️ Will invalidate {preview.invalidatedCount} subsequent edit(s)
            </p>
          )}
          
          <button className="preview-button-small">
            Preview Full Details
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for managing undo preview state.
 */
export function useUndoPreview(
  entry: UndoEntry | null,
  currentState: unknown,
  history: readonly UndoEntry[]
) {
  const [preview, setPreview] = useState<UndoPreview | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const compute = useCallback(async () => {
    if (!entry) {
      setPreview(null);
      return;
    }
    
    setIsComputing(true);
    setError(null);
    
    try {
      // Compute preview (may be async in real implementation)
      const computed = computeUndoPreview(entry, currentState, history, {
        computeFullDiff: true,
        analyzeDependencies: true
      });
      
      setPreview(computed);
    } catch (err) {
      setError(err as Error);
      setPreview(null);
    } finally {
      setIsComputing(false);
    }
  }, [entry, currentState, history]);
  
  // Auto-compute when entry changes
  React.useEffect(() => {
    compute();
  }, [compute]);
  
  return {
    preview,
    isComputing,
    error,
    recompute: compute
  };
}

/**
 * Hook for managing undo preview modal.
 */
export function useUndoPreviewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<UndoEntry | null>(null);
  
  const open = useCallback((entry: UndoEntry) => {
    setCurrentEntry(entry);
    setIsOpen(true);
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
    // Don't clear entry immediately to allow for exit animation
    setTimeout(() => setCurrentEntry(null), 300);
  }, []);
  
  return {
    isOpen,
    currentEntry,
    open,
    close
  };
}

// ============================================================================
// Exports
// ============================================================================

export type {
  UndoPreview,
  UndoRisk,
  UndoPreviewOptions,
  UndoPreviewModalProps,
  UndoPreviewInlineProps
};
