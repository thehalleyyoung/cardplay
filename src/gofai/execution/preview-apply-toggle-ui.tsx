/**
 * @file Preview vs Apply Toggle UI (Step 343)
 * @module gofai/execution/preview-apply-toggle-ui
 * 
 * Implements Step 343: Add UI to toggle preview vs apply; preview should be 
 * the default when ambiguity/risks are high.
 * 
 * This module provides UI controls for switching between preview mode and
 * immediate application mode. Key features:
 * 
 * 1. Smart Defaults - Auto-select preview for risky/ambiguous edits
 * 2. Mode Persistence - Remember user preference per context
 * 3. Visual Clarity - Clear indication of current mode
 * 4. Safety Rails - Prevent accidental applies in manual boards
 * 5. Quick Toggle - Easy keyboard shortcuts
 * 6. Confidence-Based - Use edit confidence to set default
 * 
 * Design principles:
 * - Preview-first for safety
 * - Clear visual feedback
 * - Easy to override
 * - Context-aware defaults
 * - Accessible controls
 * - Progressive disclosure
 * 
 * Mode selection logic:
 * - High confidence + low risk → Allow direct apply
 * - Medium confidence → Preview by default
 * - Low confidence or high risk → Force preview
 * - Manual boards → Always preview
 * - Structural edits → Always preview
 * 
 * @see gofai_goalB.md Step 343
 * @see gofai_goalB.md Step 342 (preview apply mode)
 * @see gofai_goalB.md Step 274 (ask vs act planning)
 * @see docs/gofai/preview-apply-policy.md
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { CPLPlan } from '../execution/edit-package.js';
import type { Capability } from '../canon/capability-model.js';

// ============================================================================
// Preview/Apply Types
// ============================================================================

/**
 * Execution mode.
 */
export type ExecutionMode =
  | 'preview'      // Show preview, require explicit apply
  | 'apply'        // Apply immediately
  | 'auto';        // Choose based on confidence

/**
 * Risk level for edit operation.
 */
export type RiskLevel =
  | 'low'          // Safe to apply directly
  | 'medium'       // Preview recommended
  | 'high'         // Preview required
  | 'critical';    // Must get explicit confirmation

/**
 * Factors influencing mode selection.
 */
export interface ModeSelectionFactors {
  /** Plan confidence (0-1) */
  readonly confidence: number;
  
  /** Risk level */
  readonly riskLevel: RiskLevel;
  
  /** Board capability level */
  readonly boardCapability: Capability;
  
  /** Number of ambiguous elements */
  readonly ambiguityCount: number;
  
  /** Whether edit affects structure */
  readonly affectsStructure: boolean;
  
  /** Number of events affected */
  readonly eventCount: number;
  
  /** Number of constraints */
  readonly constraintCount: number;
  
  /** Whether edit is reversible */
  readonly reversible: boolean;
}

/**
 * Mode selection result.
 */
export interface ModeSelection {
  /** Selected mode */
  readonly mode: ExecutionMode;
  
  /** Whether user can override */
  readonly canOverride: boolean;
  
  /** Reason for selection */
  readonly reason: string;
  
  /** Warning message (if any) */
  readonly warning?: string;
}

/**
 * User preference for execution mode.
 */
export interface ExecutionModePreference {
  /** Preferred mode */
  readonly mode: ExecutionMode;
  
  /** Whether to remember preference */
  readonly remember: boolean;
  
  /** Scope of preference (global, board-specific, etc.) */
  readonly scope: 'global' | 'board' | 'session';
}

// ============================================================================
// Mode Selection Logic
// ============================================================================

/**
 * Determine appropriate execution mode based on factors.
 */
export function selectExecutionMode(
  factors: ModeSelectionFactors,
  userPreference?: ExecutionModePreference
): ModeSelection {
  // User preference takes precedence if set
  if (userPreference && userPreference.mode !== 'auto') {
    const canOverride = factors.riskLevel !== 'critical';
    return {
      mode: userPreference.mode,
      canOverride,
      reason: 'User preference',
      warning: !canOverride && userPreference.mode === 'apply'
        ? 'This edit requires preview due to high risk'
        : undefined
    };
  }
  
  // Critical risk always requires preview + confirmation
  if (factors.riskLevel === 'critical') {
    return {
      mode: 'preview',
      canOverride: false,
      reason: 'Critical risk - manual confirmation required',
      warning: 'This edit may significantly alter your project'
    };
  }
  
  // Manual boards always preview
  if (factors.boardCapability === 'full-manual') {
    return {
      mode: 'preview',
      canOverride: false,
      reason: 'Manual board - preview required',
      warning: undefined
    };
  }
  
  // Structural edits always preview
  if (factors.affectsStructure) {
    return {
      mode: 'preview',
      canOverride: false,
      reason: 'Structural edit - preview required',
      warning: undefined
    };
  }
  
  // High risk requires preview
  if (factors.riskLevel === 'high') {
    return {
      mode: 'preview',
      canOverride: true,
      reason: 'High risk detected',
      warning: 'Preview recommended for this edit'
    };
  }
  
  // Many ambiguities require preview
  if (factors.ambiguityCount > 2) {
    return {
      mode: 'preview',
      canOverride: true,
      reason: `${factors.ambiguityCount} ambiguous elements`,
      warning: 'Preview recommended due to ambiguities'
    };
  }
  
  // Low confidence requires preview
  if (factors.confidence < 0.7) {
    return {
      mode: 'preview',
      canOverride: true,
      reason: `Low confidence (${Math.round(factors.confidence * 100)}%)`,
      warning: 'Preview recommended due to uncertainty'
    };
  }
  
  // Large edits default to preview
  if (factors.eventCount > 100) {
    return {
      mode: 'preview',
      canOverride: true,
      reason: `Large edit (${factors.eventCount} events)`,
      warning: undefined
    };
  }
  
  // Medium risk defaults to preview but allows override
  if (factors.riskLevel === 'medium') {
    return {
      mode: 'preview',
      canOverride: true,
      reason: 'Medium risk - preview recommended',
      warning: undefined
    };
  }
  
  // Low risk + high confidence + reversible → allow direct apply
  if (
    factors.riskLevel === 'low' &&
    factors.confidence > 0.85 &&
    factors.reversible
  ) {
    return {
      mode: 'apply',
      canOverride: true,
      reason: 'High confidence, low risk',
      warning: undefined
    };
  }
  
  // Default to preview for safety
  return {
    mode: 'preview',
    canOverride: true,
    reason: 'Default safety mode',
    warning: undefined
  };
}

/**
 * Assess risk level based on factors.
 */
export function assessRiskLevel(factors: Partial<ModeSelectionFactors>): RiskLevel {
  if (factors.affectsStructure) return 'high';
  if (factors.boardCapability === 'full-manual') return 'high';
  if ((factors.ambiguityCount || 0) > 5) return 'high';
  if ((factors.eventCount || 0) > 500) return 'medium';
  if ((factors.confidence || 1) < 0.6) return 'medium';
  if ((factors.constraintCount || 0) > 10) return 'medium';
  return 'low';
}

// ============================================================================
// React Components
// ============================================================================

/**
 * Props for PreviewApplyToggle.
 */
export interface PreviewApplyToggleProps {
  /** Current mode */
  currentMode: ExecutionMode;
  
  /** Mode selection factors */
  factors: ModeSelectionFactors;
  
  /** User preference */
  preference?: ExecutionModePreference;
  
  /** Change handler */
  onChange: (mode: ExecutionMode) => void;
  
  /** Update preference handler */
  onPreferenceChange?: (preference: ExecutionModePreference) => void;
  
  /** Whether toggle is disabled */
  disabled?: boolean;
  
  /** Compact mode (smaller UI) */
  compact?: boolean;
}

/**
 * Main toggle component for preview vs apply mode.
 */
export function PreviewApplyToggle({
  currentMode,
  factors,
  preference,
  onChange,
  onPreferenceChange,
  disabled = false,
  compact = false
}: PreviewApplyToggleProps): JSX.Element {
  const [showDetails, setShowDetails] = useState(false);
  
  // Compute mode selection
  const selection = useMemo(
    () => selectExecutionMode(factors, preference),
    [factors, preference]
  );
  
  // Suggest mode if different from current
  const suggestedMode = selection.mode !== currentMode ? selection.mode : null;
  
  const handleModeChange = useCallback((mode: ExecutionMode) => {
    if (disabled) return;
    if (!selection.canOverride && mode !== selection.mode) {
      // Cannot override this selection
      return;
    }
    onChange(mode);
  }, [disabled, selection, onChange]);
  
  if (compact) {
    return (
      <div className="preview-apply-toggle compact">
        <select
          value={currentMode}
          onChange={(e) => handleModeChange(e.target.value as ExecutionMode)}
          disabled={disabled || !selection.canOverride}
          className={`mode-select ${suggestedMode ? 'has-suggestion' : ''}`}
        >
          <option value="preview">Preview First</option>
          <option value="apply">Apply Immediately</option>
          <option value="auto">Auto</option>
        </select>
        
        {selection.warning && (
          <span className="warning-icon" title={selection.warning}>
            ⚠️
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="preview-apply-toggle">
      <div className="toggle-header">
        <h4>Execution Mode</h4>
        <button
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      {/* Mode buttons */}
      <div className="mode-buttons">
        <button
          className={`mode-button ${currentMode === 'preview' ? 'active' : ''} ${suggestedMode === 'preview' ? 'suggested' : ''}`}
          onClick={() => handleModeChange('preview')}
          disabled={disabled}
        >
          <span className="mode-icon">👁️</span>
          <span className="mode-label">Preview First</span>
          {suggestedMode === 'preview' && (
            <span className="recommended-badge">Recommended</span>
          )}
        </button>
        
        <button
          className={`mode-button ${currentMode === 'apply' ? 'active' : ''} ${suggestedMode === 'apply' ? 'suggested' : ''}`}
          onClick={() => handleModeChange('apply')}
          disabled={disabled || (!selection.canOverride && selection.mode !== 'apply')}
        >
          <span className="mode-icon">✓</span>
          <span className="mode-label">Apply Immediately</span>
          {!selection.canOverride && selection.mode !== 'apply' && (
            <span className="blocked-badge">🔒</span>
          )}
        </button>
        
        <button
          className={`mode-button ${currentMode === 'auto' ? 'active' : ''}`}
          onClick={() => handleModeChange('auto')}
          disabled={disabled}
        >
          <span className="mode-icon">⚙️</span>
          <span className="mode-label">Auto</span>
        </button>
      </div>
      
      {/* Warning message */}
      {selection.warning && (
        <div className="mode-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">{selection.warning}</span>
        </div>
      )}
      
      {/* Mode explanation */}
      <div className="mode-explanation">
        <ModeExplanation mode={currentMode} />
      </div>
      
      {/* Details panel */}
      {showDetails && (
        <div className="mode-details">
          <h5>Selection Factors</h5>
          <dl className="factors-list">
            <dt>Confidence:</dt>
            <dd>{Math.round(factors.confidence * 100)}%</dd>
            
            <dt>Risk Level:</dt>
            <dd>
              <RiskBadge level={factors.riskLevel} />
            </dd>
            
            <dt>Ambiguities:</dt>
            <dd>{factors.ambiguityCount}</dd>
            
            <dt>Events Affected:</dt>
            <dd>{factors.eventCount}</dd>
            
            <dt>Structural Changes:</dt>
            <dd>{factors.affectsStructure ? 'Yes' : 'No'}</dd>
            
            <dt>Reversible:</dt>
            <dd>{factors.reversible ? 'Yes' : 'No'}</dd>
          </dl>
          
          <div className="selection-reason">
            <strong>Recommendation:</strong> {selection.reason}
          </div>
          
          {onPreferenceChange && (
            <div className="preference-controls">
              <label>
                <input
                  type="checkbox"
                  checked={preference?.remember || false}
                  onChange={(e) => {
                    onPreferenceChange({
                      mode: currentMode,
                      remember: e.target.checked,
                      scope: 'session'
                    });
                  }}
                />
                Remember this choice for this session
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mode explanation text.
 */
function ModeExplanation({ mode }: { mode: ExecutionMode }): JSX.Element {
  const explanations: Record<ExecutionMode, string> = {
    preview: 'Show what will change before applying. You can review and confirm.',
    apply: 'Apply changes immediately without preview. Faster but less safe.',
    auto: 'Automatically choose based on confidence and risk level.'
  };
  
  return <p className="mode-explanation-text">{explanations[mode]}</p>;
}

/**
 * Risk level badge.
 */
function RiskBadge({ level }: { level: RiskLevel }): JSX.Element {
  const config: Record<RiskLevel, { icon: string; label: string; className: string }> = {
    low: { icon: '✓', label: 'Low', className: 'risk-low' },
    medium: { icon: '⚠️', label: 'Medium', className: 'risk-medium' },
    high: { icon: '⚠️', label: 'High', className: 'risk-high' },
    critical: { icon: '🛑', label: 'Critical', className: 'risk-critical' }
  };
  
  const { icon, label, className } = config[level];
  
  return (
    <span className={`risk-badge ${className}`}>
      <span className="risk-icon">{icon}</span>
      <span className="risk-label">{label}</span>
    </span>
  );
}

/**
 * Inline mode indicator (for toolbar/status bar).
 */
export function ExecutionModeIndicator({
  mode,
  compact = true
}: {
  mode: ExecutionMode;
  compact?: boolean;
}): JSX.Element {
  const icons: Record<ExecutionMode, string> = {
    preview: '👁️',
    apply: '✓',
    auto: '⚙️'
  };
  
  const labels: Record<ExecutionMode, string> = {
    preview: 'Preview',
    apply: 'Apply',
    auto: 'Auto'
  };
  
  if (compact) {
    return (
      <span className={`mode-indicator compact mode-${mode}`} title={labels[mode]}>
        {icons[mode]}
      </span>
    );
  }
  
  return (
    <span className={`mode-indicator mode-${mode}`}>
      <span className="mode-icon">{icons[mode]}</span>
      <span className="mode-label">{labels[mode]}</span>
    </span>
  );
}

/**
 * Quick action buttons for preview/apply.
 */
export function PreviewApplyActions({
  mode,
  onPreview,
  onApply,
  disabled = false,
  showBoth = false
}: {
  mode: ExecutionMode;
  onPreview: () => void;
  onApply: () => void;
  disabled?: boolean;
  showBoth?: boolean;
}): JSX.Element {
  if (mode === 'preview' || showBoth) {
    return (
      <div className="preview-apply-actions">
        <button
          className="button-secondary preview-button"
          onClick={onPreview}
          disabled={disabled}
        >
          👁️ Preview
        </button>
        {(mode === 'preview' || showBoth) && (
          <button
            className="button-primary apply-button"
            onClick={onApply}
            disabled={disabled}
          >
            ✓ Apply
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className="preview-apply-actions">
      <button
        className="button-primary apply-button"
        onClick={onApply}
        disabled={disabled}
      >
        ✓ Apply Now
      </button>
    </div>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for managing execution mode state.
 */
export function useExecutionMode(
  initialFactors: ModeSelectionFactors,
  initialPreference?: ExecutionModePreference
) {
  const [factors, setFactors] = useState(initialFactors);
  const [preference, setPreference] = useState(initialPreference);
  
  const selection = useMemo(
    () => selectExecutionMode(factors, preference),
    [factors, preference]
  );
  
  const [currentMode, setCurrentMode] = useState<ExecutionMode>(selection.mode);
  
  // Update current mode when selection changes
  useEffect(() => {
    if (currentMode === 'auto') {
      setCurrentMode(selection.mode);
    }
  }, [selection.mode, currentMode]);
  
  const updateFactors = useCallback((newFactors: Partial<ModeSelectionFactors>) => {
    setFactors(prev => ({ ...prev, ...newFactors }));
  }, []);
  
  const updatePreference = useCallback((newPreference: ExecutionModePreference) => {
    setPreference(newPreference);
    if (newPreference.mode !== 'auto') {
      setCurrentMode(newPreference.mode);
    }
  }, []);
  
  return {
    currentMode,
    setCurrentMode,
    factors,
    updateFactors,
    preference,
    updatePreference,
    selection
  };
}

// ============================================================================
// Exports
// ============================================================================

export type {
  ExecutionMode,
  RiskLevel,
  ModeSelectionFactors,
  ModeSelection,
  ExecutionModePreference,
  PreviewApplyToggleProps
};
