/**
 * GOFAI Success Metrics
 * 
 * Defines measurable success criteria for GOFAI system evaluation.
 * Tracks semantic reliability, constraint correctness, edit reversibility,
 * workflow speed, and user trust across development and production.
 * 
 * Step 020 [Infra][Eval] — Success Metrics
 * 
 * @module gofai/testing/success-metrics
 */

/**
 * Metric category types
 */
export type MetricCategory =
  | 'reliability'     // Semantic and parse reliability
  | 'correctness'     // Constraint and execution correctness
  | 'reversibility'   // Undo/redo functionality
  | 'performance'     // Speed and latency
  | 'usability';      // User trust and workflow

/**
 * Metric priority (for release gating)
 */
export type MetricPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Metric status
 */
export type MetricStatus = 'passing' | 'failing' | 'warning' | 'unknown';

/**
 * Success threshold definition
 */
export interface SuccessThreshold {
  readonly minimum: number;      // Minimum acceptable value
  readonly target: number;        // Target value for full success
  readonly unit: string;          // e.g., '%', 'ms', 'count'
  readonly direction: 'higher-better' | 'lower-better';
}

/**
 * Metric measurement result
 */
export interface MetricMeasurement {
  readonly metricId: string;
  readonly value: number;
  readonly timestamp: number;
  readonly context?: Record<string, unknown>;
}

/**
 * Success metric definition
 */
export interface SuccessMetric {
  readonly id: string;
  readonly category: MetricCategory;
  readonly priority: MetricPriority;
  readonly name: string;
  readonly description: string;
  readonly threshold: SuccessThreshold;
  readonly measurementMethod: string;
  readonly automatedTest?: string;
}

/**
 * Metric evaluation result
 */
export interface MetricEvaluation {
  readonly metric: SuccessMetric;
  readonly measurement: MetricMeasurement;
  readonly status: MetricStatus;
  readonly message: string;
}

// =============================================================================
// Semantic Reliability Metrics
// =============================================================================

/**
 * Paraphrase invariance: Same meaning from different phrasings
 */
export const PARAPHRASE_INVARIANCE: SuccessMetric = {
  id: 'reliability:paraphrase-invariance',
  category: 'reliability',
  priority: 'critical',
  name: 'Paraphrase Invariance',
  description: 'Percentage of paraphrase pairs that produce semantically equivalent CPL',
  threshold: {
    minimum: 85,
    target: 95,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Run paraphrase test suite, count equivalent CPL outputs',
  automatedTest: 'src/gofai/tests/paraphrase/suite.test.ts',
};

/**
 * Parse success rate: Percentage of valid utterances that parse successfully
 */
export const PARSE_SUCCESS_RATE: SuccessMetric = {
  id: 'reliability:parse-success',
  category: 'reliability',
  priority: 'critical',
  name: 'Parse Success Rate',
  description: 'Percentage of well-formed musical utterances that parse without error',
  threshold: {
    minimum: 90,
    target: 98,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Run golden corpus through parser, count successful parses',
  automatedTest: 'src/gofai/tests/golden/parse-corpus.test.ts',
};

/**
 * Semantic coverage: Percentage of documented features with working examples
 */
export const SEMANTIC_COVERAGE: SuccessMetric = {
  id: 'reliability:semantic-coverage',
  category: 'reliability',
  priority: 'high',
  name: 'Semantic Coverage',
  description: 'Percentage of lexemes and constructions with tested examples',
  threshold: {
    minimum: 80,
    target: 95,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Count lexemes with golden tests / total lexemes',
  automatedTest: 'src/gofai/testing/coverage-report.ts',
};

/**
 * Ambiguity detection rate: Percentage of ambiguous inputs that trigger clarification
 */
export const AMBIGUITY_DETECTION: SuccessMetric = {
  id: 'reliability:ambiguity-detection',
  category: 'reliability',
  priority: 'high',
  name: 'Ambiguity Detection',
  description: 'Percentage of known ambiguous utterances that generate clarification questions',
  threshold: {
    minimum: 90,
    target: 98,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Run ambiguity corpus, count clarifications triggered',
  automatedTest: 'src/gofai/tests/pragmatics/ambiguity.test.ts',
};

/**
 * Reference resolution accuracy: Correct pronoun/demonstrative binding rate
 */
export const REFERENCE_RESOLUTION: SuccessMetric = {
  id: 'reliability:reference-resolution',
  category: 'reliability',
  priority: 'critical',
  name: 'Reference Resolution Accuracy',
  description: 'Percentage of references (it, that, again) resolved to correct entities',
  threshold: {
    minimum: 85,
    target: 95,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Run multi-turn dialogue tests, verify entity bindings',
  automatedTest: 'src/gofai/tests/pragmatics/reference.test.ts',
};

// =============================================================================
// Constraint Correctness Metrics
// =============================================================================

/**
 * Constraint preservation: Plans never violate hard constraints
 */
export const CONSTRAINT_PRESERVATION: SuccessMetric = {
  id: 'correctness:constraint-preservation',
  category: 'correctness',
  priority: 'critical',
  name: 'Constraint Preservation',
  description: 'Percentage of plans that satisfy all declared hard constraints',
  threshold: {
    minimum: 100,
    target: 100,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Run plans with constraints, verify diffs pass constraint checkers',
  automatedTest: 'src/gofai/tests/execution/constraint-safety.test.ts',
};

/**
 * Scope accuracy: Edits only affect specified scope
 */
export const SCOPE_ACCURACY: SuccessMetric = {
  id: 'correctness:scope-accuracy',
  category: 'correctness',
  priority: 'critical',
  name: 'Scope Accuracy',
  description: 'Percentage of plans where all edits are within declared scope',
  threshold: {
    minimum: 100,
    target: 100,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Verify diff events are within scope selectors',
  automatedTest: 'src/gofai/tests/execution/scope-safety.test.ts',
};

/**
 * Plan-diff correspondence: Generated diffs match plan specifications
 */
export const PLAN_DIFF_CORRESPONDENCE: SuccessMetric = {
  id: 'correctness:plan-diff-correspondence',
  category: 'correctness',
  priority: 'critical',
  name: 'Plan-Diff Correspondence',
  description: 'Percentage of plans where actual diff matches predicted diff',
  threshold: {
    minimum: 95,
    target: 100,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Compare plan opcode specifications to actual event diffs',
  automatedTest: 'src/gofai/tests/execution/diff-accuracy.test.ts',
};

/**
 * Type safety: No runtime type errors in CPL processing
 */
export const TYPE_SAFETY: SuccessMetric = {
  id: 'correctness:type-safety',
  category: 'correctness',
  priority: 'critical',
  name: 'Type Safety',
  description: 'Zero runtime type errors in CPL validation and execution',
  threshold: {
    minimum: 100,
    target: 100,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Run full test suite, count type-related errors',
  automatedTest: 'npm run test',
};

/**
 * Constraint checker coverage: All constraint types have working checkers
 */
export const CONSTRAINT_CHECKER_COVERAGE: SuccessMetric = {
  id: 'correctness:checker-coverage',
  category: 'correctness',
  priority: 'high',
  name: 'Constraint Checker Coverage',
  description: 'Percentage of constraint types with implemented checkers',
  threshold: {
    minimum: 100,
    target: 100,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Count constraint types with passing checker tests',
  automatedTest: 'src/gofai/tests/canon/constraint-checkers.test.ts',
};

// =============================================================================
// Edit Reversibility Metrics
// =============================================================================

/**
 * Undo roundtrip accuracy: Undo followed by redo yields original state
 */
export const UNDO_ROUNDTRIP: SuccessMetric = {
  id: 'reversibility:undo-roundtrip',
  category: 'reversibility',
  priority: 'critical',
  name: 'Undo Roundtrip Accuracy',
  description: 'Percentage of edit packages where undo→redo is identity',
  threshold: {
    minimum: 100,
    target: 100,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Apply edit, undo, redo; verify state matches original',
  automatedTest: 'src/gofai/tests/execution/undo-roundtrip.test.ts',
};

/**
 * Undo coverage: All opcode types support undo
 */
export const UNDO_COVERAGE: SuccessMetric = {
  id: 'reversibility:undo-coverage',
  category: 'reversibility',
  priority: 'high',
  name: 'Undo Coverage',
  description: 'Percentage of opcode types with working undo implementations',
  threshold: {
    minimum: 95,
    target: 100,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Count opcodes with passing undo tests',
  automatedTest: 'src/gofai/tests/execution/undo-coverage.test.ts',
};

/**
 * Edit package serialization: All edit packages can be saved and restored
 */
export const EDIT_SERIALIZATION: SuccessMetric = {
  id: 'reversibility:edit-serialization',
  category: 'reversibility',
  priority: 'high',
  name: 'Edit Serialization',
  description: 'Percentage of edit packages that serialize/deserialize correctly',
  threshold: {
    minimum: 100,
    target: 100,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Serialize and deserialize edit packages, verify equality',
  automatedTest: 'src/gofai/tests/execution/serialization.test.ts',
};

// =============================================================================
// Performance Metrics
// =============================================================================

/**
 * Parse latency: Time to parse typical utterance
 */
export const PARSE_LATENCY: SuccessMetric = {
  id: 'performance:parse-latency',
  category: 'performance',
  priority: 'high',
  name: 'Parse Latency',
  description: 'P95 latency for parsing a typical utterance',
  threshold: {
    minimum: 100,
    target: 50,
    unit: 'ms',
    direction: 'lower-better',
  },
  measurementMethod: 'Benchmark parser on representative utterance corpus',
  automatedTest: 'src/gofai/tests/performance/parse-bench.test.ts',
};

/**
 * Planning latency: Time to generate plan from CPL
 */
export const PLANNING_LATENCY: SuccessMetric = {
  id: 'performance:planning-latency',
  category: 'performance',
  priority: 'high',
  name: 'Planning Latency',
  description: 'P95 latency for generating a plan from CPL-Intent',
  threshold: {
    minimum: 200,
    target: 100,
    unit: 'ms',
    direction: 'lower-better',
  },
  measurementMethod: 'Benchmark planner on typical goals with constraints',
  automatedTest: 'src/gofai/tests/performance/planning-bench.test.ts',
};

/**
 * Execution latency: Time to apply plan and generate diff
 */
export const EXECUTION_LATENCY: SuccessMetric = {
  id: 'performance:execution-latency',
  category: 'performance',
  priority: 'high',
  name: 'Execution Latency',
  description: 'P95 latency for applying a plan to project state',
  threshold: {
    minimum: 150,
    target: 75,
    unit: 'ms',
    direction: 'lower-better',
  },
  measurementMethod: 'Benchmark executor on typical plan opcodes',
  automatedTest: 'src/gofai/tests/performance/execution-bench.test.ts',
};

/**
 * End-to-end latency: Total time from utterance to diff preview
 */
export const END_TO_END_LATENCY: SuccessMetric = {
  id: 'performance:end-to-end-latency',
  category: 'performance',
  priority: 'critical',
  name: 'End-to-End Latency',
  description: 'P95 latency for complete utterance → preview pipeline',
  threshold: {
    minimum: 500,
    target: 250,
    unit: 'ms',
    direction: 'lower-better',
  },
  measurementMethod: 'Benchmark full pipeline from input to diff display',
  automatedTest: 'src/gofai/tests/performance/e2e-bench.test.ts',
};

/**
 * Memory footprint: Peak memory usage during processing
 */
export const MEMORY_FOOTPRINT: SuccessMetric = {
  id: 'performance:memory-footprint',
  category: 'performance',
  priority: 'medium',
  name: 'Memory Footprint',
  description: 'Peak memory usage during typical operation',
  threshold: {
    minimum: 200,
    target: 100,
    unit: 'MB',
    direction: 'lower-better',
  },
  measurementMethod: 'Monitor heap usage during benchmark suite',
  automatedTest: 'src/gofai/tests/performance/memory-bench.test.ts',
};

// =============================================================================
// Usability Metrics
// =============================================================================

/**
 * Clarification rate: Average clarifications per successful edit
 */
export const CLARIFICATION_RATE: SuccessMetric = {
  id: 'usability:clarification-rate',
  category: 'usability',
  priority: 'high',
  name: 'Clarification Rate',
  description: 'Average number of clarification questions per completed edit',
  threshold: {
    minimum: 0.3,
    target: 0.15,
    unit: 'questions/edit',
    direction: 'lower-better',
  },
  measurementMethod: 'Track clarification questions in user session logs',
  automatedTest: 'Manual user studies',
};

/**
 * First-attempt success: Edits that apply without modification
 */
export const FIRST_ATTEMPT_SUCCESS: SuccessMetric = {
  id: 'usability:first-attempt-success',
  category: 'usability',
  priority: 'high',
  name: 'First-Attempt Success Rate',
  description: 'Percentage of edits applied without user modification to plan',
  threshold: {
    minimum: 70,
    target: 85,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Track apply vs modify actions in session logs',
  automatedTest: 'Manual user studies',
};

/**
 * User trust indicator: Percentage of edits previewed before apply
 */
export const PREVIEW_USAGE: SuccessMetric = {
  id: 'usability:preview-usage',
  category: 'usability',
  priority: 'medium',
  name: 'Preview Usage',
  description: 'Percentage of edits that users preview before applying',
  threshold: {
    minimum: 60,
    target: 80,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Track preview vs direct-apply in session logs',
  automatedTest: 'Manual user studies',
};

/**
 * Explanation usefulness: Users who read explanations find them helpful
 */
export const EXPLANATION_USEFULNESS: SuccessMetric = {
  id: 'usability:explanation-usefulness',
  category: 'usability',
  priority: 'medium',
  name: 'Explanation Usefulness',
  description: 'Percentage of users who find explanations helpful (survey)',
  threshold: {
    minimum: 75,
    target: 90,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'User survey after session',
  automatedTest: 'Manual user studies',
};

/**
 * Workflow speed improvement: Time saved vs manual editing
 */
export const WORKFLOW_SPEED: SuccessMetric = {
  id: 'usability:workflow-speed',
  category: 'usability',
  priority: 'high',
  name: 'Workflow Speed Improvement',
  description: 'Percentage time reduction for common tasks vs manual editing',
  threshold: {
    minimum: 30,
    target: 50,
    unit: '%',
    direction: 'higher-better',
  },
  measurementMethod: 'Time study: GOFAI vs manual for standard tasks',
  automatedTest: 'Manual user studies',
};

// =============================================================================
// All Metrics Collection
// =============================================================================

export const ALL_METRICS: readonly SuccessMetric[] = [
  // Reliability
  PARAPHRASE_INVARIANCE,
  PARSE_SUCCESS_RATE,
  SEMANTIC_COVERAGE,
  AMBIGUITY_DETECTION,
  REFERENCE_RESOLUTION,
  
  // Correctness
  CONSTRAINT_PRESERVATION,
  SCOPE_ACCURACY,
  PLAN_DIFF_CORRESPONDENCE,
  TYPE_SAFETY,
  CONSTRAINT_CHECKER_COVERAGE,
  
  // Reversibility
  UNDO_ROUNDTRIP,
  UNDO_COVERAGE,
  EDIT_SERIALIZATION,
  
  // Performance
  PARSE_LATENCY,
  PLANNING_LATENCY,
  EXECUTION_LATENCY,
  END_TO_END_LATENCY,
  MEMORY_FOOTPRINT,
  
  // Usability
  CLARIFICATION_RATE,
  FIRST_ATTEMPT_SUCCESS,
  PREVIEW_USAGE,
  EXPLANATION_USEFULNESS,
  WORKFLOW_SPEED,
];

// =============================================================================
// Metric Evaluation Functions
// =============================================================================

/**
 * Evaluate a metric measurement against its threshold
 */
export function evaluateMetric(
  metric: SuccessMetric,
  measurement: MetricMeasurement
): MetricEvaluation {
  const { value } = measurement;
  const { minimum, target, direction } = metric.threshold;
  
  let status: MetricStatus;
  let message: string;
  
  if (direction === 'higher-better') {
    if (value >= target) {
      status = 'passing';
      message = `Exceeds target: ${value}${metric.threshold.unit} >= ${target}${metric.threshold.unit}`;
    } else if (value >= minimum) {
      status = 'warning';
      message = `Meets minimum but below target: ${value}${metric.threshold.unit} (target: ${target}${metric.threshold.unit})`;
    } else {
      status = 'failing';
      message = `Below minimum: ${value}${metric.threshold.unit} < ${minimum}${metric.threshold.unit}`;
    }
  } else {
    // lower-better
    if (value <= target) {
      status = 'passing';
      message = `Exceeds target: ${value}${metric.threshold.unit} <= ${target}${metric.threshold.unit}`;
    } else if (value <= minimum) {
      status = 'warning';
      message = `Meets minimum but above target: ${value}${metric.threshold.unit} (target: ${target}${metric.threshold.unit})`;
    } else {
      status = 'failing';
      message = `Above minimum: ${value}${metric.threshold.unit} > ${minimum}${metric.threshold.unit}`;
    }
  }
  
  return {
    metric,
    measurement,
    status,
    message,
  };
}

/**
 * Get metrics by category
 */
export function getMetricsByCategory(category: MetricCategory): readonly SuccessMetric[] {
  return ALL_METRICS.filter(m => m.category === category);
}

/**
 * Get critical metrics (must pass for release)
 */
export function getCriticalMetrics(): readonly SuccessMetric[] {
  return ALL_METRICS.filter(m => m.priority === 'critical');
}

/**
 * Check if all critical metrics are passing
 */
export function checkCriticalMetrics(
  measurements: ReadonlyMap<string, MetricMeasurement>
): boolean {
  const criticalMetrics = getCriticalMetrics();
  
  for (const metric of criticalMetrics) {
    const measurement = measurements.get(metric.id);
    if (!measurement) return false;
    
    const evaluation = evaluateMetric(metric, measurement);
    if (evaluation.status === 'failing') return false;
  }
  
  return true;
}

/**
 * Generate a metrics report
 */
export function generateMetricsReport(
  measurements: ReadonlyMap<string, MetricMeasurement>
): string {
  const lines = [
    '# GOFAI Success Metrics Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
  ];
  
  const categories: MetricCategory[] = ['reliability', 'correctness', 'reversibility', 'performance', 'usability'];
  
  for (const category of categories) {
    const metrics = getMetricsByCategory(category);
    lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)}`);
    lines.push('');
    
    for (const metric of metrics) {
      const measurement = measurements.get(metric.id);
      if (!measurement) {
        lines.push(`- **${metric.name}**: ⚠️ No measurement`);
        continue;
      }
      
      const evaluation = evaluateMetric(metric, measurement);
      const icon = evaluation.status === 'passing' ? '✅' :
        evaluation.status === 'warning' ? '⚠️' : '❌';
      
      lines.push(`- **${metric.name}** [${metric.priority}]: ${icon} ${evaluation.message}`);
    }
    
    lines.push('');
  }
  
  const criticalPassing = checkCriticalMetrics(measurements);
  lines.push('## Release Readiness');
  lines.push('');
  lines.push(criticalPassing
    ? '✅ All critical metrics passing - ready for release'
    : '❌ Critical metrics failing - not ready for release'
  );
  
  return lines.join('\n');
}

/**
 * Get failing metrics
 */
export function getFailingMetrics(
  measurements: ReadonlyMap<string, MetricMeasurement>
): readonly MetricEvaluation[] {
  const failing: MetricEvaluation[] = [];
  
  for (const metric of ALL_METRICS) {
    const measurement = measurements.get(metric.id);
    if (!measurement) continue;
    
    const evaluation = evaluateMetric(metric, measurement);
    if (evaluation.status === 'failing') {
      failing.push(evaluation);
    }
  }
  
  return failing;
}
