/**
 * GOFAI NL Parser — Parse Scoring Model
 *
 * Implements a scoring model for parse selection that prefers explicit
 * scopes and safer interpretations. When the parse forest contains
 * multiple trees, the scorer ranks them to select the best interpretation.
 *
 * ## Scoring Philosophy
 *
 * 1. **Explicit over implicit**: Parses with explicit scopes, targets,
 *    and amounts are preferred over those requiring inference.
 * 2. **Safe over risky**: Parses that affect fewer elements or preserve
 *    more structure are preferred.
 * 3. **Specific over general**: Parses with narrower scope are preferred
 *    over broad, sweeping changes.
 * 4. **Priority-weighted**: Grammar rule priorities contribute to scores.
 * 5. **Deterministic**: The same forest always produces the same ranking.
 *
 * ## Score Components
 *
 * Each parse is scored on multiple dimensions:
 * - **Rule priority**: Sum of rule priorities in the tree
 * - **Explicitness**: How many slots are explicitly filled vs. inferred
 * - **Safety**: How conservative the interpretation is
 * - **Specificity**: How narrow the scope is
 * - **Parsimony**: Shorter/simpler parses preferred
 * - **Frequency**: Common interpretations preferred (based on usage data)
 *
 * @module gofai/nl/parser/parse-scoring
 * @see gofai_goalA.md Step 108
 */

import type { ForestNode, ParseForest } from './parse-forest';

// =============================================================================
// SCORE — the result of scoring a parse
// =============================================================================

/**
 * A scored parse: a parse tree with its score and breakdown.
 */
export interface ScoredParse {
  /** The parse tree */
  readonly tree: ForestNode;

  /** The overall score (0–1, higher is better) */
  readonly score: number;

  /** Score breakdown by component */
  readonly breakdown: ScoreBreakdown;

  /** Rank among all parses (1 = best) */
  readonly rank: number;

  /** Confidence level */
  readonly confidence: ParseConfidence;

  /** Whether this parse should trigger clarification */
  readonly needsClarification: boolean;

  /** Clarification reason (if needed) */
  readonly clarificationReason?: string;
}

/**
 * Breakdown of score components.
 */
export interface ScoreBreakdown {
  /** Rule priority score (weighted sum of rule priorities) */
  readonly priority: ScoreComponent;

  /** Explicitness score (how many slots are explicitly filled) */
  readonly explicitness: ScoreComponent;

  /** Safety score (how conservative the interpretation is) */
  readonly safety: ScoreComponent;

  /** Specificity score (how narrow the scope is) */
  readonly specificity: ScoreComponent;

  /** Parsimony score (simpler parses preferred) */
  readonly parsimony: ScoreComponent;

  /** Coherence score (semantic consistency) */
  readonly coherence: ScoreComponent;
}

/**
 * A single score component.
 */
export interface ScoreComponent {
  /** The component name */
  readonly name: string;

  /** Raw score (0–1) */
  readonly raw: number;

  /** Weight (importance) of this component */
  readonly weight: number;

  /** Weighted score (raw × weight) */
  readonly weighted: number;

  /** Explanation */
  readonly explanation: string;
}

/**
 * Confidence levels for parse scoring.
 */
export type ParseConfidence =
  | 'high'       // Score > 0.8 and no close alternatives
  | 'medium'     // Score > 0.6 or close alternatives exist
  | 'low'        // Score < 0.6
  | 'ambiguous'; // Multiple parses with similar scores

// =============================================================================
// SCORING CONFIGURATION
// =============================================================================

/**
 * Configuration for the parse scorer.
 */
export interface ScoringConfig {
  /** Weights for score components (must sum to 1.0) */
  readonly weights: ScoringWeights;

  /** Minimum score difference to be considered "clearly better" */
  readonly clarityThreshold: number;

  /** Score below which clarification is triggered */
  readonly clarificationThreshold: number;

  /** Maximum number of scored parses to return */
  readonly maxResults: number;

  /** Bias towards safety (0 = neutral, 1 = strongly prefer safe) */
  readonly safetyBias: number;

  /** Bias towards explicitness (0 = neutral, 1 = strongly prefer explicit) */
  readonly explicitnessBias: number;
}

export interface ScoringWeights {
  readonly priority: number;
  readonly explicitness: number;
  readonly safety: number;
  readonly specificity: number;
  readonly parsimony: number;
  readonly coherence: number;
}

/**
 * Default scoring configuration.
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: {
    priority: 0.25,
    explicitness: 0.20,
    safety: 0.20,
    specificity: 0.15,
    parsimony: 0.10,
    coherence: 0.10,
  },
  clarityThreshold: 0.15,
  clarificationThreshold: 0.5,
  maxResults: 10,
  safetyBias: 0.5,
  explicitnessBias: 0.5,
};

// =============================================================================
// SCORING ENGINE
// =============================================================================

/**
 * Score all parses in a forest and return ranked results.
 */
export function scoreForest(
  forest: ParseForest,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): readonly ScoredParse[] {
  // Collect all alternative parses
  const alternatives = collectAlternatives(forest.root);

  if (alternatives.length === 0) {
    return [];
  }

  // Score each alternative
  const scored = alternatives.map(tree => scoreSingleParse(tree, config));

  // Sort by score (descending)
  scored.sort((a, b) => b.score - a.score);

  // Assign ranks and determine clarification needs
  const results: ScoredParse[] = [];
  for (let i = 0; i < Math.min(scored.length, config.maxResults); i++) {
    const s = scored[i]!;
    const needsClarification = determineClarification(s, scored, i, config);

    const baseResult = {
      tree: s.tree,
      score: s.score,
      breakdown: s.breakdown,
      rank: i + 1,
      confidence: determineConfidence(s, scored, i, config),
      needsClarification,
    };

    if (needsClarification) {
      results.push({
        ...baseResult,
        clarificationReason: buildClarificationReason(s, scored, i),
      });
    } else {
      results.push(baseResult);
    }
  }

  return results;
}

/**
 * Collect all alternative parse trees from a forest.
 */
function collectAlternatives(node: ForestNode): readonly ForestNode[] {
  switch (node.type) {
    case 'leaf':
    case 'and':
      return [node];
    case 'or':
      return node.alternatives;
  }
}

/**
 * Score a single parse tree.
 */
function scoreSingleParse(
  tree: ForestNode,
  config: ScoringConfig,
): { tree: ForestNode; score: number; breakdown: ScoreBreakdown } {
  const priority = scorePriority(tree);
  const explicitness = scoreExplicitness(tree, config);
  const safety = scoreSafety(tree, config);
  const specificity = scoreSpecificity(tree);
  const parsimony = scoreParsimony(tree);
  const coherence = scoreCoherence(tree);

  const w = config.weights;
  const totalScore =
    priority.weighted +
    explicitness.weighted +
    safety.weighted +
    specificity.weighted +
    parsimony.weighted +
    coherence.weighted;

  // Normalize to 0-1 (weights should sum to 1, but just in case)
  const weightSum = w.priority + w.explicitness + w.safety + w.specificity + w.parsimony + w.coherence;
  const normalizedScore = weightSum > 0 ? totalScore / weightSum : 0;

  return {
    tree,
    score: Math.max(0, Math.min(1, normalizedScore)),
    breakdown: {
      priority,
      explicitness,
      safety,
      specificity,
      parsimony,
      coherence,
    },
  };
}

// =============================================================================
// SCORING FUNCTIONS — one per component
// =============================================================================

/**
 * Score based on rule priorities.
 */
function scorePriority(tree: ForestNode): ScoreComponent {
  const { total, count } = sumPriorities(tree);
  const avgPriority = count > 0 ? total / count : 0;
  // Normalize: assume priorities range from 0-20
  const raw = Math.min(1, avgPriority / 20);

  return {
    name: 'priority',
    raw,
    weight: DEFAULT_SCORING_CONFIG.weights.priority,
    weighted: raw * DEFAULT_SCORING_CONFIG.weights.priority,
    explanation: `Average rule priority: ${avgPriority.toFixed(1)} (${count} rules)`,
  };
}

function sumPriorities(node: ForestNode): { total: number; count: number } {
  switch (node.type) {
    case 'leaf':
      return { total: 0, count: 0 };
    case 'and': {
      let total = node.priority;
      let count = 1;
      for (const child of node.children) {
        const sub = sumPriorities(child);
        total += sub.total;
        count += sub.count;
      }
      return { total, count };
    }
    case 'or': {
      // Use best alternative
      let best = { total: 0, count: 0 };
      for (const alt of node.alternatives) {
        const sub = sumPriorities(alt);
        if (sub.count === 0 || sub.total / sub.count > (best.count === 0 ? -1 : best.total / best.count)) {
          best = sub;
        }
      }
      return best;
    }
  }
}

/**
 * Score based on explicitness (how many slots are filled explicitly).
 */
function scoreExplicitness(tree: ForestNode, config: ScoringConfig): ScoreComponent {
  const { explicit, inferred } = countExplicitness(tree);
  const total = explicit + inferred;
  const raw = total > 0 ? explicit / total : 1;
  const biased = raw + (1 - raw) * config.explicitnessBias * 0.5;
  const clampedRaw = Math.min(1, biased);

  return {
    name: 'explicitness',
    raw: clampedRaw,
    weight: config.weights.explicitness,
    weighted: clampedRaw * config.weights.explicitness,
    explanation: `${explicit} explicit, ${inferred} inferred slots`,
  };
}

function countExplicitness(node: ForestNode): { explicit: number; inferred: number } {
  switch (node.type) {
    case 'leaf':
      return { explicit: 1, inferred: 0 };
    case 'and': {
      let explicit = 0;
      let inferred = 0;
      // Rules with semantic actions that include "infer" or "default" count as inferred
      if (node.semanticAction && /infer|default|implicit/i.test(node.semanticAction)) {
        inferred++;
      } else {
        explicit++;
      }
      for (const child of node.children) {
        const sub = countExplicitness(child);
        explicit += sub.explicit;
        inferred += sub.inferred;
      }
      return { explicit, inferred };
    }
    case 'or':
      // Use first alternative
      if (node.alternatives.length > 0) {
        return countExplicitness(node.alternatives[0]!);
      }
      return { explicit: 0, inferred: 0 };
  }
}

/**
 * Score based on safety (prefer conservative interpretations).
 */
function scoreSafety(tree: ForestNode, config: ScoringConfig): ScoreComponent {
  const depth = treeDepth(tree);
  const nodeCount = countNodes(tree);

  // Deeper/larger trees imply more complex operations = less safe
  // Normalize: trees > 20 nodes are considered "risky"
  const sizePenalty = Math.max(0, 1 - nodeCount / 40);
  const depthPenalty = Math.max(0, 1 - depth / 10);
  const raw = (sizePenalty + depthPenalty) / 2;
  const biased = raw + (1 - raw) * config.safetyBias * 0.3;
  const clampedRaw = Math.min(1, biased);

  return {
    name: 'safety',
    raw: clampedRaw,
    weight: config.weights.safety,
    weighted: clampedRaw * config.weights.safety,
    explanation: `${nodeCount} nodes, depth ${depth}`,
  };
}

/**
 * Score based on specificity (prefer narrow scope).
 */
function scoreSpecificity(tree: ForestNode): ScoreComponent {
  // Heuristic: trees with more leaf nodes (tokens consumed) are more specific
  const leaves = countLeaves(tree);
  const total = countNodes(tree);
  const raw = total > 0 ? leaves / total : 0;

  return {
    name: 'specificity',
    raw,
    weight: DEFAULT_SCORING_CONFIG.weights.specificity,
    weighted: raw * DEFAULT_SCORING_CONFIG.weights.specificity,
    explanation: `${leaves} leaves out of ${total} nodes`,
  };
}

/**
 * Score based on parsimony (prefer simpler parses).
 */
function scoreParsimony(tree: ForestNode): ScoreComponent {
  const nodes = countNodes(tree);
  // Fewer nodes = simpler = better
  // Normalize: 1-20 nodes is normal range
  const raw = Math.max(0, 1 - (nodes - 1) / 30);

  return {
    name: 'parsimony',
    raw,
    weight: DEFAULT_SCORING_CONFIG.weights.parsimony,
    weighted: raw * DEFAULT_SCORING_CONFIG.weights.parsimony,
    explanation: `${nodes} total nodes (simpler is better)`,
  };
}

/**
 * Score based on coherence (semantic consistency).
 */
function scoreCoherence(tree: ForestNode): ScoreComponent {
  // Simple heuristic: consistent rule sources
  const sources = collectRuleSources(tree);
  const uniqueSources = new Set(sources);
  const raw = uniqueSources.size > 0 ? 1 / uniqueSources.size : 1;

  return {
    name: 'coherence',
    raw,
    weight: DEFAULT_SCORING_CONFIG.weights.coherence,
    weighted: raw * DEFAULT_SCORING_CONFIG.weights.coherence,
    explanation: `${uniqueSources.size} distinct rule source(s)`,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function treeDepth(node: ForestNode): number {
  switch (node.type) {
    case 'leaf': return 1;
    case 'and': {
      let max = 0;
      for (const child of node.children) {
        const d = treeDepth(child);
        if (d > max) max = d;
      }
      return max + 1;
    }
    case 'or': {
      let max = 0;
      for (const alt of node.alternatives) {
        const d = treeDepth(alt);
        if (d > max) max = d;
      }
      return max;
    }
  }
}

function countNodes(node: ForestNode): number {
  switch (node.type) {
    case 'leaf': return 1;
    case 'and': {
      let count = 1;
      for (const child of node.children) count += countNodes(child);
      return count;
    }
    case 'or': {
      let count = 1;
      for (const alt of node.alternatives) count += countNodes(alt);
      return count;
    }
  }
}

function countLeaves(node: ForestNode): number {
  switch (node.type) {
    case 'leaf': return 1;
    case 'and': {
      let count = 0;
      for (const child of node.children) count += countLeaves(child);
      return count;
    }
    case 'or': {
      let count = 0;
      for (const alt of node.alternatives) count += countLeaves(alt);
      return count;
    }
  }
}

function collectRuleSources(node: ForestNode): readonly string[] {
  const sources: string[] = [];
  function walk(n: ForestNode): void {
    if (n.type === 'and') {
      sources.push(n.ruleId.split(':')[0] ?? n.ruleId);
      for (const child of n.children) walk(child);
    } else if (n.type === 'or') {
      for (const alt of n.alternatives) walk(alt);
    }
  }
  walk(node);
  return sources;
}

// =============================================================================
// CLARIFICATION LOGIC
// =============================================================================

/**
 * Determine if clarification is needed.
 */
function determineClarification(
  scored: { score: number },
  allScored: readonly { score: number }[],
  index: number,
  config: ScoringConfig,
): boolean {
  // Low score
  if (scored.score < config.clarificationThreshold) return true;

  // Close competitor
  if (index === 0 && allScored.length > 1) {
    const second = allScored[1]!;
    const gap = scored.score - second.score;
    if (gap < config.clarityThreshold) return true;
  }

  return false;
}

/**
 * Determine confidence level.
 */
function determineConfidence(
  scored: { score: number },
  allScored: readonly { score: number }[],
  index: number,
  config: ScoringConfig,
): ParseConfidence {
  if (scored.score >= 0.8) {
    if (index === 0 && allScored.length > 1) {
      const gap = scored.score - allScored[1]!.score;
      if (gap < config.clarityThreshold) return 'ambiguous';
    }
    return 'high';
  }
  if (scored.score >= 0.6) return 'medium';
  if (index === 0 && allScored.length > 1 && allScored[1]!.score > scored.score * 0.8) {
    return 'ambiguous';
  }
  return 'low';
}

/**
 * Build a clarification reason string.
 */
function buildClarificationReason(
  _scored: { score: number },
  allScored: readonly { score: number; tree: ForestNode }[],
  index: number,
): string {
  if (index === 0 && allScored.length > 1) {
    const gap = allScored[0]!.score - allScored[1]!.score;
    if (gap < 0.15) {
      return `Two interpretations have similar scores (${allScored[0]!.score.toFixed(2)} vs ${allScored[1]!.score.toFixed(2)}). Please clarify your intent.`;
    }
  }
  return 'This interpretation has low confidence. Please rephrase or be more specific.';
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format scored parses for display.
 */
export function formatScoredParses(parses: readonly ScoredParse[]): string {
  if (parses.length === 0) return 'No parses scored.';

  const lines: string[] = [];
  for (const p of parses) {
    const pct = (p.score * 100).toFixed(1);
    const conf = p.confidence;
    const clar = p.needsClarification ? ' [CLARIFY]' : '';
    lines.push(`#${p.rank}: ${pct}% (${conf})${clar}`);
    lines.push(formatScoreBreakdownShort(p.breakdown));
    if (p.clarificationReason) {
      lines.push(`  Reason: ${p.clarificationReason}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format a score breakdown as a compact string.
 */
function formatScoreBreakdownShort(b: ScoreBreakdown): string {
  const parts = [
    `pri=${(b.priority.raw * 100).toFixed(0)}%`,
    `exp=${(b.explicitness.raw * 100).toFixed(0)}%`,
    `safe=${(b.safety.raw * 100).toFixed(0)}%`,
    `spec=${(b.specificity.raw * 100).toFixed(0)}%`,
    `pars=${(b.parsimony.raw * 100).toFixed(0)}%`,
    `coh=${(b.coherence.raw * 100).toFixed(0)}%`,
  ];
  return `  [${parts.join(', ')}]`;
}

/**
 * Format a full score breakdown.
 */
export function formatScoreBreakdown(b: ScoreBreakdown): string {
  const lines = [
    `  Priority:     ${(b.priority.raw * 100).toFixed(1)}% × ${b.priority.weight} = ${(b.priority.weighted * 100).toFixed(1)}%  — ${b.priority.explanation}`,
    `  Explicitness: ${(b.explicitness.raw * 100).toFixed(1)}% × ${b.explicitness.weight} = ${(b.explicitness.weighted * 100).toFixed(1)}%  — ${b.explicitness.explanation}`,
    `  Safety:       ${(b.safety.raw * 100).toFixed(1)}% × ${b.safety.weight} = ${(b.safety.weighted * 100).toFixed(1)}%  — ${b.safety.explanation}`,
    `  Specificity:  ${(b.specificity.raw * 100).toFixed(1)}% × ${b.specificity.weight} = ${(b.specificity.weighted * 100).toFixed(1)}%  — ${b.specificity.explanation}`,
    `  Parsimony:    ${(b.parsimony.raw * 100).toFixed(1)}% × ${b.parsimony.weight} = ${(b.parsimony.weighted * 100).toFixed(1)}%  — ${b.parsimony.explanation}`,
    `  Coherence:    ${(b.coherence.raw * 100).toFixed(1)}% × ${b.coherence.weight} = ${(b.coherence.weighted * 100).toFixed(1)}%  — ${b.coherence.explanation}`,
  ];
  return lines.join('\n');
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const PARSE_SCORING_RULES = [
  'Rule SCORE-001: Parses are scored on six dimensions: priority, explicitness, ' +
  'safety, specificity, parsimony, and coherence. Each has a configurable weight.',

  'Rule SCORE-002: Explicitness is preferred: parses where the user explicitly ' +
  'named targets, scopes, and amounts score higher than those requiring inference.',

  'Rule SCORE-003: Safety is preferred: parses that affect fewer elements or ' +
  'represent smaller changes score higher. The safety bias is configurable.',

  'Rule SCORE-004: When two parses have similar scores (within clarityThreshold), ' +
  'clarification is triggered rather than guessing.',

  'Rule SCORE-005: Parse confidence is classified as high, medium, low, or ' +
  'ambiguous based on score magnitude and gap to alternatives.',

  'Rule SCORE-006: Rule priorities from the grammar contribute to the priority ' +
  'score component. Higher-priority rules indicate preferred interpretations.',

  'Rule SCORE-007: Parsimony prefers simpler parses (fewer nodes). This prevents ' +
  'over-parsing where unnecessary structure is added.',

  'Rule SCORE-008: Coherence checks that the parse uses rules from consistent ' +
  'sources (e.g., all from the imperative grammar, not mixed).',

  'Rule SCORE-009: The scorer is deterministic: the same forest and config ' +
  'always produce the same ranking.',

  'Rule SCORE-010: Clarification reasons are human-readable and include the ' +
  'competing scores so the user understands why.',

  'Rule SCORE-011: The scoring config can be tuned per-session or per-board ' +
  'to adjust the safety/explicitness tradeoff.',

  'Rule SCORE-012: At most maxResults parses are returned. This bounds the ' +
  'amount of work done by downstream processing.',
] as const;
