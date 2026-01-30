/**
 * GOFAI Infrastructure — Success Metrics
 *
 * Step 020 from gofai_goalB.md: "Define success metrics: semantic reliability
 * under paraphrase, constraint correctness, edit reversibility, workflow speed,
 * user trust."
 *
 * @module gofai/infra/success-metrics
 */

// =============================================================================
// Metric Categories
// =============================================================================

/**
 * A success metric definition.
 */
export interface SuccessMetric {
  /** Stable metric ID */
  readonly id: MetricId;

  /** Display name */
  readonly name: string;

  /** Category */
  readonly category: MetricCategory;

  /** Description */
  readonly description: string;

  /** How to measure this metric */
  readonly measurement: string;

  /** Target value (what we aim for) */
  readonly target: MetricTarget;

  /** Minimum acceptable value */
  readonly minimumAcceptable: MetricTarget;

  /** Unit of measurement */
  readonly unit: string;

  /** Whether this metric blocks release */
  readonly blocksRelease: boolean;

  /** How often to measure */
  readonly frequency: 'per-commit' | 'per-release' | 'weekly' | 'manual';
}

/**
 * Metric IDs.
 */
export type MetricId =
  | 'paraphrase_invariance_rate'
  | 'constraint_correctness_rate'
  | 'edit_reversibility_rate'
  | 'parse_success_rate'
  | 'clarification_precision'
  | 'planning_determinism'
  | 'pipeline_latency_p50'
  | 'pipeline_latency_p95'
  | 'undo_roundtrip_fidelity'
  | 'scope_accuracy'
  | 'user_trust_preview_acceptance'
  | 'clarification_load'
  | 'coverage_lexicon'
  | 'coverage_grammar'
  | 'golden_suite_pass_rate';

/**
 * Metric categories.
 */
export type MetricCategory =
  | 'semantic_reliability'
  | 'constraint_safety'
  | 'reversibility'
  | 'performance'
  | 'user_trust'
  | 'coverage';

/**
 * Target value for a metric.
 */
export interface MetricTarget {
  /** Numeric value */
  readonly value: number;

  /** Comparison direction */
  readonly direction: 'higher_is_better' | 'lower_is_better';
}

// =============================================================================
// Defined Metrics
// =============================================================================

/**
 * All GOFAI success metrics.
 */
export const GOFAI_SUCCESS_METRICS: readonly SuccessMetric[] = [
  {
    id: 'paraphrase_invariance_rate',
    name: 'Paraphrase Invariance Rate',
    category: 'semantic_reliability',
    description: 'Percentage of paraphrase pairs that produce identical CPL-Intent',
    measurement: 'Run paraphrase test suite; count matching CPL outputs / total pairs',
    target: { value: 0.95, direction: 'higher_is_better' },
    minimumAcceptable: { value: 0.85, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: true,
    frequency: 'per-commit',
  },
  {
    id: 'constraint_correctness_rate',
    name: 'Constraint Correctness Rate',
    category: 'constraint_safety',
    description: 'Percentage of executed plans that satisfy all declared constraints',
    measurement: 'Run constraint verification after every plan execution in test suite',
    target: { value: 1.0, direction: 'higher_is_better' },
    minimumAcceptable: { value: 1.0, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: true,
    frequency: 'per-commit',
  },
  {
    id: 'edit_reversibility_rate',
    name: 'Edit Reversibility Rate',
    category: 'reversibility',
    description: 'Percentage of edits where undo restores exact original state',
    measurement: 'apply → undo → compare state fingerprints; count matches / total',
    target: { value: 1.0, direction: 'higher_is_better' },
    minimumAcceptable: { value: 1.0, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: true,
    frequency: 'per-commit',
  },
  {
    id: 'parse_success_rate',
    name: 'Parse Success Rate',
    category: 'semantic_reliability',
    description: 'Percentage of valid utterances that produce at least one parse tree',
    measurement: 'Run golden utterance corpus; count successful parses / total',
    target: { value: 0.98, direction: 'higher_is_better' },
    minimumAcceptable: { value: 0.90, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: true,
    frequency: 'per-commit',
  },
  {
    id: 'clarification_precision',
    name: 'Clarification Precision',
    category: 'semantic_reliability',
    description: 'Percentage of clarification questions that are genuinely necessary',
    measurement: 'Expert review of triggered clarifications; count correct / total',
    target: { value: 0.90, direction: 'higher_is_better' },
    minimumAcceptable: { value: 0.80, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: false,
    frequency: 'per-release',
  },
  {
    id: 'planning_determinism',
    name: 'Planning Determinism',
    category: 'semantic_reliability',
    description: 'Percentage of plans identical across repeated execution with same input',
    measurement: 'Run each golden fixture twice; compare plan fingerprints',
    target: { value: 1.0, direction: 'higher_is_better' },
    minimumAcceptable: { value: 1.0, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: true,
    frequency: 'per-commit',
  },
  {
    id: 'pipeline_latency_p50',
    name: 'Pipeline Latency (p50)',
    category: 'performance',
    description: 'Median end-to-end pipeline latency for typical utterances',
    measurement: 'Time full pipeline on golden corpus; compute p50',
    target: { value: 100, direction: 'lower_is_better' },
    minimumAcceptable: { value: 250, direction: 'lower_is_better' },
    unit: 'milliseconds',
    blocksRelease: false,
    frequency: 'per-release',
  },
  {
    id: 'pipeline_latency_p95',
    name: 'Pipeline Latency (p95)',
    category: 'performance',
    description: '95th percentile end-to-end pipeline latency',
    measurement: 'Time full pipeline on golden corpus; compute p95',
    target: { value: 250, direction: 'lower_is_better' },
    minimumAcceptable: { value: 500, direction: 'lower_is_better' },
    unit: 'milliseconds',
    blocksRelease: true,
    frequency: 'per-release',
  },
  {
    id: 'undo_roundtrip_fidelity',
    name: 'Undo Roundtrip Fidelity',
    category: 'reversibility',
    description: 'Percentage of apply→undo→redo sequences that produce identical state',
    measurement: 'apply, undo, redo, compare state to post-apply state',
    target: { value: 1.0, direction: 'higher_is_better' },
    minimumAcceptable: { value: 1.0, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: true,
    frequency: 'per-commit',
  },
  {
    id: 'scope_accuracy',
    name: 'Scope Accuracy',
    category: 'semantic_reliability',
    description: 'Percentage of operations that affect only entities within declared scope',
    measurement: 'After execution, verify diff touches only in-scope entities',
    target: { value: 1.0, direction: 'higher_is_better' },
    minimumAcceptable: { value: 1.0, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: true,
    frequency: 'per-commit',
  },
  {
    id: 'user_trust_preview_acceptance',
    name: 'Preview Acceptance Rate',
    category: 'user_trust',
    description: 'Percentage of previewed plans that users accept without modification',
    measurement: 'Track preview→apply vs preview→modify→apply in user sessions',
    target: { value: 0.80, direction: 'higher_is_better' },
    minimumAcceptable: { value: 0.60, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: false,
    frequency: 'manual',
  },
  {
    id: 'clarification_load',
    name: 'Clarification Load',
    category: 'user_trust',
    description: 'Average number of clarification questions per successful edit',
    measurement: 'Count clarification rounds / successful edits across sessions',
    target: { value: 0.3, direction: 'lower_is_better' },
    minimumAcceptable: { value: 1.0, direction: 'lower_is_better' },
    unit: 'questions per edit',
    blocksRelease: false,
    frequency: 'manual',
  },
  {
    id: 'coverage_lexicon',
    name: 'Lexicon Coverage',
    category: 'coverage',
    description: 'Percentage of common music terms that have lexeme entries',
    measurement: 'Compare lexeme table against reference term list',
    target: { value: 0.95, direction: 'higher_is_better' },
    minimumAcceptable: { value: 0.80, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: false,
    frequency: 'per-release',
  },
  {
    id: 'coverage_grammar',
    name: 'Grammar Coverage',
    category: 'coverage',
    description: 'Percentage of common construction patterns that have grammar rules',
    measurement: 'Compare grammar rules against reference construction list',
    target: { value: 0.90, direction: 'higher_is_better' },
    minimumAcceptable: { value: 0.75, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: false,
    frequency: 'per-release',
  },
  {
    id: 'golden_suite_pass_rate',
    name: 'Golden Suite Pass Rate',
    category: 'semantic_reliability',
    description: 'Percentage of golden NL→CPL test cases that pass',
    measurement: 'Run golden suite; count passing / total',
    target: { value: 1.0, direction: 'higher_is_better' },
    minimumAcceptable: { value: 0.95, direction: 'higher_is_better' },
    unit: 'ratio (0-1)',
    blocksRelease: true,
    frequency: 'per-commit',
  },
] as const;

// =============================================================================
// Metric Utilities
// =============================================================================

/**
 * Get a metric by ID.
 */
export function getMetric(id: MetricId): SuccessMetric | undefined {
  return GOFAI_SUCCESS_METRICS.find(m => m.id === id);
}

/**
 * Get all metrics in a category.
 */
export function getMetricsByCategory(category: MetricCategory): readonly SuccessMetric[] {
  return GOFAI_SUCCESS_METRICS.filter(m => m.category === category);
}

/**
 * Get all release-blocking metrics.
 */
export function getReleaseBlockingMetrics(): readonly SuccessMetric[] {
  return GOFAI_SUCCESS_METRICS.filter(m => m.blocksRelease);
}

/**
 * Check if a metric value meets its target.
 */
export function meetsTarget(metric: SuccessMetric, value: number): boolean {
  if (metric.target.direction === 'higher_is_better') {
    return value >= metric.target.value;
  }
  return value <= metric.target.value;
}

/**
 * Check if a metric value meets its minimum acceptable threshold.
 */
export function meetsMinimum(metric: SuccessMetric, value: number): boolean {
  if (metric.minimumAcceptable.direction === 'higher_is_better') {
    return value >= metric.minimumAcceptable.value;
  }
  return value <= metric.minimumAcceptable.value;
}

/**
 * A recorded metric measurement.
 */
export interface MetricMeasurement {
  /** Metric ID */
  readonly metricId: MetricId;

  /** Measured value */
  readonly value: number;

  /** Timestamp */
  readonly timestamp: number;

  /** Whether it meets target */
  readonly meetsTarget: boolean;

  /** Whether it meets minimum */
  readonly meetsMinimum: boolean;

  /** Context (commit, version, etc.) */
  readonly context: string;
}

/**
 * Measure and record a metric value.
 */
export function recordMetric(
  metricId: MetricId,
  value: number,
  context: string
): MetricMeasurement {
  const metric = getMetric(metricId);
  if (!metric) {
    throw new Error(`Unknown metric: ${metricId}`);
  }

  return {
    metricId,
    value,
    timestamp: Date.now(),
    meetsTarget: meetsTarget(metric, value),
    meetsMinimum: meetsMinimum(metric, value),
    context,
  };
}
