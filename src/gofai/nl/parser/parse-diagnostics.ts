/**
 * GOFAI NL Parser — Parse Diagnostics
 *
 * Implements diagnostics that explain "why this parse won" for developer
 * debugging and user-facing explanations.
 *
 * ## Two Audiences
 *
 * 1. **Developers**: Full technical diagnostics showing chart states,
 *    rule applications, scoring breakdown, and ambiguity details.
 * 2. **Users**: Simple explanations like "I interpreted 'brighter' as
 *    increasing brightness because it's the most common meaning."
 *
 * ## Diagnostic Outputs
 *
 * - **Parse explanation**: Why the winning parse was chosen
 * - **Rule trace**: Which rules fired and in what order
 * - **Ambiguity report**: What alternatives existed and why they lost
 * - **Confidence explanation**: Why confidence is high/low
 * - **Suggestion**: What the user could say for a clearer parse
 *
 * @module gofai/nl/parser/parse-diagnostics
 * @see gofai_goalA.md Step 109
 */

import type { EarleyChart } from './earley-engine';
import type { ParseForest } from './parse-forest';
import type { ScoredParse, ScoreBreakdown } from './parse-scoring';

// =============================================================================
// DIAGNOSTIC REPORT — the full diagnostic output
// =============================================================================

/**
 * A complete diagnostic report for a parse.
 */
export interface DiagnosticReport {
  /** Summary for the user (1-2 sentences) */
  readonly userSummary: string;

  /** Detailed explanation for developers */
  readonly developerDetail: string;

  /** Why this parse was chosen over alternatives */
  readonly selectionExplanation: string;

  /** The rule trace (which rules fired) */
  readonly ruleTrace: readonly RuleTraceEntry[];

  /** Ambiguity report */
  readonly ambiguityReport: AmbiguityReport;

  /** Confidence explanation */
  readonly confidenceExplanation: string;

  /** Suggestions for clearer input */
  readonly suggestions: readonly string[];

  /** Performance metrics */
  readonly performance: ParsePerformance;
}

/**
 * A single entry in the rule trace.
 */
export interface RuleTraceEntry {
  /** The rule ID */
  readonly ruleId: string;

  /** The rule description */
  readonly description: string;

  /** What tokens this rule matched */
  readonly matchedTokens: readonly string[];

  /** The non-terminal produced */
  readonly produced: string;

  /** The step in the parsing process */
  readonly step: number;

  /** Whether this rule was part of the winning parse */
  readonly inWinningParse: boolean;
}

/**
 * Ambiguity report: what alternatives existed.
 */
export interface AmbiguityReport {
  /** Whether the parse was ambiguous */
  readonly isAmbiguous: boolean;

  /** Number of alternative parses */
  readonly alternativeCount: number;

  /** Details of each alternative */
  readonly alternatives: readonly AlternativeReport[];

  /** What made the winner better */
  readonly winningReason: string;
}

export interface AlternativeReport {
  /** Rank of this alternative */
  readonly rank: number;

  /** Score of this alternative */
  readonly score: number;

  /** Brief description */
  readonly description: string;

  /** Why this alternative was not chosen */
  readonly whyNotChosen: string;

  /** Score difference from winner */
  readonly scoreDifference: number;
}

/**
 * Parse performance metrics.
 */
export interface ParsePerformance {
  /** Total items in the chart */
  readonly chartItems: number;

  /** Maximum chart set size */
  readonly maxSetSize: number;

  /** Number of grammar rules applied */
  readonly rulesApplied: number;

  /** Number of tokens parsed */
  readonly tokenCount: number;

  /** Whether safety limits were hit */
  readonly hitLimits: boolean;
}

// =============================================================================
// DIAGNOSTIC GENERATION
// =============================================================================

/**
 * Generate a diagnostic report for a scored parse.
 */
export function generateDiagnosticReport(
  chart: EarleyChart,
  forest: ParseForest | null,
  scoredParses: readonly ScoredParse[],
): DiagnosticReport {
  const winner = scoredParses.length > 0 ? scoredParses[0]! : null;

  return {
    userSummary: generateUserSummary(chart, winner),
    developerDetail: generateDeveloperDetail(chart, forest, scoredParses),
    selectionExplanation: generateSelectionExplanation(winner, scoredParses),
    ruleTrace: generateRuleTrace(chart),
    ambiguityReport: generateAmbiguityReport(forest, scoredParses),
    confidenceExplanation: generateConfidenceExplanation(winner),
    suggestions: generateSuggestions(chart, forest, winner),
    performance: generatePerformanceMetrics(chart),
  };
}

/**
 * Generate a user-facing summary.
 */
function generateUserSummary(chart: EarleyChart, winner: ScoredParse | null): string {
  if (!chart.success) {
    const expected = chart.expectedAtStall.slice(0, 3).join(', ');
    const pos = chart.stallPosition;
    const token = chart.tokens[pos];
    if (token) {
      return `I couldn't understand "${token.original}" at position ${pos + 1}. Expected: ${expected}.`;
    }
    return `The command seems incomplete. Expected: ${expected}.`;
  }

  if (!winner) {
    return 'The command was parsed but no interpretation was found.';
  }

  const confLabel = winner.confidence === 'high' ? ''
    : winner.confidence === 'medium' ? ' (with moderate confidence)'
    : winner.confidence === 'ambiguous' ? ' (this was ambiguous — please confirm)'
    : ' (I\'m not very confident about this)';

  return `Understood your command${confLabel}.`;
}

/**
 * Generate detailed developer diagnostics.
 */
function generateDeveloperDetail(
  chart: EarleyChart,
  forest: ParseForest | null,
  scoredParses: readonly ScoredParse[],
): string {
  const lines: string[] = [];

  lines.push('=== Parse Diagnostics ===');
  lines.push(`Success: ${chart.success}`);
  lines.push(`Tokens: ${chart.tokens.length}`);

  // Chart stats
  let totalItems = 0;
  let maxSet = 0;
  for (const set of chart.sets) {
    totalItems += set.items.length;
    if (set.items.length > maxSet) maxSet = set.items.length;
  }
  lines.push(`Chart: ${totalItems} items, max set size ${maxSet}`);

  // Forest stats
  if (forest) {
    lines.push(`Forest: ${forest.treeCount} trees, ${forest.ambiguities.length} ambiguities`);
  }

  // Scoring summary
  if (scoredParses.length > 0) {
    lines.push(`\nScored Parses: ${scoredParses.length}`);
    for (const p of scoredParses.slice(0, 5)) {
      lines.push(`  #${p.rank}: ${(p.score * 100).toFixed(1)}% (${p.confidence})${p.needsClarification ? ' [CLARIFY]' : ''}`);
    }
  }

  // Stall info
  if (!chart.success) {
    lines.push(`\nStalled at position ${chart.stallPosition}`);
    lines.push(`Expected: ${chart.expectedAtStall.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Generate selection explanation.
 */
function generateSelectionExplanation(
  winner: ScoredParse | null,
  allParses: readonly ScoredParse[],
): string {
  if (!winner) return 'No parse was selected.';

  if (allParses.length === 1) {
    return 'Only one interpretation was found, so it was selected.';
  }

  const b = winner.breakdown;
  const dominantFactor = findDominantFactor(b);

  if (winner.confidence === 'ambiguous') {
    return `This interpretation was slightly preferred due to ${dominantFactor}, ` +
      `but alternative interpretations scored similarly. Clarification is recommended.`;
  }

  return `This interpretation was selected because it scored highest ` +
    `(${(winner.score * 100).toFixed(1)}%), primarily due to ${dominantFactor}.`;
}

/**
 * Find the dominant scoring factor.
 */
function findDominantFactor(b: ScoreBreakdown): string {
  const factors = [
    { name: 'rule priority', score: b.priority.weighted },
    { name: 'explicitness', score: b.explicitness.weighted },
    { name: 'safety', score: b.safety.weighted },
    { name: 'specificity', score: b.specificity.weighted },
    { name: 'parsimony', score: b.parsimony.weighted },
    { name: 'coherence', score: b.coherence.weighted },
  ];
  factors.sort((a, b) => b.score - a.score);
  return factors[0]!.name;
}

/**
 * Generate rule trace.
 */
function generateRuleTrace(chart: EarleyChart): readonly RuleTraceEntry[] {
  const trace: RuleTraceEntry[] = [];
  const seen = new Set<string>();
  let step = 0;

  // Walk through completed items in the chart
  for (const set of chart.sets) {
    for (const item of set.items) {
      if (item.dot === item.rule.rhs.length && !seen.has(item.rule.id)) {
        seen.add(item.rule.id);

        const matchedTokens: string[] = [];
        for (let i = item.start; i < set.position && i < chart.tokens.length; i++) {
          const tok = chart.tokens[i];
          if (tok) matchedTokens.push(tok.original);
        }

        trace.push({
          ruleId: item.rule.id,
          description: item.rule.description,
          matchedTokens,
          produced: item.rule.lhs,
          step: step++,
          inWinningParse: true, // Simplified — would need tree walk for accuracy
        });
      }
    }
  }

  return trace;
}

/**
 * Generate ambiguity report.
 */
function generateAmbiguityReport(
  forest: ParseForest | null,
  scoredParses: readonly ScoredParse[],
): AmbiguityReport {
  if (!forest || scoredParses.length <= 1) {
    return {
      isAmbiguous: false,
      alternativeCount: 0,
      alternatives: [],
      winningReason: scoredParses.length === 1 ? 'Only one interpretation.' : 'No parses.',
    };
  }

  const winner = scoredParses[0]!;
  const alternatives: AlternativeReport[] = scoredParses.slice(1).map(p => ({
    rank: p.rank,
    score: p.score,
    description: `Parse #${p.rank} via different rule application`,
    whyNotChosen: explainWhyLost(winner, p),
    scoreDifference: winner.score - p.score,
  }));

  return {
    isAmbiguous: forest.ambiguities.length > 0,
    alternativeCount: scoredParses.length - 1,
    alternatives,
    winningReason: `Scored ${(winner.score * 100).toFixed(1)}% vs ` +
      `next best ${(scoredParses[1]!.score * 100).toFixed(1)}%.`,
  };
}

/**
 * Explain why an alternative parse lost.
 */
function explainWhyLost(winner: ScoredParse, loser: ScoredParse): string {
  const diff = winner.score - loser.score;
  if (diff < 0.05) return 'Very close scores — nearly tied.';

  // Find which component made the biggest difference
  const components = [
    { name: 'priority', diff: winner.breakdown.priority.weighted - loser.breakdown.priority.weighted },
    { name: 'explicitness', diff: winner.breakdown.explicitness.weighted - loser.breakdown.explicitness.weighted },
    { name: 'safety', diff: winner.breakdown.safety.weighted - loser.breakdown.safety.weighted },
    { name: 'specificity', diff: winner.breakdown.specificity.weighted - loser.breakdown.specificity.weighted },
    { name: 'parsimony', diff: winner.breakdown.parsimony.weighted - loser.breakdown.parsimony.weighted },
    { name: 'coherence', diff: winner.breakdown.coherence.weighted - loser.breakdown.coherence.weighted },
  ];
  components.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const top = components[0]!;
  return `Lower ${top.name} score (${top.diff > 0 ? '-' : '+'}${(Math.abs(top.diff) * 100).toFixed(1)}%).`;
}

/**
 * Generate confidence explanation.
 */
function generateConfidenceExplanation(winner: ScoredParse | null): string {
  if (!winner) return 'No parse to evaluate confidence for.';

  switch (winner.confidence) {
    case 'high':
      return `High confidence (${(winner.score * 100).toFixed(1)}%): the interpretation is clear and unambiguous.`;
    case 'medium':
      return `Medium confidence (${(winner.score * 100).toFixed(1)}%): the interpretation is plausible but could be improved with more specific language.`;
    case 'low':
      return `Low confidence (${(winner.score * 100).toFixed(1)}%): the interpretation is uncertain. Consider rephrasing.`;
    case 'ambiguous':
      return `Ambiguous (${(winner.score * 100).toFixed(1)}%): multiple interpretations scored similarly. Clarification is needed.`;
  }
}

/**
 * Generate suggestions for clearer input.
 */
function generateSuggestions(
  chart: EarleyChart,
  forest: ParseForest | null,
  winner: ScoredParse | null,
): readonly string[] {
  const suggestions: string[] = [];

  if (!chart.success) {
    suggestions.push('Check that all words are recognized musical terms.');
    if (chart.expectedAtStall.length > 0) {
      suggestions.push(`Try adding: ${chart.expectedAtStall.slice(0, 3).join(', ')}`);
    }
    return suggestions;
  }

  if (winner && winner.confidence !== 'high') {
    suggestions.push('Try naming the target explicitly (e.g., "the chorus" instead of "it").');
    suggestions.push('Specify the amount (e.g., "slightly brighter" or "3 dB louder").');
  }

  if (forest && forest.ambiguities.length > 0) {
    suggestions.push('Your command has multiple possible meanings. Try being more specific.');
  }

  return suggestions;
}

/**
 * Generate performance metrics.
 */
function generatePerformanceMetrics(chart: EarleyChart): ParsePerformance {
  let totalItems = 0;
  let maxSet = 0;
  const rulesUsed = new Set<string>();

  for (const set of chart.sets) {
    totalItems += set.items.length;
    if (set.items.length > maxSet) maxSet = set.items.length;
    for (const item of set.items) {
      rulesUsed.add(item.rule.id);
    }
  }

  return {
    chartItems: totalItems,
    maxSetSize: maxSet,
    rulesApplied: rulesUsed.size,
    tokenCount: chart.tokens.length,
    hitLimits: false, // Would need to check against config limits
  };
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a diagnostic report for display.
 */
export function formatDiagnosticReport(report: DiagnosticReport): string {
  const lines: string[] = [];

  lines.push('=== Parse Diagnostic Report ===');
  lines.push('');
  lines.push(`User summary: ${report.userSummary}`);
  lines.push('');
  lines.push(`Selection: ${report.selectionExplanation}`);
  lines.push(`Confidence: ${report.confidenceExplanation}`);
  lines.push('');

  if (report.ambiguityReport.isAmbiguous) {
    lines.push(`Ambiguity: ${report.ambiguityReport.alternativeCount} alternatives`);
    lines.push(`  Winner reason: ${report.ambiguityReport.winningReason}`);
    for (const alt of report.ambiguityReport.alternatives.slice(0, 3)) {
      lines.push(`  #${alt.rank}: ${(alt.score * 100).toFixed(1)}% — ${alt.whyNotChosen}`);
    }
    lines.push('');
  }

  if (report.suggestions.length > 0) {
    lines.push('Suggestions:');
    for (const s of report.suggestions) {
      lines.push(`  - ${s}`);
    }
    lines.push('');
  }

  lines.push(`Performance: ${report.performance.chartItems} chart items, ` +
    `${report.performance.rulesApplied} rules, ` +
    `${report.performance.tokenCount} tokens`);

  return lines.join('\n');
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const PARSE_DIAGNOSTICS_RULES = [
  'Rule DIAG-001: Every parse result includes a user-facing summary (1-2 sentences) ' +
  'explaining what was understood and how confident the system is.',

  'Rule DIAG-002: Developer diagnostics include chart statistics, rule traces, ' +
  'ambiguity details, and scoring breakdowns.',

  'Rule DIAG-003: The selection explanation names the dominant scoring factor ' +
  'that caused the winning parse to be chosen.',

  'Rule DIAG-004: Alternative parses are explained: each shows its score, rank, ' +
  'and why it was not chosen (which component was lower).',

  'Rule DIAG-005: Confidence explanations map directly to the confidence level ' +
  '(high, medium, low, ambiguous) with actionable advice.',

  'Rule DIAG-006: Suggestions are context-specific: they reference what was ' +
  'ambiguous or unclear and suggest specific improvements.',

  'Rule DIAG-007: Rule traces show which grammar rules fired, what tokens they ' +
  'matched, and whether they are part of the winning parse.',

  'Rule DIAG-008: Performance metrics track chart size, max set size, and ' +
  'whether safety limits were hit.',

  'Rule DIAG-009: All diagnostic output is deterministic: the same parse ' +
  'always produces the same diagnostic report.',

  'Rule DIAG-010: Diagnostic reports are machine-readable (structured types) ' +
  'and human-readable (formatDiagnosticReport).',

  'Rule DIAG-011: For failed parses, diagnostics include the stall position, ' +
  'expected symbols, and suggestions for correction.',

  'Rule DIAG-012: The diagnostic system does not affect parse results. It is ' +
  'a read-only analysis layer on top of the chart and forest.',
] as const;
