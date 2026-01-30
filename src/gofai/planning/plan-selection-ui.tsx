/**
 * @file Plan Selection UI Component
 * @module gofai/planning/plan-selection-ui
 *
 * Implements Step 260 from gofai_goalB.md:
 * - Design plan selection UI: compare candidate plans by diff summary
 * - Show clear differences between plans (not abstract scoring numbers)
 * - Allow user to select, preview, or reject plans
 * - Present plans in terms users understand (what changes, where)
 *
 * Key Principles:
 * - Show human-readable diff summaries, not technical scores
 * - Highlight key differences between plans
 * - Make selection fast and intuitive
 * - Support preview before commitment
 * - Link to plan explainability for "why" questions
 *
 * @see src/gofai/planning/plan-generation.ts (generates candidates)
 * @see src/gofai/planning/plan-explainability.ts (reason traces)
 * @see src/gofai/execution/diff-summary.ts (human-readable diffs)
 */

import React, { useState, useMemo } from 'react';
import type { CPLPlan, PlanScore } from './plan-types';
import type { DiffSummary, SectionDiff, LayerDiff } from '../execution/diff-types';

// ============================================================================
// Types
// ============================================================================

/**
 * Candidate plan with associated metadata for UI display.
 */
export interface PlanCandidate {
  /** Unique identifier for this candidate */
  readonly id: string;

  /** The executable plan */
  readonly plan: CPLPlan;

  /** Human-readable diff summary */
  readonly diffSummary: DiffSummary;

  /** Score breakdown (for advanced users, hidden by default) */
  readonly score: PlanScore;

  /** Rank among all candidates (1-indexed) */
  readonly rank: number;

  /** Whether this is the recommended default */
  readonly isRecommended: boolean;

  /** Key distinguishing features from other candidates */
  readonly distinguishingFeatures: string[];
}

/**
 * Props for PlanSelectionUI component.
 */
export interface PlanSelectionUIProps {
  /** All candidate plans to choose from */
  readonly candidates: readonly PlanCandidate[];

  /** Callback when user selects a plan */
  readonly onSelectPlan: (candidate: PlanCandidate) => void;

  /** Callback when user requests plan preview */
  readonly onPreviewPlan: (candidate: PlanCandidate) => void;

  /** Callback when user rejects all plans */
  readonly onRejectAll: () => void;

  /** Callback when user requests explanation of a plan */
  readonly onExplainPlan: (candidate: PlanCandidate) => void;

  /** Whether to show technical details (scores, opcodes) */
  readonly showTechnicalDetails?: boolean;

  /** Currently previewing plan ID, if any */
  readonly previewingPlanId?: string;
}

/**
 * Props for individual plan card.
 */
interface PlanCardProps {
  readonly candidate: PlanCandidate;
  readonly onSelect: () => void;
  readonly onPreview: () => void;
  readonly onExplain: () => void;
  readonly showTechnicalDetails: boolean;
  readonly isPreviewing: boolean;
  readonly isExpanded: boolean;
  readonly onToggleExpanded: () => void;
}

// ============================================================================
// Diff Summary Display Helpers
// ============================================================================

/**
 * Format a section diff for display.
 */
function formatSectionDiff(sectionDiff: SectionDiff): string {
  const changes: string[] = [];

  if (sectionDiff.eventsAdded > 0) {
    changes.push(`+${sectionDiff.eventsAdded} events`);
  }
  if (sectionDiff.eventsRemoved > 0) {
    changes.push(`-${sectionDiff.eventsRemoved} events`);
  }
  if (sectionDiff.eventsModified > 0) {
    changes.push(`~${sectionDiff.eventsModified} modified`);
  }

  return changes.length > 0 ? changes.join(', ') : 'no changes';
}

/**
 * Format a layer diff for display.
 */
function formatLayerDiff(layerDiff: LayerDiff): string {
  const changes: string[] = [];

  if (layerDiff.densityChange) {
    const sign = layerDiff.densityChange > 0 ? '+' : '';
    changes.push(`density ${sign}${(layerDiff.densityChange * 100).toFixed(0)}%`);
  }

  if (layerDiff.registerChange) {
    const direction = layerDiff.registerChange > 0 ? 'raised' : 'lowered';
    changes.push(`register ${direction} ${Math.abs(layerDiff.registerChange)} semitones`);
  }

  if (layerDiff.parametersChanged.length > 0) {
    changes.push(`${layerDiff.parametersChanged.length} params adjusted`);
  }

  return changes.length > 0 ? changes.join(', ') : 'no changes';
}

// ============================================================================
// Plan Card Component
// ============================================================================

/**
 * Individual plan candidate card.
 */
const PlanCard: React.FC<PlanCardProps> = ({
  candidate,
  onSelect,
  onPreview,
  onExplain,
  showTechnicalDetails,
  isPreviewing,
  isExpanded,
  onToggleExpanded,
}) => {
  const { diffSummary, isRecommended, rank, distinguishingFeatures, score } = candidate;

  return (
    <div
      className={`plan-card ${isRecommended ? 'recommended' : ''} ${
        isPreviewing ? 'previewing' : ''
      }`}
      data-plan-id={candidate.id}
    >
      {/* Header */}
      <div className="plan-card-header">
        <div className="plan-card-rank">
          {isRecommended && <span className="badge recommended-badge">Recommended</span>}
          <span className="rank-number">Option {rank}</span>
        </div>
        <button
          className="btn btn-expand"
          onClick={onToggleExpanded}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Summary */}
      <div className="plan-card-summary">
        <p className="summary-text">{diffSummary.overallDescription}</p>
      </div>

      {/* Distinguishing Features */}
      {distinguishingFeatures.length > 0 && (
        <div className="plan-card-features">
          <h4>Key differences:</h4>
          <ul>
            {distinguishingFeatures.map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="plan-card-details">
          {/* Section-by-section breakdown */}
          {diffSummary.sectionDiffs.length > 0 && (
            <div className="section-diffs">
              <h4>Changes by section:</h4>
              <ul>
                {diffSummary.sectionDiffs.map((sectionDiff, idx) => (
                  <li key={idx}>
                    <strong>{sectionDiff.sectionName}</strong>: {formatSectionDiff(sectionDiff)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Layer-by-layer breakdown */}
          {diffSummary.layerDiffs.length > 0 && (
            <div className="layer-diffs">
              <h4>Changes by layer:</h4>
              <ul>
                {diffSummary.layerDiffs.map((layerDiff, idx) => (
                  <li key={idx}>
                    <strong>{layerDiff.layerName}</strong>: {formatLayerDiff(layerDiff)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical details (optional) */}
          {showTechnicalDetails && (
            <div className="technical-details">
              <h4>Technical details:</h4>
              <dl>
                <dt>Goal Satisfaction:</dt>
                <dd>{(score.goalSatisfaction * 100).toFixed(0)}%</dd>
                <dt>Edit Cost:</dt>
                <dd>{score.editCost.toFixed(2)}</dd>
                <dt>Constraint Risk:</dt>
                <dd>{score.constraintRisk.toFixed(2)}</dd>
                <dt>Total Score:</dt>
                <dd>{score.totalScore.toFixed(2)}</dd>
              </dl>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="plan-card-actions">
        <button
          className="btn btn-preview"
          onClick={onPreview}
          disabled={isPreviewing}
          aria-label="Preview this plan"
        >
          {isPreviewing ? 'Previewing...' : 'Preview'}
        </button>
        <button
          className="btn btn-select primary"
          onClick={onSelect}
          aria-label="Select and apply this plan"
        >
          Apply
        </button>
        <button
          className="btn btn-explain"
          onClick={onExplain}
          aria-label="Explain why this plan works"
        >
          Why?
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Main Plan Selection UI Component
// ============================================================================

/**
 * Plan selection UI: compare and choose between candidate plans.
 *
 * Design Goals (Step 260):
 * - Show diff summaries, not abstract scores
 * - Highlight key differences between candidates
 * - Make selection fast (preview → apply workflow)
 * - Support rejection if none are satisfactory
 * - Link to explanations for transparency
 *
 * @example
 * ```tsx
 * <PlanSelectionUI
 *   candidates={[plan1, plan2, plan3]}
 *   onSelectPlan={handleApply}
 *   onPreviewPlan={handlePreview}
 *   onRejectAll={handleReject}
 *   onExplainPlan={handleExplain}
 * />
 * ```
 */
export const PlanSelectionUI: React.FC<PlanSelectionUIProps> = ({
  candidates,
  onSelectPlan,
  onPreviewPlan,
  onRejectAll,
  onExplainPlan,
  showTechnicalDetails = false,
  previewingPlanId,
}) => {
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());

  // Expand the recommended plan by default
  useMemo(() => {
    const recommended = candidates.find((c) => c.isRecommended);
    if (recommended && !expandedPlanIds.has(recommended.id)) {
      setExpandedPlanIds(new Set([recommended.id]));
    }
  }, [candidates]);

  const toggleExpanded = (planId: string) => {
    setExpandedPlanIds((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) {
        next.delete(planId);
      } else {
        next.add(planId);
      }
      return next;
    });
  };

  if (candidates.length === 0) {
    return (
      <div className="plan-selection-ui empty">
        <p className="empty-message">No valid plans could be generated for this request.</p>
        <button className="btn btn-reject" onClick={onRejectAll}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="plan-selection-ui">
      {/* Header */}
      <div className="plan-selection-header">
        <h3>Choose a plan</h3>
        <p className="instruction-text">
          {candidates.length === 1
            ? "Here's the proposed change:"
            : `${candidates.length} options available. Compare and choose:`}
        </p>
      </div>

      {/* Candidate Cards */}
      <div className="plan-candidates">
        {candidates.map((candidate) => (
          <PlanCard
            key={candidate.id}
            candidate={candidate}
            onSelect={() => onSelectPlan(candidate)}
            onPreview={() => onPreviewPlan(candidate)}
            onExplain={() => onExplainPlan(candidate)}
            showTechnicalDetails={showTechnicalDetails}
            isPreviewing={previewingPlanId === candidate.id}
            isExpanded={expandedPlanIds.has(candidate.id)}
            onToggleExpanded={() => toggleExpanded(candidate.id)}
          />
        ))}
      </div>

      {/* Footer Actions */}
      <div className="plan-selection-footer">
        <button className="btn btn-reject" onClick={onRejectAll}>
          None of these work
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Compute distinguishing features between plans.
 * Identifies key differences to help users choose.
 */
export function computeDistinguishingFeatures(
  candidate: PlanCandidate,
  allCandidates: readonly PlanCandidate[]
): string[] {
  const features: string[] = [];
  const { diffSummary, plan } = candidate;

  // Compare against other candidates
  for (const other of allCandidates) {
    if (other.id === candidate.id) continue;

    // Scope differences
    if (diffSummary.scopeDescription !== other.diffSummary.scopeDescription) {
      features.push(`Affects ${diffSummary.scopeDescription}`);
    }

    // Section coverage differences
    const candidateSections = new Set(
      diffSummary.sectionDiffs.map((sd) => sd.sectionName)
    );
    const otherSections = new Set(
      other.diffSummary.sectionDiffs.map((sd) => sd.sectionName)
    );

    const uniqueSections = Array.from(candidateSections).filter(
      (s) => !otherSections.has(s)
    );
    if (uniqueSections.length > 0) {
      features.push(`Also edits ${uniqueSections.join(', ')}`);
    }

    // Layer coverage differences
    const candidateLayers = new Set(diffSummary.layerDiffs.map((ld) => ld.layerName));
    const otherLayers = new Set(other.diffSummary.layerDiffs.map((ld) => ld.layerName));

    const uniqueLayers = Array.from(candidateLayers).filter((l) => !otherLayers.has(l));
    if (uniqueLayers.length > 0) {
      features.push(`Includes ${uniqueLayers.join(', ')} changes`);
    }

    // Opcode differences
    const candidateOpcodes = new Set(plan.opcodes.map((op) => op.type));
    const otherOpcodes = new Set(other.plan.opcodes.map((op) => op.type));

    const uniqueOpcodes = Array.from(candidateOpcodes).filter(
      (op) => !otherOpcodes.has(op)
    );
    if (uniqueOpcodes.length > 0) {
      features.push(`Uses ${uniqueOpcodes.join(', ')}`);
    }
  }

  // Deduplicate and limit
  return Array.from(new Set(features)).slice(0, 3);
}

/**
 * Select top N most diverse plans for presentation.
 * Ensures candidates are distinct and cover different strategies.
 */
export function selectDiversePlans(
  scoredPlans: ReadonlyArray<{ plan: CPLPlan; score: PlanScore; diffSummary: DiffSummary }>,
  maxCandidates: number
): readonly PlanCandidate[] {
  if (scoredPlans.length === 0) return [];

  // Sort by score (best first)
  const sorted = [...scoredPlans].sort((a, b) => b.score.totalScore - a.score.totalScore);

  const selected: PlanCandidate[] = [];
  const usedStrategies = new Set<string>();

  for (let i = 0; i < sorted.length && selected.length < maxCandidates; i++) {
    const { plan, score, diffSummary } = sorted[i];

    // Compute a strategy signature for diversity
    const strategySignature = plan.opcodes
      .map((op) => op.type)
      .sort()
      .join(',');

    // Skip if we already have this strategy
    if (usedStrategies.has(strategySignature) && selected.length >= 2) {
      continue;
    }

    usedStrategies.add(strategySignature);

    const candidate: PlanCandidate = {
      id: `plan-${i}`,
      plan,
      diffSummary,
      score,
      rank: selected.length + 1,
      isRecommended: selected.length === 0,
      distinguishingFeatures: [],
    };

    selected.push(candidate);
  }

  // Compute distinguishing features after selection
  for (const candidate of selected) {
    candidate.distinguishingFeatures = computeDistinguishingFeatures(candidate, selected);
  }

  return selected;
}

// ============================================================================
// Exports
// ============================================================================

export type {
  PlanCandidate,
  PlanSelectionUIProps,
  PlanCardProps,
};
