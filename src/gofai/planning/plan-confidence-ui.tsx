/**
 * @file Plan Confidence UI Component
 * @module gofai/planning/plan-confidence-ui
 *
 * Implements Step 285 from gofai_goalB.md:
 * - Design "confidence UI": show confidence as "ready / needs clarification / risky"
 * - Derive confidence from hole count (unresolved references/parameters)
 * - Factor in plan cost and constraint risk
 * - Provide clear visual indicators of plan readiness
 * - Show what needs resolution before execution
 *
 * Confidence Levels:
 * - READY: No holes, low cost, all constraints satisfied, safe opcodes
 * - NEEDS_CLARIFICATION: Has holes or ambiguous references that must be resolved
 * - RISKY: High cost, constraint violations possible, or destructive opcodes
 * - BLOCKED: Cannot execute due to missing capabilities or failed preconditions
 *
 * Key Features:
 * - Clear visual status indicators (colors, icons)
 * - Detailed breakdown of confidence factors
 * - Actionable suggestions for improvement
 * - Link to specific issues in plan
 * - Support for override/confirmation flows
 *
 * Design Principles:
 * - Never hide risks from users
 * - Make "needs clarification" feel natural, not like an error
 * - Provide clear path to resolution
 * - Match studio workflow expectations (preview > verify > apply)
 *
 * @see src/gofai/planning/plan-types.ts (plan structure)
 * @see src/gofai/semantics/cpl-holes.ts (hole detection)
 * @see src/gofai/planning/cost-model.ts (cost calculation)
 */

import React, { useMemo } from 'react';
import type { CPLPlan, OpcodeRisk } from './plan-types';
import type { PlanScore } from './cost-model';
import type { CPLIntent, CPLHole } from '../canon/cpl-types';

// ============================================================================
// Types
// ============================================================================

/**
 * Overall confidence level for plan execution
 */
export type ConfidenceLevel =
  | 'ready'                  // Safe to execute immediately
  | 'needs-clarification'    // Requires user input before execution
  | 'risky'                  // Executable but user should review carefully
  | 'blocked';               // Cannot execute without addressing issues

/**
 * Specific factor affecting confidence
 */
export interface ConfidenceFactor {
  readonly type: 'hole' | 'cost' | 'risk' | 'constraint' | 'capability' | 'precondition';
  readonly severity: 'info' | 'warning' | 'error';
  readonly message: string;
  readonly detail?: string;
  readonly suggestion?: string;
  readonly sourceOpcodeId?: string;
  readonly sourceHoleId?: string;
}

/**
 * Complete confidence assessment for a plan
 */
export interface ConfidenceAssessment {
  readonly level: ConfidenceLevel;
  readonly score: number; // 0-1, higher is more confident
  readonly factors: readonly ConfidenceFactor[];
  readonly canExecute: boolean;
  readonly requiresConfirmation: boolean;
  readonly summary: string;
}

/**
 * Props for PlanConfidenceUI component
 */
export interface PlanConfidenceUIProps {
  /** The plan to assess */
  readonly plan: CPLPlan;

  /** Original intent (for hole analysis) */
  readonly intent?: CPLIntent;

  /** Plan score from scoring system */
  readonly planScore?: PlanScore;

  /** Whether to show detailed breakdown */
  readonly showDetails?: boolean;

  /** Whether to show suggestions for improvement */
  readonly showSuggestions?: boolean;

  /** Callback when user requests clarification */
  readonly onRequestClarification?: (factor: ConfidenceFactor) => void;

  /** Callback when user acknowledges risk and wants to proceed */
  readonly onAcknowledgeRisk?: () => void;

  /** Whether component is in compact mode */
  readonly compact?: boolean;

  /** Custom className for styling */
  readonly className?: string;
}

// ============================================================================
// Confidence Assessment Logic
// ============================================================================

/**
 * Count holes in intent/plan
 */
function countHoles(intent?: CPLIntent, plan?: CPLPlan): number {
  let count = 0;

  // Check intent for unresolved references
  if (intent && 'holes' in intent) {
    const holes = intent.holes as CPLHole[];
    count += holes.length;
  }

  // Check plan opcodes for unresolved parameters
  if (plan) {
    for (const opcode of plan.opcodes) {
      const params = opcode.params;
      for (const value of Object.values(params)) {
        if (value === null || value === undefined) {
          count++;
        }
        if (typeof value === 'object' && value && 'type' in value && value.type === 'hole') {
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Assess cost level
 */
function assessCost(planScore?: PlanScore): ConfidenceFactor | null {
  if (!planScore) return null;

  const cost = planScore.totalCost || 0;

  if (cost < 10) {
    return {
      type: 'cost',
      severity: 'info',
      message: 'Low cost edits',
      detail: 'These changes are minor and easily reversible.',
    };
  } else if (cost < 50) {
    return {
      type: 'cost',
      severity: 'warning',
      message: 'Moderate cost edits',
      detail: 'These changes will noticeably affect your project.',
      suggestion: 'Preview the changes before applying.',
    };
  } else {
    return {
      type: 'cost',
      severity: 'error',
      message: 'High cost edits',
      detail: 'These changes are substantial and may be difficult to undo.',
      suggestion: 'Carefully review the diff before applying. Consider saving your project first.',
    };
  }
}

/**
 * Assess risk level from opcodes
 */
function assessRisk(plan: CPLPlan): readonly ConfidenceFactor[] {
  const factors: ConfidenceFactor[] = [];

  for (const opcode of plan.opcodes) {
    const risk = opcode.risk;

    if (risk === 'high' || risk === 'critical') {
      factors.push({
        type: 'risk',
        severity: risk === 'critical' ? 'error' : 'warning',
        message: `${risk} risk operation: ${opcode.name}`,
        detail: opcode.description,
        suggestion: risk === 'critical' 
          ? 'This operation cannot be undone. Save your project first.'
          : 'This operation may be difficult to reverse. Preview carefully.',
        sourceOpcodeId: opcode.id,
      });
    }
  }

  return factors;
}

/**
 * Assess constraint satisfaction
 */
function assessConstraints(plan: CPLPlan, planScore?: PlanScore): readonly ConfidenceFactor[] {
  const factors: ConfidenceFactor[] = [];

  // Check if plan violates any constraints
  if (planScore && 'constraintViolations' in planScore) {
    const violations = planScore.constraintViolations as any[];
    for (const violation of violations) {
      factors.push({
        type: 'constraint',
        severity: 'error',
        message: `Constraint violation: ${violation.constraint}`,
        detail: violation.description,
        suggestion: 'This plan cannot be executed without violating stated constraints.',
      });
    }
  }

  // Check if plan has constraint risks
  if (planScore && 'constraintRisks' in planScore) {
    const risks = planScore.constraintRisks as any[];
    for (const risk of risks) {
      factors.push({
        type: 'constraint',
        severity: 'warning',
        message: `Constraint risk: ${risk.constraint}`,
        detail: risk.description,
        suggestion: 'This plan may affect constrained elements. Review carefully.',
      });
    }
  }

  return factors;
}

/**
 * Assess capability requirements
 */
function assessCapabilities(plan: CPLPlan): readonly ConfidenceFactor[] {
  const factors: ConfidenceFactor[] = [];

  for (const opcode of plan.opcodes) {
    const required = opcode.requiredCapabilities;
    
    // Check if capabilities are available
    // This would need actual capability checking from project/board state
    // For now, we'll check if capabilities are present
    if (required && required.length > 0) {
      // Placeholder: in real implementation, check against available capabilities
      const missing = required.filter(cap => {
        // Would check: isCapabilityAvailable(cap, projectState)
        return false; // Assume available for now
      });

      if (missing.length > 0) {
        factors.push({
          type: 'capability',
          severity: 'error',
          message: `Missing required capabilities for: ${opcode.name}`,
          detail: `Required: ${missing.join(', ')}`,
          suggestion: 'Enable required capabilities or choose a different plan.',
          sourceOpcodeId: opcode.id,
        });
      }
    }
  }

  return factors;
}

/**
 * Assess preconditions
 */
function assessPreconditions(plan: CPLPlan): readonly ConfidenceFactor[] {
  const factors: ConfidenceFactor[] = [];

  for (const opcode of plan.opcodes) {
    const preconditions = opcode.preconditions;
    
    if (preconditions && preconditions.length > 0) {
      for (const precondition of preconditions) {
        // Check if precondition is met
        // This would need actual project state checking
        // For now, we'll mark required preconditions that might not be met
        
        if (precondition.required) {
          // Placeholder: in real implementation, evaluate precondition
          const isMet = true; // Would check: evaluatePrecondition(precondition, projectState)
          
          if (!isMet) {
            factors.push({
              type: 'precondition',
              severity: 'error',
              message: `Precondition not met: ${precondition.type}`,
              detail: precondition.description,
              suggestion: 'Address the precondition before executing this plan.',
              sourceOpcodeId: opcode.id,
            });
          }
        }
      }
    }
  }

  return factors;
}

/**
 * Calculate overall confidence assessment
 */
export function assessPlanConfidence(
  plan: CPLPlan,
  intent?: CPLIntent,
  planScore?: PlanScore
): ConfidenceAssessment {
  const factors: ConfidenceFactor[] = [];

  // 1. Check for holes
  const holeCount = countHoles(intent, plan);
  if (holeCount > 0) {
    factors.push({
      type: 'hole',
      severity: 'warning',
      message: `${holeCount} unresolved ${holeCount === 1 ? 'reference' : 'references'}`,
      detail: 'Some parts of the request need clarification.',
      suggestion: 'Resolve ambiguities before executing.',
    });
  }

  // 2. Check cost
  const costFactor = assessCost(planScore);
  if (costFactor) {
    factors.push(costFactor);
  }

  // 3. Check risk
  factors.push(...assessRisk(plan));

  // 4. Check constraints
  factors.push(...assessConstraints(plan, planScore));

  // 5. Check capabilities
  factors.push(...assessCapabilities(plan));

  // 6. Check preconditions
  factors.push(...assessPreconditions(plan));

  // Determine overall level
  const hasErrors = factors.some(f => f.severity === 'error');
  const hasWarnings = factors.some(f => f.severity === 'warning');
  const hasHoles = holeCount > 0;

  let level: ConfidenceLevel;
  let canExecute: boolean;
  let requiresConfirmation: boolean;
  let summary: string;

  if (hasErrors) {
    level = 'blocked';
    canExecute = false;
    requiresConfirmation = false;
    summary = 'Cannot execute: critical issues must be resolved first';
  } else if (hasHoles) {
    level = 'needs-clarification';
    canExecute = false;
    requiresConfirmation = false;
    summary = 'Needs clarification before execution';
  } else if (hasWarnings) {
    level = 'risky';
    canExecute = true;
    requiresConfirmation = true;
    summary = 'Ready to execute with confirmation';
  } else {
    level = 'ready';
    canExecute = true;
    requiresConfirmation = false;
    summary = 'Ready to execute';
  }

  // Calculate numeric score (0-1)
  const errorPenalty = factors.filter(f => f.severity === 'error').length * 0.4;
  const warningPenalty = factors.filter(f => f.severity === 'warning').length * 0.15;
  const holePenalty = holeCount * 0.2;
  const score = Math.max(0, 1 - errorPenalty - warningPenalty - holePenalty);

  return {
    level,
    score,
    factors,
    canExecute,
    requiresConfirmation,
    summary,
  };
}

// ============================================================================
// UI Components
// ============================================================================

/**
 * Confidence level badge with color and icon
 */
interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  compact?: boolean;
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ level, compact }) => {
  const config = useMemo(() => {
    switch (level) {
      case 'ready':
        return {
          color: '#10B981',
          bg: '#10B98120',
          icon: '✓',
          label: 'Ready',
        };
      case 'needs-clarification':
        return {
          color: '#F59E0B',
          bg: '#F59E0B20',
          icon: '?',
          label: 'Needs Clarification',
        };
      case 'risky':
        return {
          color: '#EF4444',
          bg: '#EF444420',
          icon: '⚠',
          label: 'Risky',
        };
      case 'blocked':
        return {
          color: '#DC2626',
          bg: '#DC262620',
          icon: '✕',
          label: 'Blocked',
        };
    }
  }, [level]);

  return (
    <div
      className="confidence-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 4 : 6,
        padding: compact ? '2px 8px' : '4px 12px',
        backgroundColor: config.bg,
        border: `1px solid ${config.color}`,
        borderRadius: 4,
        fontSize: compact ? '11px' : '13px',
        fontWeight: 600,
        color: config.color,
      }}
    >
      <span style={{ fontSize: compact ? '12px' : '14px' }}>{config.icon}</span>
      {!compact && <span>{config.label}</span>}
    </div>
  );
};

/**
 * Confidence score bar
 */
interface ConfidenceScoreBarProps {
  score: number;
  width?: number;
}

const ConfidenceScoreBar: React.FC<ConfidenceScoreBarProps> = ({ score, width = 100 }) => {
  const color = useMemo(() => {
    if (score >= 0.8) return '#10B981';
    if (score >= 0.5) return '#F59E0B';
    return '#EF4444';
  }, [score]);

  return (
    <div
      className="confidence-score-bar"
      style={{
        width,
        height: 6,
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${score * 100}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
};

/**
 * Individual confidence factor display
 */
interface ConfidenceFactorItemProps {
  factor: ConfidenceFactor;
  onRequestClarification?: (factor: ConfidenceFactor) => void;
}

const ConfidenceFactorItem: React.FC<ConfidenceFactorItemProps> = ({
  factor,
  onRequestClarification,
}) => {
  const severityConfig = useMemo(() => {
    switch (factor.severity) {
      case 'error':
        return { color: '#EF4444', icon: '✕', label: 'Error' };
      case 'warning':
        return { color: '#F59E0B', icon: '⚠', label: 'Warning' };
      case 'info':
        return { color: '#3B82F6', icon: 'ℹ', label: 'Info' };
    }
  }, [factor.severity]);

  return (
    <div
      className="confidence-factor-item"
      style={{
        padding: '8px 12px',
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: `3px solid ${severityConfig.color}`,
        borderRadius: 2,
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: '14px', color: severityConfig.color }}>
          {severityConfig.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 2, color: severityConfig.color }}>
            {factor.message}
          </div>
          {factor.detail && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 4 }}>
              {factor.detail}
            </div>
          )}
          {factor.suggestion && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                fontStyle: 'italic',
                marginTop: 4,
              }}
            >
              💡 {factor.suggestion}
            </div>
          )}
        </div>
      </div>
      
      {factor.type === 'hole' && onRequestClarification && (
        <button
          onClick={() => onRequestClarification(factor)}
          style={{
            marginTop: 8,
            padding: '4px 12px',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 3,
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Clarify Now
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Plan Confidence UI Component
 * 
 * Displays confidence assessment for a plan, showing readiness level
 * and any factors that affect confidence (holes, risks, constraints).
 */
export const PlanConfidenceUI: React.FC<PlanConfidenceUIProps> = ({
  plan,
  intent,
  planScore,
  showDetails = true,
  showSuggestions = true,
  onRequestClarification,
  onAcknowledgeRisk,
  compact = false,
  className = '',
}) => {
  // Calculate confidence assessment
  const assessment = useMemo(() => {
    return assessPlanConfidence(plan, intent, planScore);
  }, [plan, intent, planScore]);

  // Filter factors based on settings
  const visibleFactors = useMemo(() => {
    let factors = assessment.factors;
    
    if (!showSuggestions) {
      factors = factors.map(f => ({ ...f, suggestion: undefined }));
    }
    
    return factors;
  }, [assessment.factors, showSuggestions]);

  if (compact) {
    return (
      <div className={`plan-confidence-ui compact ${className}`}>
        <ConfidenceBadge level={assessment.level} compact />
      </div>
    );
  }

  return (
    <div
      className={`plan-confidence-ui ${className}`}
      style={{
        padding: 16,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 6,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <ConfidenceBadge level={assessment.level} />
          <ConfidenceScoreBar score={assessment.score} width={120} />
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            {Math.round(assessment.score * 100)}%
          </span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          {assessment.summary}
        </div>
      </div>

      {/* Factors */}
      {showDetails && visibleFactors.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
            Details ({visibleFactors.length})
          </div>
          {visibleFactors.map((factor, index) => (
            <ConfidenceFactorItem
              key={index}
              factor={factor}
              onRequestClarification={onRequestClarification}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      {assessment.level === 'risky' && onAcknowledgeRisk && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-secondary)' }}>
          <button
            onClick={onAcknowledgeRisk}
            style={{
              padding: '8px 16px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            I Understand the Risks – Proceed Anyway
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanConfidenceUI;
